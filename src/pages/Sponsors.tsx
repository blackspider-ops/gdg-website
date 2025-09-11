import React from 'react';
import { Link } from 'react-router-dom';
import { ExternalLink, Users, Calendar, Award, Heart } from 'lucide-react';

const Sponsors = () => {
  const titleSponsors = [
    {
      name: 'Google',
      logo: '/placeholder.svg',
      tier: 'Title Sponsor',
      description: 'Google provides the foundation for our chapter through the Google Developer Groups program, offering resources, swag, and direct support.',
      website: '#',
      benefits: ['Event funding', 'Speaker support', 'Google swag', 'Cloud credits'],
      partnership: 'Official GDG Partner'
    }
  ];

  const platinumSponsors = [
    {
      name: 'Microsoft',
      logo: '/placeholder.svg',
      tier: 'Platinum',
      description: 'Supporting our cloud computing workshops and providing Azure credits for student projects.',
      website: '#',
      benefits: ['Azure credits', 'Workshop materials', 'Mentorship'],
      partnership: 'Technology Partner'
    },
    {
      name: 'Amazon Web Services',
      logo: '/placeholder.svg',
      tier: 'Platinum',
      description: 'Enabling our cloud infrastructure learning through AWS Educate and technical resources.',
      website: '#',
      benefits: ['AWS credits', 'Training resources', 'Career opportunities'],
      partnership: 'Education Partner'
    }
  ];

  const goldSponsors = [
    {
      name: 'Penn State College of Engineering',
      logo: '/placeholder.svg',
      tier: 'Gold',
      description: 'Our home college providing venue support and academic integration.',
      website: '#',
      benefits: ['Venue access', 'Faculty support', 'Academic credit'],
      partnership: 'Academic Partner'
    },
    {
      name: 'GitHub',
      logo: '/placeholder.svg',
      tier: 'Gold',
      description: 'Supporting our open source initiatives and providing development tools.',
      website: '#',
      benefits: ['GitHub Pro accounts', 'Copilot access', 'Actions minutes'],
      partnership: 'Development Partner'
    },
    {
      name: 'JetBrains',
      logo: '/placeholder.svg',
      tier: 'Gold',
      description: 'Providing professional development tools for our student developers.',
      website: '#',
      benefits: ['IDE licenses', 'Educational resources', 'Student discounts'],
      partnership: 'Tool Partner'
    }
  ];

  const silverSponsors = [
    {
      name: 'Figma',
      logo: '/placeholder.svg',
      tier: 'Silver',
      description: 'Supporting our design workshops and UI/UX learning initiatives.',
      website: '#',
      benefits: ['Pro accounts', 'Design resources'],
      partnership: 'Design Partner'
    },
    {
      name: 'Vercel',
      logo: '/placeholder.svg',
      tier: 'Silver',
      description: 'Hosting platform for our web development projects and demos.',
      website: '#',
      benefits: ['Pro hosting', 'Deployment credits'],
      partnership: 'Hosting Partner'
    },
    {
      name: 'MongoDB',
      logo: '/placeholder.svg',
      tier: 'Silver',
      description: 'Database solutions for our full-stack development workshops.',
      website: '#',
      benefits: ['Atlas credits', 'Learning materials'],
      partnership: 'Database Partner'
    }
  ];

  const communityPartners = [
    {
      name: 'Penn State ACM',
      logo: '/placeholder.svg',
      description: 'Collaborative programming and technical events.',
      website: '#'
    },
    {
      name: 'Women in Computer Science',
      logo: '/placeholder.svg',
      description: 'Joint diversity and inclusion initiatives.',
      website: '#'
    },
    {
      name: 'Startup Week',
      logo: '/placeholder.svg',
      description: 'Entrepreneurship and innovation partnerships.',
      website: '#'
    },
    {
      name: 'HackPSU',
      logo: '/placeholder.svg',
      description: 'Hackathon collaboration and mentorship.',
      website: '#'
    }
  ];

  const sponsorshipTiers = [
    {
      tier: 'Platinum',
      amount: '$5,000+',
      color: 'bg-gradient-to-r from-gray-300 to-gray-500',
      benefits: [
        'Logo on all event materials',
        'Speaking opportunities',
        'Recruiting access',
        'Custom workshop sponsorship',
        'Year-round partnership'
      ]
    },
    {
      tier: 'Gold',
      amount: '$2,500+',
      color: 'bg-gradient-to-r from-yellow-400 to-yellow-600',
      benefits: [
        'Logo on event materials',
        'Booth at major events',
        'Newsletter mentions',
        'Social media recognition'
      ]
    },
    {
      tier: 'Silver',
      amount: '$1,000+',
      color: 'bg-gradient-to-r from-gray-400 to-gray-600',
      benefits: [
        'Logo on website',
        'Event mentions',
        'Social media shoutouts',
        'Networking opportunities'
      ]
    },
    {
      tier: 'Bronze',
      amount: '$500+',
      color: 'bg-gradient-to-r from-orange-400 to-orange-600',
      benefits: [
        'Website listing',
        'Thank you mentions',
        'Community recognition'
      ]
    }
  ];

  const SponsorCard = ({ sponsor, showBenefits = true }) => (
    <div className="bg-card border border-border rounded-lg p-6 hover:shadow-lg transition-shadow">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 bg-muted rounded-lg flex items-center justify-center overflow-hidden">
            <img 
              src={sponsor.logo} 
              alt={`${sponsor.name} logo`}
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
            <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold mb-6">
              Our
              <br />
              <span className="text-primary">Sponsors</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground content-measure mx-auto mb-8">
              We're grateful to our sponsors and partners who make our events, workshops, 
              and community initiatives possible.
            </p>
          </div>
        </div>
      </section>

      {/* Title Sponsor */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold text-center mb-12">Title Sponsor</h2>
            <div className="max-w-2xl mx-auto">
              {titleSponsors.map((sponsor, index) => (
                <SponsorCard key={index} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Platinum Sponsors */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold text-center mb-12">Platinum Sponsors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
              {platinumSponsors.map((sponsor, index) => (
                <SponsorCard key={index} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Gold Sponsors */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold text-center mb-12">Gold Sponsors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {goldSponsors.map((sponsor, index) => (
                <SponsorCard key={index} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Silver Sponsors */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold text-center mb-12">Silver Sponsors</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
              {silverSponsors.map((sponsor, index) => (
                <SponsorCard key={index} sponsor={sponsor} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Community Partners */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12">
            <h2 className="text-3xl font-display font-bold text-center mb-12">Community Partners</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {communityPartners.map((partner, index) => (
                <SponsorCard key={index} sponsor={partner} showBenefits={false} />
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Sponsorship Opportunities */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Sponsorship Opportunities</h2>
              <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
                Partner with us to reach talented Penn State students and support the next generation of developers.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {sponsorshipTiers.map((tier, index) => (
                <div key={index} className="bg-card border border-border rounded-lg p-6 text-center">
                  <div className={`w-16 h-16 ${tier.color} rounded-lg mx-auto mb-4 flex items-center justify-center`}>
                    <Award className="text-white" size={24} />
                  </div>
                  
                  <h3 className="text-xl font-semibold mb-2">{tier.tier}</h3>
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
          </div>
        </div>
      </section>

      {/* Impact Stats */}
      <section className="py-20">
        <div className="editorial-grid">
          <div className="col-span-12">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-display font-bold mb-4">Our Impact</h2>
              <p className="text-lg text-muted-foreground">
                See how your sponsorship makes a difference in our community.
              </p>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-4 gap-6 md:gap-8">
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Users className="text-primary" size={24} />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">500+</div>
                <p className="text-muted-foreground">Active Members</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Calendar className="text-primary" size={24} />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">24</div>
                <p className="text-muted-foreground">Events This Year</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Award className="text-primary" size={24} />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">15</div>
                <p className="text-muted-foreground">Student Projects</p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 bg-primary/10 rounded-lg mx-auto mb-4 flex items-center justify-center">
                  <Heart className="text-primary" size={24} />
                </div>
                <div className="text-3xl font-bold text-primary mb-2">95%</div>
                <p className="text-muted-foreground">Satisfaction Rate</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section className="py-20 bg-card/30">
        <div className="editorial-grid">
          <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
            <h2 className="text-3xl font-display font-bold mb-4">
              Interested in Sponsoring?
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Join our community of sponsors and help us create amazing opportunities for Penn State students. 
              Let's discuss how we can work together.
            </p>
            <Link 
              to="/contact"
              className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
            >
              Become a Sponsor
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
};

export default Sponsors;