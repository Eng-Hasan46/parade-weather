import { useEffect, useRef, useState } from "react";
import { Calendar, Loader, Umbrella } from "lucide-react";
import { geocodeCity } from "../lib/weather";

// Small debounce hook
function useDebounced(value, delay = 300) {
  const [v, setV] = useState(value);
  useEffect(() => {
    const t = setTimeout(() => setV(value), delay);
    return () => clearTimeout(t);
  }, [value, delay]);
  return v;
}

// Icon
const Pin = () => (
  <svg
    width="16"
    height="16"
    fill="currentColor"
    viewBox="0 0 24 24"
    className="opacity-80"
  >
    <path d="M12 22s8-7.58 8-12a8 8 0 1 0-16 0c0 4.42 8 12 8 12Zm0-9a3 3 0 1 1 0-6 3 3 0 0 1 0 6Z" />
  </svg>
);

export default function SearchForm({
  lang = "en",
  labels,
  onPick,
  date,
  setDate,
  time,
  setTime,
  onCheck,
  scrollTargetId = "results",
  loading = false,
  checking = false,
  queryIsLoading,
}) {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false); // searching suggestions
  const [geoBusy, setGeoBusy] = useState(false); // using geolocation
  const [error, setError] = useState("");

  const dq = useDebounced(q);
  const inputWrapRef = useRef(null);

  // Live suggestions (debounced)
  useEffect(() => {
    let cancel = false;
    (async () => {
      setError("");
      if (!dq.trim()) {
        setList([]);
        return;
      }
      setBusy(true);
      try {
        const res = await geocodeCity(dq.trim(), lang);
        if (!cancel) setList(res || []);
      } catch (e) {
        if (!cancel)
          setError(lang === "ar" ? "حدث خطأ أثناء البحث" : "Search failed");
      } finally {
        if (!cancel) setBusy(false);
      }
    })();
    return () => {
      cancel = true;
    };
  }, [dq, lang]);

  // Pick a suggestion
  function pickPlace(p) {
    setList([]);
    setQ(p.name || "");
    onPick?.(p);
  }

  // Use my location (with loading)
  function myLoc() {
    if (!navigator.geolocation) {
      alert(
        lang === "ar"
          ? "ميزة تحديد الموقع غير مدعومة"
          : "Geolocation not supported"
      );
      return;
    }
    setGeoBusy(true);
    setError("");
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        setGeoBusy(false);
        pickPlace({
          name: lang === "ar" ? "موقعي الحالي" : "My location",
          lat: pos.coords.latitude,
          lon: pos.coords.longitude,
        });
      },
      () => {
        setGeoBusy(false);
        setError(
          lang === "ar" ? "تعذر الحصول على الموقع" : "Unable to get location"
        );
      }
    );
  }

  // Press Check -> call parent callback
  async function handleCheck() {
    try {
      await onCheck?.(); // parent handles everything including scrolling
    } catch (error) {
      console.error("Error in handleCheck:", error);
    }
  }

  return (
    <div
      className="
        rounded-2xl p-5 md:p-6 shadow-xl
        bg-slate-900/60 backdrop-blur
        ring-1 ring-white/10
      "
      role="search"
      aria-label={lang === "ar" ? "نموذج البحث" : "Search form"}
    >
      {/* Grid */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">
        {/* Location */}
        <div className="md:col-span-7">
          <div className="text-white/80 text-sm mb-1 flex items-center gap-2">
            <Pin /> {labels.location}
          </div>

          <div className="relative flex items-stretch gap-2 flex-wrap" ref={inputWrapRef}>
            <input
              className="input flex-1 min-w-0 pr-10"
              placeholder="Manama, Bahrain"
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onFocus={() => q.trim() && setList((l) => l)} // re-show dropdown on focus if q exists
              aria-autocomplete="list"
              aria-expanded={!!list.length}
            />

            {/* Clear text */}
            {q && (
              <button
                onClick={() => {
                  setQ("");
                  setList([]);
                }}
                className="absolute right-[11.5rem] md:right-[13rem] top-1/2 -translate-y-1/2 text-white/70 hover:text-white"
                aria-label={lang === "ar" ? "مسح النص" : "Clear"}
              >
                ×
              </button>
            )}

            {/* Search button */}
            <button
              onClick={() => dq.trim() && setQ(dq)} // no-op; suggestions are already live
              disabled={busy}
              className={`
                px-6 py-3 rounded-full font-medium text-white transition-all
                whitespace-nowrap
                ${busy
                  ? "bg-sky-800 cursor-not-allowed"
                  : "bg-gradient-to-r from-sky-500 to-sky-700 hover:from-sky-400 hover:to-sky-600"
                }
                shadow-md hover:shadow-lg focus:ring-2 focus:ring-sky-400 focus:outline-none
              `}
              title={lang === "ar" ? "بحث" : "Search"}
            >
              {busy ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/60 border-t-transparent rounded-full animate-spin" />
                  {lang === "ar" ? "جارٍ البحث" : "Searching..."}
                </span>
              ) : lang === "ar" ? (
                "بحث"
              ) : (
                "Search"
              )}
            </button>

            {/* Use My Location (bigger) */}
            <button
              onClick={myLoc}
              disabled={geoBusy}
              className={`
                px-6 py-3 rounded-full font-medium text-white transition-all
                whitespace-nowrap
                ${geoBusy
                  ? "bg-slate-800 cursor-not-allowed"
                  : "bg-gradient-to-r from-emerald-500 to-emerald-700 hover:from-emerald-400 hover:to-emerald-600"
                }
                shadow-md hover:shadow-lg focus:ring-2 focus:ring-emerald-400 focus:outline-none
              `}
              title={lang === "ar" ? "استخدم موقعي" : "Use My Location"}
            >
              {geoBusy ? (
                <span className="flex items-center gap-2">
                  <span className="inline-block w-4 h-4 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
                  {lang === "ar" ? "جارٍ..." : "Locating..."}
                </span>
              ) : lang === "ar" ? (
                "استخدم موقعي"
              ) : (
                "Use My Location"
              )}
            </button>

            {/* Suggestions dropdown */}
            {list.length > 0 && (
              <div
                className="
                  absolute left-0 right-0 top-full mt-2 z-50
                  max-h-60 overflow-y-auto rounded-xl
                  bg-slate-900/90 ring-1 ring-white/10 shadow-2xl
                "
                role="listbox"
              >
                {list.map((p) => (
                  <button
                    key={`${p.lat},${p.lon}`}
                    role="option"
                    onClick={() => pickPlace(p)}
                    className="w-full px-4 py-2 text-left hover:bg-slate-800/60 transition"
                    title={`${p.lat}, ${p.lon}`}
                  >
                    {p.name}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Error */}
          {error && <div className="mt-2 text-sm text-rose-300">{error}</div>}
        </div>

        {/* Date */}
        <div className="md:col-span-5">
          <div className="text-white/80 text-sm mb-1 flex items-center gap-1">
            <Calendar className="w-4 h-4" />
            {labels.date}
          </div>
          <input
            type="date"
            className="input w-full"
            value={date}
            onChange={(e) => setDate(e.target.value)}
          />
        </div>
      </div>

      {/* Check CTA */}
      <div className="mt-6 flex justify-center">
        <button
          onClick={handleCheck}
          disabled={checking || queryIsLoading}
          className={`
            px-10 py-3 rounded-full text-lg font-semibold flex items-center gap-2
           text-white transition-all
          ${checking
              ? "bg-indigo-800 cursor-wait"
              : "bg-gradient-to-r from-blue-500 to-indigo-700 hover:from-blue-400 hover:to-indigo-600 shadow-lg hover:shadow-xl"
            }
            focus:ring-2 focus:ring-indigo-400 focus:outline-none
           disabled:bg-gray-400 disabled:cursor-not-allowed disabled:opacity-60
          `}
        >
          {checking ? (
            <>
              <span className="inline-block w-5 h-5 border-2 border-white/70 border-t-transparent rounded-full animate-spin" />
              {lang === "ar" ? "جارٍ التحميل..." : "Loading results..."}
            </>
          ) : (
            <>
              {queryIsLoading ? (<div className="flex items-center justify-center gap-4">
                <Loader className="w-5 h-5 animate-spin" /><span>Fetching Data</span></div>

              ) : (
                <>
                  <Umbrella className="w-5 h-5" />
                  {labels.check}
                </>
              )}
            </>
          )}
        </button>
      </div>
    </div>
  );
}
