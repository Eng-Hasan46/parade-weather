import { useMemo, useState } from "react";
import MapPicker from "./components/MapPicker.jsx";
import SearchForm from "./components/SearchForm.jsx";
import DualAxisChart from "./components/DualAxisChart.jsx";
import HeroGlobe from "./components/HeroGlobe.jsx";
import WeatherIcons from "./components/WeatherIcons.jsx";
import { getForecast } from "./lib/weather.js";
import { heatIndexC, verdict, fmt, labels as LBL } from "./lib/utils.js";
import "./index.css";

export default function App() {
  const [lang, setLang] = useState('en'); const L = LBL[lang];
  const [place, setPlace] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("Morning (6AM–12PM)");
  const [data, setData] = useState(null); const [sum, setSum] = useState(null);
  const [loading, setLoading] = useState(false);

  async function onPick(p) {
    setPlace(p);
    setLoading(true);
    setSum(null); // Clear previous results
    setData(null); // Clear previous data
    try {
      const f = await getForecast(p.lat, p.lon);
      setData(f);
      const h = f.hourly, idx = h.time.reduce((a, t, i) => { if (t.startsWith(date)) a.push(i); return a; }, []);
      const tIdx = idx.find(i => h.time[i].endsWith("12:00")) ?? (idx.length ? idx[Math.floor(idx.length / 2)] : null);
      if (tIdx != null) {
        const pop = h.precipitation_probability[tIdx] ?? 0, uv = h.uv_index[tIdx] ?? 0;
        const temp = h.temperature_2m[tIdx] ?? 0, app = h.apparent_temperature[tIdx] ?? temp;
        const wind = h.wind_speed_10m[tIdx] ?? 0;
        setSum(verdict({ pop, uv, apparentC: heatIndexC(temp, 60), wind }));
      }
    } catch (error) {
      console.error('Failed to fetch weather data:', error);
      setSum(null);
      setData(null);
    } finally {
      setLoading(false);
    }
  }

  const snapshot = useMemo(() => {
    if (!data) return null;
    const h = data.hourly, idx = h.time.reduce((a, t, i) => { if (t.startsWith(date)) a.push(i); return a; }, []);
    const t = idx.find(i => h.time[i].endsWith("12:00")) ?? (idx.length ? idx[Math.floor(idx.length / 2)] : null);
    if (t == null) return null;
    return { temp: h.temperature_2m[t], pop: h.precipitation_probability[t], uv: h.uv_index[t], wind: h.wind_speed_10m[t] };
  }, [data, date]);

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="text-2xl md:text-3xl font-bold flex items-center gap-3">
          <span className="text-blue-400 flex items-center justify-center">{WeatherIcons.umbrella}</span>
          <span className="text-white leading-none">
            ParadeWeather
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="badge flex items-center gap-2">
            {WeatherIcons.globe} NASA Space Apps 2025
          </span>
          <button onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')} className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20 transition-all">
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
        </div>
      </div>

      {/* === HERO WITH GLOBE === */}
      <HeroGlobe>
        <div className="text-center mb-6">
          <h1 className="text-4xl md:text-6xl font-black title-gradient mb-4 leading-tight">
            {lang === 'ar' ? "لا تدع المطر يفسد خططك!" : "Don't Let Rain Ruin Your Plans!"}
          </h1>
          <p className="text-slate-200 flex items-center justify-center gap-2 text-lg font-medium">
            <span className="w-5 h-5 text-cyan-400">{WeatherIcons.globe}</span>
            {L.subtitle}
            <span className="text-yellow-300">✨</span>
          </p>
        </div>

        <div className="mt-4">
          <SearchForm
            lang={lang}
            labels={L}
            onPick={onPick}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            loading={loading}
            place={place}
          />
        </div>
      </HeroGlobe>

      {/* === MAP + RESULTS === */}
      <div className="my-6"><MapPicker point={place} onPick={onPick} /></div>

      {place && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1 card p-5">
            <div className="text-white/80 text-sm">{place.name}</div>
            <div className="text-3xl mt-2">{sum ? `${sum.icon} ${lang === 'ar' ? sum.ar : sum.en}` : (loading ? '…' : '')}</div>
          </div>
          <div className="md:col-span-2 card p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat icon={WeatherIcons.thermometer} label={L.temp} value={snapshot ? fmt(snapshot.temp, "°C") : "--"} />
              <Stat icon={WeatherIcons.rainDrop} label={L.precip} value={snapshot ? fmt(snapshot.pop, "%") : "--"} />
              <Stat icon={WeatherIcons.sun} label={L.uv} value={snapshot ? Math.round(snapshot.uv) : "--"} />
              <Stat icon={WeatherIcons.wind} label={L.wind} value={snapshot ? fmt(snapshot.wind, " km/h") : "--"} />
            </div>
          </div>
        </div>
      )}

      {place && data && <DualAxisChart data={data} date={date} labels={L} />}

      <footer className="text-center text-white/60 text-xs mt-8">
        Data: Open-Meteo • Prototype only — not for safety-critical use
      </footer>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="text-center flex flex-col items-center justify-center gap-2 p-3 rounded-xl bg-slate-800/30 backdrop-blur-sm border border-slate-600/20 hover:bg-slate-800/50 transition-all">
      <div className="text-blue-300 w-8 h-8 flex items-center justify-center">
        {icon}
      </div>
      <div className="text-slate-300 text-sm font-medium">{label}</div>
      <div className="text-2xl font-bold text-white">{value}</div>
    </div>
  );
}
