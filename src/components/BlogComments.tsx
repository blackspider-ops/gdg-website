import React, { useState, useEffect } from 'react';
import { MessageCircle, User, Calendar, Reply, Flag, Send, Loader2 } from 'lucide-react';
import { BlogCommentsService, BlogComment, CreateCommentData } from '@/services/blogCommentsService';

interface BlogCommentsProps {
  blogPostId: string;
  initialCommentsCount?: number;
}

interface CommentFormData {
  author_name: string;
  author_email: string;
  content: string;
}

const BlogComments: React.FC<BlogCommentsProps> = ({ blogPostId, initialCommentsCount = 0 }) => {
  const [comments, setComments] = useState<BlogComment[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCommentForm, setShowCommentForm] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [formData, setFormData] = useState<CommentFormData>({
    author_name: '',
    author_email: '',
    content: ''
  });
  const [formErrors, setFormErrors] = useState<Partial<CommentFormData>>({});
  const [submitMessage, setSubmitMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadComments();
  }, [blogPostId]);

  const loadComments = async () => {
    setIsLoading(true);
    try {
      const commentsData = await BlogCommentsService.getComments(blogPostId);
      setComments(commentsData);
    } catch (error) {
      // Error loading comments
    } finally {
      setIsLoading(false);
    }
  };

  const validateForm = (): boolean => {
    const errors: Partial<CommentFormData> = {};

    if (!formData.author_name.trim()) {
      errors.author_name = 'Name is required';
    } else if (formData.author_name.length > 100) {
      errors.author_name = 'Name must be less than 100 characters';
    }

    if (!formData.author_email.trim()) {
      errors.author_email = 'Email is required';
    } else if (!/^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}$/.test(formData.author_email)) {
      errors.author_email = 'Please enter a valid email address';
    }

    if (!formData.content.trim()) {
      errors.content = 'Comment is required';
    } else if (formData.content.length > 2000) {
      errors.content = 'Comment must be less than 2000 characters';
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  const handleSubmitComment = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateForm()) return;

    setIsSubmitting(true);
    setSubmitMessage(null);

    try {
      const commentData: CreateCommentData = {
        post_id: blogPostId,
        author_name: formData.author_name.trim(),
        author_email: formData.author_email.trim(),
        content: formData.content.trim(),
        parent_comment_id: replyingTo || undefined
      };

      await BlogCommentsService.createComment(commentData);

      // Reset form
      setFormData({ author_name: '', author_email: '', content: '' });
      setFormErrors({});
      setShowCommentForm(false);
      setReplyingTo(null);

      setSubmitMessage({
        type: 'success',
        text: 'Thank you for your comment! It will be reviewed and published shortly.'
      });

      // Reload comments to show any that might have been approved
      setTimeout(() => {
        loadComments();
      }, 1000);

    } catch (error) {
      setSubmitMessage({
        type: 'error',
        text: error instanceof Error ? error.message : 'Failed to submit comment. Please try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReply = (commentId: string) => {
    setReplyingTo(commentId);
    setShowCommentForm(true);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const renderComment = (comment: BlogComment, isReply = false) => (
    <div key={comment.id} className={`${isReply ? 'ml-8 mt-4' : 'mb-6'}`}>
      <div className="bg-card border border-border rounded-lg p-4">
        {/* Comment Header */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center space-x-3">
            <div className="w-8 h-8 bg-gradient-to-br from-gdg-blue to-gdg-green rounded-full flex items-center justify-center">
              <User size={16} className="text-white" />
            </div>
            <div>
              <div className="font-medium text-foreground">{comment.author_name}</div>
              <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                <Calendar size={12} />
                <span>{formatDate(comment.created_at)}</span>
              </div>
            </div>
          </div>
          
          {!isReply && (
            <button
              onClick={() => handleReply(comment.id)}
              className="flex items-center space-x-1 text-sm text-muted-foreground hover:text-gdg-blue transition-colors"
            >
              <Reply size={14} />
              <span>Reply</span>
            </button>
          )}
        </div>

        {/* Comment Content */}
        <div className="text-foreground leading-relaxed whitespace-pre-wrap">
          {comment.content}
        </div>

        {/* Replies */}
        {comment.replies && comment.replies.length > 0 && (
          <div className="mt-4 space-y-4">
            {comment.replies.map(reply => renderComment(reply, true))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <section className="py-16 border-t border-border">
      <div className="editorial-grid">
        <div className="col-span-12 lg:col-span-8 lg:col-start-3">
          {/* Comments Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center space-x-3">
              <MessageCircle size={24} className="text-gdg-blue" />
              <h3 className="text-2xl font-semibold text-foreground">
                Comments ({comments.length})
              </h3>
            </div>
            
            {!showCommentForm && (
              <button
                onClick={() => setShowCommentForm(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gdg-blue text-white rounded-lg hover:bg-gdg-blue/90 transition-colors"
              >
                <MessageCircle size={16} />
                <span>Add Comment</span>
              </button>
            )}
          </div>

          {/* Submit Message */}
          {submitMessage && (
            <div className={`mb-6 p-4 rounded-lg border ${
              submitMessage.type === 'success' 
                ? 'bg-green-900/20 border-green-500/30 text-green-400' 
                : 'bg-red-900/20 border-red-500/30 text-red-400'
            }`}>
              {submitMessage.text}
            </div>
          )}

          {/* Comment Form */}
          {showCommentForm && (
            <div className="mb-8 bg-card border border-border rounded-lg p-6">
              <div className="flex items-center justify-between mb-4">
                <h4 className="text-lg font-medium text-foreground">
                  {replyingTo ? 'Reply to Comment' : 'Add a Comment'}
                </h4>
                <button
                  onClick={() => {
                    setShowCommentForm(false);
                    setReplyingTo(null);
                    setFormData({ author_name: '', author_email: '', content: '' });
                    setFormErrors({});
                  }}
                  className="text-muted-foreground hover:text-foreground transition-colors"
                >
                  Cancel
                </button>
              </div>

              <form onSubmit={handleSubmitComment} className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Name *
                    </label>
                    <input
                      type="text"
                      value={formData.author_name}
                      onChange={(e) => setFormData(prev => ({ ...prev, author_name: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gdg-blue focus:border-gdg-blue bg-background text-foreground ${
                        formErrors.author_name ? 'border-red-500' : 'border-border'
                      }`}
                      placeholder="Your name"
                      maxLength={100}
                    />
                    {formErrors.author_name && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.author_name}</p>
                    )}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-foreground mb-2">
                      Email *
                    </label>
                    <input
                      type="email"
                      value={formData.author_email}
                      onChange={(e) => setFormData(prev => ({ ...prev, author_email: e.target.value }))}
                      className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gdg-blue focus:border-gdg-blue bg-background text-foreground ${
                        formErrors.author_email ? 'border-red-500' : 'border-border'
                      }`}
                      placeholder="your@email.com"
                    />
                    {formErrors.author_email && (
                      <p className="text-red-400 text-sm mt-1">{formErrors.author_email}</p>
                    )}
                    <p className="text-xs text-muted-foreground mt-1">
                      Your email will not be published
                    </p>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">
                    Comment *
                  </label>
                  <textarea
                    value={formData.content}
                    onChange={(e) => setFormData(prev => ({ ...prev, content: e.target.value }))}
                    className={`w-full px-4 py-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-gdg-blue focus:border-gdg-blue bg-background text-foreground ${
                      formErrors.content ? 'border-red-500' : 'border-border'
                    }`}
                    placeholder="Share your thoughts..."
                    rows={4}
                    maxLength={2000}
                  />
                  {formErrors.content && (
                    <p className="text-red-400 text-sm mt-1">{formErrors.content}</p>
                  )}
                  <div className="flex justify-between items-center mt-1">
                    <p className="text-xs text-muted-foreground">
                      Comments are moderated and will be reviewed before publishing
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {formData.content.length}/2000
                    </p>
                  </div>
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex items-center space-x-2 px-6 py-3 bg-gdg-blue text-white rounded-lg hover:bg-gdg-blue/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? (
                      <Loader2 size={16} className="animate-spin" />
                    ) : (
                      <Send size={16} />
                    )}
                    <span>{isSubmitting ? 'Submitting...' : 'Submit Comment'}</span>
                  </button>
                </div>
              </form>
            </div>
          )}

          {/* Comments List */}
          {isLoading ? (
            <div className="space-y-6">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-4 animate-pulse">
                  <div className="flex items-center space-x-3 mb-3">
                    <div className="w-8 h-8 bg-muted rounded-full"></div>
                    <div>
                      <div className="w-24 h-4 bg-muted rounded mb-1"></div>
                      <div className="w-32 h-3 bg-muted rounded"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="w-full h-4 bg-muted rounded"></div>
                    <div className="w-3/4 h-4 bg-muted rounded"></div>
                  </div>
                </div>
              ))}
            </div>
          ) : comments.length > 0 ? (
            <div className="space-y-6">
              {comments.map(comment => renderComment(comment))}
            </div>
          ) : (
            <div className="text-center py-12">
              <MessageCircle size={48} className="mx-auto text-muted-foreground mb-4" />
              <h4 className="text-lg font-medium text-foreground mb-2">No comments yet</h4>
              <p className="text-muted-foreground mb-6">
                Be the first to share your thoughts on this post!
              </p>
              {!showCommentForm && (
                <button
                  onClick={() => setShowCommentForm(true)}
                  className="px-6 py-3 bg-gdg-blue text-white rounded-lg hover:bg-gdg-blue/90 transition-colors"
                >
                  Start the Discussion
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </section>
  );
};

export default BlogComments;