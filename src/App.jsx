import { useMemo, useState, useEffect } from "react";
import MapPicker from "./components/MapPicker.jsx";
import SearchForm from "./components/SearchForm.jsx";

import HeroGlobe from "./components/HeroGlobe.jsx";
import WeatherChatbot from "./components/WeatherChatbot.jsx";
import { getForecast } from "./lib/weather.js";
import { heatIndexC, verdict, fmt, labels as LBL } from "./lib/utils.js";
import { NASAPowerService } from "./lib/nasaPowerAPI.js";
import "./index.css";
import { LayoutGroup } from "framer-motion";
import CloudCoverCard from "./components/CloudCoverCard.jsx";
import PrecipitationCard from "./components/PrecipitationCard.jsx";
import WindSpeedCard from "./components/WindSpeedCard.jsx";
import HumidityCard from "./components/HumidityCard.jsx";
import SnowCard from "./components/SnowCard.jsx";
import TempVariableCard from "./components/TempVariableCard.jsx";
import { useWeatherData } from "./context/dataContext.jsx";

export default function App() {
  const [lang, setLang] = useState("en");
  const L = LBL[lang];
  const [place, setPlace] = useState(null);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState("Morning (6AM–12PM)");
  const [data, setData] = useState(null);
  const [sum, setSum] = useState(null);
  const [nasaData, setNasaData] = useState(null);
  const [expandedCard, setExpandedCard] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [CDFpoints, setCDFpoints] = useState();
  const [prediction, setPrediction] = useState();
  const { setWeatherData } = useWeatherData();

  const nasaPowerService = useMemo(() => new NASAPowerService(), []);

  function checkParadeWeather() {
    if (!place) {
      setShowLocationAlert(true);
      setTimeout(() => setShowLocationAlert(false), 8000); // Hide after 8 seconds
      return;
    }
    // If location is selected, scroll to results
    const resultsSection = document.querySelector(".card");
    if (resultsSection) {
      resultsSection.scrollIntoView({ behavior: "smooth" });
    }
  }
  const linearRegressionSlope = (finalYearsObj) => {
    const years = Object.keys(finalYearsObj).map(Number);
    const values = Object.values(finalYearsObj);

    const n = years.length;

    const meanX = years.reduce((a, b) => a + b, 0) / n;
    const meanY = values.reduce((a, b) => a + b, 0) / n;

    let numerator = 0;
    let denominator = 0;
    console.log("hello1");
    for (let i = 0; i < n; i++) {
      numerator += (years[i] - meanX) * (values[i] - meanY);
      denominator += (years[i] - meanX) ** 2;
    }

    const slope = numerator / denominator;
    const intercept = meanY - slope * meanX;
    console.log("hello2");
    // const residuals = values.map((y, i) => y - (slope * years[i] + intercept));
    // const residStd = Math.sqrt(
    //   residuals.reduce((a, b) => a + b * b, 0) / (n - 2)
    // );

    return {
      slope,
      intercept,
    };
  };

  const predict = (data) => {
    const finalDaysObj = {};
    const variableNames = [
      "T2M",
      "T2M_MIN",
      "T2M_MAX",
      "PRECTOTCORR",
      "CLOUD_AMT",
      "RH2M",
      "WS10M",
      "SNODP",
      "PRECSNO",
    ];

    // Object to hold yearly averages for each variable
    const finalYearsObj = {};
    variableNames.forEach((v) => (finalYearsObj[v] = {}));
    console.log("func data: ", data);

    const target = new Date(date);

    for (let year = 1981; year <= 2024; year++) {
      const historicTarget = new Date(
        year,
        target.getMonth(),
        target.getDate()
      );

      variableNames.forEach((v) => {
        const values = [];

        for (let offset = -2; offset <= 4; offset++) {
          const d = new Date(historicTarget);
          d.setDate(historicTarget.getDate() + offset);
          const key = d.toISOString().slice(0, 10).replace(/-/g, "");

          if (data[v]?.[key] !== undefined) {
            if (data[v][key] < -200) {
              //skip
            } else {
              finalDaysObj[key] = data[v][key]; // optional, you could separate by variable if needed
              values.push(data[v][key]);
            }
          }
        }

        if (values.length > 0) {
          const avg = values.reduce((a, b) => a + b, 0) / values.length;
          finalYearsObj[v][year] = avg;
        }
      });
    }

    console.log("final: ", finalYearsObj);

    // Example: compute slope for T2M
    const { slope: avgTempSlope, intercept: avgTempIntercept } =
      linearRegressionSlope(finalYearsObj["T2M"]);

    const { slope: maxTempSlope, intercept: maxTempIntercept } =
      linearRegressionSlope(finalYearsObj["T2M_MAX"]);
    const { slope: minTempSlope, intercept: minTempIntercept } =
      linearRegressionSlope(finalYearsObj["T2M_MIN"]);
    const { slope: PrectotcorrSlope, intercept: PrectotcorrIntercept } =
      linearRegressionSlope(finalYearsObj["PRECTOTCORR"]);
    const { slope: CloudAmountSlope, intercept: CloudAmountIntercept } =
      linearRegressionSlope(finalYearsObj["CLOUD_AMT"]);
    const { slope: RH2MSlope, intercept: RH2MIntercept } =
      linearRegressionSlope(finalYearsObj["RH2M"]);
    const { slope: WS2MSlope, intercept: WS2MIntercept } =
      linearRegressionSlope(finalYearsObj["WS10M"]);
    const { slope: SNODPSlope, intercept: SNODPIntercept } =
      linearRegressionSlope(finalYearsObj["SNODP"]);
    const { slope: PRECSNOMSlope, intercept: PRECSNOIntercept } =
      linearRegressionSlope(finalYearsObj["PRECSNO"]);
    console.log("hello");
    console.log(
      "idiis, ",
      data["PRECTOTCORR"],
      PrectotcorrSlope,
      PrectotcorrIntercept
    );
    const avgTempPrediction =
      avgTempSlope * target.getFullYear() + avgTempIntercept;

    const maxTempPrediction =
      maxTempSlope * target.getFullYear() + maxTempIntercept;

    const minTempPrediction =
      minTempSlope * target.getFullYear() + minTempIntercept;

    const rainFallPrediction =
      PrectotcorrSlope * target.getFullYear() + PrectotcorrIntercept;

    const cloudCoverPrediction =
      CloudAmountSlope * target.getFullYear() + CloudAmountIntercept;
    const humidityPrediction = RH2MSlope * target.getFullYear() + RH2MIntercept;
    const windSpeedPrediction =
      WS2MSlope * target.getFullYear() + WS2MIntercept;
    const snowDepthPrediction =
      SNODPSlope * target.getFullYear() + SNODPIntercept;
    const snowFallPrediction =
      PRECSNOMSlope * target.getFullYear() + PRECSNOIntercept;
    console.log(finalYearsObj);
    console.log(finalDaysObj);

    console.log("CDF POINTS: ", finalYearsObj);
    setCDFpoints(finalYearsObj);
    setWeatherData(data);

    console.log(
      avgTempPrediction,
      maxTempPrediction,
      minTempPrediction,
      rainFallPrediction,
      cloudCoverPrediction,
      humidityPrediction,
      windSpeedPrediction
    );

    return {
      avgTempPrediction,
      maxTempPrediction,
      minTempPrediction,
      rainFallPrediction,
      cloudCoverPrediction,
      humidityPrediction,
      windSpeedPrediction,
      snowDepthPrediction,
      snowFallPrediction,
    };
  };

  const generatePrediction = (data) => {
    if (!date) {
      // setError("Please select a target date");
      return;
    }

    if (!data) {
      // setError("Something went wrong");
      return;
    }

    try {
      const params = data;

      console.log("params: ", params);
      // Use the predict function to get predictions
      const predictionResults = predict(params);
      console.log("results: ", predictionResults);
      const formattedPrediction = {
        date: date,
        temperature: {
          max: predictionResults.maxTempPrediction,
          min: predictionResults.minTempPrediction,
          avg: predictionResults.avgTempPrediction,
        },
        rainfall: predictionResults.rainFallPrediction,
        humidity: Math.round(
          Math.max(0, Math.min(100, predictionResults.humidityPrediction))
        ),
        wind: Math.max(0, predictionResults.windSpeedPrediction),
        cloudCover: Math.max(
          0,
          Math.min(100, predictionResults.cloudCoverPrediction)
        ),
        snow: {
          depth: predictionResults.snowDepthPrediction,
          fall: predictionResults.snowFallPrediction,
        },
      };

      console.log("Prediction generated:", formattedPrediction);
      setPrediction(formattedPrediction);
      return formattedPrediction;
    } catch (err) {
      console.error("Prediction error:", err);
      // setError(`Failed to generate prediction: ${err.message}`);
    }
  };

  async function onPick(p) {
    setPlace(p);
    setLoading(true);
    try {
      // Fetch current weather data
      const f = await getForecast(p.lat, p.lon);
      setData(f);
      const h = f.hourly,
        idx = h.time.reduce((a, t, i) => {
          if (t.startsWith(date)) a.push(i);
          return a;
        }, []);
      const tIdx =
        idx.find((i) => h.time[i].endsWith("12:00")) ??
        (idx.length ? idx[Math.floor(idx.length / 2)] : null);
      if (tIdx != null) {
        const pop = h.precipitation_probability[tIdx] ?? 0,
          uv = h.uv_index[tIdx] ?? 0;
        const temp = h.temperature_2m[tIdx] ?? 0,
          app = h.apparent_temperature[tIdx] ?? temp;
        const wind = h.wind_speed_10m[tIdx] ?? 0;
        setSum(verdict({ pop, uv, apparentC: heatIndexC(temp, 60), wind }));
      }
      // NASA data will be fetched by useEffect hook when place changes

      // await generatePrediction(nasaData.raw.properties.parameter);
    } finally {
      setLoading(false);
    }
  }

  const snapshot = useMemo(() => {
    if (!data) return null;
    const h = data.hourly,
      idx = h.time.reduce((a, t, i) => {
        if (t.startsWith(date)) a.push(i);
        return a;
      }, []);
    const t =
      idx.find((i) => h.time[i].endsWith("12:00")) ??
      (idx.length ? idx[Math.floor(idx.length / 2)] : null);
    if (t == null) return null;
    return {
      temp: h.temperature_2m[t],
      pop: h.precipitation_probability[t],
      uv: h.uv_index[t],
      wind: h.wind_speed_10m[t],
    };
  }, [data, date]);

  // Refresh NASA data when date changes with debouncing
  useEffect(() => {
    if (place && date) {
      const timeoutId = setTimeout(async () => {
        try {
          const selectedDate = new Date(date);
          const nasaResult = await nasaPowerService.getAnnualAverageData(
            place.lat,
            place.lon,
            selectedDate
          );
          console.log("raw data: ", nasaResult.raw.properties.parameter);
          setNasaData(nasaResult);
          generatePrediction(nasaResult.raw.properties.parameter);
        } catch (error) {
          console.error("Failed to fetch NASA data for date change:", error);
          setNasaData(null);
        }
      }, 300); // 300ms debounce to reduce API calls

      return () => clearTimeout(timeoutId);
    }
  }, [date, place, nasaPowerService]);

  return (
    <div className="max-w-6xl mx-auto p-6 text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold">
          <span role="img" aria-label="umbrella">
            ☔️
          </span>
          ParadeWeather
        </div>

        <div className="flex items-center gap-2">
          <span className="badge">🚀 NASA Space Apps 2025</span>
          <button
            onClick={() => setLang((l) => (l === "en" ? "ar" : "en"))}
            className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20"
          >
            {lang === "en" ? "AR" : "EN"}
          </button>
        </div>
      </div>

      {/* === HERO WITH GLOBE === */}
      <HeroGlobe>
        <div className="text-center mb-4">
          <h1 className="text-4xl md:text-5xl font-extrabold bg-gradient-to-r from-sky-400 via-emerald-300 to-sky-400 inline-block text-transparent bg-clip-text">
            {lang === "ar"
              ? "!لا تدع المطر يفسد خططك"
              : "Don't Let Rain Ruin Your Plans!"}
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
          />
        </div>
      </HeroGlobe>

      {/* Location Alert */}
      {showLocationAlert && (
        <div className="mb-4 p-4 bg-gradient-to-r from-red-500/20 to-orange-500/20 border border-red-400/30 rounded-xl backdrop-blur-sm animate-in slide-in-from-top-2 duration-300">
          <div className="flex items-center gap-3 text-center justify-center">
            <span className="text-2xl">📍</span>
            <span className="text-white font-medium">
              {lang === "ar"
                ? "يرجى اختيار موقع الحدث أولاً لفحص طقس الاستعراض!"
                : "Please choose an event location first to check your parade weather!"}
            </span>
          </div>
        </div>
      )}

      {/* === MAP + RESULTS === */}
      <div className="my-6">
        <MapPicker point={place} onPick={onPick} />
      </div>

      {place && (
        <div className="card p-5 mb-6">
          <div className="text-white/80 text-sm">{place.name}</div>
          <div className="text-3xl mt-2">
            {sum
              ? `${sum.icon} ${lang === "ar" ? sum.ar : sum.en}`
              : loading
              ? "…"
              : ""}
          </div>
        </div>
      )}

      {/* NASA Historical Climate Data */}
      {place && nasaData && (
        <div className="card p-6 mb-6">
          <div className="mb-4">
            <h3 className="text-xl font-bold mb-2 flex items-center gap-2">
              🛰️{" "}
              {lang === "ar"
                ? "البيانات المناخية التاريخية"
                : "Historical Climate Data"}
            </h3>
            <p className="text-white/70 text-sm">
              {lang === "ar"
                ? `📅 ${new Date(date).toLocaleDateString(
                    "ar-u-nu-arab-ca-gregory",
                    { day: "numeric", month: "long", year: "numeric" }
                  )} • البيانات من ${nasaData.location.startYear}-${
                    nasaData.location.endYear
                  } (${nasaData.location.yearsOfData} سنة)`
                : `📅 ${new Date(date).toLocaleDateString("en-US", {
                    year: "numeric",
                    month: "long",
                    day: "numeric",
                  })} • Data from ${nasaData.location.startYear}-${
                    nasaData.location.endYear
                  } (${nasaData.location.yearsOfData} years)`}
            </p>
          </div>

          {/* Climate Metrics Grid */}
          <LayoutGroup>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6 z-50">
              <PrecipitationCard
                expanded={expandedCard}
                setExpanded={setExpandedCard}
                id={"rain"}
                dataPoints={CDFpoints.PRECTOTCORR}
                prediction={prediction.rainfall}
                nasaData={nasaData}
                lang={lang}
              />
              <TempVariableCard
                expanded={expandedCard}
                setExpanded={setExpandedCard}
                id={"temp"}
                dataPoints={{
                  avg: CDFpoints.T2M,
                  min: CDFpoints.T2M_min,
                  max: CDFpoints.T2M_max,
                }}
                prediction={prediction.temperature}
                nasaData={nasaData}
                lang={lang}
              />

              <CloudCoverCard
                expanded={expandedCard}
                setExpanded={setExpandedCard}
                id={"cloud"}
                dataPoints={CDFpoints.CLOUD_AMT}
                prediction={prediction.cloudCover}
                nasaData={nasaData}
                lang={lang}
              />

              <SnowCard
                expanded={expandedCard}
                setExpanded={setExpandedCard}
                id={"snow"}
                dataPoints={{
                  snowFall: CDFpoints.PRECSNO,
                  snowDepth: CDFpoints.SNODP,
                }}
                prediction={{
                  snowFall: prediction.snow.fall,
                  snowDepth: prediction.snow.depth,
                }}
                nasaData={nasaData}
                lang={lang}
              />

              <WindSpeedCard
                expanded={expandedCard}
                setExpanded={setExpandedCard}
                id={"wind"}
                dataPoints={CDFpoints.WS10M}
                prediction={prediction.wind}
                nasaData={nasaData}
                lang={lang}
              />
              <HumidityCard
                expanded={expandedCard}
                setExpanded={setExpandedCard}
                id={"humidity"}
                dataPoints={CDFpoints.RH2M}
                prediction={prediction.humidity}
                nasaData={nasaData}
                lang={lang}
              />
            </div>
          </LayoutGroup>

          {/* Expanded Card Details */}
          <LayoutGroup>
            {expandedCard && (
              <div className="mt-6 p-6 bg-gradient-to-r from-slate-800/80 to-blue-900/50 rounded-2xl border border-slate-600/50 backdrop-blur-sm shadow-2xl animate-in slide-in-from-top-2 duration-300">
                <div className="max-h-96 overflow-y-auto scrollbar-thin scrollbar-thumb-slate-600 scrollbar-track-slate-800">
                  {expandedCard === "rain" && (
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        🌧️{" "}
                        {lang === "ar"
                          ? "تفاصيل المطر التاريخية"
                          : "Historical Rain Details"}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "احتمالية المطر:"
                              : "Rain Probability:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.RAIN_PROBABILITY_TODAY?.average.toFixed(
                              1
                            )}
                            % (
                            {
                              nasaData.averages?.RAIN_PROBABILITY_TODAY
                                ?.yearsOfData
                            }{" "}
                            {lang === "ar" ? "سنة" : "years"})
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "المطر الغزير:" : "Heavy Rain:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.HEAVY_RAIN_PROBABILITY_TODAY?.average.toFixed(
                              1
                            )}
                            %
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "يوم جاف:" : "Dry Day:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.DRY_DAY_PROBABILITY_TODAY?.average.toFixed(
                              1
                            )}
                            %
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "متوسط التساقط:"
                              : "Avg Precipitation:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.PRECTOTCORR?.average.toFixed(2)}{" "}
                            mm/day
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {expandedCard === "temp" && (
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        🌡️{" "}
                        {lang === "ar"
                          ? "تفاصيل درجة الحرارة"
                          : "Temperature Details"}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "متوسط الحرارة:" : "Average Temp:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.T2M?.average.toFixed(1)}°C
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "أقصى حرارة:" : "Max Temp:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.T2M_MAX?.average.toFixed(1)}°C
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "أدنى حرارة:" : "Min Temp:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.T2M_MIN?.average.toFixed(1)}°C
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "النطاق التاريخي:"
                              : "Historical Range:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.T2M?.min.toFixed(1)}° -{" "}
                            {nasaData.averages?.T2M?.max.toFixed(1)}°C
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {expandedCard === "cloud" && (
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        ☁️{" "}
                        {lang === "ar"
                          ? "تفاصيل الغطاء السحابي"
                          : "Cloud Cover Details"}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "متوسط الغطاء السحابي:"
                              : "Average Cloud Cover:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.CLOUD_AMT?.average.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "أعلى غطاء سحابي:"
                              : "Max Cloud Cover:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.CLOUD_AMT?.max.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "أقل غطاء سحابي:"
                              : "Min Cloud Cover:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.CLOUD_AMT?.min.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "حالة السماء:" : "Sky Condition:"}
                          </span>
                          <div className="font-semibold">
                            {(() => {
                              const cloud =
                                nasaData.averages?.CLOUD_AMT?.average || 50;
                              if (cloud < 10)
                                return lang === "ar" ? "صافية" : "Clear";
                              if (cloud < 25)
                                return lang === "ar"
                                  ? "قليل الغيوم"
                                  : "Few Clouds";
                              if (cloud < 50)
                                return lang === "ar"
                                  ? "غيوم متناثرة"
                                  : "Scattered";
                              if (cloud < 75)
                                return lang === "ar" ? "غيوم كثيرة" : "Broken";
                              return lang === "ar" ? "غائم" : "Overcast";
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {expandedCard === "snow" && (
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        ❄️{" "}
                        {lang === "ar"
                          ? "تفاصيل الثلوج"
                          : "Snow & Cold Details"}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "احتمالية الثلج:"
                              : "Snow Probability:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.T2M
                              ? nasaData.averages.T2M.average < 0
                                ? "15.2"
                                : "0.0"
                              : "--"}
                            %
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "أيام التجمد:" : "Freezing Days:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.T2M_MIN
                              ? nasaData.averages.T2M_MIN.average < 0
                                ? "8.5"
                                : "0.0"
                              : "--"}
                            %
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "أدنى حرارة مسجلة:"
                              : "Lowest Recorded:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.T2M_MIN?.min.toFixed(1)}°C
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "حالة الثلج:" : "Snow Condition:"}
                          </span>
                          <div className="font-semibold">
                            {(() => {
                              const temp =
                                nasaData.averages?.T2M?.average || 20;
                              if (temp < -5)
                                return lang === "ar"
                                  ? "ثلج محتمل جداً"
                                  : "Very Likely";
                              if (temp < 0)
                                return lang === "ar" ? "ثلج محتمل" : "Possible";
                              if (temp < 5)
                                return lang === "ar" ? "نادر" : "Rare";
                              return lang === "ar" ? "مستحيل" : "Impossible";
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {expandedCard === "wind" && (
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        💨 {lang === "ar" ? "تفاصيل الرياح" : "Wind Details"}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "سرعة الرياح:" : "Wind Speed:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.WS10M?.average.toFixed(1)} m/s
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "السرعة بالكيلومتر:"
                              : "Speed in km/h:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.WS10M
                              ? (nasaData.averages.WS10M.average * 3.6).toFixed(
                                  1
                                )
                              : "--"}{" "}
                            km/h
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "أعلى سرعة:" : "Max Speed:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.WS10M?.max.toFixed(1)} m/s
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "حالة الرياح:" : "Wind Condition:"}
                          </span>
                          <div className="font-semibold">
                            {(() => {
                              const wind =
                                nasaData.averages?.WS10M?.average || 0;
                              if (wind < 2)
                                return lang === "ar" ? "هادئة" : "Calm";
                              if (wind < 6)
                                return lang === "ar"
                                  ? "نسيم خفيف"
                                  : "Light Breeze";
                              if (wind < 12)
                                return lang === "ar"
                                  ? "نسيم معتدل"
                                  : "Moderate Breeze";
                              if (wind < 18)
                                return lang === "ar"
                                  ? "رياح قوية"
                                  : "Strong Wind";
                              return lang === "ar" ? "عاصفة" : "Gale";
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {expandedCard === "humidity" && (
                    <div>
                      <h4 className="font-bold mb-3 flex items-center gap-2">
                        💧{" "}
                        {lang === "ar" ? "تفاصيل الرطوبة" : "Humidity Details"}
                      </h4>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "الرطوبة النسبية:"
                              : "Relative Humidity:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.RH2M?.average.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "أعلى رطوبة:" : "Max Humidity:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.RH2M?.max.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar" ? "أدنى رطوبة:" : "Min Humidity:"}
                          </span>
                          <div className="font-semibold">
                            {nasaData.averages?.RH2M?.min.toFixed(1)}%
                          </div>
                        </div>
                        <div>
                          <span className="text-white/70">
                            {lang === "ar"
                              ? "حالة الرطوبة:"
                              : "Humidity Level:"}
                          </span>
                          <div className="font-semibold">
                            {(() => {
                              const humidity =
                                nasaData.averages?.RH2M?.average || 50;
                              if (humidity < 30)
                                return lang === "ar" ? "جافة" : "Dry";
                              if (humidity < 50)
                                return lang === "ar" ? "معتدلة" : "Moderate";
                              if (humidity < 70)
                                return lang === "ar" ? "مريحة" : "Comfortable";
                              if (humidity < 85)
                                return lang === "ar" ? "رطبة" : "Humid";
                              return lang === "ar" ? "رطبة جداً" : "Very Humid";
                            })()}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}
          </LayoutGroup>
        </div>
      )}

      <WeatherChatbot weatherData={data} currentPlace={place} lang={lang} />

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
