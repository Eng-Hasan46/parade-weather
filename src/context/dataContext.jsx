// src/context/WeatherDataContext.jsx
"use client";
import React, { createContext, useContext, useState } from "react";

// Create context
const WeatherDataContext = createContext();

// Provider
export function WeatherDataProvider({ children }) {
  const [weatherData, setWeatherDataState] = useState({});

  const setWeatherData = (data) => {
    setWeatherDataState(data);
  };

  const resetWeatherData = () => {
    setWeatherDataState({});
  };

  return (
    <WeatherDataContext.Provider
      value={{ weatherData, setWeatherData, resetWeatherData }}
    >
      {children}
    </WeatherDataContext.Provider>
  );
}

// Hook for usage
export function useWeatherData() {
  const context = useContext(WeatherDataContext);
  if (!context) {
    throw new Error("useWeatherData must be used within a WeatherDataProvider");
  }
  return context;
}
