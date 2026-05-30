import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "@fontsource-variable/space-grotesk";
import "@fontsource-variable/jetbrains-mono";
import "./styles/globals.css";

// Suppress the WebView's default right-click context menu so the app feels
// native. The custom <Menu> primitive in the sidebar/topbar still works
// because it's driven by React onContextMenu handlers — preventDefault stops
// only the browser's built-in menu, not React's synthetic dispatch.
window.addEventListener("contextmenu", (e) => e.preventDefault());

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>,
);
