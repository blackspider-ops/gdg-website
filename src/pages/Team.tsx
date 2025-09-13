import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';
import { useContent } from '@/contexts/ContentContext';
import { useEffect } from 'react';
import LoadingSkeleton from '@/components/ui/LoadingSkeleton';

const Team = () => {
    const { teamMembers, isLoadingTeam, loadTeamMembers } = useContent();

    // Load team members when component mounts
    useEffect(() => {
        loadTeamMembers();
    }, [loadTeamMembers]);

    // Transform team members data to match component structure
    const transformedMembers = teamMembers.map(member => ({
        name: member.name,
        role: member.role,
        bio: member.bio,
        image: member.image_url || '/placeholder.svg',
        social: {
            github: member.github_url,
            linkedin: member.linkedin_url,
            email: `${member.name.toLowerCase().replace(' ', '.')}@gdgpsu.org`
        }
    }));

    // Separate leadership and regular members based on role
    const leadership = transformedMembers.filter(member => 
        member.role.toLowerCase().includes('lead') || 
        member.role.toLowerCase().includes('president') ||
        member.role.toLowerCase().includes('organizer')
    );

    const advisors = transformedMembers.filter(member => 
        member.role.toLowerCase().includes('advisor') ||
        member.role.toLowerCase().includes('mentor')
    );

    const regularMembers = transformedMembers.filter(member => 
        !leadership.includes(member) && !advisors.includes(member)
    );

    const TeamMember = ({ member, isLeadership = false }) => (
        <div className="bg-card border border-border rounded-lg p-6 text-center hover:shadow-lg transition-shadow">
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

            {member.bio && isLeadership && (
                <p className="text-sm text-muted-foreground mb-4">{member.bio}</p>
            )}

            <div className="flex justify-center space-x-3">
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

    return (
        <div className="min-h-screen relative z-10">
            {/* Hero Section */}
            <section className="py-16 sm:py-20 lg:py-32">
                <div className="editorial-grid">
                    <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
                        <h1 className="text-3xl sm:text-4xl lg:text-6xl font-display font-bold mb-6">
                            Meet Our
                            <br />
                            <span className="text-primary">Team</span>
                        </h1>

                        <p className="text-lg sm:text-xl text-muted-foreground content-measure mx-auto mb-8">
                            The passionate students and mentors who make GDG@PSU a thriving community
                            for developers and tech enthusiasts.
                        </p>
                    </div>
                </div>
            </section>

            {/* Leadership Team */}
            <section className="py-12 sm:py-16 lg:py-20">
                <div className="editorial-grid">
                    <div className="col-span-12">
                        <h2 className="text-3xl font-display font-bold text-center mb-12">Leadership Team</h2>
                        {isLoadingTeam ? (
                            <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                                <LoadingSkeleton variant="team" count={3} />
                            </div>
                        ) : leadership.length > 0 ? (
                            <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                                {leadership.map((member, index) => (
                                    <div key={index} className="w-full sm:w-80 max-w-sm flex-shrink-0">
                                        <TeamMember member={member} isLeadership={true} />
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-center text-muted-foreground">
                                <p>No leadership team members found.</p>
                            </div>
                        )}
                    </div>
                </div>
            </section>

            {/* Advisors */}
            {advisors.length > 0 && (
                <section className="py-12 sm:py-16 lg:py-20 bg-card/30">
                    <div className="editorial-grid">
                        <div className="col-span-12">
                            <h2 className="text-3xl font-display font-bold text-center mb-12">Advisors & Mentors</h2>
                            <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                                {advisors.map((member, index) => (
                                    <div key={index} className="w-full sm:w-80 max-w-sm flex-shrink-0">
                                        <TeamMember member={member} isLeadership={true} />
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Regular Team Members */}
            {regularMembers.length > 0 && (
                <section className="py-12 sm:py-16 lg:py-20">
                    <div className="editorial-grid">
                        <div className="col-span-12">
                            <h2 className="text-3xl font-display font-bold text-center mb-12">Team Members</h2>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8 max-w-7xl mx-auto">
                                {regularMembers.map((member, index) => (
                                    <TeamMember key={index} member={member} isLeadership={false} />
                                ))}
                            </div>
                        </div>
                    </div>
                </section>
            )}

            {/* Join Team CTA */}
            <section className="py-12 sm:py-16 lg:py-20">
                <div className="editorial-grid">
                    <div className="col-span-12 lg:col-span-8 lg:col-start-3 text-center">
                        <h2 className="text-3xl font-display font-bold mb-4">
                            Want to Join Our Team?
                        </h2>
                        <p className="text-lg text-muted-foreground mb-8">
                            We're always looking for passionate students to help grow our community.
                            Whether you're interested in organizing events, creating content, or leading workshops,
                            there's a place for you on our team.
                        </p>
                        <Link
                            to="/contact"
                            className="magnetic-button px-8 py-4 bg-primary text-primary-foreground rounded-lg font-medium inline-flex items-center focus-ring"
                        >
                            Get Involved
                        </Link>
                    </div>
                </div>
            </section>
        </div>
    );
};

export default Team;