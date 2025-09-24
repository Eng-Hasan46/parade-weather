import { useState } from "react";
import { geocodeCity } from "../lib/weather";

export default function SearchForm({ lang='en', labels, onPick, date, setDate, time, setTime }){
  const [q,setQ]=useState(""); const [list,setList]=useState([]);
  async function search(){ setList(await geocodeCity(q, lang)); }
  function myLoc(){
    if(!navigator.geolocation){ alert(lang==='ar'?'ميزة تحديد الموقع غير مدعومة':'Geolocation not supported'); return; }
    navigator.geolocation.getCurrentPosition(pos=> onPick({ name: lang==='ar'?'موقعي الحالي':'My location', lat: pos.coords.latitude, lon: pos.coords.longitude }));
  }
  return (
    <div className="card p-5">
      <div className="grid md:grid-cols-3 gap-4">
        <div>
          <div className="text-white/80 text-sm mb-1">📍 {labels.location}</div>
          <div className="flex gap-2">
            <input className="input flex-1" placeholder="Manama, Bahrain" value={q} onChange={e=>setQ(e.target.value)}/>
            <button onClick={search} className="cta">Search</button>
            <button onClick={myLoc} className="rounded-full px-4 py-3 bg-white/10 hover:bg-white/20 text-white">Use</button>
          </div>
          {list.length>0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {list.map(p=> <button key={`${p.lat},${p.lon}`} onClick={()=>onPick(p)} className="badge">{p.name}</button>)}
            </div>
          )}
        </div>
        <div>
          <div className="text-white/80 text-sm mb-1">📅 {labels.date}</div>
          <input type="date" className="input w-full" value={date} onChange={e=>setDate(e.target.value)} />
        </div>
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
        <button className="cta text-lg">{labels.check}</button>
      </div>
    </div>
  );
}
