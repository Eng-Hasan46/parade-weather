import { useWeatherData } from "../context/dataContext";
import { data } from "framer-motion/client";
import { HeatMapGrid } from "react-grid-heatmap";

// const data = [
//   [123, 98, 110, 95, 80, 70, 65, 85, 120, 140, 100, 90], // 2005
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100], // 2006
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100], // 2006
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100], // 2006
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100], // 2006
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],
//   [130, 95, 120, 100, 85, 75, 70, 90, 125, 150, 110, 100],

//   // more rows...
// ];

const years = ["2005", "2006"];
const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

export default function HeatMap({ variable }) {
  const { weatherData: globalWeatherData } = useWeatherData();
  console.log("glooobal: ", globalWeatherData.CLOUD_AMT);
  let variableData = { 20250101: 0 };
  let color = "0,0,255";
  switch (variable) {
    case "avgTemp":
      variableData = globalWeatherData.T2M;
      color = "200,48,48";
      break;
    case "maxTemp":
      variableData = globalWeatherData.T2M_MAX;
      break;
    case "minTemp":
      variableData = globalWeatherData.T2M_MIN;
      break;
    case "rainFall":
      variableData = globalWeatherData.PRECTOTCORR;
      color = "0,0,255";
      break;
    case "humidity":
      variableData = globalWeatherData.RH2M;
      color = "65,65,65";
      break;
    case "cloudCoverage":
      variableData = globalWeatherData.CLOUD_AMT;
      color = "143, 30, 255";
      break;
    case "windSpeed":
      variableData = globalWeatherData.WS10M;
      color = "0,213,255";
      break;
    case "snowDepth":
      variableData = globalWeatherData.SNODP;
      color = "0,213,255";
      break;
    case "snowFall":
      variableData = globalWeatherData.PRECSNO;
      color = "0,213,255";
      break;
    default:
      variableData = { 20250101: 0 };
  }

  const { data, yearRange: years } = constructHeatmapData(variableData);
  console.log("heatmapdata: ", data);

  return (
    <div className="w-full h-[500px] dark:text-black">
      <HeatMapGrid
        data={data}
        xLabels={months}
        yLabels={years}
        cellStyle={(x, y, ratio) => ({
          background: `rgba(${color}, ${ratio})`,
          fontSize: "12px",
          color: "#000000",
        })}
        cellHeight="14px"

        // cellRender={(value) => value && <span>{value}</span>}
      />
    </div>
  );
}

function constructHeatmapData(variableData) {
  if (!variableData) return { data: [], yearRange: [] };
  const dates = Object.keys(variableData);
  const values = Object.values(variableData);

  let previousYear = new Date(formatDate(dates[0])).getFullYear();
  let previousMonth = new Date(formatDate(dates[0])).getMonth();
  let sum = 0;
  let n = 0;
  let yearArray = [];
  let data = [];
  let minimumValue = 0;
  const maxYear = new Date(formatDate(dates[dates.length - 1])).getFullYear();
  console.log("yeeeeeer: ", maxYear, previousYear);
  const yearRange = Array.from(
    { length: maxYear - previousYear + 1 },
    (_, i) => previousYear + i + ""
  );
  console.log("yeeeeeer: ", yearRange);
  dates.map((objDate, index) => {
    const date = new Date(formatDate(objDate));
    if (date.getFullYear() == previousYear) {
      if (date.getMonth() == previousMonth) {
        if (values[index] < -200) {
          sum += 0;
        } else {
          sum += values[index];
        }
        n++;
      } else {
        const avg = sum / n;
        minimumValue = avg < minimumValue ? avg : minimumValue;
        yearArray.push(avg);
        if (values[index] < -200) {
          sum = 0;
        } else {
          sum = values[index];
        }
        n = 1;
        previousMonth = date.getMonth();
      }
    } else {
      previousYear = date.getFullYear();
      previousMonth = date.getMonth();
      const avg = sum / n;
      minimumValue = avg < minimumValue ? avg : minimumValue;
      yearArray.push(avg);
      data.push(yearArray);
      yearArray = [];
      if (values[index] < -200) {
        sum = 0;
      } else {
        sum = values[index];
      }
      n = 1;
    }
  });
  console.log(yearArray.length);
  const length = yearArray.length;
  if (length > 0) {
    for (let i = 0; i < 12 - length; i++) {
      yearArray.push(minimumValue - 0.5);
    }
    data.push(yearArray);
  }
  return { data, yearRange };
}

function formatDate(date) {
  return `${date.slice(0, 4)}-${date.slice(4, 6)}-${date.slice(6, 8)}`;
}
