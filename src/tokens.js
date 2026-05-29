// Shared Glōssa design tokens. The existing App.jsx / AuthScreen.jsx keep their
// own inline copies; this module is the shared source for the Cards app.

export const C = {
  bg: "#F5F0E8",
  surface: "#FFFFFF",
  text: "#1A1A1A",
  soft: "#6E6760",
  muted: "#A8A09A",
  green: "#2B5F47",
  greenLight: "#EAF0EC",
  greenMid: "#4A8A6A",
  border: "#DDD6CB",
  amber: "#B87B2A",
  amberLight: "#FDF3E0",
  correct: "#2B5F47",
  wrong: "#B04040",
  wrongLight: "#FAEAEA",
  correctLight: "#EAF4EE",
};

export const serif = "'Lora', Georgia, serif";
export const sans = "'DM Sans', system-ui, sans-serif";

// Injects the Google Fonts link + base mobile CSS once (mirrors App.jsx's approach).
export function ensureFonts() {
  if (typeof document === "undefined") return;
  if (document.getElementById("glossa-fonts")) return;
  const el = document.createElement("style");
  el.id = "glossa-fonts";
  el.textContent = [
    "@import url('https://fonts.googleapis.com/css2?family=Lora:ital,wght@0,400;0,600;1,400&family=DM+Sans:opsz,wght@9..40,300;9..40,400;9..40,500;9..40,600&display=swap');",
    // Full-bleed, no default margins, no tap flash on mobile.
    "html,body{margin:0;padding:0;background:#F5F0E8;-webkit-text-size-adjust:100%;}",
    "*{-webkit-tap-highlight-color:transparent;}",
    // iOS Safari zooms the page when a focused input's font-size is < 16px.
    // Force 16px on small screens so tapping a field never triggers a zoom.
    "@media (max-width:600px){input,select,textarea{font-size:16px !important;}}",
  ].join("\n");
  document.head.appendChild(el);
}
