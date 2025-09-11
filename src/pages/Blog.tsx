import React from 'react';
import { Calendar, User, Tag, ArrowRight } from 'lucide-react';
import { Link } from 'react-router-dom';

const Blog = () => {
  // Mock blog posts
  const posts = [
    {
      title: 'Getting Started with Google Cloud for Students',
      excerpt: 'Learn how to leverage Google Cloud Platform with student credits and build scalable applications.',
      author: 'Sarah Chen',
      date: 'March 10, 2024',
      tags: ['Cloud', 'Beginner', 'GCP'],
      readTime: '5 min read',
      featured: true,
    },
    {
      title: 'Building Accessible Android Apps',
      excerpt: 'Best practices for creating inclusive mobile experiences that work for everyone.',
      author: 'Michael Rodriguez',
      date: 'March 5, 2024',
      tags: ['Android', 'Accessibility', 'Mobile'],
      readTime: '8 min read',
      featured: false,
    },
    {
      title: 'Machine Learning Study Jam Recap',
      excerpt: 'Highlights from our recent ML workshop series covering TensorFlow and practical applications.',
      author: 'Emily Johnson',
      date: 'February 28, 2024',
      tags: ['ML', 'TensorFlow', 'Workshop'],
      readTime: '6 min read',
      featured: false,
    },
    {
      title: 'The Future of Web Development',
      excerpt: 'Exploring emerging trends in frontend frameworks and their impact on developer experience.',
      author: 'David Kim',
      date: 'February 22, 2024',
      tags: ['Web', 'Frontend', 'Trends'],
      readTime: '7 min read',
      featured: false,
    },
  ];

  const featuredPost = posts.find(post => post.featured);
  const regularPosts = posts.filter(post => !post.featured);

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

      {/* Featured Post */}
      {featuredPost && (
        <section className="py-16">
          <div className="editorial-grid">
            <div className="col-span-12">
              <div className="flex items-center space-x-2 mb-6">
                <span className="text-sm font-medium text-gdg-blue uppercase tracking-wide">Featured</span>
                <div className="w-12 h-px bg-gdg-blue"></div>
              </div>
            </div>

            <div className="col-span-12 lg:col-span-8 gdg-accent-bar pl-6">
              <article className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-lg transition-shadow">
                <div className="p-8">
                  <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                    <div className="flex items-center space-x-2">
                      <User size={16} />
                      <span>{featuredPost.author}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Calendar size={16} />
                      <span>{featuredPost.date}</span>
                    </div>
                    <span>{featuredPost.readTime}</span>
                  </div>

                  <h2 className="text-display text-2xl lg:text-3xl font-semibold mb-4 hover:text-gdg-blue transition-colors">
                    <Link to={`/blog/${featuredPost.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {featuredPost.title}
                    </Link>
                  </h2>
                  
                  <p className="text-muted-foreground content-measure mb-6">
                    {featuredPost.excerpt}
                  </p>

                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-2">
                      {featuredPost.tags.map((tag) => (
                        <span key={tag} className="px-3 py-1 bg-gdg-blue/10 text-gdg-blue text-xs rounded-full">
                          {tag}
                        </span>
                      ))}
                    </div>

                    <Link 
                      to={`/blog/${featuredPost.title.toLowerCase().replace(/\s+/g, '-')}`}
                      className="inline-flex items-center text-gdg-blue hover:text-gdg-blue/80 transition-colors group"
                    >
                      Read More
                      <ArrowRight size={16} className="ml-1 group-hover:translate-x-1 transition-transform" />
                    </Link>
                  </div>
                </div>
              </article>
            </div>

            <div className="col-span-12 lg:col-span-4 lg:col-start-9 mt-8 lg:mt-0">
              <div className="bg-muted/50 rounded-lg p-6">
                <h3 className="font-display font-semibold text-lg mb-4">Newsletter</h3>
                <p className="text-muted-foreground text-sm mb-4">
                  Get weekly updates on events, new blog posts, and community highlights.
                </p>
                <div className="space-y-3">
                  <input
                    type="email"
                    placeholder="Enter your email"
                    className="w-full px-3 py-2 bg-background border border-input rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-gdg-blue"
                  />
                  <button className="btn-editorial px-4 py-2 bg-gdg-blue text-white border-gdg-blue hover:bg-gdg-blue/90 w-full">
                    Subscribe
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Recent Posts */}
      <section className="py-16 bg-muted/20">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-display text-2xl font-semibold mb-8">Recent Posts</h2>
          </div>

          <div className="col-span-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {regularPosts.map((post, index) => (
              <article key={index} className="bg-card border border-border rounded-lg overflow-hidden hover:shadow-md transition-shadow group">
                <div className="p-6">
                  <div className="flex items-center space-x-4 text-xs text-muted-foreground mb-3">
                    <div className="flex items-center space-x-1">
                      <User size={14} />
                      <span>{post.author}</span>
                    </div>
                    <div className="flex items-center space-x-1">
                      <Calendar size={14} />
                      <span>{post.date}</span>
                    </div>
                  </div>

                  <h3 className="font-display font-semibold text-lg mb-3 group-hover:text-gdg-blue transition-colors">
                    <Link to={`/blog/${post.title.toLowerCase().replace(/\s+/g, '-')}`}>
                      {post.title}
                    </Link>
                  </h3>
                  
                  <p className="text-muted-foreground text-sm mb-4">
                    {post.excerpt}
                  </p>

                  <div className="flex items-center justify-between pt-4 border-t border-border">
                    <div className="flex flex-wrap gap-1">
                      {post.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="px-2 py-1 bg-muted text-muted-foreground text-xs rounded">
                          {tag}
                        </span>
                      ))}
                    </div>
                    <span className="text-xs text-muted-foreground">{post.readTime}</span>
                  </div>
                </div>
              </article>
            ))}
          </div>
        </div>
      </section>

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
              className="btn-editorial px-6 py-3 bg-gdg-blue text-white border-gdg-blue hover:bg-gdg-blue/90 inline-flex items-center"
            >
              Submit a Post
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Blog;