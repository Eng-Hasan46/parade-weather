import { useState } from "react";
import { geocodeCity } from "../lib/weather";

// tiny inline icons (no extra libs)
const Pin = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="opacity-80">
    <path d="M12 22s8-7.58 8-12a8 8 0 1 0-16 0c0 4.42 8 12 8 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
  </svg>
);
const SearchIcon = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="opacity-80">
    <path d="M21 21 15.8 15.8m-3.8 1.2a6 6 0 1 1 0-12 6 6 0 0 1 0 12Z"/>
  </svg>
);
const Gps = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="opacity-80">
    <path d="M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm0-6v3m0 12v3M3 12h3m12 0h3"/>
  </svg>
);

export default function SearchForm({ lang='en', labels, onPick, date, setDate, time, setTime }){
  const [q,setQ]=useState("");
  const [list,setList]=useState([]);
  const [busy,setBusy]=useState(false);

  async function search(){
    setBusy(true);
    try { setList(await geocodeCity(q, lang)); }
    finally { setBusy(false); }
  }
  function myLoc(){
    if(!navigator.geolocation){
      alert(lang==='ar'?'ميزة تحديد الموقع غير مدعومة':'Geolocation not supported');
      return;
    }
    navigator.geolocation.getCurrentPosition(pos=>{
      onPick({ name: lang==='ar'?'موقعي الحالي':'My location', lat: pos.coords.latitude, lon: pos.coords.longitude });
    }, ()=> alert(lang==='ar'?'تعذر الحصول على الموقع':'Unable to get location'));
  }

  return (
    <div className="card p-5">
      <div className="grid gap-4 md:grid-cols-3">
        {/* Location */}
        <div>
          <div className="text-white/80 text-sm mb-1 flex items-center gap-2">
            <Pin/>{labels.location}
          </div>
          <div className="flex flex-wrap md:flex-nowrap gap-2">
            <input
              className="input flex-1 min-w-[220px]"
              placeholder="Manama, Bahrain"
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
            <button
              onClick={search}
              className="rounded-full px-5 py-3 bg-ocean-600 hover:bg-ocean-700 text-white shrink-0 flex items-center gap-2"
            >
              <SearchIcon/>{busy ? (lang==='ar'?'...':'Search…') : (lang==='ar'?'بحث':'Search')}
            </button>
            <button
              onClick={myLoc}
              className="rounded-full px-5 py-3 bg-white/10 hover:bg-white/20 text-white shrink-0 flex items-center gap-2"
            >
              <Gps/>{lang==='ar'?'موقعي':'Use'}
            </button>
          </div>

          {list.length>0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {list.map(p=> (
                <button key={`${p.lat},${p.lon}`} onClick={()=>onPick(p)}
                        className="badge hover:bg-white/20">{p.name}</button>
              ))}
            </div>
          )}
        </div>

        {/* Date */}
        <div>
          <div className="text-white/80 text-sm mb-1">📅 {labels.date}</div>
          <input type="date" className="input w-full" value={date} onChange={e=>setDate(e.target.value)} />
        </div>

        {/* Time */}
        <div>
          <div className="text-white/80 text-sm mb-1">⏰ {labels.time}</div>
          <select className="input w-full" value={time} onChange={e=>setTime(e.target.value)}>
            <option>Morning (6AM–12PM)</option>
            <option>Afternoon (12–6PM)</option>
            <option>Evening (6–10PM)</option>
          </select>
        </div>
      </div>

      <div className="mt-5 flex justify-center">
        <button className="cta text-lg flex items-center gap-2">
          ☔ {labels.check}
        </button>
      </div>
    </div>
  );
}
