import { Link } from 'react-router-dom';
import { Github, Linkedin, Twitter, Mail } from 'lucide-react';

const Team = () => {
    const leadership = [
        {
            name: 'Tejas Singhal',
            role: 'Chapter Lead',
            year: 'Senior',
            major: 'Computer Science',
            image: '/placeholder.svg',
            bio: 'Passionate about building developer communities and exploring cutting-edge technologies.',
            social: {
                github: '#',
                linkedin: '#',
                twitter: '#',
                email: 'tejas@gdgpsu.org'
            }
        },
        {
            name: 'Karthik Krishnan',
            role: 'Co-Organizer / Vice Lead',
            year: 'Junior',
            major: 'Computer Science',
            image: '/placeholder.svg',
            bio: 'Loves organizing events and connecting students with industry professionals.',
            social: {
                github: '#',
                linkedin: '#',
                email: 'karthik@gdgpsu.org'
            }
        }
    ];

    const advisors = [
        {
            name: 'Alan Carl Verbanac',
            role: 'Faculty Advisor',
            department: 'Computer Science & Engineering',
            image: '/placeholder.svg',
            bio: 'Faculty advisor supporting GDG@PSU and student developer initiatives.',
            social: { email: 'acv5048@psu.edu' }
        }
    ];

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
                        <div className="flex flex-wrap justify-center gap-8 max-w-6xl mx-auto">
                            {leadership.map((member, index) => (
                                <div key={index} className="w-full sm:w-80 max-w-sm flex-shrink-0">
                                    <TeamMember member={member} isLeadership={true} />
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Advisors */}
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