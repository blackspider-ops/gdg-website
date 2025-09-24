import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { EmailService } from "./services/emailService";
import { SpeedInsights } from "@vercel/speed-insights/react";

// Initialize email service
EmailService.initialize();

// Register service worker for caching
if ('serviceWorker' in navigator && import.meta.env.PROD) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then((registration) => {
        console.log('SW registered: ', registration);
      })
      .catch((registrationError) => {
        console.log('SW registration failed: ', registrationError);
      });
  });
}

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    <SpeedInsights />
  </>
);
