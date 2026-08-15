import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";

import "./index.css";


const savedTheme =
  localStorage.getItem("campusmart_theme") || "light";

document.documentElement.classList.toggle(
  "dark",
  savedTheme === "dark"
);

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);