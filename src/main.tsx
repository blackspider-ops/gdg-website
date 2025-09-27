import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// import { SpeedInsights } from "@vercel/speed-insights/react";

// Unregister any existing service workers to prevent network conflicts
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.getRegistrations().then((registrations) => {
    registrations.forEach((registration) => {
      registration.unregister().then(() => {
        // Force reload to clear any cached responses
        if (registrations.length > 0) {
          window.location.reload();
        }
      });
    });
  });
}

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    {/* <SpeedInsights /> */}
  </>
);
