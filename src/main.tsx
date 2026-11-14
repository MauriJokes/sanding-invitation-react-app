import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { App } from "./App";
import { resolveInvite } from "./features/rsvp/invite";
import { I18nProvider } from "./i18n/I18nProvider";
import "./styles/index.css";

const root = document.getElementById("root");
if (!root) throw new Error("Root element not found");

// Must run exactly once, before rendering: it removes ?invite= from the address bar.
const invite = resolveInvite(window.location, window.history);

createRoot(root).render(
  <StrictMode>
    <I18nProvider>
      <App invite={invite} />
    </I18nProvider>
  </StrictMode>,
);
