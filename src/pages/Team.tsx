import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail, ChevronDown, ChevronUp } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { useEffect, useState } from 'react';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const Team = () => {
    const { teamMembers, isLoadingTeam, loadTeamMembers, getPageSection, lastUpdated } = useContent();

    // Load team members when component mounts
    useEffect(() => {
        loadTeamMembers();
    }, [loadTeamMembers, lastUpdated]);

    // Transform team members data to match component structure
    const transformedMembers = teamMembers.map(member => ({
        name: member.name,
        role: member.role,
        bio: member.bio,
        image: member.image_url,
        teamSection: member.team_section || 'Active Members', // Use team_section from database
        social: {
            github: member.github_url,
            linkedin: member.linkedin_url,
            email: member.email
        }
    }));

    // Group members by their team_section
    const membersBySection = transformedMembers.reduce((acc, member) => {
        const section = member.teamSection;
        if (!acc[section]) {
            acc[section] = [];
        }
        acc[section].push(member);
        return acc;
    }, {} as Record<string, typeof transformedMembers>);

    // Define section order (sections not in this list will appear after in alphabetical order)
    const sectionOrder = ['Leadership Team', 'Advisors', 'Active Members', 'Alumni'];
    
    // Sort sections by defined order, then alphabetically
    const sortedSections = Object.keys(membersBySection).sort((a, b) => {
        const aIndex = sectionOrder.indexOf(a);
        const bIndex = sectionOrder.indexOf(b);
        
        if (aIndex !== -1 && bIndex !== -1) return aIndex - bIndex;
        if (aIndex !== -1) return -1;
        if (bIndex !== -1) return 1;
        return a.localeCompare(b);
    });

    // Get page content from database
    const pageHeader = getPageSection('team', 'header') || {};

    const TeamMember = ({ member, isLeadership = false }) => {
        const [isExpanded, setIsExpanded] = useState(false);
        const maxBioLength = 120; // Characters to show before "read more"
        const shouldTruncate = member.bio && member.bio.length > maxBioLength;
        const displayBio = shouldTruncate && !isExpanded 
            ? member.bio.substring(0, maxBioLength) + '...'
            : member.bio;

        return (
            <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg transition-shadow h-full flex flex-col">
                <div className="w-24 h-24 mx-auto mb-4 rounded-full bg-muted overflow-hidden">
                    <img
                        src={member.image}
                        alt={member.name}
                        className="w-full h-full object-cover"
                    />
                </div>

                <h3 className="text-lg font-semibold mb-1">{member.name}</h3>
                <p className="text-primary font-medium mb-2">{member.role}</p>

                {member.year && member.major && (
                    <p className="text-sm text-muted-foreground mb-3">
                        {member.year} • {member.major}
                    </p>
                )}

                {member.department && (
                    <p className="text-sm text-muted-foreground mb-3">{member.department}</p>
                )}

                {member.company && (
                    <p className="text-sm text-muted-foreground mb-3">
                        {member.position} at {member.company}
                    </p>
                )}

                {/* Bio section with read more functionality */}
                {member.bio && isLeadership && (
                    <div className="flex-grow mb-4">
                        <p className="text-sm text-muted-foreground mb-2">{displayBio}</p>
                        {shouldTruncate && (
                            <button
                                onClick={() => setIsExpanded(!isExpanded)}
                                className="text-primary text-sm font-medium hover:underline inline-flex items-center gap-1 transition-colors"
                            >
                                {isExpanded ? (
                                    <>
                                        Read less
                                        <ChevronUp size={14} />
                                    </>
                                ) : (
                                    <>
                                        Read more
                                        <ChevronDown size={14} />
                                    </>
                                )}
                            </button>
                        )}
                    </div>
                )}

                {/* Social links - always at bottom */}
                <div className="flex justify-center space-x-3 mt-auto">
                    {member.social?.github && (
                        <a href={member.social.github} className="text-muted-foreground hover:text-primary transition-colors">
                            <Github size={18} />
                        </a>
                    )}
                    {member.social?.linkedin && (
                        <a href={member.social.linkedin} className="text-muted-foreground hover:text-primary transition-colors">
                            <Linkedin size={18} />
                        </a>
                    )}
                    {member.social?.twitter && (
                        <a href={member.social.twitter} className="text-muted-foreground hover:text-primary transition-colors">
                            <Twitter size={18} />
                        </a>
                    )}
                    {member.social?.email && (
                        <a href={`mailto:${member.social.email}`} className="text-muted-foreground hover:text-primary transition-colors">
                            <Mail size={18} />
                        </a>
                    )}
                </div>
            </div>
        );
    };

    return (
        <div className="min-h-screen relative z-10">
            {/* Hero Section */}
            <section className="py-16 sm:py-20 lg:py-32">
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

            {/* Dynamic Team Sections */}
            {sortedSections.map((sectionName, sectionIndex) => {
                const members = membersBySection[sectionName];
                const isLeadershipSection = sectionName === 'Leadership Team' || sectionName === 'Advisors';
                const sectionBgClass = sectionIndex % 2 === 1 ? 'bg-card/30' : '';
                
                // Use the actual section name from database, no overrides
                const sectionTitle = sectionName;

                return (
                    <section key={sectionName} className={`py-12 sm:py-16 lg:py-20 ${sectionBgClass}`}>
                        <div className="editorial-grid">
                            <div className="col-span-12">
                                <h2 className="text-3xl font-display font-bold text-center mb-12">{sectionTitle}</h2>
                                {isLoadingTeam ? (
                                    <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                                        <LoadingSkeleton variant="team" count={3} />
                                    </div>
                                ) : members.length > 0 ? (
                                    <div className="flex flex-wrap justify-center gap-8 max-w-7xl mx-auto">
                                        {members.map((member, index) => (
                                            <div 
                                                key={index} 
                                                className={`w-full ${isLeadershipSection ? 'sm:w-80 max-w-sm min-h-[400px]' : 'sm:w-72 max-w-sm min-h-[300px]'}`}
                                            >
                                                <TeamMember member={member} isLeadership={isLeadershipSection} />
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="text-center text-muted-foreground">
                                        <p>No members in this section yet.</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </section>
                );
            })}

            {/* Join Team CTA */}
            <section className="py-12 sm:py-16 lg:py-20">
                <div className="editorial-grid">
                    <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
                        {pageHeader.join_team_cta && (
                          <h2 className="text-3xl font-display font-bold mb-4">
                              {pageHeader.join_team_cta}
                          </h2>
                        )}
                        <p className="text-lg text-muted-foreground mb-8">
                            We're always looking for passionate students to help grow our community.
                            Whether you're interested in organizing events, creating content, or leading workshops,
                            there's a place for you on our team.
                        </p>
                        <Link
                            to="/contact"
                            className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
                        >
                            {pageHeader.join_team_button}
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Team;