import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Users, Calendar, Award, Heart } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';
import SafeImage from '@/components/ui/SafeImage';
import { SponsorContentService, SponsorshipTier, ImpactStat } from '@/services/sponsorContentService';

const Sponsors = () => {
  const { sponsors, isLoadingSponsors, loadSponsors, getPageSection, lastUpdated } = useContent();
  const [sponsorshipTiers, setSponsorshipTiers] = useState<SponsorshipTier[]>([]);
  const [impactStats, setImpactStats] = useState<ImpactStat[]>([]);
  const [isLoadingContent, setIsLoadingContent] = useState(true);

  // Load sponsors when component mounts
  useEffect(() => {
    loadSponsors();
  }, [loadSponsors, lastUpdated]);

  // Load sponsorship tiers and impact stats
  useEffect(() => {
    const loadContent = async () => {
      setIsLoadingContent(true);
      const [tiers, stats] = await Promise.all([
        SponsorContentService.getActiveTiers(),
        SponsorContentService.getActiveStats()
      ]);
      setSponsorshipTiers(tiers);
      setImpactStats(stats);
      setIsLoadingContent(false);
    };
    loadContent();
  }, []);

  // Group sponsors by tier dynamically based on available tiers
  const sponsorsByTier = sponsorshipTiers.map(tier => ({
    tier: tier,
    sponsors: sponsors.filter(s => s.tier === tier.tier_level)
  })).filter(group => group.sponsors.length > 0); // Only show tiers that have sponsors

  // Get tier name from database
  const getTierName = (tierLevel: string) => {
    const tier = sponsorshipTiers.find(t => t.tier_level === tierLevel);
    return tier ? tier.tier_name : tierLevel.charAt(0).toUpperCase() + tierLevel.slice(1);
  };

  // Transform sponsors data to match component structure
  const transformSponsor = (sponsor: any) => {
    const tierName = getTierName(sponsor.tier);
    return {
      name: sponsor.name,
      logo: sponsor.logo_url,
      tier: tierName,
      description: `Supporting GDG@PSU through ${tierName} tier partnership.`,
      website: sponsor.website_url,
      benefits: [], // Could be expanded with a benefits field in the database
      partnership: `${tierName} Partner`
    };
  };

  // Icon mapping for impact stats
  const getIconComponent = (iconName: string) => {
    const icons: Record<string, any> = {
      users: Users,
      calendar: Calendar,
      award: Award,
      heart: Heart
    };
    return icons[iconName] || Users;
  };

  // Get page content from database
  const pageHeader = getPageSection('sponsors', 'header') || {};

  const SponsorCard = ({ sponsor, showBenefits = true }) => (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            <SafeImage 
              src={sponsor.logo} 
              alt={`${sponsor.name} logo`}
              fallbackText={sponsor.name}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <h3 className="text-lg font-semibold">{sponsor.name}</h3>
            {sponsor.tier && (
              <span className="text-sm text-primary font-medium">{sponsor.tier}</span>
            )}
            {sponsor.partnership && (
              <span className="text-xs text-muted-foreground block">{sponsor.partnership}</span>
            )}
          </div>
        </div>
        <a 
          href={sponsor.website}
          className="text-muted-foreground hover:text-primary transition-colors"
          title={`Visit ${sponsor.name}`}
        >
          <ExternalLink size={20} />
        </a>
      </div>
      
      <p className="text-muted-foreground mb-4">{sponsor.description}</p>
      
      {showBenefits && sponsor.benefits && (
        <div>
          <p className="text-sm font-medium mb-2">Partnership Benefits:</p>
          <div className="flex flex-wrap gap-2">
            {sponsor.benefits.map((benefit, index) => (
              <span 
                key={index}
                className="px-2 py-1 bg-primary/10 text-primary text-xs rounded"
              >
                {benefit}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="min-h-screen relative z-10">
      {/* Hero Section */}
      <section className="py-20 lg:py-32">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            {(pageHeader.title || pageHeader.subtitle) && (
              <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold mb-6">
                {pageHeader.title}
                {pageHeader.subtitle && (
                  <>
                    <br />
                    <span className="text-primary">{pageHeader.subtitle}</span>
                  </>
                )}
              </h1>
            )}
            
            {pageHeader.description && (
              <p className="text-lg sm:text-xl text-muted-foreground content-measure mx-auto mb-8">
                {pageHeader.description}
              </p>
            )}
          </div>
        </div>
      </section>

      {isLoadingSponsors ? (
        <section className="py-20">
          <div className="editorial-grid">
            <div className="col-span-12">
              <h2 className="text-3xl font-display font-bold text-center mb-12">Loading Sponsors...</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 md:gap-8">
                <LoadingSkeleton variant="card" count={6} />
              </div>
            </div>
          </div>
        </section>
      ) : (
        <>
          {/* Dynamic Sponsor Sections by Tier */}
          {sponsorsByTier.map((group, groupIndex) => (
            <section key={group.tier.id} className={groupIndex % 2 === 0 ? 'py-20 bg-card/30' : 'py-20'}>
              <div className="editorial-grid">
                <div className="col-span-12">
                  <h2 className="text-3xl font-display font-bold text-center mb-12">
                    {group.tier.tier_name} Sponsors
                  </h2>
                  <div className={`grid gap-6 md:gap-8 ${
                    group.tier.tier_level === 'platinum' 
                      ? 'grid-cols-1 sm:grid-cols-1 md:grid-cols-2' 
                      : group.tier.tier_level === 'bronze'
                      ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4'
                      : 'grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3'
                  }`}>
                    {group.sponsors.map((sponsor, index) => (
                      <SponsorCard 
                        key={index} 
                        sponsor={transformSponsor(sponsor)} 
                        showBenefits={group.tier.tier_level !== 'bronze'}
                      />
                    ))}
                  </div>
                </div>
              </div>
            </section>
          ))}

          {/* No Sponsors Message */}
          {sponsors.length === 0 && (
            <section className="py-20">
              <div className="editorial-grid">
                <div className="col-span-12 text-center">
                  <p className="text-muted-foreground">No sponsors found. Check back soon!</p>
                </div>
              </div>
            </section>
          )}
        </>
      )}

      {/* Sponsorship Opportunities */}
      {sponsorshipTiers.length > 0 && (
        <section className="py-20 bg-card/30">
          <div className="editorial-grid">
            <div className="col-span-12">
              <div className="text-center mb-12">
                {pageHeader.opportunities_title && (
                  <h2 className="text-3xl font-display font-bold mb-4">{pageHeader.opportunities_title}</h2>
                )}
                {pageHeader.opportunities_description && (
                  <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                    {pageHeader.opportunities_description}
                  </p>
                )}
              </div>
            
            {isLoadingContent ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                <LoadingSkeleton variant="card" count={4} />
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
                {sponsorshipTiers.map((tier, index) => (
                  <div key={index} className="bg-card border border-border rounded-lg p-6 text-center">
                    <div className={`w-16 h-16 ${tier.color_gradient} rounded-lg mx-auto mb-4 flex items-center justify-center`}>
                      <Award className="text-foreground" size={24} />
                    </div>
                    
                    <h3 className="text-xl font-semibold mb-2">{tier.tier_name}</h3>
                    <p className="text-2xl font-bold text-primary mb-4">{tier.amount}</p>
                    
                    <ul className="text-sm text-muted-foreground space-y-2 mb-6">
                      {tier.benefits.map((benefit, benefitIndex) => (
                        <li key={benefitIndex} className="flex items-center">
                          <span className="w-1 h-1 bg-primary rounded-full mr-2"></span>
                          {benefit}
                        </li>
                      ))}
                    </ul>
                  </div>
                ))}
              </div>
            )}
            </div>
          </div>
        </section>
      )}

      {/* Impact Stats */}
      {impactStats.length > 0 && (
        <section className="py-20">
          <div className="editorial-grid">
            <div className="col-span-12">
              <div className="text-center mb-12">
                {pageHeader.impact_title && (
                  <h2 className="text-3xl font-display font-bold mb-4">{pageHeader.impact_title}</h2>
                )}
                {pageHeader.impact_description && (
                  <p className="text-lg text-muted-foreground">
                    {pageHeader.impact_description}
                  </p>
                )}
              </div>
            
            {isLoadingContent ? (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                <LoadingSkeleton variant="card" count={4} />
              </div>
            ) : (
              <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
                {impactStats.map((stat, index) => {
                  const IconComponent = getIconComponent(stat.icon_name);
                  return (
                    <div key={index} className="text-center">
                      <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                        <IconComponent className="text-primary" size={24} />
                      </div>
                      <div className="text-3xl font-bold text-primary mb-2">{stat.stat_value}</div>
                      <p className="text-muted-foreground">{stat.stat_description}</p>
                    </div>
                  );
                })}
              </div>
            )}
            </div>
          </div>
        </section>
      )}

      {/* Call to Action */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            {pageHeader.cta_title && (
              <h2 className="text-3xl font-display font-bold mb-4">
                {pageHeader.cta_title}
              </h2>
            )}
            {pageHeader.cta_description && (
              <p className="text-lg text-muted-foreground mb-8">
                {pageHeader.cta_description}
              </p>
            )}
            {pageHeader.cta_button_text && (
              <Link 
                to="/contact"
                className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
              >
                {pageHeader.cta_button_text}
              </Link>
            )}
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sponsors;