import { Fragment, useState } from "react";
import { Listbox, Transition } from "@headlessui/react";
import { geocodeCity } from "../lib/weather";

// icon
const Pin = () => (
  <svg width="16" height="16" fill="currentColor" viewBox="0 0 24 24" className="opacity-80">
    <path d="M12 22s8-7.58 8-12a8 8 0 1 0-16 0c0 4.42 8 12 8 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z"/>
  </svg>
);

// time options with colors
const TIME_OPTIONS = [
  { label: "Morning (6AM–12PM)",  dot: "bg-emerald-400",  text: "text-emerald-300" },
  { label: "Afternoon (12–6PM)",  dot: "bg-yellow-400",   text: "text-yellow-300" },
  { label: "Evening (6–10PM)",    dot: "bg-orange-400",   text: "text-orange-300" },
  { label: "Night (10PM–6AM)",    dot: "bg-purple-400",   text: "text-purple-300" },
];

export default function SearchForm({ lang='en', labels, onPick, onCheck, date, setDate, time, setTime }){
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

  const selectedTime = time || TIME_OPTIONS[0].label;

  return (
    <div className="card p-5">
      {/* 12-col grid: each control in its own lane */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

        {/* Location (col-span-5) */}
        <div className="md:col-span-5">
          <div className="text-white/80 text-sm mb-1 flex items-center gap-2">
            <Pin/>{labels.location}
          </div>

          {/* input + buttons stay together; never wrap into other columns */}
          <div className="flex items-stretch gap-2">
            <input
              className="input flex-1 min-w-0"
              placeholder="Manama, Bahrain"
              value={q}
              onChange={e=>setQ(e.target.value)}
            />
            <button
              onClick={search}
              className="shrink-0 rounded-full px-5 py-3 bg-ocean-600 hover:bg-ocean-700 text-white"
            >
              {busy ? (lang==='ar'?'...':'Search…') : (lang==='ar'?'بحث':'Search')}
            </button>
            <button
              onClick={myLoc}
              className="shrink-0 rounded-full px-5 py-3 bg-white/10 hover:bg-white/20 text-white"
            >
              {lang==='ar'?'موقعي':'Use'}
            </button>
          </div>

          {/* suggestions */}
          {list.length>0 && (
            <div className="mt-2 flex flex-wrap gap-2">
              {list.map(p=> (
                <button
                  key={`${p.lat},${p.lon}`}
                  onClick={()=>onPick(p)}
                  className="badge hover:bg-white/20"
                >
                  {p.name}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Date (col-span-4) */}
        <div className="md:col-span-4">
          <div className="text-white/80 text-sm mb-1">📅 {labels.date}</div>
          <input
            type="date"
            className="input w-full"
            value={date}
            onChange={e=>setDate(e.target.value)}
          />
        </div>

        {/* Time (col-span-3) — Headless UI Listbox for full styling control */}
        <div className="md:col-span-3">
          <div className="text-white/80 text-sm mb-1">⏰ {labels.time}</div>

          <Listbox value={selectedTime} onChange={setTime}>
            <div className="relative">
              {/* Trigger button looks like your inputs */}
              <Listbox.Button className="input w-full flex items-center justify-between">
                <span className="truncate">{selectedTime}</span>
                <svg width="18" height="18" viewBox="0 0 24 24" className="opacity-80">
                  <path fill="currentColor" d="M7 10l5 5 5-5H7z"/>
                </svg>
              </Listbox.Button>

              {/* Dropdown panel */}
              <Transition
                as={Fragment}
                enter="transition ease-out duration-100"
                enterFrom="opacity-0 translate-y-1"
                enterTo="opacity-100 translate-y-0"
                leave="transition ease-in duration-75"
                leaveFrom="opacity-100 translate-y-0"
                leaveTo="opacity-0 translate-y-1"
              >
                <Listbox.Options
                  className="absolute z-20 mt-1 w-full overflow-hidden rounded-xl bg-slate-900/95 ring-1 ring-white/10 shadow-xl focus:outline-none"
                >
                  {TIME_OPTIONS.map((t) => (
                    <Listbox.Option
                      key={t.label}
                      value={t.label}
                      className={({ active, selected }) =>
                        `px-4 py-2 cursor-pointer select-none flex items-center gap-2
                         ${active ? "bg-slate-700/70" : ""}
                         ${selected ? "bg-slate-800/70" : ""}`
                      }
                    >
                      {({ selected }) => (
                        <>
                          <span className={`inline-block h-2.5 w-2.5 rounded-full ${t.dot}`} />
                          <span className={`truncate ${t.text}`}>{t.label}</span>
                          {selected && (
                            <svg width="18" height="18" viewBox="0 0 24 24" className="ml-auto text-sky-300">
                              <path fill="currentColor" d="M9 16.2l-3.5-3.5 1.4-1.4L9 13.4l7.1-7.1 1.4 1.4z"/>
                            </svg>
                          )}
                        </>
                      )}
                    </Listbox.Option>
                  ))}
                </Listbox.Options>
              </Transition>
            </div>
          </Listbox>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 flex justify-center">
        <button onClick={onCheck} className="cta text-lg flex items-center gap-2">
          ☔ {labels.check}
        </button>
      </div>
    </div>
  );
}
