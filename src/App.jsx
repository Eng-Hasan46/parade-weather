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
  AlertTriangle,
} from "lucide-react";
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
import { useQuery } from "@tanstack/react-query";
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
  const [nasaLoading, setNasaLoading] = useState(false);
  const [showLocationAlert, setShowLocationAlert] = useState(false);
  const [shouldScroll, setShouldScroll] = useState(false);
  const [CDFpoints, setCDFpoints] = useState();
  const [prediction, setPrediction] = useState();
  const { setWeatherData } = useWeatherData();

  const nasaPowerService = useMemo(() => new NASAPowerService(), []);

  const {
    isLoading,
    error,
    data: nasaResult,
  } = useQuery({
    queryKey: ["data", place?.lat, place?.lon],
    queryFn: async () => {
      if (place?.lat && place?.lon && date) {
        let data = await nasaPowerService.getDailyRawData(
          place.lat,
          place.lon,
          date
        );
        return data;
      } else {
        let data = await nasaPowerService.getDailyRawData(
          40,
          40,
          new Date().toISOString().slice(0, 10)
        );
        return data;
      }
    },
  });
  console.log("result2s: ", isLoading);

  useEffect(() => {
    console.log("result2s: ", nasaResult);
  }, [nasaResult]);
  // Component to render verdict icon
  const VerdictIcon = ({ iconName }) => {
    const iconProps = { size: 32, className: "inline mr-2" };
    switch (iconName) {
      case "CloudDrizzle":
        return (
          <CloudDrizzle {...iconProps} className="inline mr-2 text-blue-400" />
        );
      case "CloudRain":
        return (
          <CloudRain {...iconProps} className="inline mr-2 text-blue-500" />
        );
      case "Cloud":
        return <Cloud {...iconProps} className="inline mr-2 text-gray-400" />;
      case "Thermometer":
        return (
          <Thermometer {...iconProps} className="inline mr-2 text-red-400" />
        );
      case "Sun":
        return <Sun {...iconProps} className="inline mr-2 text-yellow-400" />;
      case "Snowflake":
        return (
          <Snowflake {...iconProps} className="inline mr-2 text-cyan-400" />
        );
      case "Wind":
        return <Wind {...iconProps} className="inline mr-2 text-green-400" />;
      case "CheckCircle":
        return (
          <CheckCircle {...iconProps} className="inline mr-2 text-green-500" />
        );
      case "ThumbsUp":
        return (
          <ThumbsUp {...iconProps} className="inline mr-2 text-blue-500" />
        );
      case "AlertTriangle":
        return (
          <AlertTriangle
            {...iconProps}
            className="inline mr-2 text-yellow-500"
          />
        );
      default:
        return (
          <AlertTriangle {...iconProps} className="inline mr-2 text-gray-400" />
        );
    }
  };

  // Linear regression slope calculation from Elias branch
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
  // CDF calculation from Elias branch
  // const calculateCDF = (values, target) => {
  //   const sortedValues = [...values].sort((a, b) => a - b);
  //   const count = sortedValues.filter(val => val <= target).length;
  //   return count / sortedValues.length;
  // };
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

  // Transform NASA data to expected format for advanced cards
  const transformNasaDataForCards = (nasaData) => {
    if (
      !nasaData ||
      !nasaData.raw ||
      !nasaData.raw.properties ||
      !nasaData.raw.properties.parameter
    ) {
      console.log("NASA data structure is missing or incomplete:", nasaData);
      return null;
    }

    const params = nasaData.raw.properties.parameter;
    console.log("NASA parameters available:", Object.keys(params));

    // Create year-based data structure that cards expect
    const temperatureData = {
      avg: {},
      max: {},
      min: {},
    };

    const precipitationData = {};
    const windData = {};
    const humidityData = {};
    const cloudData = {};

    // Transform the raw data into year-based format
    if (params.T2M) {
      Object.entries(params.T2M).forEach(([dateStr, value]) => {
        if (value !== null && value !== undefined && value !== -999) {
          const year = dateStr.substring(0, 4);
          if (!temperatureData.avg[year]) temperatureData.avg[year] = [];
          temperatureData.avg[year].push(value);
        }
      });

      // Average values by year
      Object.keys(temperatureData.avg).forEach((year) => {
        const values = temperatureData.avg[year];
        temperatureData.avg[year] =
          values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    }

    if (params.T2M_MAX) {
      Object.entries(params.T2M_MAX).forEach(([dateStr, value]) => {
        if (value !== null && value !== undefined && value !== -999) {
          const year = dateStr.substring(0, 4);
          if (!temperatureData.max[year]) temperatureData.max[year] = [];
          temperatureData.max[year].push(value);
        }
      });

      // Average values by year
      Object.keys(temperatureData.max).forEach((year) => {
        const values = temperatureData.max[year];
        temperatureData.max[year] =
          values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    }

    if (params.T2M_MIN) {
      Object.entries(params.T2M_MIN).forEach(([dateStr, value]) => {
        if (value !== null && value !== undefined && value !== -999) {
          const year = dateStr.substring(0, 4);
          if (!temperatureData.min[year]) temperatureData.min[year] = [];
          temperatureData.min[year].push(value);
        }
      });

      // Average values by year
      Object.keys(temperatureData.min).forEach((year) => {
        const values = temperatureData.min[year];
        temperatureData.min[year] =
          values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    }

    if (params.PRECTOTCORR) {
      Object.entries(params.PRECTOTCORR).forEach(([dateStr, value]) => {
        if (value !== null && value !== undefined && value !== -999) {
          const year = dateStr.substring(0, 4);
          if (!precipitationData[year]) precipitationData[year] = [];
          precipitationData[year].push(value);
        }
      });

      // Average values by year
      Object.keys(precipitationData).forEach((year) => {
        const values = precipitationData[year];
        precipitationData[year] =
          values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    }

    if (params.WS10M) {
      Object.entries(params.WS10M).forEach(([dateStr, value]) => {
        if (value !== null && value !== undefined && value !== -999) {
          const year = dateStr.substring(0, 4);
          if (!windData[year]) windData[year] = [];
          windData[year].push(value);
        }
      });

      // Average values by year
      Object.keys(windData).forEach((year) => {
        const values = windData[year];
        windData[year] =
          values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    }

    if (params.RH2M) {
      Object.entries(params.RH2M).forEach(([dateStr, value]) => {
        if (value !== null && value !== undefined && value !== -999) {
          const year = dateStr.substring(0, 4);
          if (!humidityData[year]) humidityData[year] = [];
          humidityData[year].push(value);
        }
      });

      // Average values by year
      Object.keys(humidityData).forEach((year) => {
        const values = humidityData[year];
        humidityData[year] =
          values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    }

    if (params.CLOUD_AMT) {
      Object.entries(params.CLOUD_AMT).forEach(([dateStr, value]) => {
        if (value !== null && value !== undefined && value !== -999) {
          const year = dateStr.substring(0, 4);
          if (!cloudData[year]) cloudData[year] = [];
          cloudData[year].push(value);
        }
      });

      // Average values by year
      Object.keys(cloudData).forEach((year) => {
        const values = cloudData[year];
        cloudData[year] =
          values.reduce((sum, val) => sum + val, 0) / values.length;
      });
    }

    const result = {
      temperature: temperatureData,
      precipitation: precipitationData,
      wind: windData,
      humidity: humidityData,
      cloud: cloudData,
      averages: nasaData.averages, // Keep the averages for fallback
    };

    console.log("Transformed data:", result);
    return result;
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
    const mapSection = document.querySelector(".my-6");
    if (mapSection) {
      mapSection.scrollIntoView({ behavior: "smooth" });
    }

    // Fetch NASA POWER data
    setNasaLoading(true);
    try {
      // const selectedDate = new Date(date);

      const averages = calculateDateSpecificAverages(nasaResult.raw, date);
      setNasaData({ ...nasaResult, averages: averages });
      setWeatherData(nasaResult);

      // Calculate CDF points and prediction from Elias logic
      if (
        nasaResult &&
        nasaResult.raw &&
        nasaResult.raw.properties &&
        nasaResult.raw.properties.parameter
      ) {
        generatePrediction(nasaResult.raw.properties.parameter);
        // const tempData = nasaResult.raw.properties.parameter.T2M;
        // if (tempData) {
        //   const weatherDataArray = Object.values(tempData).filter(
        //     (val) => val !== null && val !== undefined && val !== -999
        //   );
        //   const targetTemp = snapshot?.temp || 25; // Use current temp or default
        //   const cdf = calculateCDF(weatherDataArray, targetTemp);
        //   setCDFpoints(cdf);

        //   // Calculate temperature trend using year-based data
        //   const yearlyTempData = {};
        //   Object.entries(tempData).forEach(([dateStr, value]) => {
        //     if (value !== null && value !== undefined && value !== -999) {
        //       const year = dateStr.substring(0, 4);
        //       if (!yearlyTempData[year]) yearlyTempData[year] = [];
        //       yearlyTempData[year].push(value);
        //     }
        //   });

        //   // Average temperatures by year
        //   const yearlyAverages = {};
        //   Object.entries(yearlyTempData).forEach(([year, temps]) => {
        //     yearlyAverages[year] =
        //       temps.reduce((sum, temp) => sum + temp, 0) / temps.length;
        //   });

        //   const slope = linearRegressionSlope(yearlyAverages);
        //   setPrediction({
        //     avg: slope,
        //     max: slope * 1.2,
        //     min: slope * 0.8,
        //   });
        // }
      }

      // Calculate verdict based on current weather data AFTER NASA data loads
      if (data) {
        const h = data.hourly,
          idx = h.time.reduce((a, t, i) => {
            if (t.startsWith(date)) a.push(i);
            return a;
          }, []);
        const tIdx =
          idx.find((i) => h.time[i].endsWith("12:00")) ??
          (idx.length ? idx[Math.floor(idx.length / 2)] : null);
        if (tIdx != null) {
          const pop = h.precipitation_probability[tIdx] ?? 0;
          const temp = h.temperature_2m[tIdx] ?? 0,
            app = h.apparent_temperature[tIdx] ?? temp;
          const wind = h.wind_speed_10m[tIdx] ?? 0;
          setSum(verdict({ pop, apparentC: heatIndexC(temp, 60), wind }));
        }
      }

      // After data loads, scroll to the data section
      setTimeout(() => {
        if (shouldScroll) {
          const dataSection = document.querySelector("#data");
          if (dataSection) {
            dataSection.scrollIntoView({ behavior: "smooth" });
          }
          setShouldScroll(false); // Reset scroll flag
        }
      }, 100);
    } catch (error) {
      console.error("Failed to fetch NASA data:", error);
      setNasaData(null);
    } finally {
      setNasaLoading(false);
    }
  }

  async function onPick(p) {
    setPlace(p);
    setLoading(true);
    // Clear previous NASA data and verdict when selecting new location
    setNasaData(null);
    setSum(null);
    try {
      const f = await getForecast(p.lat, p.lon);
      setData(f);
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

  return (
    <div className="w-full mx-auto p-6 text-white">
      {/* Header bar */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-2xl md:text-3xl font-extrabold">
          <Umbrella size={32} className="text-blue-400" />
          ParadeWeather
        </div>

        <div className="flex items-center gap-2">
          <span className="badge opacity-0 sm:opacity-100">🚀 NASA Space Apps 2025</span>
          <button
            onClick={() => {
              navigator.clipboard.writeText('https://weather-pred-node-api.vercel.app/api/predict');
              // Optional: Show a temporary feedback
              const btn = event.target;
              const originalText = btn.textContent;
              btn.textContent = '📋 Copied!';
              setTimeout(() => btn.textContent = originalText, 2000);
            }}
            className="rounded-full px-3 py-1 bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 hover:text-blue-200 transition-colors"
            title="Copy Weather Prediction API URL"
          >
            � API
          </button>
          <button
            onClick={() => setLang((l) => (l === "en" ? "ar" : "en"))}
            className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20"
          >
            {lang === "en" ? "AR" : "EN"}
          </button>
        </div>
      </div>

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
            loading={loading}
            queryIsLoading={isLoading}
          />
        </div> {showLocationAlert && (
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

        <div className="my-6">
          <MapPicker point={place} onPick={onPick} />
        </div>
      </HeroGlobe>



      {place && nasaLoading && (
        <div id="data" className="card p-6 mb-6">
          <div className="flex items-center justify-center py-8">
            <div className="flex flex-col items-center gap-4">
              <div className="w-8 h-8 border-4 border-blue-400/30 border-t-blue-400 rounded-full animate-spin"></div>
              <div className="text-white text-lg font-medium">
                🛰️{" "}
                {lang === "ar"
                  ? "جارٍ تحميل البيانات التاريخية..."
                  : "Loading historical data..."}
              </div>
              <div className="text-white/70 text-sm">
                {lang === "ar" ? "يرجى الانتظار..." : "Please wait..."}
              </div>
            </div>
          </div>
        </div>
      )}

      {place &&
        nasaData &&
        (() => {
          // Set NASA data in weather context for HeatMap component
          console.log(
            "Setting weather data in context:",
            nasaData.raw?.properties?.parameter
          );
          if (nasaData.raw?.properties?.parameter) {
            setWeatherData(nasaData.raw.properties.parameter);
          }

          // Transform NASA data to expected format for advanced cards
          const transformedData = transformNasaDataForCards(nasaData);

          console.log("NASA Data:", nasaData);
          console.log("Transformed Data:", transformedData);
          console.log("Expanded Card:", expandedCard);
          console.log("Prediction:", prediction);

          if (!transformedData) {
            return (
              <div id="data" className="card p-6 mb-6">
                <div className="text-center text-white/70">
                  {lang === "ar"
                    ? "خطأ في تحويل البيانات"
                    : "Error transforming data"}
                  <br />
                  <small>Check console for details</small>
                </div>
              </div>
            );
          }

          return (
            <div
              id="data"
              className="bg-white/10 border-white/10 rounded-2xl shadow-[0_0_40px_rgba(14,165,233,0.22)] p-6 mb-6 max-w-6xl justify-center mx-auto"
            >
              {sum && (
                <div className="mb-6 p-4 bg-gradient-to-r from-blue-500/20 to-cyan-500/20 border border-blue-400/30 rounded-xl ">
                  <div className="text-white/80 text-sm mb-2">{place.name}</div>
                  <div className="text-xl flex items-center">
                    <VerdictIcon iconName={sum.icon} />
                    <span>{lang === "ar" ? sum.ar : sum.en}</span>
                  </div>
                </div>
              )}

              {/* Advanced NASA Data Cards */}
              <div className="mb-4">
                <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
                  🛰️{" "}
                  {lang === "ar"
                    ? "البيانات المناخية التاريخية"
                    : "Historical Climate Data"}
                </h3>
                <p className="text-white/70 text-sm mb-6">
                  {lang === "ar"
                    ? `📅 ${new Date(date).toLocaleDateString(
                      "ar"
                    )} • البيانات من ${nasaData.location.startYear}-${nasaData.location.endYear
                    } (${nasaData.location.yearsOfData} سنة)`
                    : `📅 ${new Date(date).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })} • Data from ${nasaData.location.startYear}-${nasaData.location.endYear
                    } (${nasaData.location.yearsOfData} years)`}
                </p>
              </div>

              <LayoutGroup>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
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
                  <PrecipitationCard
                    expanded={expandedCard}
                    setExpanded={setExpandedCard}
                    id={"rain"}
                    dataPoints={CDFpoints.PRECTOTCORR}
                    prediction={prediction.rainfall}
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
                </div>
              </LayoutGroup>
            </div>
          );
        })()}

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
function calculateDateSpecificAverages(data, targetDate) {
  const parameters = data.properties?.parameter || {};
  const averages = {};

  // Extract month and day from target date (ignore year)
  const dateObj = new Date(targetDate);
  const targetMonth = String(dateObj.getMonth() + 1).padStart(2, "0");
  const targetDay = String(dateObj.getDate()).padStart(2, "0");
  const targetMonthDay = targetMonth + targetDay; // Format: MMDD

  // Filter data for the same month and day across all years
  const getDateSpecificValues = (paramValues) => {
    const specificValues = [];
    for (const [dateStr, value] of Object.entries(paramValues)) {
      if (
        value !== null &&
        value !== undefined &&
        value !== -999 &&
        !isNaN(value)
      ) {
        // Extract MMDD from YYYYMMDD
        const monthDay = dateStr.substring(4, 8);
        if (monthDay === targetMonthDay) {
          specificValues.push(value);
        }
      }
    }
    return specificValues;
  };

  // Calculate averages for each parameter on this specific date across all years
  for (const [param, values] of Object.entries(parameters)) {
    if (typeof values === "object" && values !== null) {
      const dateSpecificValues = getDateSpecificValues(values);

      if (dateSpecificValues.length > 0) {
        const sum = dateSpecificValues.reduce((acc, val) => acc + val, 0);
        averages[param] = {
          average: sum / dateSpecificValues.length,
          min: Math.min(...dateSpecificValues),
          max: Math.max(...dateSpecificValues),
          count: dateSpecificValues.length,
          unit: getParameterUnit(param),
          yearsOfData: dateSpecificValues.length,
        };
      }
    }
  }

  // Calculate date-specific rain probabilities
  if (parameters.PRECTOTCORR) {
    const precipValues = getDateSpecificValues(parameters.PRECTOTCORR);

    if (precipValues.length > 0) {
      // Rain probability for this specific date across all years
      const rainyDays = precipValues.filter((val) => val > 0.1).length;
      const rainProbability = (rainyDays / precipValues.length) * 100;

      // Heavy rain probability for this date
      const heavyRainDays = precipValues.filter((val) => val > 10).length;
      const heavyRainProbability = (heavyRainDays / precipValues.length) * 100;

      // Extreme rain probability for this date
      const extremeRainDays = precipValues.filter((val) => val > 25).length;
      const extremeRainProbability =
        (extremeRainDays / precipValues.length) * 100;

      // No rain probability for this date
      const dryDays = precipValues.filter((val) => val <= 0.1).length;
      const dryProbability = (dryDays / precipValues.length) * 100;

      // Add date-specific rain statistics
      averages["RAIN_PROBABILITY_TODAY"] = {
        average: rainProbability,
        min: 0,
        max: 100,
        count: precipValues.length,
        unit: "%",
        yearsOfData: precipValues.length,
      };

      averages["HEAVY_RAIN_PROBABILITY_TODAY"] = {
        average: heavyRainProbability,
        min: 0,
        max: 100,
        count: precipValues.length,
        unit: "%",
        yearsOfData: precipValues.length,
      };

      averages["EXTREME_RAIN_PROBABILITY_TODAY"] = {
        average: extremeRainProbability,
        min: 0,
        max: 100,
        count: precipValues.length,
        unit: "%",
        yearsOfData: precipValues.length,
      };

      averages["DRY_DAY_PROBABILITY_TODAY"] = {
        average: dryProbability,
        min: 0,
        max: 100,
        count: precipValues.length,
        unit: "%",
        yearsOfData: precipValues.length,
      };
    }
  }

  // Calculate weekly average around this date (±3 days)
  const getWeeklyValues = (paramValues) => {
    const weeklyValues = [];
    for (const [dateStr, value] of Object.entries(paramValues)) {
      if (
        value !== null &&
        value !== undefined &&
        value !== -999 &&
        !isNaN(value)
      ) {
        const month = dateStr.substring(4, 6);
        const day = dateStr.substring(6, 8);
        const monthDay = month + day;

        // Check if this date is within ±3 days of target date
        const targetDayNum = parseInt(targetDay);
        const currentDayNum = parseInt(day);
        const targetMonthNum = parseInt(targetMonth);
        const currentMonthNum = parseInt(month);

        if (currentMonthNum === targetMonthNum) {
          const dayDiff = Math.abs(currentDayNum - targetDayNum);
          if (dayDiff <= 3) {
            weeklyValues.push(value);
          }
        }
      }
    }
    return weeklyValues;
  };

  // Add weekly rain probability around this date
  if (parameters.PRECTOTCORR) {
    const weeklyPrecipValues = getWeeklyValues(parameters.PRECTOTCORR);

    if (weeklyPrecipValues.length > 0) {
      const weeklyRainyDays = weeklyPrecipValues.filter(
        (val) => val > 0.1
      ).length;
      const weeklyRainProbability =
        (weeklyRainyDays / weeklyPrecipValues.length) * 100;

      averages["WEEKLY_RAIN_PROBABILITY"] = {
        average: weeklyRainProbability,
        min: 0,
        max: 100,
        count: weeklyPrecipValues.length,
        unit: "%",
        yearsOfData: Math.floor(weeklyPrecipValues.length / 7),
      };
    }
  }

  return averages;
}

function getParameterUnit(param) {
  const units = {
    T2M: "°C",
    T2M_MAX: "°C",
    T2M_MIN: "°C",
    RH2M: "%",
    PRECTOTCORR: "mm/day",
    WS10M: "m/s",
    WS10M_MAX: "m/s",
    ALLSKY_SFC_SW_DWN: "kWh/m²/day",
    WD2M: "°",
    PS: "kPa",
    QV2M: "g/kg",
    CLOUD_AMT: "%",
    RAIN_PROBABILITY_TODAY: "%",
    HEAVY_RAIN_PROBABILITY_TODAY: "%",
    EXTREME_RAIN_PROBABILITY_TODAY: "%",
    DRY_DAY_PROBABILITY_TODAY: "%",
    WEEKLY_RAIN_PROBABILITY: "%",
  };
  return units[param] || "";
}
