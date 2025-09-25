import React from 'react';
import { X, Calendar, User, Tag, Clock, Heart, Eye } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { BlogService, BlogPost } from '@/services/blogService';
import 'highlight.js/styles/github-dark.css';

interface BlogPostModalProps {
  isOpen: boolean;
  onClose: () => void;
  post: BlogPost;
}

const BlogPostModal: React.FC<BlogPostModalProps> = ({
  isOpen,
  onClose,
  post
}) => {
  const [currentPost, setCurrentPost] = React.useState(post);
  const [isLiking, setIsLiking] = React.useState(false);
  const [hasLiked, setHasLiked] = React.useState(false);
  const [isCheckingLikeStatus, setIsCheckingLikeStatus] = React.useState(false);

  // Update current post when prop changes
  React.useEffect(() => {
    setCurrentPost(post);
  }, [post]);

  // Check if user has already liked this post
  React.useEffect(() => {
    const checkLikeStatus = async () => {
      if (!currentPost.id || !isOpen) return;
      
      setIsCheckingLikeStatus(true);
      try {
        const liked = await BlogService.hasUserLikedPost(currentPost.id);
        setHasLiked(liked);
      } catch (error) {
        // Silently handle errors
      } finally {
        setIsCheckingLikeStatus(false);
      }
    };

    checkLikeStatus();
  }, [currentPost.id, isOpen]);

  // Handle body scroll lock manually
  React.useEffect(() => {
    if (isOpen) {
      // Store original values
      const originalBodyOverflow = document.body.style.overflow;
      const originalBodyPosition = document.body.style.position;
      const originalBodyTop = document.body.style.top;
      const originalBodyWidth = document.body.style.width;
      
      // Get current scroll position
      const scrollY = window.scrollY;
      
      // Apply scroll lock
      document.body.style.overflow = 'hidden';
      document.body.style.position = 'fixed';
      document.body.style.top = `-${scrollY}px`;
      document.body.style.width = '100%';
      
      return () => {
        // Restore original styles
        document.body.style.overflow = originalBodyOverflow;
        document.body.style.position = originalBodyPosition;
        document.body.style.top = originalBodyTop;
        document.body.style.width = originalBodyWidth;
        
        // Restore scroll position
        window.scrollTo(0, scrollY);
      };
    }
  }, [isOpen]);

  // Handle escape key
  React.useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      return () => document.removeEventListener('keydown', handleEscape);
    }
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    try {
      return new Date(dateString).toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    } catch {
      return dateString;
    }
  };

  const getReadTime = () => {
    if (currentPost.read_time_minutes) return `${currentPost.read_time_minutes} min read`;
    return '5 min read';
  };

  const getAuthor = () => {
    return currentPost.author_name || 'GDG Author';
  };

  const getPublishDate = () => {
    return formatDate(currentPost.published_at) || '';
  };

  const handleLike = async () => {
    if (!currentPost.id || isLiking) return;
    
    setIsLiking(true);
    try {
      const result = await BlogService.toggleLike(currentPost.id);
      if (result.success) {
        setHasLiked(result.isLiked);
        setCurrentPost(prev => ({
          ...prev,
          likes_count: result.newCount
        }));
      }
    } catch (error) {
      // Silently handle errors
    } finally {
      setIsLiking(false);
    }
  };

  // Fallback content if no content is provided
  const fallbackContent = `
${post.excerpt}

---

*This blog post is currently being prepared. Please check back later for the full content.*
  `;

  return (
    <div
      className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm overflow-hidden"
      style={{
        overflow: 'hidden',
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0
      }}
      onClick={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
      onWheel={(e) => e.preventDefault()}
      onTouchMove={(e) => e.preventDefault()}
      onScroll={(e) => e.preventDefault()}
    >
      <div 
        className="h-full w-full flex items-center justify-center p-4"
        onClick={(e) => {
          if (e.target === e.currentTarget) {
            onClose();
          }
        }}
      >
        <div
          className="bg-card rounded-xl w-full max-w-4xl max-h-[85vh] shadow-xl overflow-hidden flex flex-col border border-border"
          onClick={(e) => e.stopPropagation()}
          onWheel={(e) => e.stopPropagation()}
          onTouchMove={(e) => e.stopPropagation()}
        >
          {/* Fixed Header */}
          <div className="flex-shrink-0 bg-card border-b border-border p-6 rounded-t-xl">
            <div className="flex items-start justify-between">
              <div className="flex-1 pr-4">
                <h1 className="text-2xl lg:text-3xl font-bold text-foreground mb-4 leading-tight">
                  {currentPost.title}
                </h1>
                
                {/* Post Meta */}
                <div className="flex items-center flex-wrap gap-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-2">
                    <User size={16} />
                    <span>{getAuthor()}</span>
                  </div>
                  
                  {getPublishDate() && (
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>{getPublishDate()}</span>
                    </div>
                  )}
                  
                  <div className="flex items-center space-x-2">
                    <Clock size={16} />
                    <span>{getReadTime()}</span>
                  </div>
                </div>

                {/* Tags */}
                {currentPost.tags && currentPost.tags.length > 0 && (
                  <div className="flex flex-wrap gap-2 mt-4">
                    {currentPost.tags.map((tag, index) => (
                      <span 
                        key={index}
                        className="inline-flex items-center px-3 py-1 bg-gdg-blue/10 text-gdg-blue text-xs rounded-full border border-gdg-blue/20"
                      >
                        <Tag size={12} className="mr-1" />
                        {tag}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              
              <button
                onClick={onClose}
                className="flex-shrink-0 text-muted-foreground hover:text-foreground transition-colors p-1 rounded-md hover:bg-muted/50"
                aria-label="Close modal"
              >
                <X size={24} />
              </button>
            </div>
          </div>

          {/* Scrollable Content */}
          <div className="flex-1 overflow-y-auto p-6">
            <div className="prose prose-gray dark:prose-invert max-w-none prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-code:text-foreground prose-pre:bg-muted prose-pre:border prose-pre:border-border">
              <ReactMarkdown
                remarkPlugins={[remarkGfm]}
                rehypePlugins={[rehypeHighlight, rehypeRaw]}
                components={{
                  // Custom components for better styling
                  h1: ({ children }) => (
                    <h1 className="text-3xl font-bold text-foreground mb-6 mt-8 first:mt-0">
                      {children}
                    </h1>
                  ),
                  h2: ({ children }) => (
                    <h2 className="text-2xl font-semibold text-foreground mb-4 mt-8 first:mt-0">
                      {children}
                    </h2>
                  ),
                  h3: ({ children }) => (
                    <h3 className="text-xl font-semibold text-foreground mb-3 mt-6">
                      {children}
                    </h3>
                  ),
                  h4: ({ children }) => (
                    <h4 className="text-lg font-semibold text-foreground mb-2 mt-4">
                      {children}
                    </h4>
                  ),
                  p: ({ children }) => (
                    <p className="text-foreground mb-4 leading-relaxed">
                      {children}
                    </p>
                  ),
                  ul: ({ children }) => (
                    <ul className="list-disc list-inside mb-4 space-y-1 text-foreground">
                      {children}
                    </ul>
                  ),
                  ol: ({ children }) => (
                    <ol className="list-decimal list-inside mb-4 space-y-1 text-foreground">
                      {children}
                    </ol>
                  ),
                  li: ({ children }) => (
                    <li className="text-foreground">
                      {children}
                    </li>
                  ),
                  blockquote: ({ children }) => (
                    <blockquote className="border-l-4 border-gdg-blue pl-4 py-2 my-4 bg-muted/30 rounded-r-lg">
                      {children}
                    </blockquote>
                  ),
                  code: ({ children, className, ...props }) => {
                    const isInline = !className || !className.includes('language-');
                    if (isInline) {
                      return (
                        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono text-foreground border border-border" {...props}>
                          {children}
                        </code>
                      );
                    }
                    return (
                      <code className="text-foreground" {...props}>
                        {children}
                      </code>
                    );
                  },
                  pre: ({ children }) => (
                    <pre className="bg-muted border border-border rounded-lg p-4 overflow-x-auto mb-4">
                      {children}
                    </pre>
                  ),
                  a: ({ children, href }) => (
                    <a 
                      href={href} 
                      className="text-gdg-blue hover:text-gdg-blue/80 underline"
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      {children}
                    </a>
                  ),
                  strong: ({ children }) => (
                    <strong className="font-semibold text-foreground">
                      {children}
                    </strong>
                  ),
                  em: ({ children }) => (
                    <em className="italic text-foreground">
                      {children}
                    </em>
                  )
                }}
              >
                {currentPost.content || fallbackContent}
              </ReactMarkdown>
            </div>
          </div>

          {/* Fixed Footer */}
          <div className="flex-shrink-0 p-6 border-t border-border bg-card rounded-b-xl">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                {/* Post Stats */}
                <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                  <div className="flex items-center space-x-1">
                    <Eye size={16} />
                    <span>{currentPost.views_count || 0} views</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <Heart size={16} />
                    <span>{currentPost.likes_count || 0} likes</span>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex items-center space-x-2">
                  <button
                    onClick={handleLike}
                    disabled={isLiking || isCheckingLikeStatus}
                    className={`flex items-center space-x-1 px-3 py-2 text-sm border rounded-lg transition-colors disabled:opacity-50 ${
                      hasLiked 
                        ? 'border-red-500 bg-red-500/10 text-red-500 hover:bg-red-500/20' 
                        : 'border-border hover:bg-muted/30 text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <Heart 
                      size={16} 
                      className={`${isLiking ? 'animate-pulse' : ''} ${hasLiked ? 'fill-current' : ''}`} 
                    />
                    <span>
                      {isLiking 
                        ? (hasLiked ? 'Unliking...' : 'Liking...') 
                        : (hasLiked ? 'Unlike' : 'Like')
                      }
                    </span>
                  </button>
                  
                  <button
                    onClick={() => {
                      if (navigator.share) {
                        navigator.share({
                          title: currentPost.title,
                          text: currentPost.excerpt,
                          url: window.location.href
                        });
                      } else {
                        navigator.clipboard.writeText(
                          `${currentPost.title} - ${currentPost.excerpt}\n\n${window.location.href}`
                        );
                      }
                    }}
                    className="px-4 py-2 text-sm border border-border rounded-lg hover:bg-muted/30 transition-colors text-muted-foreground hover:text-foreground"
                  >
                    Share
                  </button>
                </div>
              </div>
              
              <button
                onClick={onClose}
                className="px-6 py-2 bg-primary text-primary-foreground rounded-lg hover:bg-primary/90 transition-colors font-medium"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BlogPostModal;