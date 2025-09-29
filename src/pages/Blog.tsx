import React, { useState, useEffect } from 'react';
import { Calendar, User, Tag, ArrowRight, ExternalLink, Filter, Grid, List, MessageCircle } from 'lucide-react';
import { Link } from 'react-router-dom';
import { BlogService, BlogPost, BlogCategory } from '@/services/blogService';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import BlogPostModal from '@/components/BlogPostModal';
import BlogLikeButton from '@/components/BlogLikeButton';
import { useContent } from '@/contexts/ContentContext';

const Blog = () => {
  const { getPageSection } = useContent();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [categories, setCategories] = useState<BlogCategory[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedPost, setSelectedPost] = useState<BlogPost | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [showAllPosts, setShowAllPosts] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'date' | 'views' | 'likes'>('date');

  useEffect(() => {
    loadBlogPosts();
    loadCategories();
  }, []);

  const loadCategories = async () => {
    try {
      const blogCategories = await BlogService.getCategories();
      setCategories(blogCategories);
    } catch (error) {
      // Silently handle loading errors
    }
  };

  // Reload categories periodically to catch updates
  useEffect(() => {
    const interval = setInterval(() => {
      loadCategories();
    }, 30000); // Refresh every 30 seconds

    return () => clearInterval(interval);
  }, []);

  const loadBlogPosts = async () => {
    setIsLoading(true);
    try {
      const blogPosts = await BlogService.getPublishedPosts();
      setPosts(blogPosts);
    } catch (error) {
      // Silently handle loading errors
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
        // Silently handle view count errors
      }
    }
  };

  const closePostModal = () => {
    setIsModalOpen(false);
    setSelectedPost(null);
  };

  // Filter and sort posts
  const filteredPosts = posts.filter(post => {
    if (selectedCategory === 'all') return true;
    return post.category_id === selectedCategory;
  });

  const sortedPosts = [...filteredPosts].sort((a, b) => {
    switch (sortBy) {
      case 'views':
        return (b.views_count || 0) - (a.views_count || 0);
      case 'likes':
        return (b.likes_count || 0) - (a.likes_count || 0);
      case 'date':
      default:
        return new Date(b.published_at || b.created_at).getTime() - new Date(a.published_at || a.created_at).getTime();
    }
  });

  // Use filtered and sorted posts
  const featuredPost = showAllPosts ? null : sortedPosts.find(post => post.is_featured);
  const regularPosts = showAllPosts 
    ? sortedPosts 
    : sortedPosts.filter(post => !post.is_featured);

  const displayPosts = showAllPosts ? sortedPosts : regularPosts;

  // Get page content from database
  const pageHeader = getPageSection('blog', 'header') || {};

  return (
    <div className="min-h-screen bg-background pt-16">
      {/* Page Header */}
      <section className="py-16 bg-muted/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8">
            {pageHeader.title && (
              <h1 className="text-display text-3xl sm:text-4xl lg:text-5xl font-semibold mb-4">
                {pageHeader.title}
              </h1>
            )}
            {pageHeader.description && (
              <p className="text-editorial text-lg text-muted-foreground content-measure">
                {pageHeader.description}
              </p>
            )}
          </div>
          
          {/* Controls */}
          <div className="col-span-12 mt-8">
            <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => setShowAllPosts(!showAllPosts)}
                  className={`flex items-center space-x-2 px-4 py-2 rounded-lg border transition-colors ${
                    showAllPosts 
                      ? 'bg-gdg-blue text-white border-gdg-blue' 
                      : 'border-border hover:bg-muted'
                  }`}
                >
                  {showAllPosts ? <List size={16} /> : <Grid size={16} />}
                  <span>{showAllPosts ? 'Featured View' : 'All Posts'}</span>
                </button>

                {/* Category Filter */}
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="px-4 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gdg-blue"
                >
                  <option value="all">All Categories</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Sort Options */}
              <div className="flex items-center space-x-2">
                <Filter size={16} className="text-muted-foreground" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as 'date' | 'views' | 'likes')}
                  className="px-3 py-2 border border-border rounded-lg bg-background text-foreground focus:outline-none focus:ring-2 focus:ring-gdg-blue text-sm"
                >
                  <option value="date">Latest</option>
                  <option value="views">Most Viewed</option>
                  <option value="likes">Most Liked</option>
                </select>
              </div>
            </div>
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
              <article className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
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
                    <div className="flex items-center space-x-2">
                      <MessageCircle size={16} />
                      <span>{featuredPost.comments_count || 0} comments</span>
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

                    <div className="flex items-center space-x-4">
                      <button 
                        onClick={() => openPostModal(featuredPost)}
                        className="inline-flex items-center text-gdg-blue hover:text-gdg-blue/80 transition-colors group"
                      >
                        Read More
                        <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                      </button>
                      
                      <BlogLikeButton 
                        postId={featuredPost.id} 
                        initialLikeCount={featuredPost.likes_count || 0}
                      />
                      
                      <Link
                        to={`/blog/${featuredPost.slug}`}
                        className="inline-flex items-center px-3 py-1 text-sm border border-border rounded-lg hover:bg-muted transition-colors group"
                      >
                        <ExternalLink size={14} className="mr-1" />
                        Open Page
                      </Link>
                    </div>
                  </div>
                </div>
              </article>
            </div>
          </div>
        </section>
      )}

      {/* Posts Grid */}
      {!isLoading && (
        <section className="py-16 bg-muted/20">
          <div className="editorial-grid">
            {posts.length > 0 && (
              <div className="col-span-12">
                <h2 className="text-display text-2xl font-semibold mb-8">
                  {showAllPosts ? 'All Posts' : 'Recent Posts'}
                  {selectedCategory !== 'all' && (
                    <span className="text-lg text-muted-foreground ml-2">
                      in {categories.find(c => c.id === selectedCategory)?.name}
                    </span>
                  )}
                </h2>
              </div>
            )}

            {posts.length === 0 ? (
              <div className="col-span-12 text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No blog posts yet</h3>
                <p className="text-muted-foreground">Check back soon for updates from our community!</p>
              </div>
            ) : displayPosts.length > 0 ? (
              <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {displayPosts.map((post, index) => (
                  <article 
                    key={post.id || index} 
                    className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow group"
                  >
                    <div className="p-6">
                      {/* Category Badge */}
                      {post.category && (
                        <div className="mb-3">
                          <span 
                            className="px-2 py-1 text-xs rounded-full"
                            style={{ 
                              backgroundColor: `${post.category.color}20`,
                              color: post.category.color 
                            }}
                          >
                            {post.category.name}
                          </span>
                        </div>
                      )}

                      <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                        <div className="flex items-center space-x-1">
                          <User size={14} />
                          <span>{post.author_name}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <Calendar size={14} />
                          <span>{post.published_at ? new Date(post.published_at).toLocaleDateString() : 'No date'}</span>
                        </div>
                        <div className="flex items-center space-x-1">
                          <MessageCircle size={14} />
                          <span>{post.comments_count || 0}</span>
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

                      {/* Action Buttons */}
                      <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                        <div className="flex items-center space-x-4">
                          <button 
                            onClick={() => openPostModal(post)}
                            className="inline-flex items-center text-gdg-blue hover:text-gdg-blue/80 transition-colors group text-sm"
                          >
                            Read More
                            <ArrowRight size={14} className="ml-1 group-hover:translate-x-1 transition-transform" />
                          </button>
                          
                          <BlogLikeButton 
                            postId={post.id} 
                            initialLikeCount={post.likes_count || 0}
                            className="text-xs"
                          />
                        </div>
                        
                        <Link
                          to={`/blog/${post.slug}`}
                          className="inline-flex items-center px-3 py-1 text-xs border border-border rounded-lg hover:bg-muted transition-colors group"
                        >
                          <ExternalLink size={12} className="mr-1" />
                          Open Page
                        </Link>
                      </div>
                    </div>
                  </article>
                ))}
              </div>
            ) : (
              <div className="col-span-12 text-center py-12">
                <h3 className="text-lg font-semibold mb-2">No posts found</h3>
                <p className="text-muted-foreground">
                  {selectedCategory !== 'all' 
                    ? 'No posts in this category yet.' 
                    : 'No posts match your current filters.'
                  }
                </p>
              </div>
            )}
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