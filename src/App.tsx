import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import GlobalBackground from "@/components/GlobalBackground";
import { AdminProvider } from "@/contexts/AdminContext";
import { ContentProvider } from "@/contexts/ContentContext";
import { DevProvider } from "@/contexts/DevContext";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import Resources from "./pages/Resources";
import Sponsors from "./pages/Sponsors";
import AdminDashboard from "./pages/AdminDashboard";
import AdminContent from "./pages/AdminContent";
import AdminEvents from "./pages/admin/AdminEvents";
import AdminTeam from "./pages/admin/AdminTeam";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminResources from "./pages/admin/AdminResources";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminAnalytics from "./pages/admin/AdminAnalytics";

import AdminUsers from "./pages/admin/AdminUsers";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSponsors from "./pages/admin/AdminSponsors";
import AdminCommunications from "./pages/admin/AdminCommunications";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminReports from "./pages/admin/AdminReports";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

// Component to handle scroll to top on route changes
const ScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Scroll to top when location changes (pathname or search params)
    const scrollToTop = () => {
      // Wait for the next frame and then some to ensure content is rendered
      requestAnimationFrame(() => {
        setTimeout(() => {
          // Check if Lenis is available for smooth scrolling
          const lenis = (window as any).lenis;
          if (lenis && lenis.scrollTo) {
            // Use Lenis for smooth scroll to top with gentler easing
            lenis.scrollTo(0, { 
              duration: 1.0, // Slightly longer duration for smoother feel
              easing: (t: number) => 1 - Math.pow(1 - t, 3) // Cubic ease-out for smoother animation
            });
          } else {
            // Fallback to native smooth scroll
            window.scrollTo({ 
              top: 0, 
              left: 0, 
              behavior: 'smooth' 
            });
          }
        }, 50); // Reduced delay since we're using requestAnimationFrame
      });
    };

    scrollToTop();
  }, [location.pathname, location.search]); // Listen to both pathname and search changes

  return null;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <DevProvider>
      <AdminProvider>
        <ContentProvider>
          <TooltipProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <ScrollToTop />
              <SmoothScroll />
              <GlobalBackground />
              <div className="min-h-screen flex flex-col relative z-10">
                <Navigation />
                <main className="flex-1">
                  <Routes>
                    <Route path="/" element={<Home />} />
                    <Route path="/events" element={<Events />} />
                    <Route path="/blog" element={<Blog />} />
                    <Route path="/contact" element={<Contact />} />
                    <Route path="/projects" element={<Projects />} />
                    <Route path="/team" element={<Team />} />
                    <Route path="/resources" element={<Resources />} />
                    <Route path="/sponsors" element={<Sponsors />} />
                    <Route path="/admin" element={<AdminDashboard />} />
                    <Route path="/admin/content" element={<AdminContent />} />
                    <Route path="/admin/events" element={<AdminEvents />} />
                    <Route path="/admin/team" element={<AdminTeam />} />
                    <Route path="/admin/members" element={<AdminMembers />} />
                    <Route path="/admin/resources" element={<AdminResources />} />
                    <Route path="/admin/newsletter" element={<AdminNewsletter />} />
                    <Route path="/admin/analytics" element={<AdminAnalytics />} />

                    <Route path="/admin/users" element={<AdminUsers />} />
                    <Route path="/admin/profile" element={<AdminProfile />} />
                    <Route path="/admin/sponsors" element={<AdminSponsors />} />
                    <Route path="/admin/communications" element={<AdminCommunications />} />
                    <Route path="/admin/media" element={<AdminMedia />} />
                    <Route path="/admin/reports" element={<AdminReports />} />
                    {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </main>
                <Footer />
              </div>
            </BrowserRouter>
          </TooltipProvider>
        </ContentProvider>
      </AdminProvider>
    </DevProvider>
  </QueryClientProvider>
);

export default App;
