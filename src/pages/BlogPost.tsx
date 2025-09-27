import React, { useState, useEffect } from 'react';
import { useParams, Link, Navigate } from 'react-router-dom';
import { Calendar, User, Tag, ArrowLeft, Eye, Heart, Share2 } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import rehypeHighlight from 'rehype-highlight';
import rehypeRaw from 'rehype-raw';
import { BlogService, BlogPost as BlogPostType } from '@/services/blogService';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import BlogLikeButton from '@/components/BlogLikeButton';
import 'highlight.js/styles/github-dark.css';

const BlogPost = () => {
  const { slug } = useParams<{ slug: string }>();
  const [post, setPost] = useState<BlogPostType | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);


  useEffect(() => {
    if (slug) {
      loadBlogPost(slug);
    }
  }, [slug]);

  const loadBlogPost = async (postSlug: string) => {
    setIsLoading(true);
    setNotFound(false);
    
    try {
      const blogPost = await BlogService.getPostBySlug(postSlug);
      
      if (blogPost) {
        setPost(blogPost);
        
        // Increment view count
        await BlogService.incrementViews(blogPost.id);
      } else {
        setNotFound(true);
      }
    } catch (error) {
      setNotFound(true);
    } finally {
      setIsLoading(false);
    }
  };

  const handleShare = async () => {
    if (!post) return;
    
    const shareData = {
      title: post.title,
      text: post.excerpt || 'Check out this blog post from GDG PSU',
      url: window.location.href
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        // Fallback: copy to clipboard
        await navigator.clipboard.writeText(window.location.href);
        // You could show a toast notification here
      }
    } catch (error) {
      // Silently handle share errors
    }
  };

  if (notFound) {
    return <Navigate to="/404" replace />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background pt-16">
        <div className="editorial-grid py-16">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3">
            <LoadingSkeleton variant="article" />
          </div>
        </div>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/404" replace />;
  }

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Back to Blog */}
      <section className="py-8 border-b border-border">
        <div className="editorial-grid">
          <div className="col-span-12">
            <Link 
              to="/blog"
              className="inline-flex items-center space-x-2 text-muted-foreground hover:text-gdg-blue transition-colors"
            >
              <ArrowLeft size={16} />
              <span>Back to Blog</span>
            </Link>
          </div>
        </div>
      </section>

      {/* Article Header */}
      <section className="py-16">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3">
            <article>
              {/* Category */}
              {post.category && (
                <div className="mb-6">
                  <span 
                    className="px-3 py-1 text-sm rounded-full"
                    style={{ 
                      backgroundColor: `${post.category.color}20`,
                      color: post.category.color 
                    }}
                  >
                    {post.category.name}
                  </span>
                </div>
              )}

              {/* Title */}
              <h1 className="text-display text-3xl sm:text-4xl lg:text-5xl font-bold mb-6 leading-tight">
                {post.title}
              </h1>

              {/* Excerpt */}
              {post.excerpt && (
                <p className="text-xl text-muted-foreground content-measure mb-8">
                  {post.excerpt}
                </p>
              )}

              {/* Meta Information */}
              <div className="flex flex-wrap items-center gap-6 text-sm text-muted-foreground mb-8 pb-8 border-b border-border">
                <div className="flex items-center space-x-2">
                  <User size={16} />
                  <span>{post.author_name}</span>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Calendar size={16} />
                  <span>
                    {post.published_at 
                      ? new Date(post.published_at).toLocaleDateString('en-US', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric'
                        })
                      : 'No date'
                    }
                  </span>
                </div>

                <div className="flex items-center space-x-2">
                  <Eye size={16} />
                  <span>{post.views_count || 0} views</span>
                </div>

                <span>{post.read_time_minutes || 5} min read</span>
              </div>

              {/* Featured Image */}
              {post.featured_image_url && (
                <div className="mb-8">
                  <img 
                    src={post.featured_image_url} 
                    alt={post.title}
                    className="w-full h-64 sm:h-80 lg:h-96 object-cover rounded-lg"
                  />
                </div>
              )}

              {/* Content */}
              <div className="prose prose-lg max-w-none prose-headings:font-display prose-headings:text-foreground prose-p:text-foreground prose-strong:text-foreground prose-a:text-gdg-blue prose-a:no-underline hover:prose-a:underline prose-blockquote:border-gdg-blue prose-blockquote:text-muted-foreground prose-code:text-gdg-blue prose-code:bg-muted prose-code:px-1 prose-code:py-0.5 prose-code:rounded prose-pre:bg-muted prose-pre:border prose-pre:border-border">
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
                    ),
                    img: ({ src, alt }) => (
                      <img 
                        src={src} 
                        alt={alt} 
                        className="w-full h-auto rounded-lg my-6 border border-border"
                      />
                    ),
                    table: ({ children }) => (
                      <div className="overflow-x-auto my-6">
                        <table className="w-full border-collapse border border-border">
                          {children}
                        </table>
                      </div>
                    ),
                    th: ({ children }) => (
                      <th className="border border-border px-4 py-2 bg-muted text-foreground font-semibold text-left">
                        {children}
                      </th>
                    ),
                    td: ({ children }) => (
                      <td className="border border-border px-4 py-2 text-foreground">
                        {children}
                      </td>
                    ),
                    hr: () => (
                      <hr className="my-8 border-border" />
                    )
                  }}
                >
                  {post.content || `
${post.excerpt}

---

*This blog post is currently being prepared. Please check back later for the full content.*
                  `}
                </ReactMarkdown>
              </div>

              {/* Tags */}
              {post.tags && post.tags.length > 0 && (
                <div className="mt-12 pt-8 border-t border-border">
                  <div className="flex items-center space-x-2 mb-4">
                    <Tag size={16} className="text-muted-foreground" />
                    <span className="text-sm font-medium text-muted-foreground">Tags</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {post.tags.map((tag) => (
                      <span 
                        key={tag} 
                        className="px-3 py-1 bg-muted text-muted-foreground text-sm rounded-full hover:bg-gdg-blue/10 hover:text-gdg-blue transition-colors cursor-pointer"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Actions */}
              <div className="mt-12 pt-8 border-t border-border flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <div className="px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors">
                    <BlogLikeButton 
                      postId={post.id} 
                      initialLikeCount={post.likes_count || 0}
                      className="text-base"
                    />
                  </div>

                  <button
                    onClick={handleShare}
                    className="flex items-center space-x-2 px-4 py-2 rounded-lg border border-border hover:bg-muted transition-colors"
                  >
                    <Share2 size={16} />
                    <span>Share</span>
                  </button>
                </div>

                <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                  <Eye size={16} />
                  <span>{(post.views_count || 0) + 1} views</span>
                </div>
              </div>
            </article>
          </div>
        </div>
      </section>

      {/* Related Posts or Call to Action */}
      <section className="py-16 bg-muted/20 border-t border-border">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <h3 className="text-display text-2xl font-semibold mb-4">
              Enjoyed this post?
            </h3>
            <p className="text-muted-foreground content-measure mx-auto mb-6">
              Check out more posts from our community or consider contributing your own insights.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link 
                to="/blog"
                className="btn-editorial px-6 py-3 bg-gdg-blue text-foreground border-gdg-blue hover:bg-gdg-blue/90"
              >
                More Posts
              </Link>
              <Link 
                to="/contact"
                className="btn-editorial px-6 py-3 border-border hover:bg-muted"
              >
                Submit a Post
              </Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};

export default BlogPost;