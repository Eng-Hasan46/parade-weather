"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Thermometer, X, TrendingUp, TrendingDown } from "lucide-react";
import PointsLineChart from "../components/LineChart";
import NormalDistributionChart from "../components/NormalDistributionChart";
import HeatMap from "./HeatMap";
import {
  calculateMeanAndStandardDeviation,
  calculateSlopeAndIntercept,
} from "../lib/graphsHelperFunctions";
// interface TempVariableCardProps {
//   id: string;
//   expanded: string | null;
//   setExpanded: any;
//   prediction?: {
//     max: number;
//     min: number;
//     avg: number;
//   };
//   dataPoints: {
// avg: { [key: string]: number };
// min: { [key: string]: number };
// max: { [key: string]: number };
//   };
// }

export default function TempVariableCard({
  id,
  expanded,
  setExpanded,
  prediction,
  dataPoints,
  nasaData,
  lang,
}) {
  console.log("TempVariableCard - dataPoints:", dataPoints);
  console.log("TempVariableCard - prediction:", prediction);
  console.log("TempVariableCard - expanded:", expanded);
  console.log("TempVariableCard - id:", id);

  try {
    const slopeAndInterceptAvg = calculateSlopeAndIntercept(dataPoints.avg);
    const meanAndStdAvg = calculateMeanAndStandardDeviation(dataPoints.avg);
    const meanAndStdMax = calculateMeanAndStandardDeviation(dataPoints.max);
    const meanAndStdMin = calculateMeanAndStandardDeviation(dataPoints.min);

    const isOpen = expanded === id;
    // Use NASA data averages for actual temperature values
    const avgTemp = nasaData.averages?.T2M ? Math.round(nasaData.averages.T2M.average) : 0;
    const maxTemp = nasaData.averages?.T2M_MAX ? Math.round(nasaData.averages.T2M_MAX.average) : 0;
    const minTemp = nasaData.averages?.T2M_MIN ? Math.round(nasaData.averages.T2M_MIN.average) : 0;

    // Use prediction data if available, otherwise use fallback props
    const oneStdAvg = [
      Math.max(0, Math.round(avgTemp - meanAndStdAvg.standardDeviation)),
      Math.max(0, Math.round(avgTemp + meanAndStdAvg.standardDeviation)),
    ];
    const oneStdMax = [
      Math.max(0, Math.round(maxTemp - meanAndStdMax.standardDeviation)),
      Math.max(0, Math.round(maxTemp + meanAndStdMax.standardDeviation)),
    ];
    const oneStdMin = [
      Math.max(0, Math.round(minTemp - meanAndStdMin.standardDeviation)),
      Math.max(0, Math.round(minTemp + meanAndStdMin.standardDeviation)),
    ];
    const twoStdAvg = [
      Math.max(0, Math.round(avgTemp - 2 * meanAndStdAvg.standardDeviation)),
      Math.max(0, Math.round(avgTemp + 2 * meanAndStdAvg.standardDeviation)),
    ];
    const threeStdAvg = [
      Math.max(0, Math.round(avgTemp - 3 * meanAndStdAvg.standardDeviation)),
      Math.max(0, Math.round(avgTemp + 3 * meanAndStdAvg.standardDeviation)),
    ];

    const avgRange = oneStdAvg;
    const maxRange = oneStdMax;
    const minRange = oneStdMin;

    return (
      <>
        <AnimatePresence>
          {!isOpen && (
            // <motion.div
            //   layoutId={id}
            //   onClick={() => setExpanded(id)}
            //   className="relative cursor-pointer rounded-2xl shadow-lg bg-white overflow-hidden"
            //   initial={{ opacity: 0, scale: 0.9 }}
            //   animate={{ opacity: 1, scale: 1 }}
            //   exit={{ opacity: 0, scale: 0.9 }}
            //   transition={{
            //     type: "spring",
            //     stiffness: 300,
            //     damping: 30,
            //   }}
            //   whileHover={{ scale: 1.01 }}
            // >
            //   <div className="absolute inset-0 bg-[url(/sky.jpg)] bg-cover">
            //     <div className="absolute inset-0 bg-black/10"></div>
            //   </div>
            //   <div className="relative z-10 p-6 text-white">
            //     <div className="flex items-center gap-2">
            //       <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
            //         <Thermometer size={20} />
            //       </div>
            //       <p className="text-sm font-semibold uppercase">Temperature</p>
            //     </div>
            //     <p className="mt-6 text-4xl font-bold">{avgTemp}°C</p>
            //     <p className="text-sm opacity-80">
            //       {prediction ? "Predicted avg temperature" : "Avg temperature"}
            //     </p>
            //   </div>
            // </motion.div>
            <button
              onClick={() => setExpanded("temp")}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-orange-500/20 to-red-600/10 border border-orange-400/30 hover:border-orange-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-orange-500/25 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  🌡️
                </div>
                <div className="text-orange-200 text-sm font-medium mb-2">
                  {lang === "ar" ? "متوسط الحرارة" : "Avg Temperature"}
                </div>
                <div className="text-2xl font-bold text-white">
                  {Math.round(prediction.avg)}°C
                </div>
              </div>
            </button>
          )}
        </AnimatePresence>

        <AnimatePresence>
          {isOpen && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm "
              onClick={() => setExpanded(null)}
            >
              <motion.div
                layoutId={id}
                className="relative w-[1000px] max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl pb-40"
                onClick={(e) => e.stopPropagation()}
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                transition={{
                  type: "spring",
                  stiffness: 300,
                  damping: 30,
                }}
              >
                {/* Exit button top left - Visible positioning */}
                {/* <button
                  onClick={() => setExpanded(null)}
                  className="absolute top-2 left-2 z-30 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white px-3 py-1.5 rounded-full shadow-xl border border-slate-600 hover:border-slate-500 transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md hover:scale-105"
                >
                  <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                  </svg>
                  <span>Back</span>
                </button> */}
                <button
                  onClick={() => setExpanded(null)}
                  className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
                >
                  <X size={20} />
                </button>                <motion.div
                  className="p-8 space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Current Temperature Analysis */}
                  {nasaData.averages?.T2M && (
                    <>
                      <div>
                        <p className="font-semibold text-lg mb-4 text-gray-800">
                          Temperature Analysis
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp
                                size={16}
                                className="text-orange-600"
                              />
                              <p className="text-sm text-gray-600">Max Temp</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                              {maxTemp}°C
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-blue-50 to-blue-100 rounded-lg p-4 border border-blue-200">
                            <div className="flex items-center gap-2 mb-1">
                              <Thermometer
                                size={16}
                                className="text-blue-600"
                              />
                              <p className="text-sm text-gray-600">Avg Temp</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                              {avgTemp}°C
                            </p>
                          </div>
                          <div className="bg-gradient-to-br from-cyan-50 to-cyan-100 rounded-lg p-4 border border-cyan-200">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingDown
                                size={16}
                                className="text-cyan-600"
                              />
                              <p className="text-sm text-gray-600">Min Temp</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                              {minTemp}°C
                            </p>
                          </div>
                        </div>
                      </div>

                      {/* Confidence Ranges */}
                      {avgRange && (
                        <div>
                          <p className="font-semibold text-lg mb-4 text-gray-800">
                            68% Confidence Ranges (±1σ)
                          </p>
                          <div className="space-y-3">
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
                                  Max Temperature
                                </span>
                                <span className="text-sm font-bold text-gray-800">
                                  {maxRange?.[0]}°C – {maxRange?.[1]}°C
                                </span>
                              </div>
                              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-orange-400 to-red-500 rounded-full"
                                  style={{ width: "68%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
                                  Avg Temperature
                                </span>
                                <span className="text-sm font-bold text-gray-800">
                                  {avgRange[0]}°C – {avgRange[1]}°C
                                </span>
                              </div>
                              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-blue-400 to-blue-600 rounded-full"
                                  style={{ width: "68%" }}
                                ></div>
                              </div>
                            </div>
                            <div className="bg-gray-50 rounded-lg p-4">
                              <div className="flex justify-between items-center">
                                <span className="text-sm font-medium text-gray-700">
                                  Min Temperature
                                </span>
                                <span className="text-sm font-bold text-gray-800">
                                  {minRange?.[0]}°C – {minRange?.[1]}°C
                                </span>
                              </div>
                              <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-gradient-to-r from-cyan-400 to-blue-500 rounded-full"
                                  style={{ width: "68%" }}
                                ></div>
                              </div>
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Normal Distribution Ranges */}
                      {oneStdAvg && (
                        <div>
                          <p className="font-semibold text-lg mb-4 text-gray-800">
                            Statistical Confidence Intervals
                          </p>
                          <div className="space-y-3">
                            <div className="border border-gray-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                68% Confidence (±1σ)
                              </p>
                              <p className="text-sm text-gray-700">
                                {oneStdAvg[0]}°C – {oneStdAvg[1]}°C
                              </p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                95% Confidence (±2σ)
                              </p>
                              <p className="text-sm text-gray-700">
                                {twoStdAvg[0]}°C – {twoStdAvg[1]}°C
                              </p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                99.7% Confidence (±3σ)
                              </p>
                              <p className="text-sm text-gray-700">
                                {threeStdAvg[0]}°C – {threeStdAvg[1]}
                                °C
                              </p>
                            </div>
                          </div>

                          {/* NormalDist Graph */}
                          {meanAndStdAvg && (
                            <NormalDistributionChart
                              meanAndStd={meanAndStdAvg}
                              label="Avg Tempreture"
                            />
                          )}
                        </div>
                      )}

                      {slopeAndInterceptAvg.intercept != 0 &&
                        slopeAndInterceptAvg.slope != 0 &&
                        prediction && (
                          <PointsLineChart
                            label="Avg tempreture trend over years"
                            points={dataPoints.avg}
                            slopeAndIntercept={slopeAndInterceptAvg}
                          />
                        )}
                      { }
                      {prediction && (
                        <div className="">
                          <HeatMap variable="avgTemp" />{" "}
                          <div className="mb-30"></div>
                        </div>
                      )}
                    </>
                  )}
                  {!nasaData.averages?.T2M && (
                    <div className="text-center py-4 text-gray-500 text-sm">
                      NASA weather data is loading. Please wait...
                    </div>
                  )}
                </motion.div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </>
    );
  } catch (error) {
    console.error("Error in TempVariableCard:", error);
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        <p>Error loading temperature data</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
}
