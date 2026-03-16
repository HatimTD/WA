'use client';

import { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar } from '@/components/ui/avatar';
import { UserPlus, X, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import {
  waTagUsersInCaseStudy,
  waGetTaggedUsers,
  waSearchUsersForTagging,
} from '@/lib/actions/waEmailPdfActions';

interface TagColleaguesProps {
  caseStudyId: string;
  onTagsUpdated?: () => void;
}

interface User {
  id: string;
  name: string | null;
  email: string;
  image: string | null;
}

export function TagColleagues({ caseStudyId, onTagsUpdated }: TagColleaguesProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [currentTags, setCurrentTags] = useState<User[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  // Load current tags on mount
  useEffect(() => {
    loadCurrentTags();
  }, [caseStudyId]);

  // Search users when query changes
  useEffect(() => {
    const delayDebounce = setTimeout(() => {
      if (searchQuery.length >= 2) {
        handleSearch();
      } else {
        setSearchResults([]);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery]);

  const loadCurrentTags = async () => {
    const result = await waGetTaggedUsers(caseStudyId);
    if (result.success && result.users) {
      setCurrentTags(result.users);
      setSelectedUsers(result.users);
    }
  };

  const handleSearch = async () => {
    setIsSearching(true);
    try {
      const result = await waSearchUsersForTagging(searchQuery);
      if (result.success && result.users) {
        // Filter out already selected users
        const filtered = result.users.filter(
          (user) => !selectedUsers.some((selected) => selected.id === user.id)
        );
        setSearchResults(filtered);
      }
    } catch (error) {
      console.error('[TagColleagues] Error searching users:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleSelectUser = (user: User) => {
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
    setIsSaving(true);
    try {
      const userIds = selectedUsers.map((u) => u.id);
      const result = await waTagUsersInCaseStudy({
        caseId: caseStudyId,
        userIds,
      });

      if (result.success) {
        toast.success('Tagged colleagues updated successfully!');
        setCurrentTags(selectedUsers);
        setIsOpen(false);
        onTagsUpdated?.();
      } else {
        toast.error(result.error || 'Failed to update tags');
      }
    } catch (error) {
      console.error('[TagColleagues] Error saving tags:', error);
      toast.error('Failed to update tags');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setSelectedUsers(currentTags);
    setSearchQuery('');
    setSearchResults([]);
    setIsOpen(false);
  };

  if (!isOpen) {
    return (
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
            Tagged Colleagues
          </h3>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setIsOpen(true)}
            className="gap-2"
          >
            <UserPlus className="h-4 w-4" />
            Tag Colleagues
          </Button>
        </div>
        {currentTags.length > 0 ? (
          <div className="flex flex-wrap gap-2">
            {currentTags.map((user) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="gap-1 px-2 py-1"
              >
                {user.name || user.email}
              </Badge>
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-500 dark:text-gray-400">
            No colleagues tagged yet
          </p>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-4 border rounded-lg p-4 bg-white dark:bg-card">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300">
          Tag Colleagues
        </h3>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleCancel}
            disabled={isSaving}
          >
            Cancel
          </Button>
          <Button
            variant="default"
            size="sm"
            onClick={handleSave}
            disabled={isSaving}
          >
            {isSaving ? (
              <>
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              'Save'
            )}
          </Button>
        </div>
      </div>

      {/* Search Input */}
      <div className="relative">
        <Input
          type="text"
          placeholder="Search by name or email..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full"
        />
        {isSearching && (
          <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
            <Loader2 className="h-4 w-4 animate-spin text-gray-400" />
          </div>
        )}
      </div>

      {/* Search Results */}
      {searchResults.length > 0 && (
        <div className="border rounded-md divide-y max-h-48 overflow-y-auto">
          {searchResults.map((user) => (
            <button
              key={user.id}
              onClick={() => handleSelectUser(user)}
              className="w-full flex items-center gap-3 px-3 py-2 hover:bg-gray-50 dark:hover:bg-gray-800 text-left transition-colors"
            >
              <Avatar className="h-8 w-8">
                {user.image ? (
                  <img src={user.image} alt={user.name || user.email} />
                ) : (
                  <div className="h-full w-full flex items-center justify-center bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-300 font-medium text-sm">
                    {(user.name || user.email).charAt(0).toUpperCase()}
                  </div>
                )}
              </Avatar>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">
                  {user.name || 'No name'}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Selected Users */}
      {selectedUsers.length > 0 && (
        <div>
          <p className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
            Tagged ({selectedUsers.length})
          </p>
          <div className="flex flex-wrap gap-2">
            {selectedUsers.map((user) => (
              <Badge
                key={user.id}
                variant="secondary"
                className="gap-2 px-2 py-1"
              >
                <span>{user.name || user.email}</span>
                <button
                  onClick={() => handleRemoveUser(user.id)}
                  className="hover:text-red-500 transition-colors"
                  disabled={isSaving}
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        </div>
      )}

      <p className="text-xs text-gray-500 dark:text-gray-400">
        Tagged colleagues will be notified and can view this case study.
      </p>
    </div>
  );
}
