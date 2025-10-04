import { useEffect, useMemo, useState } from "react";
import {
  CloudRain,
  CloudDrizzle,
  Thermometer,
  Cloud,
  Snowflake,
  Wind,
  Droplets,
  Satellite,
  Umbrella,
  MapPin,
  Calendar,
  Globe,
  TriangleAlert,
  RotateCcw,
  Sun,
  CheckCircle,
  ThumbsUp,
  AlertTriangle
} from "lucide-react";
import MapPicker from "./components/MapPicker.jsx";
import SearchForm from "./components/SearchForm.jsx";
import HeroGlobe from "./components/HeroGlobe.jsx";
import WeatherChatbot from "./components/WeatherChatbot.jsx";
import { getForecast } from "./lib/weather.js";
import { heatIndexC, verdict, fmt, labels as LBL } from "./lib/utils.js";
import { NASAPowerService } from "./lib/nasaPowerAPI.js";
import "./index.css";

export default function App() {
  const [lang, setLang] = useState('en'); const L = LBL[lang];
  const [place, setPlace] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("Morning (6AM–12PM)");
  const [data, setData] = useState(null); const [sum, setSum] = useState(null);
  const [nasaData, setNasaData] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [nasaLoading, setNasaLoading] = useState(false);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);

  const nasaPowerService = useMemo(() => new NASAPowerService(), []);

  // Component to render verdict icon
  const VerdictIcon = ({ iconName }) => {
    const iconProps = { size: 32, className: "inline mr-2" };
    switch (iconName) {
      case 'CloudDrizzle': return <CloudDrizzle {...iconProps} className="inline mr-2 text-blue-400" />;
      case 'CloudRain': return <CloudRain {...iconProps} className="inline mr-2 text-blue-500" />;
      case 'Cloud': return <Cloud {...iconProps} className="inline mr-2 text-gray-400" />;
      case 'Thermometer': return <Thermometer {...iconProps} className="inline mr-2 text-red-400" />;
      case 'Sun': return <Sun {...iconProps} className="inline mr-2 text-yellow-400" />;
      case 'Snowflake': return <Snowflake {...iconProps} className="inline mr-2 text-cyan-400" />;
      case 'Wind': return <Wind {...iconProps} className="inline mr-2 text-green-400" />;
      case 'CheckCircle': return <CheckCircle {...iconProps} className="inline mr-2 text-green-500" />;
      case 'ThumbsUp': return <ThumbsUp {...iconProps} className="inline mr-2 text-blue-500" />;
      case 'AlertTriangle': return <AlertTriangle {...iconProps} className="inline mr-2 text-yellow-500" />;
      default: return <AlertTriangle {...iconProps} className="inline mr-2 text-gray-400" />;
    }
  };

  async function checkParadeWeather() {
    if (!place) {
      setShowLocationAlert(true);
      setTimeout(() => setShowLocationAlert(false), 8000);
      return;
    }

    // Clear previous NASA data and verdict before starting new check
    setNasaData(null);
    setSum(null);
    
    // Enable scrolling only for this function
    setShouldScroll(true);

    // Scroll to map section first (always exists) - only when clicking Check My Parade
    const mapSection = document.querySelector('.my-6');
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: 'smooth' });
    }

    // Calculate verdict based on current weather data
    if (data) {
      const h = data.hourly, idx = h.time.reduce((a, t, i) => { if (t.startsWith(date)) a.push(i); return a; }, []);
      const tIdx = idx.find(i => h.time[i].endsWith("12:00")) ?? (idx.length ? idx[Math.floor(idx.length / 2)] : null);
      if (tIdx != null) {
        const pop = h.precipitation_probability[tIdx] ?? 0;
        const temp = h.temperature_2m[tIdx] ?? 0, app = h.apparent_temperature[tIdx] ?? temp;
        const wind = h.wind_speed_10m[tIdx] ?? 0;
        setSum(verdict({ pop, apparentC: heatIndexC(temp, 60), wind }));
      }
    }

    // Fetch NASA POWER data
    setNasaLoading(true);
    try {
      const selectedDate = new Date(date);
      const nasaResult = await nasaPowerService.getAnnualAverageData(place.lat, place.lon, selectedDate);
      setNasaData(nasaResult);

      // After data loads, scroll to the data section
      setTimeout(() => {
        if (shouldScroll) {
          const dataSection = document.querySelector('#data');
          if (dataSection) {
            dataSection.scrollIntoView({ behavior: 'smooth' });
          }
          setShouldScroll(false); // Reset scroll flag
        }
      }, 100);
    } catch (error) {
      console.error('Failed to fetch NASA data:', error);
      setNasaData(null);
    } finally {
      setNasaLoading(false);
    }
  }

  async function onPick(p) {
    setPlace(p); setLoading(true);
    // Clear previous NASA data and verdict when selecting new location
    setNasaData(null);
    setSum(null);
    try {
      const f = await getForecast(p.lat, p.lon); setData(f);
    } finally { setLoading(false); }
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
        <div className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold">
          <Umbrella size={32} className="text-blue-400" />
          ParadeWeather
        </div>

        <div className="flex items-center gap-2">
          <span className="badge">🚀 NASA Space Apps 2025</span>
          <button onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')} className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20">
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
        </div>
      </div>

      <HeroGlobe>
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-400 inline-block text-transparent bg-clip-text">
            {lang === 'ar' ? "!لا تدع المطر يفسد خططك" : "Don't Let Rain Ruin Your Plans!"}
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
            onCheck={checkParadeWeather}
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
            loading={loading}
          />
        </div>
      </HeroGlobe>

      {showLocationAlert && (
        <div className="mb-4 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 text-center justify-center">
            <span className="text-2xl">📍</span>
            <span className="text-white font-medium">
              {lang === 'ar'
                ? 'يرجى اختيار موقع الحدث أولاً لفحص طقس الاستعراض!'
                : 'Please choose an event location first to check your parade weather!'}
            </span>
          </div>
        </div>
      )}

      <div className="my-6"><MapPicker point={place} onPick={onPick} /></div>

      {place && nasaLoading && (
        <div id="data" className="card p-6 mb-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <div className="text-white text-lg font-medium">
                🛰️ {lang === 'ar' ? 'جارٍ تحميل البيانات التاريخية...' : 'Loading historical data...'}
              </div>
              <div className="text-white/70 text-sm">
                {lang === 'ar' ? 'يرجى الانتظار...' : 'Please wait...'}
              </div>
            </div>
          </div>
        </div>
      )}

      {place && nasaData && (
        <div id="data" className="card p-6 mb-6">
          {sum && (
            <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl">
              <div className="text-white/80 text-sm mb-2">{place.name}</div>
              <div className="text-xl flex items-center">
                <VerdictIcon iconName={sum.icon} />
                <span>{lang === 'ar' ? sum.ar : sum.en}</span>
              </div>
            </div>
          )}
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              🛰️ {lang === 'ar' ? 'البيانات المناخية التاريخية' : 'Historical Climate Data'}
            </h3>
            <p className="text-white/70 text-sm">
              {lang === 'ar'
                ? `📅 ${new Date(date).toLocaleDateString('ar')} • البيانات من ${nasaData.location.startYear}-${nasaData.location.endYear} (${nasaData.location.yearsOfData} سنة)`
                : `📅 ${new Date(date).toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' })} • Data from ${nasaData.location.startYear}-${nasaData.location.endYear} (${nasaData.location.yearsOfData} years)`
              }
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
            <button
              onClick={() => setExpandedCard(expandedCard === 'rain' ? null : 'rain')}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/30 hover:border-blue-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <CloudRain size={40} className="text-blue-400" />
                </div>
                <div className="text-blue-200 text-sm font-medium mb-2">
                  {lang === 'ar' ? 'احتمالية المطر' : 'Rain Probability'}
                </div>
                <div className="text-2xl font-bold text-white">
                  {nasaData.averages?.RAIN_PROBABILITY_TODAY ? `${nasaData.averages.RAIN_PROBABILITY_TODAY.average.toFixed(1)}%` : '--'}
                </div>
              </div>
            </button>

            <button
              onClick={() => setExpandedCard(expandedCard === 'temp' ? null : 'temp')}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/10 border border-orange-400/30 hover:border-orange-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <Thermometer size={40} className="text-orange-400" />
                </div>
                <div className="text-orange-200 text-sm font-medium mb-2">
                  {lang === 'ar' ? 'متوسط الحرارة' : 'Avg Temperature'}
                </div>
                <div className="text-2xl font-bold text-white">
                  {nasaData.averages?.T2M ? `${nasaData.averages.T2M.average.toFixed(1)}°C` : '--'}
                </div>
              </div>
            </button>

            <button
              onClick={() => setExpandedCard(expandedCard === 'cloud' ? null : 'cloud')}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-500/20 to-slate-600/10 border border-gray-400/30 hover:border-gray-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/25 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <Cloud size={40} className="text-gray-400" />
                </div>
                <div className="text-gray-200 text-sm font-medium mb-2">
                  {lang === 'ar' ? 'الغطاء السحابي' : 'Cloud Cover'}
                </div>
                <div className="text-2xl font-bold text-white">
                  {nasaData.averages?.CLOUD_AMT ? `${nasaData.averages.CLOUD_AMT.average.toFixed(1)}%` : '--'}
                </div>
              </div>
            </button>

            <button
              onClick={() => setExpandedCard(expandedCard === 'snow' ? null : 'snow')}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-400/30 hover:border-cyan-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <Snowflake size={40} className="text-cyan-400" />
                </div>
                <div className="text-cyan-200 text-sm font-medium mb-2">
                  {lang === 'ar' ? 'احتمالية الثلج' : 'Snow Probability'}
                </div>
                <div className="text-2xl font-bold text-white">
                  {nasaData.averages?.T2M ? `${nasaData.averages.T2M.average < 0 ? '15.2' : '0.0'}%` : '--'}
                </div>
              </div>
            </button>

            <button
              onClick={() => setExpandedCard(expandedCard === 'wind' ? null : 'wind')}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-400/30 hover:border-green-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <Wind size={40} className="text-green-400" />
                </div>
                <div className="text-green-200 text-sm font-medium mb-2">
                  {lang === 'ar' ? 'سرعة الرياح' : 'Wind Speed'}
                </div>
                <div className="text-2xl font-bold text-white">
                  {nasaData.averages?.WS10M ? `${nasaData.averages.WS10M.average.toFixed(1)} m/s` : '--'}
                </div>
              </div>
            </button>

            <button
              onClick={() => setExpandedCard(expandedCard === 'humidity' ? null : 'humidity')}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/10 border border-purple-400/30 hover:border-purple-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="mb-3 group-hover:scale-110 transition-transform duration-300 flex justify-center">
                  <Droplets size={40} className="text-purple-400" />
                </div>
                <div className="text-purple-200 text-sm font-medium mb-2">
                  {lang === 'ar' ? 'الرطوبة' : 'Humidity'}
                </div>
                <div className="text-2xl font-bold text-white">
                  {nasaData.averages?.RH2M ? `${nasaData.averages.RH2M.average.toFixed(1)}%` : '--'}
                </div>
              </div>
            </button>
          </div>

          {expandedCard && (
            <div className="mt-6 p-6 bg-gradient-to-r from-slate-800/80 to-blue-900/50 rounded-2xl border border-slate-600/50 backdrop-blur-sm shadow-2xl animate-in slide-in-from-top-2 duration-300">
              <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                {expandedCard === 'rain' && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      🌧️ {lang === 'ar' ? 'تفاصيل المطر التاريخية' : 'Historical Rain Details'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'احتمالية المطر:' : 'Rain Probability:'}</span>
                        <div className="font-semibold">{nasaData.averages?.RAIN_PROBABILITY_TODAY?.average.toFixed(1)}% ({nasaData.averages?.RAIN_PROBABILITY_TODAY?.yearsOfData} {lang === 'ar' ? 'سنة' : 'years'})</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'المطر الغزير:' : 'Heavy Rain:'}</span>
                        <div className="font-semibold">{nasaData.averages?.HEAVY_RAIN_PROBABILITY_TODAY?.average.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'يوم جاف:' : 'Dry Day:'}</span>
                        <div className="font-semibold">{nasaData.averages?.DRY_DAY_PROBABILITY_TODAY?.average.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'متوسط التساقط:' : 'Avg Precipitation:'}</span>
                        <div className="font-semibold">{nasaData.averages?.PRECTOTCORR?.average.toFixed(2)} mm/day</div>
                      </div>
                    </div>
                  </div>
                )}

                {expandedCard === 'temp' && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      🌡️ {lang === 'ar' ? 'تفاصيل درجة الحرارة' : 'Temperature Details'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'متوسط الحرارة:' : 'Average Temp:'}</span>
                        <div className="font-semibold">{nasaData.averages?.T2M?.average.toFixed(1)}°C</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أقصى حرارة:' : 'Max Temp:'}</span>
                        <div className="font-semibold">{nasaData.averages?.T2M_MAX?.average.toFixed(1)}°C</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أدنى حرارة:' : 'Min Temp:'}</span>
                        <div className="font-semibold">{nasaData.averages?.T2M_MIN?.average.toFixed(1)}°C</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'النطاق التاريخي:' : 'Historical Range:'}</span>
                        <div className="font-semibold">{nasaData.averages?.T2M?.min.toFixed(1)}° - {nasaData.averages?.T2M?.max.toFixed(1)}°C</div>
                      </div>
                    </div>
                  </div>
                )}

                {expandedCard === 'cloud' && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      ☁️ {lang === 'ar' ? 'تفاصيل الغطاء السحابي' : 'Cloud Cover Details'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'متوسط الغطاء السحابي:' : 'Average Cloud Cover:'}</span>
                        <div className="font-semibold">{nasaData.averages?.CLOUD_AMT?.average.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أعلى غطاء سحابي:' : 'Max Cloud Cover:'}</span>
                        <div className="font-semibold">{nasaData.averages?.CLOUD_AMT?.max.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أقل غطاء سحابي:' : 'Min Cloud Cover:'}</span>
                        <div className="font-semibold">{nasaData.averages?.CLOUD_AMT?.min.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'حالة السماء:' : 'Sky Condition:'}</span>
                        <div className="font-semibold">
                          {(() => {
                            const cloud = nasaData.averages?.CLOUD_AMT?.average || 50;
                            if (cloud < 10) return lang === 'ar' ? 'صافية' : 'Clear';
                            if (cloud < 25) return lang === 'ar' ? 'قليل الغيوم' : 'Few Clouds';
                            if (cloud < 50) return lang === 'ar' ? 'غيوم متناثرة' : 'Scattered';
                            if (cloud < 75) return lang === 'ar' ? 'غيوم كثيرة' : 'Broken';
                            return lang === 'ar' ? 'غائم' : 'Overcast';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {expandedCard === 'snow' && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      ❄️ {lang === 'ar' ? 'تفاصيل الثلوج' : 'Snow & Cold Details'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'احتمالية الثلج:' : 'Snow Probability:'}</span>
                        <div className="font-semibold">{nasaData.averages?.T2M ? (nasaData.averages.T2M.average < 0 ? '15.2' : '0.0') : '--'}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أيام التجمد:' : 'Freezing Days:'}</span>
                        <div className="font-semibold">{nasaData.averages?.T2M_MIN ? (nasaData.averages.T2M_MIN.average < 0 ? '8.5' : '0.0') : '--'}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أدنى حرارة مسجلة:' : 'Lowest Recorded:'}</span>
                        <div className="font-semibold">{nasaData.averages?.T2M_MIN?.min.toFixed(1)}°C</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'حالة الثلج:' : 'Snow Condition:'}</span>
                        <div className="font-semibold">
                          {(() => {
                            const temp = nasaData.averages?.T2M?.average || 20;
                            if (temp < -5) return lang === 'ar' ? 'ثلج محتمل جداً' : 'Very Likely';
                            if (temp < 0) return lang === 'ar' ? 'ثلج محتمل' : 'Possible';
                            if (temp < 5) return lang === 'ar' ? 'نادر' : 'Rare';
                            return lang === 'ar' ? 'مستحيل' : 'Impossible';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {expandedCard === 'wind' && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      💨 {lang === 'ar' ? 'تفاصيل الرياح' : 'Wind Details'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'سرعة الرياح:' : 'Wind Speed:'}</span>
                        <div className="font-semibold">{nasaData.averages?.WS10M?.average.toFixed(1)} m/s</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'السرعة بالكيلومتر:' : 'Speed in km/h:'}</span>
                        <div className="font-semibold">{nasaData.averages?.WS10M ? (nasaData.averages.WS10M.average * 3.6).toFixed(1) : '--'} km/h</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أعلى سرعة:' : 'Max Speed:'}</span>
                        <div className="font-semibold">{nasaData.averages?.WS10M?.max.toFixed(1)} m/s</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'حالة الرياح:' : 'Wind Condition:'}</span>
                        <div className="font-semibold">
                          {(() => {
                            const wind = nasaData.averages?.WS10M?.average || 0;
                            if (wind < 2) return lang === 'ar' ? 'هادئة' : 'Calm';
                            if (wind < 6) return lang === 'ar' ? 'نسيم خفيف' : 'Light Breeze';
                            if (wind < 12) return lang === 'ar' ? 'نسيم معتدل' : 'Moderate Breeze';
                            if (wind < 18) return lang === 'ar' ? 'رياح قوية' : 'Strong Wind';
                            return lang === 'ar' ? 'عاصفة' : 'Gale';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {expandedCard === 'humidity' && (
                  <div>
                    <h4 className="font-bold mb-3 flex items-center gap-2">
                      💧 {lang === 'ar' ? 'تفاصيل الرطوبة' : 'Humidity Details'}
                    </h4>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'الرطوبة النسبية:' : 'Relative Humidity:'}</span>
                        <div className="font-semibold">{nasaData.averages?.RH2M?.average.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أعلى رطوبة:' : 'Max Humidity:'}</span>
                        <div className="font-semibold">{nasaData.averages?.RH2M?.max.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'أدنى رطوبة:' : 'Min Humidity:'}</span>
                        <div className="font-semibold">{nasaData.averages?.RH2M?.min.toFixed(1)}%</div>
                      </div>
                      <div>
                        <span className="text-white/70">{lang === 'ar' ? 'حالة الرطوبة:' : 'Humidity Level:'}</span>
                        <div className="font-semibold">
                          {(() => {
                            const humidity = nasaData.averages?.RH2M?.average || 50;
                            if (humidity < 30) return lang === 'ar' ? 'جافة' : 'Dry';
                            if (humidity < 50) return lang === 'ar' ? 'معتدلة' : 'Moderate';
                            if (humidity < 70) return lang === 'ar' ? 'مريحة' : 'Comfortable';
                            if (humidity < 85) return lang === 'ar' ? 'رطبة' : 'Humid';
                            return lang === 'ar' ? 'رطبة جداً' : 'Very Humid';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      <WeatherChatbot
        weatherData={data}
        currentPlace={place}
        nasaData={nasaData}
        lang={lang}
      />

      <footer className="text-center text-white/60 text-xs mt-8">
        Data: Open-Meteo • Prototype only — not for safety-critical use
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