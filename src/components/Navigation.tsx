import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Calendar, Users, BookOpen, Code, Briefcase, Phone } from 'lucide-react';

const Navigation = () => {
  const [isOpen, setIsOpen] = React.useState(false);
  const location = useLocation();

  const navigation = [
    { name: 'Events', href: '/events', icon: Calendar },
    { name: 'Blog', href: '/blog', icon: BookOpen },
    { name: 'Projects', href: '/projects', icon: Code },
    { name: 'Team', href: '/team', icon: Users },
    { name: 'Resources', href: '/resources', icon: BookOpen },
    { name: 'Sponsors', href: '/sponsors', icon: Briefcase },
    { name: 'Contact', href: '/contact', icon: Phone },
  ];

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-md border-b border-border">
      <div className="editorial-grid">
        <div className="col-span-12 flex items-center justify-between py-4">
          {/* Logo */}
          <Link to="/" className="flex items-center space-x-3 magnetic-button">
            <div className="w-10 h-10 bg-primary rounded-xl flex items-center justify-center">
              <span className="text-primary-foreground font-display font-bold text-lg">G</span>
            </div>
            <div className="flex flex-col">
              <span className="font-display font-semibold text-lg sm:text-xl leading-none">GDG@PSU</span>
              <span className="text-muted-foreground text-xs hidden sm:block">Penn State University</span>
            </div>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-4 lg:space-x-8">
            {navigation.map((item) => (
              <Link
                key={item.name}
                to={item.href}
                className={`text-sm font-medium transition-colors underline-slide focus-ring ${
                  isActive(item.href) 
                    ? 'text-primary' 
                    : 'text-foreground/80 hover:text-foreground'
                }`}
              >
                {item.name}
              </Link>
            ))}
            <Link to="/contact" className="magnetic-button px-6 py-3 bg-primary text-primary-foreground rounded-lg font-medium focus-ring">
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