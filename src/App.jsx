// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import MapPicker from "./components/MapPicker.jsx";
import SearchForm from "./components/SearchForm.jsx";
import DualAxisChart from "./components/DualAxisChart.jsx";
import HeroGlobe from "./components/HeroGlobe.jsx";
import LightRainGlobe from "./components/LightRainGlobe.jsx";
import ThemeToggle from "./components/ThemeToggle.jsx";
import LeafParticles from "./components/LeafParticles.jsx";
import WeatherChatbot from "./components/WeatherChatbot.jsx";

import { getForecast } from "./lib/weather.js";
import { getPowerHourlyPrecip } from "./lib/nasa.js";
import { heatIndexC, verdict, fmt, labels as LBL } from "./lib/utils.js";
import "./index.css";

export default function App() {
  // --- THEME ---
  const [theme, setTheme] = useState("dark"); // "dark" | "light"
  const isLight = theme === "light";
  const toggleTheme = () => setTheme(t => (t === "dark" ? "light" : "dark"));

  // --- I18N ---
  const [lang, setLang] = useState("en");
  const L = LBL[lang];

  // --- STATE ---
  const [place, setPlace] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("Morning (6AM–12PM)");
  const [data, setData] = useState(null);
  const [sum, setSum] = useState(null);
  const [loading, setLoading] = useState(false);
  const [power, setPower] = useState([]); // NASA POWER precip (mm/hr)

  // theme boot + persistence
  useEffect(() => {
    const saved = localStorage.getItem("theme");
    if (saved === "light" || saved === "dark") {
      setTheme(saved);
    } else {
      const prefersLight = window.matchMedia?.("(prefers-color-scheme: light)")?.matches;
      setTheme(prefersLight ? "light" : "dark");
    }
  }, []);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else {
      root.classList.add("light");
      root.classList.remove("dark");
    }
    localStorage.setItem("theme", theme);
  }, [theme]);

  // --- DATA FETCHERS ---
  async function fetchPower(lat, lon, ymd) {
    try {
      const r = await getPowerHourlyPrecip(lat, lon, ymd);
      setPower(r?.values || []);
    } catch (e) {
      console.warn("POWER fetch failed", e);
      setPower([]);
    }
  }

  async function onPick(p) {
    setPlace(p);
    setLoading(true);
    try {
      const f = await getForecast(p.lat, p.lon);
      setData(f);

      // summary @ midday
      const h = f.hourly;
      const idx = h.time.reduce((a, t, i) => {
        if (t.startsWith(date)) a.push(i);
        return a;
      }, []);
      const tIdx =
        idx.find(i => h.time[i].endsWith("12:00")) ??
        (idx.length ? idx[Math.floor(idx.length / 2)] : null);

      if (tIdx != null) {
        const pop = h.precipitation_probability[tIdx] ?? 0;
        const uv = h.uv_index[tIdx] ?? 0;
        const temp = h.temperature_2m[tIdx] ?? 0;
        const wind = h.wind_speed_10m[tIdx] ?? 0;
        setSum(verdict({ pop, uv, apparentC: heatIndexC(temp, 60), wind }));
      }

      await fetchPower(p.lat, p.lon, date);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    if (place) fetchPower(place.lat, place.lon, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date]);

  const snapshot = useMemo(() => {
    if (!data) return null;
    const h = data.hourly;
    const idx = h.time.reduce((a, t, i) => {
      if (t.startsWith(date)) a.push(i);
      return a;
    }, []);
    const t =
      idx.find(i => h.time[i].endsWith("12:00")) ??
      (idx.length ? idx[Math.floor(idx.length / 2)] : null);
    if (t == null) return null;
    return {
      temp: h.temperature_2m[t],
      pop: h.precipitation_probability[t],
      uv: h.uv_index[t],
      wind: h.wind_speed_10m[t],
    };
  }, [data, date]);

  return (
    <div className={isLight ? "bg-light-gradient min-h-screen text-gray-900" : "bg-neutral-950 min-h-screen text-white"}>
      {isLight && <LeafParticles />}

      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold">
            <span role="img" aria-label="umbrella">☔️</span>
            ParadeWeather
          </div>
          <div className="flex items-center gap-2">
            <span className={isLight ? "badge bg-black/5 text-gray-800" : "badge"}>🚀 NASA Space Apps 2025</span>
            <button
              onClick={() => setLang(l => (l === "en" ? "ar" : "en"))}
              className={isLight ? "rounded-full px-3 py-1 bg-black/5 hover:bg-black/10" : "rounded-full px-3 py-1 bg-white/10 hover:bg-white/20"}
            >
              {lang === "en" ? "AR" : "EN"}
            </button>
            <ThemeToggle theme={theme} onToggle={toggleTheme} />
          </div>
        </div>

        {/* Hero */}
        {isLight ? (
          <LightRainGlobe>
            <div className="text-center mb-4">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-blue-600 via-cyan-500 to-emerald-400 inline-block text-transparent bg-clip-text">
                {lang === "ar" ? "!لا تدع المطر يفسد خططك" : "Don't Let Rain Ruin Your Plans!"}
              </h1>
              <p className="mt-2 text-gray-700 flex items-center justify-center gap-2">🌎 {L.subtitle}</p>
            </div>
            <div className="mt-3">
              <SearchForm lang={lang} labels={L} onPick={onPick} date={date} setDate={setDate} time={time} setTime={setTime} />
            </div>
          </LightRainGlobe>
        ) : (
          <HeroGlobe>
            <div className="text-center mb-4">
              <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-400 inline-block text-transparent bg-clip-text">
                {lang === "ar" ? "!لا تدع المطر يفسد خططك" : "Don't Let Rain Ruin Your Plans!"}
              </h1>
              <p className="mt-2 text-white/80 flex items-center justify-center gap-2">🌎 {L.subtitle}</p>
            </div>
            <div className="mt-3">
              <SearchForm lang={lang} labels={L} onPick={onPick} date={date} setDate={setDate} time={time} setTime={setTime} />
            </div>
          </HeroGlobe>
        )}

        {/* Map */}
        <div className="my-6">
          <MapPicker point={place} onPick={onPick} date={date} />
        </div>

        {/* Summary + Stats */}
        {place && (
          <div className="grid md:grid-cols-3 gap-4 mb-6">
            <div className={isLight ? "md:col-span-1 card p-5 bg-white text-gray-900" : "md:col-span-1 card p-5"}>
              <div className={isLight ? "text-gray-600 text-sm" : "text-white/80 text-sm"}>{place.name}</div>
              <div className="text-3xl mt-2">
                {sum ? `${sum.icon} ${lang === "ar" ? sum.ar : sum.en}` : (loading ? "…" : "")}
              </div>
            </div>
            <div className={isLight ? "md:col-span-2 card p-5 bg-white text-gray-900" : "md:col-span-2 card p-5"}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <Stat icon="🌡️" label={L.temp}   value={snapshot ? fmt(snapshot.temp, "°C") : "--"} />
                <Stat icon="🌧️" label={L.precip} value={snapshot ? fmt(snapshot.pop, "%")   : "--"} />
                <Stat icon="🔆" label={L.uv}     value={snapshot ? Math.round(snapshot.uv)  : "--"} />
                <Stat icon="💨" label={L.wind}   value={snapshot ? fmt(snapshot.wind, " km/h") : "--"} />
              </div>
            </div>
          </div>
        )}

        {/* Chart */}
        {place && data && <DualAxisChart data={data} date={date} labels={L} power={power} />}

        {/* Chatbot */}
        <WeatherChatbot weatherData={data} currentPlace={place} lang={lang} />

        {/* Footer */}
        <footer className={isLight ? "text-center text-gray-600 text-xs mt-8" : "text-center text-white/60 text-xs mt-8"}>
          Data: NASA POWER (PRECTOTCORR), NASA GIBS / GPM IMERG (visual), Open-Meteo (forecast) • Prototype only — not for safety-critical use
        </footer>
      </div>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="text-center flex flex-col items-center justify-center gap-1 p-2">
      <div className="text-3xl">{icon}</div>
      <div className="text-sm opacity-70">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
