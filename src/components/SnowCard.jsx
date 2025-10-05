"use client";
import { motion, AnimatePresence } from "framer-motion";
import { Snowflake, X, TrendingUp, Layers } from "lucide-react";
import PointsLineChart from "../components/LineChart";
import NormalDistributionChart from "../components/NormalDistributionChart";
import HeatMap from "./HeatMap";
import {
  calculateMeanAndStandardDeviation,
  calculateSlopeAndIntercept,
} from "../lib/graphsHelperFunctions";

// interface SnowVariableCardProps {
//   id: string;
//   expanded: string | null;
//   setExpanded: any;
//   prediction?: {
//     snowfall: number | undefined,
//     snowDepth: number | undefined,
//   };
//   dataPoints: {
//     snowfall: { [key: string]: number },
//     snowDepth: { [key: string]: number },
//   };
// }

export default function SnowCard({
  id,
  expanded,
  setExpanded,
  prediction,
  dataPoints,
  lang,
  nasaData,
}) {
  console.log("snow: ", dataPoints);
  console.log("deeepth: ", prediction);
  const slopeAndInterceptSnowfall = calculateSlopeAndIntercept(
    dataPoints.snowfall
  );
  const slopeAndInterceptSnowDepth = calculateSlopeAndIntercept(
    dataPoints.snowDepth
  );
  const meanAndStdSnowfall = calculateMeanAndStandardDeviation(
    dataPoints.snowfall
  );
  const meanAndStdSnowDepth = calculateMeanAndStandardDeviation(
    dataPoints.snowDepth
  );

  const isOpen = expanded === id;
  const snowfall = prediction?.snowfall ? Math.round(prediction?.snowfall) : 0;
  const snowDepth = prediction?.snowDepth
    ? Math.round(prediction?.snowDepth)
    : 0;

  // Calculate confidence ranges for snowfall
  const oneStdSnowfall = [
    Math.max(0, Math.round(snowfall - meanAndStdSnowfall.standardDeviation)),
    Math.round(snowfall + meanAndStdSnowfall.standardDeviation),
  ];
  const twoStdSnowfall = [
    Math.max(
      0,
      Math.round(snowfall - 2 * meanAndStdSnowfall.standardDeviation)
    ),
    Math.round(snowfall + 2 * meanAndStdSnowfall.standardDeviation),
  ];
  const threeStdSnowfall = [
    Math.max(
      0,
      Math.round(snowfall - 3 * meanAndStdSnowfall.standardDeviation)
    ),
    Math.round(snowfall + 3 * meanAndStdSnowfall.standardDeviation),
  ];

  // Calculate confidence ranges for snow depth
  const oneStdSnowDepth = [
    Math.max(0, Math.round(snowDepth - meanAndStdSnowDepth.standardDeviation)),
    Math.round(snowDepth + meanAndStdSnowDepth.standardDeviation),
  ];
  const twoStdSnowDepth = [
    Math.max(
      0,
      Math.round(snowDepth - 2 * meanAndStdSnowDepth.standardDeviation)
    ),
    Math.round(snowDepth + 2 * meanAndStdSnowDepth.standardDeviation),
  ];
  const threeStdSnowDepth = [
    Math.max(
      0,
      Math.round(snowDepth - 3 * meanAndStdSnowDepth.standardDeviation)
    ),
    Math.round(snowDepth + 3 * meanAndStdSnowDepth.standardDeviation),
  ];

  console.log("deeepth, ", meanAndStdSnowDepth);
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
          //   <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-cyan-300 to-blue-200">
          //     <div className="absolute inset-0 bg-white/10"></div>
          //   </div>
          //   <div className="relative z-10 p-6 text-white">
          //     <div className="flex items-center gap-2">
          //       <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
          //         <Snowflake size={20} />
          //       </div>
          //       <p className="text-sm font-semibold uppercase">Snow</p>
          //     </div>
          //     <div className="mt-6 flex items-end gap-3">
          //       <div>
          //         <p className="text-4xl font-bold">{snowfall} mm</p>
          //         <p className="text-xs opacity-80">snowfall</p>
          //       </div>
          //       <div className="pb-1">
          //         <p className="text-2xl font-semibold">{snowDepth} cm</p>
          //         <p className="text-xs opacity-80">snow depth</p>
          //       </div>
          //     </div>
          //   </div>
          // </motion.div>
          <motion.div
            onClick={() => setExpanded("snow")}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-cyan-500/20 to-blue-600/10 border border-cyan-400/30 hover:border-cyan-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-cyan-500/25 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                ❄️
              </div>
              <div className="text-cyan-200 text-sm font-medium mb-2">
                {lang === "ar" ? "الثلوج" : "Snow"}
              </div>
              <div className="text-2xl font-bold text-white">
                {nasaData.averages?.PRECTOTCORR && nasaData.averages?.T2M
                  ? `${nasaData.averages.T2M.average < 0
                    ? (nasaData.averages.PRECTOTCORR.average * 10).toFixed(1)
                    : "0.0"} mm`
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
                {prediction?.snowDepth != undefined && (
                  <>
                    <div>
                      <p className="font-semibold text-lg mb-4 text-gray-800">
                        Current Predictions
                      </p>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="bg-gradient-to-br from-blue-50 to-cyan-100 rounded-lg p-4 border border-blue-200">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={16} className="text-blue-600" />
                            <p className="text-sm text-gray-600">Snowfall</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-800">
                            {snowfall} mm
                          </p>
                        </div>
                        <div className="bg-gradient-to-br from-cyan-50 to-blue-100 rounded-lg p-4 border border-cyan-200">
                          <div className="flex items-center gap-2 mb-1">
                            <Layers size={16} className="text-cyan-600" />
                            <p className="text-sm text-gray-600">Snow Depth</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-800">
                            {snowDepth} cm
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Snowfall Confidence Ranges */}
                    <div>
                      <p className="font-semibold text-lg mb-4 text-gray-800">
                        Snowfall - 68% Confidence Range (±1σ)
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Expected Range
                          </span>
                          <span className="text-sm font-bold text-gray-800">
                            {oneStdSnowfall[0]} mm – {oneStdSnowfall[1]} mm
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-blue-400 to-cyan-500 rounded-full"
                            style={{ width: "68%" }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Snow Depth Confidence Ranges */}
                    <div>
                      <p className="font-semibold text-lg mb-4 text-gray-800">
                        Snow Depth - 68% Confidence Range (±1σ)
                      </p>
                      <div className="bg-gray-50 rounded-lg p-4">
                        <div className="flex justify-between items-center">
                          <span className="text-sm font-medium text-gray-700">
                            Expected Range
                          </span>
                          <span className="text-sm font-bold text-gray-800">
                            {oneStdSnowDepth[0]} cm – {oneStdSnowDepth[1]} cm
                          </span>
                        </div>
                        <div className="mt-2 h-2 bg-gray-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-cyan-400 to-blue-600 rounded-full"
                            style={{ width: "68%" }}
                          ></div>
                        </div>
                      </div>
                    </div>

                    {/* Snowfall Statistical Confidence Intervals */}
                    <div>
                      <p className="font-semibold text-lg mb-4 text-gray-800">
                        Snowfall - Statistical Confidence Intervals
                      </p>
                      <div className="space-y-3">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            68% Confidence (±1σ)
                          </p>
                          <p className="text-sm text-gray-700">
                            {oneStdSnowfall[0]} mm – {oneStdSnowfall[1]} mm
                          </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            95% Confidence (±2σ)
                          </p>
                          <p className="text-sm text-gray-700">
                            {twoStdSnowfall[0]} mm – {twoStdSnowfall[1]} mm
                          </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            99.7% Confidence (±3σ)
                          </p>
                          <p className="text-sm text-gray-700">
                            {threeStdSnowfall[0]} mm – {threeStdSnowfall[1]} mm
                          </p>
                        </div>
                      </div>

                      {slopeAndInterceptSnowfall.intercept !== 0 &&
                        slopeAndInterceptSnowfall.slope !== 0 && (
                          <PointsLineChart
                            label="Snowfall trend over years for the selected date"
                            points={dataPoints.snowfall}
                            slopeAndIntercept={slopeAndInterceptSnowfall}
                          />
                        )}

                      {/* Snowfall Normal Distribution Chart */}
                      {meanAndStdSnowfall.mean != 0 &&
                        meanAndStdSnowfall.standardDeviation != 0 && (
                          <NormalDistributionChart
                            meanAndStd={meanAndStdSnowfall}
                            label="Snowfall (mm)"
                          />
                        )}
                    </div>

                    {/* Add info section about charts */}
                    {nasaData.averages.T2M.average < 5 &&
                      (!dataPoints.snowfall && !dataPoints.snowDepth) && (
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 text-center">
                          <h4 className="text-sm font-semibold text-blue-800 mb-1">Historical Trend Data</h4>
                          <p className="text-xs text-blue-600">
                            Charts will appear here when historical snow data becomes available for trend analysis.
                          </p>
                        </div>
                      )}

                    <div className="space-y-[200px]">
                      <HeatMap variable="snowFall" />
                      <div className="mb-30"></div>
                    </div>
                    {/* <div className="mt-[100]">f</div> */}
                    {/* Snow Depth Statistical Confidence Intervals */}
                    <div className="">
                      <p className="font-semibold text-lg mb-4 text-gray-800">
                        Snow Depth - Statistical Confidence Intervals
                      </p>
                      <div className="space-y-3">
                        <div className="border border-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            68% Confidence (±1σ)
                          </p>
                          <p className="text-sm text-gray-700">
                            {oneStdSnowDepth[0]} cm – {oneStdSnowDepth[1]} cm
                          </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            95% Confidence (±2σ)
                          </p>
                          <p className="text-sm text-gray-700">
                            {twoStdSnowDepth[0]} cm – {twoStdSnowDepth[1]} cm
                          </p>
                        </div>
                        <div className="border border-gray-200 rounded-lg p-4">
                          <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                            99.7% Confidence (±3σ)
                          </p>
                          <p className="text-sm text-gray-700">
                            {threeStdSnowDepth[0]} cm – {threeStdSnowDepth[1]}{" "}
                            cm
                          </p>
                        </div>
                      </div>

                      {/* Snow Depth Normal Distribution Chart */}
                      {meanAndStdSnowDepth.mean != 0 &&
                        meanAndStdSnowDepth.standardDeviation != 0 && (
                          <NormalDistributionChart
                            meanAndStd={meanAndStdSnowDepth}
                            label="Snow Depth (cm)"
                          />
                        )}
                    </div>

                    {/* Trend Charts */}

                    {slopeAndInterceptSnowDepth.intercept !== 0 &&
                      slopeAndInterceptSnowDepth.slope !== 0 && (
                        <PointsLineChart
                          label="Snow depth trend over years for the selected date"
                          points={dataPoints.snowDepth}
                          slopeAndIntercept={slopeAndInterceptSnowDepth}
                        />
                      )}

                    {/* Heat Maps */}
                    <div className="">
                      <HeatMap variable="snowDepth" />
                      <div className="mb-30"></div>
                    </div>
                  </>
                )}


              </motion.div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
