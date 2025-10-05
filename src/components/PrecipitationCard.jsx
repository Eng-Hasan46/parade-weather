import PointsLineChart from "./LineChart";
import NormalDistributionChart from "./NormalDistributionChart";
import {
  calculateMeanAndStandardDeviation,
  calculateSlopeAndIntercept,
} from "../lib/graphsHelperFunctions";
import { AnimatePresence, motion } from "framer-motion";
import {
  Droplets,
  Thermometer,
  TrendingDown,
  TrendingUp,
  X,
} from "lucide-react";

import HeatMap from "./HeatMap";
import { formatters } from "../lib/formatters";

// type PrecipitationCard = {
//   expanded: string | null,
//   setExpanded: React.Dispatch<SetStateAction<string | null>>,
//   id: string,
//   dataPoints: { [key: string]: number },
//   prediction: number | undefined,
// };
export default function PrecipitationCard({
  expanded,
  setExpanded,
  id,
  dataPoints,
  prediction,
  nasaData,
  lang,
}) {
  console.log("PrecipitationCard - dataPoints:", dataPoints);
  console.log("PrecipitationCard - prediction:", prediction);
  console.log("PrecipitationCard - expanded:", expanded);
  console.log("PrecipitationCard - id:", id);

  try {
    const isOpen = expanded == id;
    const slopeAndIntercept = calculateSlopeAndIntercept(dataPoints);
    const meanAndStd = calculateMeanAndStandardDeviation(dataPoints);
    // Use NASA data for actual precipitation values instead of prediction slope
    const predictedRainfall = nasaData.averages?.PRECTOTCORR
      ? Math.round(Math.max(0, nasaData.averages.PRECTOTCORR.average))
      : 0;

    const oneStd = [
      Math.max(0, Math.round(predictedRainfall - meanAndStd.standardDeviation)),
      Math.max(0, Math.round(predictedRainfall + meanAndStd.standardDeviation)),
    ];
    const twoStd = [
      Math.max(
        0,
        Math.round(predictedRainfall - 2 * meanAndStd.standardDeviation)
      ),
      Math.max(
        0,
        Math.round(predictedRainfall + 2 * meanAndStd.standardDeviation)
      ),
    ];
    const threeStd = [
      Math.max(
        0,
        Math.round(predictedRainfall - 3 * meanAndStd.standardDeviation)
      ),
      Math.max(
        0,
        Math.round(predictedRainfall + 3 * meanAndStd.standardDeviation)
      ),
    ];
    const predictionFormatted = formatters.rainfall(
      predictedRainfall,
      oneStd[1]
    );

    return (
      <>
        <AnimatePresence>
          {!isOpen && (
            // <motion.div
            //   className="relative w-full h-90 rounded-2xl overflow-hidden shadow-lg bg-lime-300 bg-[repeating-linear-gradient(120deg,rgba(255,255,255,0.2)_0px,rgba(255,255,255,0.2)_3px,transparent_2px,transparent_20px)] hover:cursor-pointer "
            //   layoutId={id}
            //   onClick={() => setExpanded(id)}
            //   initial={{ opacity: 0, scale: 1.01 }}
            //   animate={{ opacity: 1, scale: 1 }}
            //   exit={{ opacity: 0, scale: 0.9 }}
            //   transition={{
            //     type: "spring",
            //     stiffness: 300,
            //     damping: 30,
            //   }}
            //   whileHover={{ scale: 1.01 }}
            // >
            //   <div className="absolute inset-0 bg-black/20"></div>
            //   <div className="absolute inset-0 flex flex-col text-white p-6">
            //     <div className="flex items-center gap-2">
            //       <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
            //         <Droplets size={20} className="text-white" />
            //       </div>
            //       <p className="text-sm uppercase tracking-wide font-semibold">
            //         Precipitation
            //       </p>
            //     </div>

            //     <div className="flex flex-col gap-2 mt-8">
            //       <p className="text-5xl font-bold">
            //         {predictedRainfall == oneStd[1]
            //           ? `${predictedRainfall} mm`
            //           : `${predictedRainfall} - ${oneStd[1]} mm`}
            //       </p>
            //       <p className="text-sm opacity-90">{predictionFormatted.text}</p>
            //     </div>

            //     <div className="mt-auto">
            //       <div className="bg-white/90 rounded-xl p-4 text-gray-800 backdrop-blur-sm">
            //         <div className="flex justify-between items-center mb-2">
            //           <p className="text-sm font-medium opacity-70">
            //             Probability
            //           </p>
            //           <p className="text-xl font-bold">65%</p>
            //         </div>
            //         <div className="w-full bg-gray-200 rounded-full h-2">
            //           <div
            //             className="bg-blue-600 h-2 rounded-full transition-all duration-500"
            //             style={{ width: `65%` }}
            //           ></div>
            //         </div>
            //       </div>
            //     </div>
            //   </div>
            // </motion.div>
            <motion.div
              onClick={() => setExpanded(id)}
              className="group relative p-6 rounded-2xl bg-gradient-to-br from-blue-500/20 to-blue-600/10 border border-blue-400/30 hover:border-blue-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-blue-500/25 backdrop-blur-sm"
            >
              <div className="text-center">
                <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                  🌧️
                </div>
                <div className="text-blue-200 text-sm font-medium mb-2">
                  {lang === "ar" ? "الأمطار" : "Rainfall"}
                </div>
                <div className="text-2xl font-bold text-white">
                  {nasaData.averages?.RAIN_PROBABILITY_TODAY
                    ? `${nasaData.averages.RAIN_PROBABILITY_TODAY.average.toFixed(
                      1
                    )}%`
                    : "--"}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
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
                className="relative w-[1000px] max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl  pb-40"
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
                </button>                <motion.div
                  className="p-8 space-y-6"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {/* Current Precipitation Analysis */}
                  {nasaData.averages?.PRECTOTCORR && (
                    <>
                      <div>
                        <p className="font-semibold text-lg mb-4 text-gray-800">
                          Rainfall Analysis
                        </p>
                        <div className="grid grid-cols-3 gap-4">
                          <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                            <div className="flex items-center gap-2 mb-1">
                              <TrendingUp
                                size={16}
                                className="text-orange-600"
                              />
                              <p className="text-sm text-gray-600">Rain Fall</p>
                            </div>
                            <p className="text-3xl font-bold text-gray-800">
                              {predictedRainfall == oneStd[1]
                                ? `${predictedRainfall} mm`
                                : `${predictedRainfall} - ${oneStd[1]} mm`}
                            </p>
                            <p className="font-bold text-gray-500">
                              {predictionFormatted.text}
                            </p>
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
                                {oneStd[0]} mm - {oneStd[1]} mm
                              </p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                95% Confidence (±2σ)
                              </p>
                              <p className="text-sm text-gray-700">
                                {twoStd[0]} mm - {twoStd[1]} mm
                              </p>
                            </div>
                            <div className="border border-gray-200 rounded-lg p-4">
                              <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                                99.7% Confidence (±3σ)
                              </p>
                              <p className="text-sm text-gray-700">
                                {threeStd[0]} mm - {threeStd[1]} mm
                              </p>
                            </div>
                          </div>

                          {/* NormalDist Graph */}
                          <NormalDistributionChart
                            meanAndStd={meanAndStd}
                            label="Rain Fall"
                          />
                        </div>
                      }
                    </>
                  )}

                  {slopeAndIntercept.intercept != 0 &&
                    slopeAndIntercept.slope != 0 &&
                    prediction && (
                      <PointsLineChart
                        label="Avg rainfall trend over years for the selected date"
                        points={dataPoints}
                        slopeAndIntercept={slopeAndIntercept}
                      />
                    )}
                  { }
                  {prediction && (
                    <div className="">
                      <HeatMap variable="rainFall" />{" "}
                      <div className="mb-30"></div>
                    </div>
                  )}

                  {!nasaData.averages?.PRECTOTCORR && (
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
    console.error("Error in PrecipitationCard:", error);
    return (
      <div className="p-4 bg-red-100 text-red-800 rounded-lg">
        <p>Error loading precipitation data</p>
        <p className="text-sm">{error.message}</p>
      </div>
    );
  }
}
