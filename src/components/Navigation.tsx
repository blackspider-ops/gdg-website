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
  // Filter out items that don't have valid href
  const navigation = navigationItems
    .filter(item => item.href && item.label)
    .map(item => ({
      name: item.label,
      href: item.href,
      icon: iconMap[item.icon] || BookOpen
    }));

  const siteTitle = getSiteSetting('site_title');
  const siteSubtitle = getSiteSetting('site_subtitle');
  
  // Logo settings
  const logoText = getSiteSetting('logo_text') || 'G';
  const logoImagePath = getSiteSetting('logo_image_path') || '';
  const logoBgColor = getSiteSetting('logo_bg_color') || '#3b82f6';
  const logoTextColor = getSiteSetting('logo_text_color') || '#ffffff';
  const logoUseImage = getSiteSetting('logo_use_image') === 'true' || getSiteSetting('logo_use_image') === true;

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
            <div 
              className={`w-8 h-8 sm:w-10 sm:h-10 rounded-lg sm:rounded-xl flex items-center justify-center flex-shrink-0 ${logoBgColor === 'transparent' ? 'bg-transparent' : ''}`}
              style={{ backgroundColor: logoBgColor === 'transparent' ? 'transparent' : logoBgColor }}
            >
              {logoUseImage && logoImagePath ? (
                <img 
                  src={logoImagePath} 
                  alt="Logo" 
                  className="w-6 h-6 sm:w-8 sm:h-8 object-contain rounded-lg"
                  onError={(e) => {
                    // Fallback to text logo if image fails to load
                    e.currentTarget.style.display = 'none';
                    const fallbackSpan = document.createElement('span');
                    fallbackSpan.className = 'font-display font-bold text-sm sm:text-lg';
                    fallbackSpan.style.color = logoTextColor;
                    fallbackSpan.textContent = logoText;
                    const parent = e.currentTarget.parentNode as HTMLElement;
                    if (parent) {
                      parent.appendChild(fallbackSpan);
                    }
                  }}
                />
              ) : (
                <span 
                  className="font-display font-bold text-sm sm:text-lg"
                  style={{ color: logoTextColor }}
                >
                  {logoText}
                </span>
              )}
            </div>
            <div className="flex flex-col min-w-0">
              <span className="font-display font-semibold text-sm sm:text-base md:text-lg leading-tight truncate">{siteTitle}</span>
              <span className="text-muted-foreground text-xs hidden sm:block leading-tight truncate">{siteSubtitle}</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-1 lg:space-x-4 xl:space-x-6 flex-shrink-0">
            {!isLoading && navigation.length > 0 ? (
              navigation.map((item) => (
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
              ))
            ) : isLoading ? (
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Loader2 size={16} className="animate-spin" />
                <span className="text-xs">Loading...</span>
              </div>
            ) : null}
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
              {!isLoading && navigation.length > 0 ? (
                navigation.map((item) => {
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
                })
              ) : isLoading ? (
                <div className="flex items-center justify-center p-4 text-muted-foreground">
                  <Loader2 size={20} className="animate-spin mr-2" />
                  <span>Loading navigation...</span>
                </div>
              ) : null}
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