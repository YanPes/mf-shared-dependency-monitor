import React from "react";
import { createRoot } from "react-dom/client";
import { Popup } from "../components/popup/popup.tsx";

const POPUP_WIDTH = 800;
const POPUP_HEIGHT = 600;

const applyPopupSize = () => {
  const width = `${POPUP_WIDTH}px`;
  const height = `${POPUP_HEIGHT}px`;

  document.documentElement.style.width = width;
  document.documentElement.style.height = height;

  if (document.body) {
    document.body.style.width = width;
    document.body.style.height = height;
  }
};

applyPopupSize();

const container = document.getElementById("root");
if (container) {
  container.style.width = `${POPUP_WIDTH}px`;
  container.style.height = `${POPUP_HEIGHT}px`;

  const root = createRoot(container);
  root.render(<Popup />);
}
