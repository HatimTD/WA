'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { MessageSquare, ThumbsUp, Trash2, Send, User } from 'lucide-react';
import { waCreateComment, waLikeComment, waDeleteComment } from '@/lib/actions/waCommentActions';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';

type Comment = {
  id: string;
  content: string;
  likes: number;
  createdAt: Date;
  user: {
    id: string;
    name: string | null;
    email: string | null;
    role: string;
  };
};

type CommentsSectionProps = {
  caseStudyId: string;
  initialComments: Comment[];
  currentUserId: string;
  currentUserRole: string;
};

export default function CommentsSection({
  caseStudyId,
  initialComments,
  currentUserId,
  currentUserRole,
}: CommentsSectionProps) {
  const router = useRouter();
  const [comments, setComments] = useState<Comment[]>(initialComments);
  const [newComment, setNewComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);

  useEffect(() => {
    setComments(initialComments);
  }, [initialComments]);

  const handleSubmitComment = async () => {
    if (!newComment || newComment.trim().length === 0) {
      toast.error('Please enter a comment');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await waCreateComment(caseStudyId, newComment);

      if (result.success && result.comment) {
        toast.success('Comment added successfully!');
        setNewComment('');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to add comment');
      }
    } catch (error) {
      console.error('[CommentsSection] Error:', error);
      toast.error('An error occurred');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLike = async (commentId: string) => {
    setLikingCommentId(commentId);

    try {
      const result = await waLikeComment(commentId);

      if (result.success) {
        toast.success('Liked!');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to like comment');
      }
    } catch (error) {
      console.error('[CommentsSection] Like error:', error);
      toast.error('An error occurred');
    } finally {
      setLikingCommentId(null);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm('Are you sure you want to delete this comment?')) {
      return;
    }

    setDeletingCommentId(commentId);

    try {
      const result = await waDeleteComment(commentId);

      if (result.success) {
        toast.success('Comment deleted');
        router.refresh();
      } else {
        toast.error(result.error || 'Failed to delete comment');
      }
    } catch (error) {
      console.error('[CommentsSection] Delete error:', error);
      toast.error('An error occurred');
    } finally {
      setDeletingCommentId(null);
    }
  };

  const canDeleteComment = (comment: Comment) => {
    return comment.user.id === currentUserId || currentUserRole === 'APPROVER';
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'APPROVER':
        return 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400';
      case 'CONTRIBUTOR':
        return 'bg-wa-green-100 text-wa-green-700 dark:bg-accent dark:text-primary';
      case 'VIEWER':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
    }
  };

  return (
    <Card className="dark:bg-card dark:border-border">
      <CardHeader>
        <div className="flex items-center gap-3">
          <MessageSquare className="h-6 w-6 text-wa-green-600 dark:text-primary" />
          <div>
            <CardTitle className="dark:text-foreground">Comments ({comments.length})</CardTitle>
            <CardDescription className="dark:text-muted-foreground">Share your thoughts and feedback</CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* New Comment Form */}
        <div className="space-y-3">
          <Textarea
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            className="min-h-[100px] dark:bg-input dark:border-border dark:text-foreground"
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
          <div className="text-center py-8 text-gray-500 dark:text-muted-foreground">
            <MessageSquare className="h-12 w-12 mx-auto mb-3 text-gray-300 dark:text-muted-foreground" />
            <p>No comments yet. Be the first to share your thoughts!</p>
          </div>
        ) : (
          <div className="space-y-4">
            {comments.map((comment) => (
              <div
                key={comment.id}
                className="border border-gray-200 dark:border-border rounded-lg p-4 space-y-3 dark:bg-card"
              >
                {/* Comment Header */}
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-wa-green-100 dark:bg-accent flex items-center justify-center">
                      <User className="h-5 w-5 text-wa-green-600 dark:text-primary" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold text-sm text-gray-900 dark:text-foreground">
                          {comment.user.name || 'Unknown User'}
                        </p>
                        <Badge
                          variant="secondary"
                          className={`text-xs ${getRoleBadgeColor(comment.user.role)}`}
                        >
                          {comment.user.role}
                        </Badge>
                      </div>
                      <p className="text-xs text-gray-500 dark:text-muted-foreground">
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

                  {/* Delete Button */}
                  {canDeleteComment(comment) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDelete(comment.id)}
                      disabled={deletingCommentId === comment.id}
                    >
                      <Trash2 className="h-4 w-4 text-red-500 dark:text-red-400" />
                    </Button>
                  )}
                </div>

                {/* Comment Content */}
                <p className="text-sm text-gray-700 dark:text-foreground whitespace-pre-wrap pl-13">
                  {comment.content}
                </p>

                {/* Comment Actions */}
                <div className="flex items-center gap-4 pl-13">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleLike(comment.id)}
                    disabled={likingCommentId === comment.id}
                    className="gap-2"
                  >
                    <ThumbsUp
                      className={`h-4 w-4 ${
                        likingCommentId === comment.id ? 'animate-pulse' : ''
                      }`}
                    />
                    <span className="text-sm font-medium">
                      {comment.likes > 0 ? comment.likes : 'Like'}
                    </span>
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
