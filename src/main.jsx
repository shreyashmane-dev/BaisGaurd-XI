import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import { AppProvider } from "./context/AppContext";
import "./index.css";

// v1.0.6 - HMR & Context Stability
const container = document.getElementById("root");

if (!window.reactRoot) {
  window.reactRoot = createRoot(container);
}

window.reactRoot.render(
  <StrictMode>
    <AppProvider>
      <App />
    </AppProvider>
  </StrictMode>,
);
