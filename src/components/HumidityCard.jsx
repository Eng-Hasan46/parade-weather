"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Droplets, X, TrendingUp } from "lucide-react";
import PointsLineChart from "../components/LineChart";
import NormalDistributionChart from "../components/NormalDistributionChart";
import HeatMap from "./HeatMap";
import {
  calculateMeanAndStandardDeviation,
  calculateSlopeAndIntercept,
} from "../lib/graphsHelperFunctions";

// type HumidityCard = {
//   dewPoint?: number;
//   expanded: string | null;
//   setExpanded: React.Dispatch<React.SetStateAction<string | null>>;
//   id: string;
//   dataPoints: { [key: string]: number };
//   prediction: number | undefined;
// };

export default function HumidityCard({
  dewPoint = 18,
  expanded,
  setExpanded,
  id,
  dataPoints,
  prediction = -1,
  nasaData,
  lang,
}) {
  const isOpen = expanded === id;
  const slopeAndIntercept = calculateSlopeAndIntercept(dataPoints);
  const meanAndStd = calculateMeanAndStandardDeviation(dataPoints);
  // Use NASA data for actual humidity values instead of prediction slope
  const predictedHumidity = nasaData.averages?.RH2M 
    ? Math.round(Math.max(0, nasaData.averages.RH2M.average))
    : 0;

  const oneStd = [
    Math.max(0, Math.round(predictedHumidity - meanAndStd.standardDeviation)),
    Math.max(0, Math.round(predictedHumidity + meanAndStd.standardDeviation)),
  ];
  const twoStd = [
    Math.max(
      0,
      Math.round(predictedHumidity - 2 * meanAndStd.standardDeviation)
    ),
    Math.max(
      0,
      Math.round(predictedHumidity + 2 * meanAndStd.standardDeviation)
    ),
  ];
  const threeStd = [
    Math.max(
      0,
      Math.round(predictedHumidity - 3 * meanAndStd.standardDeviation)
    ),
    Math.max(
      0,
      Math.round(predictedHumidity + 3 * meanAndStd.standardDeviation)
    ),
  ];

  return (
    <>
      {!isOpen && (
        <AnimatePresence>
          {/* <motion.div
            className="relative w-full h-90 rounded-2xl overflow-hidden shadow-lg bg-gradient-to-br from-cyan-400 via-teal-400 to-emerald-500 cursor-pointer"
            layoutId={id}
            onClick={() => setExpanded(id)}
            initial={{ opacity: 0, scale: 1.01 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            whileHover={{ scale: 1.01 }}
          >
            <div className="absolute inset-0 flex flex-col text-white p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                  <Droplets size={20} className="text-white" />
                </div>
                <p className="text-sm uppercase tracking-wide font-semibold">
                  Humidity
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-8">
                <p className="text-5xl font-bold">
                  {predictedHumidity == -1 ? 0 : predictedHumidity} %
                </p>
                <p className="text-sm opacity-90">Relative humidity</p>
              </div>

              <div className="mt-auto">
                <div className="bg-white/90 rounded-xl p-4 text-gray-800 backdrop-blur-sm">
                  <div className="flex justify-between flex-col gap-3">
                    <p className="text-sm font-medium opacity-70">humidity</p>
                    <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                      <div
                        className="bg-gray-600 h-3 rounded-full transition-all duration-500"
                        style={{
                          width: `${
                            predictedHumidity == -1 ? 0 : predictedHumidity
                          }%`,
                        }}
                      ></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div> */}

          <motion.div
            onClick={() => setExpanded("humidity")}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-purple-500/20 to-indigo-600/10 border border-purple-400/30 hover:border-purple-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-purple-500/25 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                💧
              </div>
              <div className="text-purple-200 text-sm font-medium mb-2">
                {lang === "ar" ? "الرطوبة" : "Humidity"}
              </div>
              <div className="text-2xl font-bold text-white">
                {nasaData.averages?.RH2M
                  ? `${nasaData.averages.RH2M.average.toFixed(1)}%`
                  : "--"}
              </div>
            </div>
          </motion.div>
        </AnimatePresence>
      )}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setExpanded(null)}
          >
            <motion.div
              layoutId={id}
              className="relative w-[1000px] max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
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
              <button
                onClick={() => setExpanded(null)}
                className="absolute top-2 left-2 z-30 bg-gradient-to-r from-slate-800 to-slate-900 hover:from-slate-700 hover:to-slate-800 text-white px-3 py-1.5 rounded-full shadow-xl border border-slate-600 hover:border-slate-500 transition-all duration-300 flex items-center gap-1.5 text-xs font-semibold backdrop-blur-md hover:scale-105"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <span>Back</span>
              </button>
              <button
                onClick={() => setExpanded(null)}
                className="absolute top-4 right-4 z-10 rounded-full bg-white/20 p-2 text-white hover:bg-white/30 transition-colors backdrop-blur-sm"
              >
                <X size={20} />
              </button>

              <motion.div
                className="p-8 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Current Predictions */}
                {prediction != -1 && (
                  <>
                    <div>
                      <p className="font-semibold text-lg mb-4 text-gray-800">
                        Current Predictions
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={16} className="text-orange-600" />
                            <p className="text-sm text-gray-600">Humidity</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-800">
                            {predictedHumidity} %
                          </p>
                          <p className="font-bold text-gray-500"></p>
                        </div>
                      </div>
                    </div>

                    {/* Normal Distribution Ranges */}
                    {
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
                              {oneStd[0]} % - {oneStd[1]} %
                            </p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              95% Confidence (±2σ)
                            </p>
                            <p className="text-sm text-gray-700">
                              {twoStd[0]} % - {twoStd[1]} %
                            </p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              99.7% Confidence (±3σ)
                            </p>
                            <p className="text-sm text-gray-700">
                              {threeStd[0]} % - {threeStd[1]} %
                            </p>
                          </div>
                        </div>

                        {/* NormalDist Graph */}
                        <NormalDistributionChart
                          meanAndStd={meanAndStd}
                          label="Humidity"
                        />
                      </div>
                    }
                  </>
                )}

                {slopeAndIntercept.intercept != 0 &&
                  slopeAndIntercept.slope != 0 &&
                  nasaData.averages?.RH2M && (
                    <PointsLineChart
                      label="Avg humidity trend over years for the selected date"
                      points={dataPoints}
                      slopeAndIntercept={slopeAndIntercept}
                    />
                  )}

                {prediction != -1 && (
                  <div className="">
                    <HeatMap variable="humidity" />
                    <div className="mb-30"></div>
                  </div>
                )}

                {!nasaData.averages?.RH2M && (
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
}
