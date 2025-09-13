import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, Users, BookOpen, Code, Briefcase, Phone } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { navigationItems, getSiteSetting } = useContent();

  // Icon mapping
  const iconMap: Record<string, any> = {
    Calendar,
    Users,
    BookOpen,
    Code,
    Briefcase,
    Phone
  };

  // Use only dynamic navigation items from admin panel
  const navigation = navigationItems.map(item => ({
    name: item.label,
    href: item.href,
    icon: iconMap[item.icon] || BookOpen
  }));

  const siteTitle = getSiteSetting('site_title') || 'GDG@PSU';
  const siteSubtitle = getSiteSetting('site_subtitle') || 'Penn State University';

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border">
      <div className="editorial-grid">
        <div className="col-span-12 flex items-center justify-between py-3 px-2 gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 magnetic-button min-w-0 flex-shrink-0">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-display font-bold text-lg">G</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display font-semibold text-base sm:text-lg leading-tight truncate">{siteTitle}</span>
              <span className="text-muted-foreground text-xs hidden sm:block leading-tight truncate">{siteSubtitle}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-2 lg:space-x-6 flex-shrink-0">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors underline-slide focus-ring px-2 py-1 rounded whitespace-nowrap ${
                  isActive(item.href) 
                    ? 'text-primary' 
                    : 'text-foreground/80 hover:text-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link to="/contact" className="magnetic-button px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium focus-ring whitespace-nowrap ml-4">
              Join Chapter
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 hover:bg-card rounded-lg transition-colors focus-ring text-foreground"
          >
            {isOpen ? <X size={20} /> : <Menu size={20} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden col-span-12 pb-6 animate-fade-up">
            <div className="flex flex-col space-y-3">
              {navigation.map((item) => {
                const Icon = item.icon;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setIsOpen(false)}
                    className={`flex items-center space-x-3 p-4 rounded-lg transition-colors focus-ring ${
                      isActive(item.href)
                        ? 'bg-primary/10 text-primary border border-primary/20'
                        : 'hover:bg-card text-foreground/80 hover:text-foreground'
                    }`}
                  >
                    <Icon size={18} />
                    <span className="font-medium">{item.name}</span>
                  </Link>
                );
              })}
              <Link to="/contact" className="magnetic-button px-6 py-4 bg-primary text-primary-foreground rounded-lg font-medium mt-4 text-center focus-ring">
                Join Chapter
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
};

export default Navigation;