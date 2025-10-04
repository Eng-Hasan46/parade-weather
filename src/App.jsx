import { useEffect, useMemo, useState } from "react";
import MapPicker from "./components/MapPicker.jsx";
import SearchForm from "./components/SearchForm.jsx";
import DualAxisChart from "./components/DualAxisChart.jsx";
import HeroGlobe from "./components/HeroGlobe.jsx";
import RainRadar from "./components/RainRadar.jsx";
import { getForecast } from "./lib/weather.js";
import { getPowerHourlyPrecip } from "./lib/nasa.js";   // <-- NEW (NASA POWER)
import { heatIndexC, verdict, fmt, labels as LBL } from "./lib/utils.js";
import "./index.css";

export default function App(){
  const [lang,setLang]=useState('en'); const L=LBL[lang];
  const [place,setPlace]=useState(null);
  const [date,setDate]=useState(new Date().toISOString().slice(0,10));
  const [time,setTime]=useState("Morning (6AM–12PM)");
  const [data,setData]=useState(null);
  const [sum,setSum]=useState(null);
  const [loading,setLoading]=useState(false);

  // NASA POWER precip (mm/hr) for the selected day
  const [power,setPower]=useState([]);

  async function fetchPower(lat, lon, ymd){
    try{
      const r = await getPowerHourlyPrecip(lat, lon, ymd);
      setPower(r?.values || []);
    }catch(e){
      console.warn("POWER fetch failed", e);
      setPower([]);
    }
  }

  async function onPick(p){
    setPlace(p);
    setLoading(true);
    try {
      const f=await getForecast(p.lat,p.lon);
      setData(f);

      // compute quick summary using Open-Meteo snapshot around midday
      const h=f.hourly, idx=h.time.reduce((a,t,i)=>{ if(t.startsWith(date)) a.push(i); return a; },[]);
      const tIdx=idx.find(i=>h.time[i].endsWith("12:00")) ?? (idx.length? idx[Math.floor(idx.length/2)] : null);
      if(tIdx!=null){
        const pop=h.precipitation_probability[tIdx]??0;
        const uv =h.uv_index[tIdx]??0;
        const temp=h.temperature_2m[tIdx]??0;
        const wind=h.wind_speed_10m[tIdx]??0;
        setSum(verdict({ pop, uv, apparentC: heatIndexC(temp,60), wind }));
      }

      // pull NASA POWER precip for this date
      await fetchPower(p.lat, p.lon, date);
    } finally {
      setLoading(false);
    }
  }

  // If user changes the date after selecting a place, refresh POWER for that new day
  useEffect(()=>{
    if(place) fetchPower(place.lat, place.lon, date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[date]);

  const snapshot = useMemo(()=>{
    if(!data) return null;
    const h=data.hourly, idx=h.time.reduce((a,t,i)=>{ if(t.startsWith(date)) a.push(i); return a; },[]);
    const t=idx.find(i=>h.time[i].endsWith("12:00")) ?? (idx.length? idx[Math.floor(idx.length/2)] : null);
    if(t==null) return null;
    return { temp:h.temperature_2m[t], pop:h.precipitation_probability[t], uv:h.uv_index[t], wind:h.wind_speed_10m[t] };
  },[data,date]);

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold">
          <span role="img" aria-label="umbrella">☔️</span>
          ParadeWeather
        </div>

        <div className="flex items-center gap-2">
          <span className="badge">🚀 NASA Space Apps 2025</span>
          <button
            onClick={()=>setLang(l=>l==='en'?'ar':'en')}
            className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20"
          >
            {lang==='en'?'AR':'EN'}
          </button>
        </div>
      </div>

      {/* === HERO WITH GLOBE === */}
      <HeroGlobe>
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-400 inline-block text-transparent bg-clip-text">
            {lang==='ar' ? "!لا تدع المطر يفسد خططك" : "Don't Let Rain Ruin Your Plans!"}
          </h1>
          <p className="mt-2 text-white/80 flex items-center justify-center gap-2">
            🌎 {L.subtitle}
          </p>
        </div>

        <div className="mt-3">
          <SearchForm
            lang={lang}
            labels={L}
            onPick={onPick}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
          />
        </div>
      </HeroGlobe>

      {/* === MAP + RESULTS === */}
      {/* pass selected date so NASA IMERG overlay matches */}
      <div className="my-6">
        <MapPicker point={place} onPick={onPick} date={date}/>
      </div>

      {place && (
        <div className="grid md:grid-cols-3 gap-4 mb-6">
          <div className="md:col-span-1 card p-5">
            <div className="text-white/80 text-sm">{place.name}</div>
            <div className="text-3xl mt-2">
              {sum ? `${sum.icon} ${lang==='ar'?sum.ar:sum.en}` : (loading?'…':'')}
            </div>
          </div>
          <div className="md:col-span-2 card p-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <Stat icon="🌡️" label={L.temp}   value={snapshot ? fmt(snapshot.temp,"°C") : "--"} />
              <Stat icon="🌧️" label={L.precip} value={snapshot ? fmt(snapshot.pop,"%")   : "--"} />
              <Stat icon="🔆" label={L.uv}     value={snapshot ? Math.round(snapshot.uv) : "--"} />
              <Stat icon="💨" label={L.wind}   value={snapshot ? fmt(snapshot.wind," km/h") : "--"} />
            </div>
          </div>
        </div>
      )}

      {/* Pass NASA POWER precip series into the chart */}
      {place && data && <DualAxisChart data={data} date={date} labels={L} power={power} />}

      <footer className="text-center text-white/60 text-xs mt-8">
        Data: NASA POWER (PRECTOTCORR), NASA GIBS / GPM IMERG (visual), Open-Meteo (forecast) • Prototype only — not for safety-critical use
      </footer>
    </div>
  );
}

function Stat({ label, value, icon }) {
  return (
    <div className="text-center flex flex-col items-center justify-center gap-1 p-2">
      <div className="text-3xl">{icon}</div>
      <div className="text-white/70 text-sm">{label}</div>
      <div className="text-2xl font-semibold">{value}</div>
    </div>
  );
}
