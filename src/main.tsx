import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { EmailService } from "./services/emailService";

// Initialize email service
EmailService.initialize();

createRoot(document.getElementById("root")!).render(<App />);
