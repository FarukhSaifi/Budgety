import React from "react";
import { createRoot } from "react-dom/client"; // Updated import for React 18+
import App from "./App";
import "./index.css";
import * as serviceWorker from "./serviceWorker";

// Create a root and render the App component
const root = createRoot(document.getElementById("root"));
root.render(<App />);

// If you want your app to work offline and load faster, you can change
// unregister() to register() below. Note this comes with some pitfalls.
// Learn more about service workers: https://bit.ly/CRA-PWA
serviceWorker.unregister();
