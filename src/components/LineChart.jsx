// components/PointsLineChart.tsx
"use client";
import React, { useRef } from "react";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
} from "recharts";
// import * as htmlToImage from "html-to-image";
// import { Button } from "./ui/button";

// interface PointsLineChartProps {
//   label?: string;
//   unit?: string;
//   color?: string;
//   points: Record<string, number>;
//   slopeAndIntercept?: { slope: number; intercept: number };
// }

const PointsLineChart = ({
  label = "Observed",
  unit = "",
  color = "#1f77b4",
  points,
  slopeAndIntercept,
}) => {
  const chartRef = useRef();

  // Convert points object -> sorted array
  const data = Object.entries(points)
    .map(([k, v]) => ({ x: Number(k), value: Number(v) }))
    .filter((d) => !isNaN(d.x) && !isNaN(d.value))
    .sort((a, b) => a.x - b.x);

  if (!data.length)
    return <div style={{ padding: 12 }}>No points to display.</div>;

  // Add trend values if provided
  let chartData = data;
  if (slopeAndIntercept) {
    const { slope, intercept } = slopeAndIntercept;
    chartData = data.map((d) => ({ ...d, trend: slope * d.x + intercept }));
  }

  const xMin = Math.min(...data.map((d) => d.x));
  const xMax = Math.max(...data.map((d) => d.x));

  const handleDownload = async () => {
    if (!chartRef.current) return;

    // Hide tooltip temporarily
    const tooltip = chartRef.current.querySelector(".recharts-tooltip-wrapper");
    if (tooltip) tooltip.style.display = "none";

    const dataUrl = await htmlToImage.toPng(chartRef.current, {
      cacheBust: true,
      width: chartRef.current.offsetWidth * 2,
      height: chartRef.current.offsetHeight * 2,
      style: {
        transform: "scale(2)",
        transformOrigin: "top left",
      },
    });

    const link = document.createElement("a");
    link.download = "chart.png";
    link.href = dataUrl;
    link.click();

    if (tooltip) tooltip.style.display = "";
  };

  return (
    <div>
      <div
        ref={chartRef}
        style={{
          width: "100%",
          height: 400,
          paddingBottom: 40, // space for X-axis
          background: "white", // avoid transparent background
        }}
        className="pr-10 pt-10"
      >
        <h4 className="ml-10 ">{label}</h4>
        <ResponsiveContainer>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[xMin, xMax]}
              tickFormatter={(v) => `${v}`}
              label={{
                value: unit ? `Year (${unit})` : "Year",
                position: "insideBottomRight",
                offset: -5,
              }}
            />
            <YAxis
              allowDecimals
              label={{ value: unit || "", angle: -90, position: "insideLeft" }}
            />
            <Tooltip
              formatter={(val, name) =>
                typeof val === "number" ? `${val.toFixed(2)}${unit}` : val
              }
              labelFormatter={(label) => `Year: ${label}`}
            />
            <Legend verticalAlign="top" height={36} />
            <Line
              type="linear"
              dataKey="value"
              name="Observed"
              stroke={color}
              strokeWidth={2}
              dot={{ r: 4 }}
              activeDot={{ r: 6 }}
              isAnimationActive={false}
              connectNulls
            />
            {slopeAndIntercept && (
              <Line
                type="linear"
                dataKey="trend"
                name="Trend"
                stroke="#ff7f0e"
                strokeWidth={2}
                dot={false}
                isAnimationActive={false}
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </div>
      <button onClick={handleDownload} style={{ marginTop: 8 }}>
        Download Chart
      </button>
    </div>
  );
};

export default PointsLineChart;
