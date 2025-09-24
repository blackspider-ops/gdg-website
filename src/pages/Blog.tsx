import React, { useState, useEffect } from 'react';
import { Calendar, User, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlogService, BlogPost } from '@/services/blogService';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import BlogPostModal from '@/components/BlogPostModal';

const Blog = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    loadBlogPosts();
  }, []);

  const loadBlogPosts = async () => {
    setIsLoading(true);
    try {
      const blogPosts = await BlogService.getPublishedPosts();
      setPosts(blogPosts);
    } catch (error) {
      console.error('Error loading blog posts:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const openPostModal = async (post: BlogPost) => {
    setSelectedPost(post);
    setIsModalOpen(true);
    
    // Increment view count when post is opened
    if (post.id) {
      try {
        await BlogService.incrementViews(post.id);
        // Update the local state to reflect the new view count
        setPosts(prevPosts => 
          prevPosts.map(p => 
            p.id === post.id 
              ? { ...p, views_count: (p.views_count || 0) + 1 }
              : p
          )
        );
      } catch (error) {
        console.error('Error incrementing view count:', error);
      }
    }
  };

  const closePostModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Use only real posts from database
  const featuredPost = posts.find(post => post.is_featured);
  const regularPosts = posts.filter(post => !post.is_featured);

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Page Header */}
      <section className="py-16 bg-muted/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8">
            <h1 className="text-display text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
              Blog & Updates
            </h1>
            <p className="text-editorial text-lg text-muted-foreground content-measure">
              Insights, tutorials, and updates from our community. Learn about the latest 
              technologies, workshop recaps, and member spotlights.
            </p>
          </div>
        </div>
      </section>

      {/* Loading State */}
      {isLoading && (
        <section className="py-16">
          <div className="editorial-grid">
            <div className="col-span-12">
              <LoadingSkeleton variant="card" count={3} />
            </div>
          </div>
        </section>
      )}

      {/* Featured Post */}
      {!isLoading && posts.length > 0 && featuredPost && (
        <section className="py-16">
          <div className="editorial-grid">
            <div className="col-span-12">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-sm font-medium text-gdg-blue uppercase tracking-wide">Featured</span>
                <div className="w-12 h-px bg-gdg-blue"></div>
              </div>
            </div>

            <div className="col-span-12 gdg-accent-bar pl-6">
              <article 
                className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow cursor-pointer"
                onClick={() => openPostModal(featuredPost)}
              >
                <div className="p-8">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-2">
                      <User size={16} />
                      <span>{featuredPost.author_name}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>{featuredPost.published_at ? new Date(featuredPost.published_at).toLocaleDateString() : 'No date'}</span>
                    </div>
                    <span>{featuredPost.read_time_minutes ? `${featuredPost.read_time_minutes} min read` : '5 min read'}</span>
                  </div>

                  <h2 
                    className="text-display text-2xl lg:text-3xl font-semibold mb-4 hover:text-gdg-blue transition-colors cursor-pointer"
                    onClick={() => openPostModal(featuredPost)}
                  >
                    {featuredPost.title}
                  </h2>
                  
                  <p className="text-muted-foreground content-measure mb-6">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {(featuredPost.tags || []).map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-gdg-blue/10 text-gdg-blue text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <button 
                      onClick={() => openPostModal(featuredPost)}
                      className="inline-flex items-center text-gdg-blue hover:text-gdg-blue/80 transition-colors group"
                    >
                      Read More
                      <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </button>
                  </div>
                </div>
              </article>
            </div>


          </div>
        </section>
      )}

      {/* Recent Posts */}
      {!isLoading && (
        <section className="py-16 bg-muted/20">
          <div className="editorial-grid">
            {posts.length > 0 && (
              <div className="col-span-12">
                <h2 className="text-display text-2xl font-semibold mb-8">Recent Posts</h2>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="col-span-12 text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
                <p className="text-muted-foreground">Check back soon for updates from our community!</p>
              </div>
            ) : regularPosts.length > 0 ? (
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {regularPosts.map((post, index) => (
              <article 
                key={index} 
                className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow group cursor-pointer"
                onClick={() => openPostModal(post)}
              >
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{post.author_name}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'No date'}</span>
                    </div>
                  </div>

                  <h3 
                    className="font-display font-semibold text-lg mb-3 group-hover:text-gdg-blue transition-colors cursor-pointer"
                    onClick={() => openPostModal(post)}
                  >
                    {post.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-1">
                      {(post.tags || []).slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {post.read_time_minutes ? `${post.read_time_minutes} min read` : '5 min read'}
                    </span>
                  </div>
                </div>
              </article>
                ))}
              </div>
            ) : posts.length > 0 && regularPosts.length === 0 ? (
              <div className="col-span-12 text-center py-12">
                <h3 className="text-lg font-semibold mb-2">Only featured posts available</h3>
                <p className="text-muted-foreground">More posts coming soon!</p>
              </div>
            ) : null}
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-16 border-t border-border">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <h3 className="text-display text-2xl font-semibold mb-4">
              Want to Contribute?
            </h3>
            <p className="text-muted-foreground content-measure mx-auto mb-6">
              Share your knowledge with the community! We're always looking for 
              member-written tutorials, project showcases, and tech insights.
            </p>
            <Link 
              to="/contact"
              className="btn-editorial px-6 py-3 bg-gdg-blue text-foreground border-gdg-blue hover:bg-gdg-blue/90 inline-flex items-center"
            >
              Submit a Post
            </Link>
          </div>
        </div>
      </section>

      {/* Blog Post Modal */}
      {selectedPost && (
        <BlogPostModal
          isOpen={isModalOpen}
          onClose={closePostModal}
          post={selectedPost}
        />
      )}
    </div>
  );
};

export default Blog;