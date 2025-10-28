import { useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'react-router-dom';
import { ExternalLink, Share2, Eye, Monitor } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { toast } from 'sonner';
import { linktreeService, LinktreeProfile, LinktreeLink } from '@/services/linktreeService';
import { getIconComponent } from '@/lib/icons';
import EmbedModal from '@/components/EmbedModal';
import NotFound from './NotFound';

const Linktree = () => {
  const { username } = useParams<{ username: string }>();
  const [searchParams] = useSearchParams();
  const [profile, setProfile] = useState<LinktreeProfile | null>(null);
  const [links, setLinks] = useState<LinktreeLink[]>([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [isAutoEmbedding, setIsAutoEmbedding] = useState(false);
  const [embedModal, setEmbedModal] = useState<{
    isOpen: boolean;
    title: string;
    url: string;
    embedType: 'iframe' | 'google_form';
    isAutoEmbed?: boolean;
  }>({
    isOpen: false,
    title: '',
    url: '',
    embedType: 'iframe',
    isAutoEmbed: false
  });

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

        // Auto-embed logic: If there's only one link and it's set to embed, open it automatically
        // Can be bypassed with ?view=profile URL parameter
        const bypassAutoEmbed = searchParams.get('view') === 'profile';
        if (linksData.length === 1 && linksData[0].embed_type && linksData[0].embed_type !== 'none' && !bypassAutoEmbed) {
          const singleLink = linksData[0];
          
          setIsAutoEmbedding(true);
          
          // Track the click
          await linktreeService.trackClick(profileData.id, singleLink.id, {
            user_agent: navigator.userAgent,
            referrer: document.referrer
          });

          // Small delay to show the profile briefly before auto-embedding
          setTimeout(() => {
            setEmbedModal({
              isOpen: true,
              title: singleLink.title,
              url: singleLink.url,
              embedType: singleLink.embed_type as 'iframe' | 'google_form',
              isAutoEmbed: true
            });
            setIsAutoEmbedding(false);
          }, 800);
        } else {
          // Track profile view for normal multi-link profiles
          await linktreeService.trackClick(profileData.id, undefined, {
            user_agent: navigator.userAgent,
            referrer: document.referrer
          });
        }
      } catch (err) {
        // Silently handle errors
        setNotFound(true);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [username]);

  // Handle keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && embedModal.isOpen) {
        closeEmbedModal();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [embedModal.isOpen]);

  const handleLinkClick = async (link: LinktreeLink) => {
    if (profile) {
      await linktreeService.trackClick(profile.id, link.id, {
        user_agent: navigator.userAgent,
        referrer: document.referrer
      });
    }

    // Handle embed types
    if (link.embed_type && link.embed_type !== 'none') {
      setEmbedModal({
        isOpen: true,
        title: link.title,
        url: link.url,
        embedType: link.embed_type as 'iframe' | 'google_form',
        isAutoEmbed: false
      });
      return;
    }

    // Default behavior: open external links in new tab, internal links in same tab
    if (link.url.startsWith('http')) {
      window.open(link.url, '_blank', 'noopener,noreferrer');
    } else {
      window.location.href = link.url;
    }
  };

  const closeEmbedModal = () => {
    setEmbedModal(prev => ({ ...prev, isOpen: false, isAutoEmbed: false }));
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
      className="min-h-screen py-8 sm:py-12 px-3 sm:px-4 relative"
      style={getBackgroundStyle()}
    >
      {/* Hide navigation for linktree pages */}
      <style>{`
        nav { display: none !important; }
        body { margin: 0; padding: 0; }
        /* Improve mobile scrolling */
        * { -webkit-overflow-scrolling: touch; }
        /* Prevent zoom on input focus on iOS */
        input, select, textarea { font-size: 16px; }
      `}</style>
      
      <div className="max-w-sm mx-auto">
        {/* Header */}
        <div className="text-center mb-8 sm:mb-10 animate-fade-in px-4">
          <Avatar className="w-24 h-24 sm:w-28 sm:h-28 mx-auto mb-4 sm:mb-6 ring-4 ring-white/20">
            <AvatarImage src={profile.avatar_url} alt={profile.display_name} />
            <AvatarFallback className="text-2xl sm:text-3xl bg-white/20 text-white">
              {profile.display_name.charAt(0).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          
          <h1 className="text-2xl sm:text-3xl font-bold text-white mb-2 sm:mb-3 drop-shadow-lg">
            {profile.display_name}
          </h1>
          
          {profile.bio && (
            <p className="text-white/90 mb-4 sm:mb-6 leading-relaxed text-base sm:text-lg px-2 sm:px-4 drop-shadow">
              {profile.bio}
            </p>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleShare}
            className="text-white/80 hover:text-white hover:bg-white/10 active:bg-white/20 backdrop-blur-sm border border-white/20 touch-manipulation"
          >
            <Share2 className="w-4 h-4 mr-2" />
            Share
          </Button>
        </div>

        {/* Links */}
        <div className="space-y-4">
          {links.map((link, index) => {
            const IconComponent = getIconComponent(link.icon_value || 'link');
            const isAutoEmbedLink = links.length === 1 && link.embed_type && link.embed_type !== 'none';
            
            return (
              <div
                key={link.id}
                className="animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <button
                  onClick={() => handleLinkClick(link)}
                  className={`w-full p-4 sm:p-5 rounded-xl sm:rounded-2xl backdrop-blur-sm border border-white/20 hover:border-white/40 active:border-white/60 hover:scale-[1.02] active:scale-[0.98] transition-all duration-300 shadow-lg hover:shadow-xl touch-manipulation ${
                    isAutoEmbedding && isAutoEmbedLink ? 'animate-pulse border-white/60' : ''
                  }`}
                  style={getButtonStyle(link)}
                  disabled={isAutoEmbedding && isAutoEmbedLink}
                >
                  <div className="flex items-center w-full">
                    <div className="flex-shrink-0 mr-3 sm:mr-4">
                      <IconComponent className="w-5 h-5 sm:w-6 sm:h-6" />
                    </div>
                    
                    <div className="flex-1 min-w-0 text-left">
                      <div className="font-semibold text-base sm:text-lg truncate mb-1">
                        {link.title}
                      </div>
                      {link.description && (
                        <div className="text-xs sm:text-sm opacity-80 truncate">
                          {link.description}
                        </div>
                      )}
                      {isAutoEmbedding && isAutoEmbedLink && (
                        <div className="text-xs opacity-60 mt-1">
                          Opening automatically...
                        </div>
                      )}
                    </div>

                    <div className="flex-shrink-0 ml-2 sm:ml-3 flex items-center space-x-1 sm:space-x-2">
                      {link.click_count > 0 && (
                        <div className="bg-white/20 backdrop-blur-sm rounded-full px-1.5 sm:px-2 py-0.5 sm:py-1 text-xs font-medium">
                          {link.click_count}
                        </div>
                      )}
                      {link.embed_type && link.embed_type !== 'none' ? (
                        <Monitor className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
                      ) : (
                        <ExternalLink className="w-4 h-4 sm:w-5 sm:h-5 opacity-60" />
                      )}
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

      {/* Embed Modal */}
      <EmbedModal
        isOpen={embedModal.isOpen}
        onClose={closeEmbedModal}
        title={embedModal.title}
        url={embedModal.url}
        embedType={embedModal.embedType}
        isAutoEmbed={embedModal.isAutoEmbed}
        profileName={profile?.display_name}
      />
    </div>
  );
};

export default Linktree;