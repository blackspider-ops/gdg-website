import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, Users, BookOpen, Code, Briefcase, Phone, Loader2 } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();
  const { navigationItems, getSiteSetting, isLoading } = useContent();

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

  const siteTitle = getSiteSetting('site_title');
  const siteSubtitle = getSiteSetting('site_subtitle');

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/90 backdrop-blur-md border-b border-border">
      {/* Loading indicator */}
      {isLoading && (
        <div className="absolute top-0 left-0 w-full h-1 bg-primary/20">
          <div className="h-full bg-primary animate-pulse"></div>
        </div>
      )}
      
      <div className="editorial-grid">
        <div className="col-span-12 flex items-center justify-between py-2 sm:py-3 px-2 gap-2 sm:gap-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-2 sm:space-x-3 magnetic-button min-w-0 flex-shrink-0">
            <div className="w-8 h-8 sm:w-10 sm:h-10 bg-primary rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0">
              <span className="text-primary-foreground font-display font-bold text-sm sm:text-lg">G</span>
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display font-semibold text-sm sm:text-base md:text-lg leading-tight truncate">{siteTitle}</span>
              <span className="text-muted-foreground text-xs hidden sm:block leading-tight truncate">{siteSubtitle}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4 xl:space-x-6 flex-shrink-0">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-xs lg:text-sm font-medium transition-colors underline-slide focus-ring px-2 py-1 rounded whitespace-nowrap ${
                  isActive(item.href) 
                    ? 'text-primary' 
                    : 'text-foreground/80 hover:text-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link to="/contact" className="magnetic-button px-3 lg:px-4 py-2 bg-primary text-primary-foreground rounded-lg font-medium focus-ring whitespace-nowrap ml-2 lg:ml-4 text-xs lg:text-sm">
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