import React from "react";
import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";
import { WeatherDataProvider } from "./context/dataContext.jsx";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
const queryClient = new QueryClient();
createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    <QueryClientProvider client={queryClient}>
      <WeatherDataProvider>
        <App />
      </WeatherDataProvider>
    </QueryClientProvider>
  </React.StrictMode>
);
