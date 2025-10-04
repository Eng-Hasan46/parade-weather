// components/NormalDistributionChart.tsx
"use client";
import React, { useRef } from "react";
import {
  ResponsiveContainer,
  ComposedChart,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Area,
  Line,
  ReferenceDot,
  Label,
} from "recharts";
// import * as htmlToImage from "html-to-image";
// import { Button } from "./ui/button";

// interface NormalDistributionChartProps {
//   label: string; // e.g., "Average Temperature"
//   unit?: string;
//   color?: string;
//   meanAndStd: { mean: number; standardDeviation: number };
// }

// Normal distribution PDF
const pdf = (x, mean, std) => {
  if (std === 0) return x === mean ? 1 : 0;
  return (
    (1 / (std * Math.sqrt(2 * Math.PI))) *
    Math.exp(-((x - mean) ** 2) / (2 * std ** 2))
  );
};

const NormalDistributionChart = ({
  label,
  unit = "",
  color = "#1f77b4",
  meanAndStd,
}) => {
  console.log("meanAndStd: ", meanAndStd);
  const { mean, standardDeviation: std } = meanAndStd;
  const chartRef = useRef();

  // Build data points
  const step = std > 0 ? std / 20 : 1; // or another small value

  const data = [];
  const boundaries = [
    mean - 3 * std,
    mean - 2 * std,
    mean - 1 * std,
    mean,
    mean + 1 * std,
    mean + 2 * std,
    mean + 3 * std,
  ];

  // Generate data
  for (let x = mean - 4 * std; x <= mean + 4 * std; x += step) {
    const y = pdf(x, mean, std);
    data.push({
      x,
      y,
      y68: x >= mean - std && x <= mean + std ? y : null,
      y95: x >= mean - 2 * std && x <= mean + 2 * std ? y : null,
      y997: x >= mean - 3 * std && x <= mean + 3 * std ? y : null,
    });
  }

  // Ensure exact boundary points exist
  for (const b of boundaries) {
    const y = pdf(b, mean, std);
    data.push({
      x: b,
      y,
      y68: b >= mean - std && b <= mean + std ? y : null,
      y95: b >= mean - 2 * std && b <= mean + 2 * std ? y : null,
      y997: b >= mean - 3 * std && b <= mean + 3 * std ? y : null,
    });
  }

  // Sort by x because we just added extra points
  data.sort((a, b) => a.x - b.x);

  // Remove duplicates by x
  const uniqueData = Array.from(
    new Map(data.map((item) => [item.x, item])).values()
  );

  const peak = { x: mean, y: pdf(mean, mean, std) };

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
    link.download = `${label.replace(/\s+/g, "_")}_chart.png`;
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
          paddingBottom: 40,
          background: "white",
        }}
        className="p-10 pt-5"
      >
        <h4>{label}</h4>
        <ResponsiveContainer>
          <ComposedChart data={uniqueData} margin={{ top: 40 }}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis
              dataKey="x"
              type="number"
              domain={[mean - 4 * std, mean + 4 * std]}
              ticks={[
                mean - 3 * std,
                mean - 2 * std,
                mean - 1 * std,
                mean,
                mean + 1 * std,
                mean + 2 * std,
                mean + 3 * std,
              ]}
              tickFormatter={(val) => `${val.toFixed(1)}${unit}`}
            />

            <YAxis hide className="" />
            <Tooltip
              formatter={(value, name) =>
                name === "Likelihood" ? `${Number(value).toFixed(4)}` : null
              }
              labelFormatter={(val) => `${label}: ${val.toFixed(2)}${unit}`}
            />

            {/* Confidence interval shaded areas */}
            <Area
              type="monotone"
              dataKey="y997"
              name="99.7% Confidence"
              fill={color}
              opacity={0.4}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="y95"
              name="95% Confidence"
              fill={color}
              opacity={0.4}
              isAnimationActive={false}
            />
            <Area
              type="monotone"
              dataKey="y68"
              name="68% Confidence"
              fill={color}
              opacity={0.6}
              isAnimationActive={false}
            />

            {/* Main PDF line */}
            <Line
              type="monotone"
              dataKey="y"
              name="Likelihood"
              stroke={color}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />

            {/* Peak marker */}
            <ReferenceDot
              x={peak.x}
              y={peak.y}
              r={4}
              fill={color}
              stroke="none"
            >
              <Label
                value={`${peak.x.toFixed(2)}${unit}`}
                position="top"
                fill={color}
                fontSize={12}
              />
            </ReferenceDot>
          </ComposedChart>
        </ResponsiveContainer>
      </div>

      <button onClick={handleDownload} style={{ marginTop: 8 }}>
        Download Chart
      </button>
    </div>
  );
};

export default NormalDistributionChart;
