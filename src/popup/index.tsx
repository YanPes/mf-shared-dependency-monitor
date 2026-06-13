import React from "react";
import { createRoot } from "react-dom/client";
import "./tokens.css";
import { Popup } from "../components/popup/popup";

const getPopupSize = () => {
  const styles = getComputedStyle(document.documentElement);
  return {
    width: styles.getPropertyValue("--popup-width").trim() || "800px",
    height: styles.getPropertyValue("--popup-height").trim() || "600px",
  };
};

const applyPopupSize = () => {
  const { width, height } = getPopupSize();

  document.documentElement.style.width = width;
  document.documentElement.style.height = height;

  if (document.body) {
    document.body.style.width = width;
    document.body.style.height = height;
  }

  return { width, height };
};

const { width, height } = applyPopupSize();

const container = document.getElementById("root");
if (container) {
  container.style.width = width;
  container.style.height = height;

  const root = createRoot(container);
  root.render(<Popup />);
}
