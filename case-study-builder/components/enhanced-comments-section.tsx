'use client';

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, Trash2, Send, User } from 'lucide-react';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

// Reaction emoji map
const REACTIONS = {
  LIKE: { emoji: '👍', label: 'Like' },
  LOVE: { emoji: '❤️', label: 'Love' },
  CELEBRATE: { emoji: '🎉', label: 'Celebrate' },
  INSIGHTFUL: { emoji: '💡', label: 'Insightful' },
  HELPFUL: { emoji: '🙌', label: 'Helpful' },
  THUMBS_DOWN: { emoji: '👎', label: 'Disagree' },
} as const;

type ReactionType = keyof typeof REACTIONS;

type CommentReaction = {
  id: string;
  userId: string;
  type: ReactionType;
};

type Comment = {
  id: string;
  content: string;
  likes: number;
  createdAt: Date | string; // Accept both Date and string for serialization
  reactions: CommentReaction[];
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
};

type Props = {
  caseStudyId: string;
  initialComments: Comment[];
  currentUserId: string;
  currentUserRole: string;
};

export default function EnhancedCommentsSection({
  caseStudyId,
  initialComments,
  currentUserId,
  currentUserRole,
}: Props) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showReactions, setShowReactions] = useState<string | null>(null);

  const handleSubmitComment = async () => {
    if (!newComment || newComment.trim().length === 0) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch('/api/comments', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ caseStudyId, content: newComment }),
      });

      const result = await response.json();

      if (result.success && result.comment) {
        toast.success('Comment added!');
        setNewComment('');
        // Update local state immediately for better UX
        setComments([result.comment, ...comments]);
        // Also refresh the page to ensure consistency
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('[Comments] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReaction = async (commentId: string, type: ReactionType) => {
    try {
      const response = await fetch('/api/comments/react', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ commentId, type }),
      });

      const result = await response.json();

      if (result.success) {
        // Optimistically update local state
        setComments(prevComments =>
          prevComments.map(comment => {
            if (comment.id === commentId) {
              const existingReaction = comment.reactions.find(
                r => r.userId === currentUserId && r.type === type
              );

              if (existingReaction) {
                // Remove reaction
                return {
                  ...comment,
                  reactions: comment.reactions.filter(r => r.id !== existingReaction.id)
                };
              } else {
                // Add reaction
                return {
                  ...comment,
                  reactions: [
                    ...comment.reactions,
                    {
                      id: `temp-${Date.now()}`,
                      userId: currentUserId,
                      type: type,
                    }
                  ]
                };
              }
            }
            return comment;
          })
        );

        toast.success(result.added ? `${REACTIONS[type].emoji} Reacted!` : 'Reaction removed');
        setShowReactions(null);

        // Refresh in background to ensure consistency
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to react');
      }
    } catch (error) {
      console.error('[Comments] Reaction error:', error);
      toast.error('An error occurred');
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Delete this comment?')) return;

    try {
      const response = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
      });

      const result = await response.json();

      if (result.success) {
        toast.success('Comment deleted');
        // Update local state immediately
        setComments(comments.filter(c => c.id !== commentId));
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete');
      }
    } catch (error) {
      console.error('[Comments] Delete error:', error);
      toast.error('An error occurred');
    }
  };

  const canDeleteComment = (comment: Comment) => {
    return comment.user.id === currentUserId || currentUserRole === 'APPROVER';
  };

  const getReactionCounts = (reactions: CommentReaction[]) => {
    const counts: Record<string, { count: number; userReacted: boolean }> = {};

    Object.keys(REACTIONS).forEach((type) => {
      const typeReactions = reactions.filter(r => r.type === type);
      if (typeReactions.length > 0) {
        counts[type] = {
          count: typeReactions.length,
          userReacted: typeReactions.some(r => r.userId === currentUserId),
        };
      }
    });

    return counts;
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'APPROVER': return 'bg-purple-100 text-purple-700';
      case 'CONTRIBUTOR': return 'bg-blue-100 text-blue-700';
      case 'VIEWER': return 'bg-gray-100 text-gray-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-blue-600" />
          <div>
            <CardTitle>Comments ({comments.length})</CardTitle>
            <CardDescription>Share feedback and react with emojis</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        <div className="space-y-3">
          <Textarea
            placeholder="Share your thoughts..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px]"
          />
          <div className="flex justify-end">
            <Button
              onClick={handleSubmitComment}
              disabled={isSubmitting || !newComment.trim()}
            >
              <Send className="h-4 w-4 mr-2" />
              {isSubmitting ? 'Posting...' : 'Post Comment'}
            </Button>
          </div>
        </div>

        {/* Comments List */}
        {comments.length === 0 ? (
          <div className="text-center py-8 text-gray-500">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300" />
            <p>No comments yet. Be the first!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => {
              const reactionCounts = getReactionCounts(comment.reactions);

              return (
                <div
                  key={comment.id}
                  className="border border-gray-200 rounded-lg p-4 space-y-3 hover:border-blue-300 transition-colors"
                >
                  {/* Comment Header */}
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center">
                        <User className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-semibold text-sm text-gray-900">
                            {comment.user.name || 'Unknown'}
                          </p>
                          <Badge
                            variant="secondary"
                            className={`text-xs ${getRoleBadgeColor(comment.user.role)}`}
                          >
                            {comment.user.role}
                          </Badge>
                        </div>
                        <p className="text-xs text-gray-500">
                          {new Date(comment.createdAt).toLocaleDateString('en-US', {
                            year: 'numeric',
                            month: 'short',
                            day: 'numeric',
                            hour: '2-digit',
                            minute: '2-digit',
                          })}
                        </p>
                      </div>
                    </div>

                    {canDeleteComment(comment) && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(comment.id)}
                      >
                        <Trash2 className="h-4 w-4 text-red-500" />
                      </Button>
                    )}
                  </div>

                  {/* Reactions Display & Add */}
                  <div className="pl-13 space-y-2">
                    {/* Existing Reactions */}
                    {Object.keys(reactionCounts).length > 0 && (
                      <div className="flex flex-wrap gap-2">
                        {Object.entries(reactionCounts).map(([type, { count, userReacted }]) => (
                          <Button
                            key={type}
                            variant="outline"
                            size="sm"
                            onClick={() => handleReaction(comment.id, type as ReactionType)}
                            className={`gap-1 h-8 ${userReacted ? 'bg-blue-50 border-blue-300' : ''}`}
                          >
                            <span className="text-lg">{REACTIONS[type as ReactionType].emoji}</span>
                            <span className="text-xs font-medium">{count}</span>
                          </Button>
                        ))}
                      </div>
                    )}

                    {/* Add Reaction Button */}
                    <div className="relative">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setShowReactions(showReactions === comment.id ? null : comment.id)}
                        className="text-xs text-gray-600 hover:text-blue-600"
                      >
                        + Add Reaction
                      </Button>

                      {/* Reaction Picker */}
                      {showReactions === comment.id && (
                        <div className="absolute left-0 mt-1 p-2 bg-white border border-gray-200 rounded-lg shadow-lg z-10 flex gap-1">
                          {Object.entries(REACTIONS).map(([type, { emoji, label }]) => (
                            <button
                              key={type}
                              onClick={() => handleReaction(comment.id, type as ReactionType)}
                              className="p-2 hover:bg-gray-100 rounded transition-colors"
                              title={label}
                            >
                              <span className="text-2xl">{emoji}</span>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Comment Content */}
                  <p className="text-sm text-gray-700 whitespace-pre-wrap pl-13">
                    {comment.content}
                  </p>
                </div>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
