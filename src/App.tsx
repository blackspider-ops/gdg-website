import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect } from "react";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import ScrollToTopButton from "@/components/ScrollToTop";
import GlobalBackground from "@/components/GlobalBackground";
import { AdminProvider } from "@/contexts/AdminContext";
import { ContentProvider } from "@/contexts/ContentContext";
import PerformanceMonitor from "@/components/PerformanceMonitor";

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
import AdminProjects from "./pages/admin/AdminProjects";
import AdminMembers from "./pages/admin/AdminMembers";
import AdminResources from "./pages/admin/AdminResources";
import AdminNewsletter from "./pages/admin/AdminNewsletter";
import AdminBlog from "./pages/admin/AdminBlog";
import AdminUsers from "./pages/admin/AdminUsers";
import AdminProfile from "./pages/admin/AdminProfile";
import AdminSponsors from "./pages/admin/AdminSponsors";
import AdminCommunications from "./pages/admin/AdminCommunications";
import AdminMedia from "./pages/admin/AdminMedia";
import AdminGuide from "./pages/admin/AdminGuide";
import AdminLinktree from "./pages/admin/AdminLinktree";
import BlogEditorDashboard from "./pages/admin/BlogEditorDashboard";
import BlogEditorMedia from "./pages/admin/BlogEditorMedia";

import BlogPost from "./pages/BlogPost";
import Linktree from "./pages/Linktree";
import NewsletterConfirm from "./pages/NewsletterConfirm";
import NewsletterUnsubscribe from "./pages/NewsletterUnsubscribe";
import NotFound from "./pages/NotFound";
import PerformanceOptimizer from "./components/PerformanceOptimizer";
import AdminTracker from "./components/admin/AdminTracker";

const queryClient = new QueryClient();

// Component to handle scroll to top on route changes
const ScrollToTop = () => {
  const location = useLocation();
  
  useEffect(() => {
    // Scroll to top when location changes (pathname or search params)
    const scrollToTop = () => {
      // Wait for the next frame and then some to ensure content is rendered
      requestAnimationFrame(() => {
        // Check if Lenis is available for smooth scrolling
        const lenis = (window as any).lenis;
        if (lenis && lenis.scrollTo) {
          // Use Lenis for optimized scroll to top
          lenis.scrollTo(0, { 
            duration: 0.6, // Faster duration for snappier feel
            easing: (t: number) => 1 - Math.pow(1 - t, 3) // Cubic ease-out
          });
        } else {
          // Fallback to instant scroll for better performance
          window.scrollTo({ 
            top: 0, 
            left: 0, 
            behavior: 'auto' // Changed from 'smooth' to prevent double smoothing
          });
        }
      });
    };

    scrollToTop();
  }, [location.pathname, location.search]); // Listen to both pathname and search changes

  return null;
};

// Component to conditionally render navigation
const ConditionalNavigation = () => {
  const location = useLocation();
  const isLinktreePage = location.pathname.startsWith('/l/');
  const isNewsletterPage = location.pathname.startsWith('/newsletter/');
  
  if (isLinktreePage || isNewsletterPage) {
    return null;
  }
  
  return <Navigation />;
};

// Component to conditionally render footer
const ConditionalFooter = () => {
  const location = useLocation();
  const isLinktreePage = location.pathname.startsWith('/l/');
  const isNewsletterPage = location.pathname.startsWith('/newsletter/');
  
  if (isLinktreePage || isNewsletterPage) {
    return null;
  }
  
  return <Footer />;
};

// Component to conditionally render scroll-to-top button
const ConditionalScrollToTop = () => {
  const location = useLocation();
  const isLinktreePage = location.pathname.startsWith('/l/');
  const isNewsletterPage = location.pathname.startsWith('/newsletter/');
  
  if (isLinktreePage || isNewsletterPage) {
    return null;
  }
  
  return <ScrollToTopButton />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
      <AdminProvider>
        <ContentProvider>
          <PerformanceMonitor>
            <PerformanceOptimizer>
              <TooltipProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter
                  future={{
                    v7_startTransition: true,
                    v7_relativeSplatPath: true
                  }}
                >
                  <ScrollToTop />
                  <SmoothScroll />
                  <ConditionalScrollToTop />
                  <GlobalBackground />
                  <AdminTracker />
                  <div className="min-h-screen flex flex-col relative z-10">
                    <ConditionalNavigation />
                    <main className="flex-1">
                    <Routes>
                      <Route path="/" element={<Home />} />
                      <Route path="/events" element={<Events />} />
                      <Route path="/blog" element={<Blog />} />
                      <Route path="/blog/:slug" element={<BlogPost />} />
                      <Route path="/contact" element={<Contact />} />
                      <Route path="/projects" element={<Projects />} />
                      <Route path="/team" element={<Team />} />
                      <Route path="/resources" element={<Resources />} />
                      <Route path="/sponsors" element={<Sponsors />} />
                      <Route path="/admin" element={<AdminDashboard />} />
                      <Route path="/admin/content" element={<AdminContent />} />
                      <Route path="/admin/events" element={<AdminEvents />} />
                      <Route path="/admin/team" element={<AdminTeam />} />
                      <Route path="/admin/projects" element={<AdminProjects />} />
                      <Route path="/admin/members" element={<AdminMembers />} />
                      <Route path="/admin/resources" element={<AdminResources />} />
                      <Route path="/admin/newsletter" element={<AdminNewsletter />} />
                      <Route path="/admin/blog" element={<AdminBlog />} />
                      <Route path="/admin/users" element={<AdminUsers />} />
                      <Route path="/admin/profile" element={<AdminProfile />} />
                      <Route path="/admin/sponsors" element={<AdminSponsors />} />
                      <Route path="/admin/communications" element={<AdminCommunications />} />
                      <Route path="/admin/blog-comments" element={<Navigate to="/admin/blog?tab=comments" replace />} />
                      <Route path="/admin/media" element={<AdminMedia />} />
                      <Route path="/admin/guide" element={<AdminGuide />} />
                      <Route path="/admin/linktree" element={<AdminLinktree />} />

                      <Route path="/admin/blog-editor" element={<BlogEditorDashboard />} />
                      <Route path="/admin/blog-media" element={<BlogEditorMedia />} />
                      <Route path="/l/:username" element={<Linktree />} />
                      <Route path="/newsletter/confirm" element={<NewsletterConfirm />} />
                      <Route path="/newsletter/unsubscribe" element={<NewsletterUnsubscribe />} />
                      {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                    </main>
                    <ConditionalFooter />
                  </div>
                </BrowserRouter>
              </TooltipProvider>
            </PerformanceOptimizer>
          </PerformanceMonitor>
        </ContentProvider>
      </AdminProvider>
  </QueryClientProvider>
);

export default App;