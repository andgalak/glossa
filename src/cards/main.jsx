import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import CardsApp from "./CardsApp.jsx";

createRoot(document.getElementById("cards-root")).render(
  <StrictMode>
    <CardsApp />
  </StrictMode>,
);
