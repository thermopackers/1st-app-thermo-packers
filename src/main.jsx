import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

import App from "./App";
import "./index.css";
import { AppProvider } from "./context/AppContext";
import { UserProvider } from "./context/UserContext";
import { ToDoProvider } from "./context/ToDoContext";

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(
  <BrowserRouter>
    <AppProvider>
    <UserProvider>
          <ToDoProvider>


      <App />
          </ToDoProvider>

      </UserProvider>

    </AppProvider>
  </BrowserRouter>
);
