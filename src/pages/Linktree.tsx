import { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { ExternalLink, Share2, Eye } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { linktreeService, LinktreeProfile, LinktreeLink } from '@/services/linktreeService';
import { getIconComponent } from '@/lib/icons';
import NotFound from './NotFound';

const Linktree = () => {
  const { username } = useParams<{ username: string }>();
  const [profile, setProfile] = useState<LinktreeProfile | null>(null);
  const [links, setLinks] = useState<LinktreeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!username) {
        setNotFound(true);
        setLoading(false);
        return;
      }

      try {
        const profileData = await linktreeService.getProfile(username);
        if (!profileData) {
          setNotFound(true);
          setLoading(false);
          return;
        }

        setProfile(profileData);
        const linksData = await linktreeService.getProfileLinks(profileData.id);
        setLinks(linksData);

        // Track profile view
        await linktreeService.trackClick(profileData.id, undefined, {
          user_agent: navigator.userAgent,
          referrer: document.referrer
        });
      } catch (err) {
        console.error('Error fetching linktree data:', err);
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  const handleLinkClick = async (link: LinktreeLink) => {
    if (profile) {
      await linktreeService.trackClick(profile.id, link.id, {
        user_agent: navigator.userAgent,
        referrer: document.referrer
      });
    }

    // Open external links in new tab, internal links in same tab
    if (link.url.startsWith('http')) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = link.url;
    }
  };

  const handleShare = async () => {
    const url = window.location.href;
    
    if (navigator.share) {
      try {
        await navigator.share({
          title: profile?.display_name || 'Linktree',
          text: profile?.bio || 'Check out my links',
          url: url
        });
      } catch (err) {
        // User cancelled sharing
      }
    } else {
      try {
        await navigator.clipboard.writeText(url);
        toast.success('Link copied to clipboard!');
      } catch (err) {
        toast.error('Failed to copy link');
      }
    }
  };

  const getBackgroundStyle = () => {
    if (!profile) return {};

    switch (profile.background_type) {
      case 'color':
        return { backgroundColor: profile.background_value };
      case 'gradient':
        return { background: profile.background_value };
      case 'image':
        return {
          backgroundImage: `url(${profile.background_value})`,
          backgroundSize: 'cover',
          backgroundPosition: 'center',
          backgroundRepeat: 'no-repeat'
        };
      default:
        return { backgroundColor: '#1a1a1a' };
    }
  };

  const getButtonStyle = (link: LinktreeLink) => {
    const baseStyle = {
      color: link.text_color || '#ffffff',
      textShadow: '0 1px 2px rgba(0,0,0,0.3)',
    };

    // Helper function to convert hex to rgba
    const hexToRgba = (hex: string, alpha: number) => {
      const r = parseInt(hex.slice(1, 3), 16);
      const g = parseInt(hex.slice(3, 5), 16);
      const b = parseInt(hex.slice(5, 7), 16);
      return `rgba(${r}, ${g}, ${b}, ${alpha})`;
    };

    const buttonColor = link.button_color || '#ffffff';

    switch (link.button_style) {
      case 'outline':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.1)',
          border: `2px solid ${buttonColor}`,
        };
      case 'filled':
        return {
          ...baseStyle,
          backgroundColor: buttonColor,
          border: `1px solid ${buttonColor}`,
        };
      case 'minimal':
        return {
          ...baseStyle,
          backgroundColor: 'rgba(255, 255, 255, 0.05)',
          border: `1px solid ${hexToRgba(buttonColor, 0.3)}`,
        };
      default:
        return {
          ...baseStyle,
          backgroundColor: hexToRgba(buttonColor, 0.15),
          border: `1px solid ${hexToRgba(buttonColor, 0.4)}`,
        };
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-32 w-32 border-b-2 border-white"></div>
      </div>
    );
  }

  if (notFound || !profile) {
    return <NotFound />;
  }

  return (
    <div 
      className="min-h-screen py-12 px-4 relative"
      style={getBackgroundStyle()}
    >
      {/* Hide navigation for linktree pages */}
      <style>{`
        nav { display: none !important; }
        body { margin: 0; padding: 0; }
      `}</style>
      
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-10 animate-fade-in">
          <Avatar className="w-28 h-28 mx-auto mb-6 ring-4 ring-white/20">
            <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            <AvatarFallback className="text-3xl bg-white/20 text-white">
              {profile.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-3xl font-bold text-white mb-3 drop-shadow-lg">
            {profile.display_name}
          </h1>
          
          {profile.bio && (
            <p className="text-white/90 mb-6 leading-relaxed text-lg px-4 drop-shadow">
              {profile.bio}
            </p>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white/80 hover:text-white hover:bg-white/10 backdrop-blur-sm border border-white/20"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.map((link, index) => {
            const IconComponent = getIconComponent(link.icon_value || 'link');
            
            return (
              <div
                key={link.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <button
                  onClick={() => handleLinkClick(link)}
                  className="w-full p-5 rounded-2xl backdrop-blur-sm border border-white/20 hover:border-white/40 hover:scale-[1.02] transition-all duration-300 shadow-lg hover:shadow-xl"
                  style={getButtonStyle(link)}
                >
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0 mr-4">
                      <IconComponent className="w-6 h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-lg truncate mb-1">
                        {link.title}
                      </div>
                      {link.description && (
                        <div className="text-sm opacity-80 truncate">
                          {link.description}
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-3 flex items-center space-x-2">
                      {link.click_count > 0 && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-2 py-1 text-xs font-medium">
                          {link.click_count}
                        </div>
                      )}
                      <ExternalLink className="w-5 h-5 opacity-60" />
                    </div>
                  </div>
                </button>
              </div>
            );
          })}
        </div>

        {links.length === 0 && (
          <div className="text-center py-16">
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-8 border border-white/20">
              <p className="text-white/70 text-lg">No links available yet.</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Linktree;