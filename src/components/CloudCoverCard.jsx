import PointsLineChart from "./LineChart";
import NormalDistributionChart from "./NormalDistributionChart";
import {
  calculateMeanAndStandardDeviation,
  calculateSlopeAndIntercept,
} from "../lib/graphsHelperFunctions";
import { AnimatePresence, motion } from "framer-motion";
import { Cloud, TrendingUp, X } from "lucide-react";
import HeatMap from "./HeatMap";
import { formatters } from "../lib/formatters";

// Cloud Cover Card

// type CloudCoverCard = {
//   expanded: string | null;
//   setExpanded: React.Dispatch<React.SetStateAction<string | null>>;
//   id: string;
//   dataPoints: { [key: string]: number };
//   prediction: number | undefined;
// };

export default function CloudCoverCard({
  expanded,
  setExpanded,
  id,
  dataPoints,
  prediction,
  nasaData,
  lang,
}) {
  const isOpen = expanded == id;
  const slopeAndIntercept = calculateSlopeAndIntercept(dataPoints);
  const meanAndStd = calculateMeanAndStandardDeviation(dataPoints);
  // Use NASA data for actual cloud cover values instead of prediction slope
  const predictedCloudCover = nasaData.averages?.CLOUD_AMT
    ? Math.round(Math.max(0, nasaData.averages.CLOUD_AMT.average))
    : 0;
  const oneStd = [
    Math.max(0, Math.round(predictedCloudCover - meanAndStd.standardDeviation)),
    Math.max(0, Math.round(predictedCloudCover + meanAndStd.standardDeviation)),
  ];
  const twoStd = [
    Math.max(
      0,
      Math.round(predictedCloudCover - 2 * meanAndStd.standardDeviation)
    ),
    Math.max(
      0,
      Math.round(predictedCloudCover + 2 * meanAndStd.standardDeviation)
    ),
  ];
  const threeStd = [
    Math.max(
      0,
      Math.round(predictedCloudCover - 3 * meanAndStd.standardDeviation)
    ),
    Math.max(
      0,
      Math.round(predictedCloudCover + 3 * meanAndStd.standardDeviation)
    ),
  ];
  const predictionFormatted = formatters.cloud(predictedCloudCover);
  return (
    <>
      <AnimatePresence>
        {!isOpen && (
          // <motion.div
          //   className="relative w-full h-90 rounded-2xl overflow-hidden shadow-lg bg-[url(/air.jpg)] bg-cover cursor-pointer"
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
          //       <div className="rounded-full bg-white/40 p-2 backdrop-blur-sm">
          //         <Cloud size={20} className="text-white" />
          //       </div>
          //       <p className="text-sm uppercase tracking-wide font-semibold">
          //         Cloud Cover
          //       </p>
          //     </div>

          //     <div className="flex flex-col gap-2 mt-8">
          //       <p className="text-5xl font-bold">{predictedCloudCover}%</p>
          //       <p className="text-sm opacity-80">
          //         {predictionFormatted?.text}
          //       </p>
          //     </div>

          //     <div className="mt-auto">
          //       <div className="bg-white/90 rounded-xl p-4 backdrop-blur-sm">
          //         <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
          //           <div
          //             className="bg-gray-600 h-3 rounded-full transition-all duration-500"
          //             style={{ width: `${predictedCloudCover}%` }}
          //           ></div>
          //         </div>
          //         <p className="text-xs text-center opacity-70 text-black">
          //           Sky coverage
          //         </p>
          //       </div>
          //     </div>
          //   </div>
          // </motion.div>
          <motion.div
            onClick={() => setExpanded("cloud")}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-gray-500/20 to-slate-600/10 border border-gray-400/30 hover:border-gray-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-gray-500/25 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                ☁️
              </div>
              <div className="text-gray-200 text-sm font-medium mb-2">
                {lang === "ar" ? "الغطاء السحابي" : "Cloud Cover"}
              </div>
              <div className="text-2xl font-bold text-white">
                {nasaData.averages?.CLOUD_AMT
                  ? `${nasaData.averages.CLOUD_AMT.average.toFixed(1)}%`
                  : "--"}
              </div>
            </div>
          </motion.div>
          // <trigger />
        )}
      </AnimatePresence>
      {/* {isOpen && <div>jsdjadlks</div>} */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-[500] flex items-center justify-center bg-black/40 backdrop-blur-sm"
            onClick={() => setExpanded(null)}
          >
            <motion.div
              layoutId={id}
              className="z-[500] relative w-[1000px] max-w-[90vw] max-h-[90vh] overflow-y-auto bg-white rounded-2xl shadow-2xl"
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
                {/* <X size={20} /> */}
              </button>

              <motion.div
                className="p-8 space-y-6"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
              >
                {/* Current Cloud Cover Analysis */}
                {nasaData.averages?.CLOUD_AMT && (
                  <>
                    <div>
                      <p className="font-semibold text-lg mb-4 text-gray-800">
                        Cloud Cover Analysis
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            {/* <TrendingUp size={16} className="text-orange-600" /> */}
                            <p className="text-sm text-gray-600">
                              Cloud Coverage
                            </p>
                          </div>
                          <p className="text-3xl font-bold text-gray-800">
                            {predictedCloudCover == oneStd[1]
                              ? `${predictedCloudCover} %`
                              : `${predictedCloudCover} - ${oneStd[1]} %`}
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
                          label="Cloud Cover"
                        />
                      </div>
                    }
                  </>
                )}

                {slopeAndIntercept.intercept != 0 &&
                  slopeAndIntercept.slope != 0 &&
                  nasaData.averages?.CLOUD_AMT && (
                    <PointsLineChart
                      label="Avg cloud cover trend over years for the selected date"
                      points={dataPoints}
                      slopeAndIntercept={slopeAndIntercept}
                    />
                  )}

                {nasaData.averages?.CLOUD_AMT && (
                  <div className="">
                    <HeatMap variable="cloudCoverage" />{" "}
                    <div className="mb-30"></div>
                  </div>
                )}

                {!nasaData.averages?.CLOUD_AMT && (
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
