import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import Navigation from "@/components/Navigation";
import Footer from "@/components/Footer";
import SmoothScroll from "@/components/SmoothScroll";
import GlobalBackground from "@/components/GlobalBackground";
import Home from "./pages/Home";
import Events from "./pages/Events";
import Blog from "./pages/Blog";
import Contact from "./pages/Contact";
import Projects from "./pages/Projects";
import Team from "./pages/Team";
import Resources from "./pages/Resources";
import Sponsors from "./pages/Sponsors";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
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
              {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </div>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
