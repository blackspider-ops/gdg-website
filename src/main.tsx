import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
// import { SpeedInsights } from "@vercel/speed-insights/react";

// Register service worker for caching - temporarily disabled for debugging
// if ('serviceWorker' in navigator && import.meta.env.PROD) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js')
//       .then((registration) => {
//         // Silently handle logs
//       })
//       .catch((registrationError) => {
//         // Silently handle logs
//       });
//   });
// }

createRoot(document.getElementById("root")!).render(
  <>
    <App />
    {/* <SpeedInsights /> */}
  </>
);
