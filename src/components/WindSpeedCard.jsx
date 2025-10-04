import PointsLineChart from "./LineChart";
import NormalDistributionChart from "./NormalDistributionChart";
import {
  calculateMeanAndStandardDeviation,
  calculateSlopeAndIntercept,
} from "../lib/graphsHelperFunctions";
import { AnimatePresence, motion } from "framer-motion";
import { TrendingUp, Wind, X } from "lucide-react";
import HeatMap from "./HeatMap";
import { formatters } from "../lib/formatters";

// type WindSpeedCard = {
//   speed?: 15;
//   direction?: "NE";
//   gust?: 22;
//   expanded: string | null;
//   setExpanded: React.Dispatch<React.SetStateAction<string | null>>;
//   id: string;
//   dataPoints: { [key: string]: number };
//   prediction: number | undefined;
// };
export default function WindSpeedCard({
  speed = 15,
  direction = "NE",
  gust = 22,
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
  const predictedWindSpeed = prediction
    ? Math.round(Math.max(0, prediction))
    : 0;

  console.log("SPEEED", predictedWindSpeed, meanAndStd.standardDeviation);
  const oneStd = [
    Math.max(0, Math.round(predictedWindSpeed - meanAndStd.standardDeviation)),
    Math.max(0, Math.round(predictedWindSpeed + meanAndStd.standardDeviation)),
  ];
  const twoStd = [
    Math.max(
      0,
      Math.round(predictedWindSpeed - 2 * meanAndStd.standardDeviation)
    ),
    Math.max(
      0,
      Math.round(predictedWindSpeed + 2 * meanAndStd.standardDeviation)
    ),
  ];
  const threeStd = [
    Math.max(
      0,
      Math.round(predictedWindSpeed - 3 * meanAndStd.standardDeviation)
    ),
    Math.max(
      0,
      Math.round(predictedWindSpeed + 3 * meanAndStd.standardDeviation)
    ),
  ];
  const predictionFormatted = formatters.wind(predictedWindSpeed, oneStd[1]);
  return (
    <>
      {!isOpen && (
        <AnimatePresence>
          {/* <motion.div
            className="relative w-full h-90 rounded-2xl overflow-hidden shadow-lg bg-[url(/emptySky.png)] bg-cover cursor-pointer"
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
            <div className="absolute inset-0 bg-black/20"></div>
            <div className="absolute inset-0 flex flex-col text-white p-6">
              <div className="flex items-center gap-2">
                <div className="rounded-full bg-white/20 p-2 backdrop-blur-sm">
                  <Wind size={20} className="text-white" />
                </div>
                <p className="text-sm uppercase tracking-wide font-semibold">
                  Wind Speed
                </p>
              </div>

              <div className="flex flex-col gap-2 mt-8">
                <div className="flex items-baseline gap-2">
                  <p className="text-5xl font-bold">
                    {" "}
                    {predictedWindSpeed == oneStd[1]
                      ? `${predictedWindSpeed}`
                      : `${predictedWindSpeed} - ${oneStd[1]}`}
                  </p>
                  <p className="text-2xl font-semibold">km/h</p>
                </div>
                <p className="text-sm opacity-90">
                  {" "}
                  {predictionFormatted?.text}
                </p>
              </div>

          
            </div>
          </motion.div> */}
          <motion.div
            onClick={() => setExpanded("wind")}
            className="group relative p-6 rounded-2xl bg-gradient-to-br from-green-500/20 to-emerald-600/10 border border-green-400/30 hover:border-green-300/50 transition-all duration-300 hover:shadow-lg hover:shadow-green-500/25 backdrop-blur-sm"
          >
            <div className="text-center">
              <div className="text-4xl mb-3 group-hover:scale-110 transition-transform duration-300">
                💨
              </div>
              <div className="text-green-200 text-sm font-medium mb-2">
                {lang === "ar" ? "سرعة الرياح" : "Wind Speed"}
              </div>
              <div className="text-2xl font-bold text-white">
                {predictedWindSpeed} m/s
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
                {prediction && (
                  <>
                    <div>
                      <p className="font-semibold text-lg mb-4 text-gray-800">
                        Current Predictions
                      </p>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg p-4 border border-orange-200">
                          <div className="flex items-center gap-2 mb-1">
                            <TrendingUp size={16} className="text-orange-600" />
                            <p className="text-sm text-gray-600">Wind Speed</p>
                          </div>
                          <p className="text-3xl font-bold text-gray-800">
                            {predictedWindSpeed == oneStd[1]
                              ? `${predictedWindSpeed} km/h`
                              : `${predictedWindSpeed} - ${oneStd[1]} m/s`}
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
                              {oneStd[0]} m/s - {oneStd[1]} m/s
                            </p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              95% Confidence (±2σ)
                            </p>
                            <p className="text-sm text-gray-700">
                              {twoStd[0]} m/s - {twoStd[1]} m/s
                            </p>
                          </div>
                          <div className="border border-gray-200 rounded-lg p-4">
                            <p className="text-xs font-semibold text-gray-500 uppercase mb-2">
                              99.7% Confidence (±3σ)
                            </p>
                            <p className="text-sm text-gray-700">
                              {threeStd[0]} m/s - {threeStd[1]} m/s
                            </p>
                          </div>
                        </div>

                        {/* NormalDist Graph */}
                        <NormalDistributionChart
                          meanAndStd={meanAndStd}
                          label="Wind Speed"
                        />
                      </div>
                    }
                  </>
                )}

                {slopeAndIntercept.intercept != 0 &&
                  slopeAndIntercept.slope != 0 &&
                  prediction && (
                    <PointsLineChart
                      label="Avg wind speed trend over years for the selected date"
                      points={dataPoints}
                      slopeAndIntercept={slopeAndIntercept}
                    />
                  )}
                {}
                {prediction && (
                  <div className="">
                    <HeatMap variable="windSpeed" />{" "}
                    <div className="mb-30"></div>
                  </div>
                )}

                {!prediction && (
                  <div className="text-center py-4 text-gray-500 text-sm">
                    No prediction data available. Click "Predict" to generate
                    forecast.
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
