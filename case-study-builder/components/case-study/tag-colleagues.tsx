'use client';

import { useState, useEffect, useTransition } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { UserPlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  searchUsersForTagging,
  tagUsersInCaseStudy,
  getTaggedUsers,
} from '@/lib/actions/email-pdf-actions';

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

interface TagColleaguesProps {
  caseStudyId: string;
  initialTaggedUsers?: User[];
  isOwner: boolean;
  className?: string;
}

export function TagColleagues({
  caseStudyId,
  initialTaggedUsers = [],
  isOwner,
  className = '',
}: TagColleaguesProps) {
  const [open, setOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [taggedUsers, setTaggedUsers] = useState<User[]>(initialTaggedUsers);
  const [selectedUsers, setSelectedUsers] = useState<User[]>(initialTaggedUsers);
  const [isPending, startTransition] = useTransition();
  const [isSearching, setIsSearching] = useState(false);

  // Fetch tagged users when dialog opens
  useEffect(() => {
    if (open) {
      startTransition(async () => {
        const result = await getTaggedUsers(caseStudyId);
        if (result.success && result.users) {
          setTaggedUsers(result.users);
          setSelectedUsers(result.users);
        }
      });
    }
  }, [open, caseStudyId]);

  // Search users when query changes
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults([]);
      return;
    }

    const timeoutId = setTimeout(async () => {
      setIsSearching(true);
      const result = await searchUsersForTagging(searchQuery);
      if (result.success && result.users) {
        // Filter out already selected users
        const filteredUsers = result.users.filter(
          (user) => !selectedUsers.some((selected) => selected.id === user.id)
        );
        setSearchResults(filteredUsers);
      }
      setIsSearching(false);
    }, 300);

    return () => clearTimeout(timeoutId);
  }, [searchQuery, selectedUsers]);

  const handleAddUser = (user: User) => {
    if (!selectedUsers.some((u) => u.id === user.id)) {
      setSelectedUsers([...selectedUsers, user]);
      setSearchQuery('');
      setSearchResults([]);
    }
  };

  const handleRemoveUser = (userId: string) => {
    setSelectedUsers(selectedUsers.filter((u) => u.id !== userId));
  };

  const handleSave = async () => {
    startTransition(async () => {
      const userIds = selectedUsers.map((u) => u.id);
      const result = await tagUsersInCaseStudy({
        caseId: caseStudyId,
        userIds,
      });

      if (result.success) {
        setTaggedUsers(selectedUsers);
        toast.success('Colleagues tagged successfully!');
        setOpen(false);
      } else {
        toast.error(result.error || 'Failed to tag colleagues');
      }
    });
  };

  const getUserInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(' ')
        .map((n) => n[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
    }
    return email.slice(0, 2).toUpperCase();
  };

  return (
    <div className={className}>
      {/* Display Tagged Users */}
      {taggedUsers.length > 0 && (
        <div className="mb-4">
          <Label className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2 block">
            Tagged Colleagues
          </Label>
          <div className="flex flex-wrap gap-2">
            {taggedUsers.map((user) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="flex items-center gap-2 py-1 px-3 dark:bg-gray-800 dark:text-foreground"
              >
                <Avatar className="h-5 w-5">
                  <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                  <AvatarFallback className="text-xs">
                    {getUserInitials(user.name, user.email)}
                  </AvatarFallback>
                </Avatar>
                <span className="text-sm">{user.name || user.email}</span>
              </Badge>
            ))}
          </div>
        </div>
      )}

      {/* Tag Button - Only show if user is owner */}
      {isOwner && (
        <Dialog open={open} onOpenChange={setOpen}>
          <DialogTrigger asChild>
            <Button variant="outline" size="sm" className="dark:border-border">
              <UserPlus className="h-4 w-4 mr-2" />
              Tag Colleagues
            </Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-[500px] dark:bg-card dark:border-border">
            <DialogHeader>
              <DialogTitle className="dark:text-foreground">Tag Colleagues</DialogTitle>
              <DialogDescription className="dark:text-muted-foreground">
                Tag colleagues who might be interested in this case study. They will receive a notification.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-4 py-4">
              {/* Search Input */}
              <div className="space-y-2">
                <Label htmlFor="search" className="dark:text-foreground">
                  Search by name or email
                </Label>
                <div className="relative">
                  <Input
                    id="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Start typing to search..."
                    className="dark:bg-gray-900 dark:border-border dark:text-foreground"
                  />
                  {isSearching && (
                    <Loader2 className="absolute right-3 top-2.5 h-4 w-4 animate-spin text-gray-400" />
                  )}
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="border rounded-md divide-y dark:border-border dark:divide-border max-h-48 overflow-y-auto">
                  {searchResults.map((user) => (
                    <button
                      key={user.id}
                      onClick={() => handleAddUser(user)}
                      className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors text-left"
                    >
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                        <AvatarFallback className="text-xs">
                          {getUserInitials(user.name, user.email)}
                        </AvatarFallback>
                      </Avatar>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                          {user.name || 'No name'}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                          {user.email}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              )}

              {/* Selected Users */}
              {selectedUsers.length > 0 && (
                <div className="space-y-2">
                  <Label className="dark:text-foreground">Selected ({selectedUsers.length})</Label>
                  <div className="border rounded-md divide-y dark:border-border dark:divide-border max-h-48 overflow-y-auto">
                    {selectedUsers.map((user) => (
                      <div
                        key={user.id}
                        className="flex items-center gap-3 p-3 dark:bg-gray-900"
                      >
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.image || undefined} alt={user.name || user.email} />
                          <AvatarFallback className="text-xs">
                            {getUserInitials(user.name, user.email)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-foreground truncate">
                            {user.name || 'No name'}
                          </p>
                          <p className="text-xs text-gray-500 dark:text-muted-foreground truncate">
                            {user.email}
                          </p>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleRemoveUser(user.id)}
                          className="h-8 w-8 p-0 dark:hover:bg-gray-800"
                        >
                          <X className="h-4 w-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setOpen(false)}
                disabled={isPending}
                className="dark:border-border"
              >
                Cancel
              </Button>
              <Button onClick={handleSave} disabled={isPending}>
                {isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save & Notify'
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
