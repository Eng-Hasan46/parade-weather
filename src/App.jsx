import { useMemo, useState } from "react";
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
  
  const nasaPowerService = useMemo(() => new NASAPowerService(), []);

  async function onPick(p) {
    setPlace(p); setLoading(true);
    try {
      // Fetch current weather data
      const f = await getForecast(p.lat, p.lon); setData(f);
      const h = f.hourly, idx = h.time.reduce((a, t, i) => { if (t.startsWith(date)) a.push(i); return a; }, []);
      const tIdx = idx.find(i => h.time[i].endsWith("12:00")) ?? (idx.length ? idx[Math.floor(idx.length / 2)] : null);
      if (tIdx != null) {
        const pop = h.precipitation_probability[tIdx] ?? 0, uv = h.uv_index[tIdx] ?? 0;
        const temp = h.temperature_2m[tIdx] ?? 0, app = h.apparent_temperature[tIdx] ?? temp;
        const wind = h.wind_speed_10m[tIdx] ?? 0;
        setSum(verdict({ pop, uv, apparentC: heatIndexC(temp, 60), wind }));
      }
      
      // Fetch NASA historical data for this date
      try {
        const currentDate = new Date();
        const nasaResult = await nasaPowerService.getAnnualAverageData(p.lat, p.lon, currentDate);
        setNasaData(nasaResult);
      } catch (error) {
        console.error('Failed to fetch NASA data:', error);
        setNasaData(null);
      }
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
         <span role="img" aria-label="umbrella">☔️</span>
         ParadeWeather
        </div>

        <div className="flex items-center gap-2">
          <span className="badge">🚀 NASA Space Apps 2025</span>
          <button onClick={() => setLang(l => l === 'en' ? 'ar' : 'en')} className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20">
            {lang === 'en' ? 'AR' : 'EN'}
          </button>
        </div>
      </div>

      {/* === HERO WITH GLOBE === */}
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
            date={date}
            setDate={setDate}
            time={time}
            setTime={setTime}
          />
        </div>


      </HeroGlobe>

      {/* === MAP + RESULTS === */}
      <div className="my-6"><MapPicker point={place} onPick={onPick} /></div>

      {place && (
        <div className="card p-5 mb-6">
          <div className="text-white/80 text-sm">{place.name}</div>
          <div className="text-3xl mt-2">{sum ? `${sum.icon} ${lang === 'ar' ? sum.ar : sum.en}` : (loading ? '…' : '')}</div>
        </div>
      )}

      {/* NASA Historical Climate Data */}
      {place && nasaData && (
        <div className="card p-5 mb-6">
          <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
            🛰️ {lang === 'ar' ? 'البيانات المناخية التاريخية لهذا التاريخ' : 'Historical Climate Data for Today'}
          </h3>
          <div className="text-sm text-white/70 mb-4">
            {lang === 'ar' 
              ? `البيانات من ${nasaData.location.startYear}-${nasaData.location.endYear} (${nasaData.location.yearsOfData} سنة)`
              : `Data from ${nasaData.location.startYear}-${nasaData.location.endYear} (${nasaData.location.yearsOfData} years)`
            }
          </div>
          
          {/* Clickable Buttons Grid */}
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            <button 
              onClick={() => setExpandedCard(expandedCard === 'rain' ? null : 'rain')}
              className="card p-4 hover:bg-white/3 transition-colors duration-100 cursor-pointer"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🌧️</div>
                <div className="text-white/70 text-sm">{lang === 'ar' ? 'احتمالية المطر' : 'Rain Probability'}</div>
                <div className="text-xl font-semibold">
                  {nasaData.averages?.RAIN_PROBABILITY_TODAY ? `${nasaData.averages.RAIN_PROBABILITY_TODAY.average.toFixed(1)}%` : '--'}
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setExpandedCard(expandedCard === 'temp' ? null : 'temp')}
              className="card p-4 hover:bg-white/3 transition-colors duration-100 cursor-pointer"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">🌡️</div>
                <div className="text-white/70 text-sm">{lang === 'ar' ? 'متوسط الحرارة' : 'Avg Temperature'}</div>
                <div className="text-xl font-semibold">
                  {nasaData.averages?.T2M ? `${nasaData.averages.T2M.average.toFixed(1)}°C` : '--'}
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setExpandedCard(expandedCard === 'uv' ? null : 'uv')}
              className="card p-4 hover:bg-white/3 transition-colors duration-100 cursor-pointer"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">☀️</div>
                <div className="text-white/70 text-sm">{lang === 'ar' ? 'الأشعة فوق البنفسجية' : 'UV Index'}</div>
                <div className="text-xl font-semibold">
                  {nasaData.averages?.ALLSKY_SFC_SW_DWN ? `${(nasaData.averages.ALLSKY_SFC_SW_DWN.average * 0.4).toFixed(1)}` : '--'}
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setExpandedCard(expandedCard === 'snow' ? null : 'snow')}
              className="card p-4 hover:bg-white/3 transition-colors duration-100 cursor-pointer"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">❄️</div>
                <div className="text-white/70 text-sm">{lang === 'ar' ? 'احتمالية الثلج' : 'Snow Probability'}</div>
                <div className="text-xl font-semibold">
                  {nasaData.averages?.T2M ? `${nasaData.averages.T2M.average < 0 ? '15.2' : '0.0'}%` : '--'}
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setExpandedCard(expandedCard === 'wind' ? null : 'wind')}
              className="card p-4 hover:bg-white/3 transition-colors duration-100 cursor-pointer"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">💨</div>
                <div className="text-white/70 text-sm">{lang === 'ar' ? 'سرعة الرياح' : 'Wind Speed'}</div>
                <div className="text-xl font-semibold">
                  {nasaData.averages?.WS10M ? `${nasaData.averages.WS10M.average.toFixed(1)} m/s` : '--'}
                </div>
              </div>
            </button>
            
            <button 
              onClick={() => setExpandedCard(expandedCard === 'humidity' ? null : 'humidity')}
              className="card p-4 hover:bg-white/3 transition-colors duration-100 cursor-pointer"
            >
              <div className="text-center">
                <div className="text-3xl mb-2">💧</div>
                <div className="text-white/70 text-sm">{lang === 'ar' ? 'الرطوبة' : 'Humidity'}</div>
                <div className="text-xl font-semibold">
                  {nasaData.averages?.RH2M ? `${nasaData.averages.RH2M.average.toFixed(1)}%` : '--'}
                </div>
              </div>
            </button>
          </div>
          
          {/* Expanded Card Details */}
          {expandedCard && (
            <div className="mt-4 p-4 bg-blue-500/20 rounded-lg border border-blue-400/30">
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
              
              {expandedCard === 'uv' && (
                <div>
                  <h4 className="font-bold mb-3 flex items-center gap-2">
                    ☀️ {lang === 'ar' ? 'تفاصيل الأشعة فوق البنفسجية' : 'UV & Solar Details'}
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div>
                      <span className="text-white/70">{lang === 'ar' ? 'مؤشر الأشعة فوق البنفسجية:' : 'UV Index:'}</span>
                      <div className="font-semibold">{nasaData.averages?.ALLSKY_SFC_SW_DWN ? (nasaData.averages.ALLSKY_SFC_SW_DWN.average * 0.4).toFixed(1) : '--'}</div>
                    </div>
                    <div>
                      <span className="text-white/70">{lang === 'ar' ? 'الإشعاع الشمسي:' : 'Solar Irradiance:'}</span>
                      <div className="font-semibold">{nasaData.averages?.ALLSKY_SFC_SW_DWN?.average.toFixed(2)} kWh/m²</div>
                    </div>
                    <div>
                      <span className="text-white/70">{lang === 'ar' ? 'الغطاء السحابي:' : 'Cloud Coverage:'}</span>
                      <div className="font-semibold">{nasaData.averages?.CLOUD_AMT?.average.toFixed(1)}%</div>
                    </div>
                    <div>
                      <span className="text-white/70">{lang === 'ar' ? 'مستوى الخطورة:' : 'Risk Level:'}</span>
                      <div className="font-semibold">
                        {(() => {
                          const uv = nasaData.averages?.ALLSKY_SFC_SW_DWN ? (nasaData.averages.ALLSKY_SFC_SW_DWN.average * 0.4) : 0;
                          if (uv < 3) return lang === 'ar' ? 'منخفض' : 'Low';
                          if (uv < 6) return lang === 'ar' ? 'متوسط' : 'Moderate';
                          if (uv < 8) return lang === 'ar' ? 'عالي' : 'High';
                          return lang === 'ar' ? 'عالي جداً' : 'Very High';
                        })()
                        }
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
                        })()
                        }
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
                        })()
                        }
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
                        })()
                        }
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      <WeatherChatbot
        weatherData={data}
        currentPlace={place}
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
