import { createRoot } from "react-dom/client";
import App from "./App";
import "./styles.css";

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Registrar service worker con soporte de Background Sync
if ("serviceWorker" in navigator && "SyncManager" in window) {
  window.addEventListener("load", async () => {
    try {
      const registration = await navigator.serviceWorker.register("/sw.js");
      console.log("✅ Service Worker registrado:", registration);
    } catch (err) {
      console.error("❌ Error registrando SW:", err);
    }
  });
} else if ("serviceWorker" in navigator) {
  // Fallback si SyncManager no está disponible
  window.addEventListener("load", () => {
    navigator.serviceWorker
      .register("/sw.js")
      .then((reg) => {
        console.log("✅ Service Worker registrado (sin Background Sync):", reg);
      })
      .catch((err) => {
        console.error("❌ Error registrando SW:", err);
      });
  });
}
