import { useState, useEffect, useRef } from "react";
import { geocodeCity } from "../lib/weather";
import WeatherIcons from "./WeatherIcons";

export default function SearchForm({ lang = 'en', labels, onPick, date, setDate, time, setTime, loading, place }) {
  const [q, setQ] = useState("");
  const [list, setList] = useState([]);
  const [busy, setBusy] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [locationBusy, setLocationBusy] = useState(false);
  const searchTimeoutRef = useRef(null);
  const inputRef = useRef(null);

  // Update input field when place changes
  useEffect(() => {
    if (place && place.name !== q) {
      setQ(place.name);
    }
  }, [place]);

  // Real-time search with debouncing
  useEffect(() => {
    if (q.length < 2) {
      setList([]);
      setShowSuggestions(false);
      return;
    }

    // Clear previous timeout
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }

    // Set new timeout for debounced search
    searchTimeoutRef.current = setTimeout(async () => {
      setBusy(true);
      try {
        const results = await geocodeCity(q, lang);
        setList(results);
        setShowSuggestions(results.length > 0);
      } catch (error) {
        console.error('Search error:', error);
        setList([]);
        setShowSuggestions(false);
      } finally {
        setBusy(false);
      }
    }, 300); // 300ms delay

    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [q, lang]);

  function search() {
    if (q.length >= 2 && !busy) {
      setBusy(true);
      geocodeCity(q, lang).then(results => {
        setList(results);
        setShowSuggestions(true); // Always show dropdown when search button clicked
      }).catch(error => {
        console.error('Search error:', error);
        setList([]);
        setShowSuggestions(true); // Still show dropdown even on error
      }).finally(() => {
        setBusy(false);
      });
    }
  }

  function handleInputChange(e) {
    const value = e.target.value;
    setQ(value);
  }

  function handleSelectPlace(place) {
    setQ(place.name); // Update the input field
    setShowSuggestions(false);
    onPick(place); // Trigger weather fetch
  }

  function handleInputFocus() {
    if (list.length > 0) {
      setShowSuggestions(true);
    }
  }

  function handleInputBlur() {
    // Delay hiding suggestions to allow clicking on them
    setTimeout(() => setShowSuggestions(false), 200);
  }

  function handleCheckWeather() {
    if (place) {
      onPick(place); // Re-trigger weather fetch for current place
    } else if (q.length >= 2) {
      // If no place selected but query exists, search and pick first result
      setBusy(true);
      geocodeCity(q, lang).then(results => {
        if (results.length > 0) {
          onPick(results[0]);
        }
        setBusy(false);
      }).catch(error => {
        console.error('Search error:', error);
        setBusy(false);
      });
    }
  }

  function myLoc() {
    if (!navigator.geolocation) {
      alert(lang === 'ar' ? 'ميزة تحديد الموقع غير مدعومة' : 'Geolocation not supported');
      return;
    }
    setLocationBusy(true);
    navigator.geolocation.getCurrentPosition(pos => {
      onPick({ name: lang === 'ar' ? 'موقعي الحالي' : 'My location', lat: pos.coords.latitude, lon: pos.coords.longitude });
      setLocationBusy(false);
    }, (error) => {
      alert(lang === 'ar' ? 'تعذر الحصول على الموقع' : 'Unable to get location');
      setLocationBusy(false);
    });
  }

  return (
    <div className="card p-5">
      {/* 12-col grid: each control in its own lane */}
      <div className="grid grid-cols-1 md:grid-cols-12 gap-4 items-start">

        {/* Location (col-span-6) */}
        <div className="md:col-span-6 relative">
          <div className="text-white/80 text-sm mb-1 flex items-center gap-2">
            <div className="w-4 h-4 text-blue-300 flex items-center justify-center flex-shrink-0">{WeatherIcons.mapPin}</div>
            <span>{labels.location}</span>
          </div>

          {/* input + buttons stay together; never wrap into other columns */}
          <div className="flex items-stretch gap-2">
            <div className="relative flex-1 min-w-0">
              <input
                ref={inputRef}
                className="input w-full"
                placeholder="Manama, Bahrain"
                value={q}
                onChange={handleInputChange}
                onFocus={handleInputFocus}
                onBlur={handleInputBlur}
              />

              {/* Real-time suggestions dropdown */}
              {showSuggestions && (
                <div className="absolute top-full left-0 right-0 mt-1 bg-slate-800/95 backdrop-blur-md border border-slate-600/30 rounded-xl shadow-xl z-50 max-h-60 overflow-y-auto">
                  {list.length > 0 ? (
                    <>
                      {list.slice(0, 8).map((place, index) => (
                        <button
                          key={`${place.lat},${place.lon}`}
                          onClick={() => handleSelectPlace(place)}
                          className="w-full text-left px-4 py-3 hover:bg-slate-700/50 transition-colors border-b border-slate-600/20 last:border-b-0 text-slate-200 text-sm"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-4 h-4 text-blue-400 flex-shrink-0">{WeatherIcons.mapPin}</div>
                            <span className="truncate">{place.name}</span>
                          </div>
                        </button>
                      ))}
                      {list.length > 8 && (
                        <div className="px-4 py-2 text-xs text-slate-400 bg-slate-800/50">
                          +{list.length - 8} more results...
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="p-4 text-slate-400 text-sm text-center">
                      {busy ? (
                        <div className="flex items-center justify-center gap-2">
                          <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                          <span>{lang === 'ar' ? 'جاري البحث...' : 'Searching...'}</span>
                        </div>
                      ) : (
                        <span>{lang === 'ar' ? 'لم يتم العثور على نتائج' : 'No results found'}</span>
                      )}
                    </div>
                  )}
                </div>
              )}

              {/* Loading indicator */}
              {busy && (
                <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-blue-400 border-t-transparent"></div>
                </div>
              )}
            </div>

            <button
              onClick={search}
              disabled={busy || q.length < 2}
              className="shrink-0 rounded-xl px-4 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2"
            >
              {busy ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-2 border-white border-t-transparent"></div>
                  <span>{lang === 'ar' ? '...' : 'Loading'}</span>
                </>
              ) : (
                <span>{lang === 'ar' ? 'بحث' : 'Search'}</span>
              )}
            </button>

            <button
              onClick={myLoc}
              disabled={locationBusy}
              className="shrink-0 rounded-xl px-4 py-3 bg-white/10 hover:bg-white/20 disabled:bg-white/5 disabled:cursor-not-allowed text-white transition-colors flex items-center gap-2"
              title={lang === 'ar' ? 'استخدم موقعي الحالي' : 'Use my location'}
            >
              {locationBusy ? (
                <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              ) : (
                <>
                  <div className="w-5 h-5">{WeatherIcons.mapPin}</div>
                  <span className="hidden sm:inline text-sm">{lang === 'ar' ? 'موقعي' : 'Location'}</span>
                </>
              )}
            </button>
          </div>
        </div>

        {/* Date (col-span-3) */}
        <div className="md:col-span-3">
          <div className="text-white/80 text-sm mb-1">📅 {labels.date}</div>
          <input
            type="date"
            className="input w-full"
            value={date}
            onChange={e => setDate(e.target.value)}
          />
        </div>

        {/* Time (col-span-3) */}
        <div className="md:col-span-3">
          <div className="text-white/80 text-sm mb-1">⏰ {labels.time}</div>
          <select
            className="input w-full"
            value={time}
            onChange={e => setTime(e.target.value)}
          >
            <option>Morning (6AM–12PM)</option>
            <option>Afternoon (12–6PM)</option>
            <option>Evening (6–10PM)</option>
          </select>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-5 flex justify-center">
        <button
          onClick={handleCheckWeather}
          disabled={loading || (!place && q.length < 2)}
          className="cta text-lg flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <>
              <div className="animate-spin rounded-full h-5 w-5 border-2 border-white border-t-transparent"></div>
              <span>{lang === 'ar' ? 'جاري التحقق...' : 'Checking...'}</span>
            </>
          ) : (
            <>
              ☔ {labels.check}
            </>
          )}
        </button>
      </div>
    </div>
  );
}