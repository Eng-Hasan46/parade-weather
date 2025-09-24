import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  LineElement,
  PointElement,
  LinearScale,
  CategoryScale,
  Legend,
  Tooltip,
  Filler
} from "chart.js";

ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler);

export default function DualAxisChart({ data, date, labels }) {
  const hours = useMemo(() => {
    const idxs = [];
    (data?.hourly?.time || []).forEach((t, i) => {
      if (t.startsWith(date)) idxs.push(i);
    });
    const L = idxs.map((i) => (data.hourly.time[i] || "").slice(11, 16));
    return {
      labels: L,
      temp: idxs.map((i) => data.hourly.temperature_2m[i]),
      pop: idxs.map((i) => data.hourly.precipitation_probability[i]),
      uv: idxs.map((i) => data.hourly.uv_index[i]),
    };
  }, [data, date]);

  const ds = {
    labels: hours.labels,
    datasets: [
      // Temperature — cyan line
      {
        label: labels.temp,
        data: hours.temp,
        yAxisID: "y",
        fill: false,
        tension: 0.35,
        borderColor: "#38bdf8",       // sky-400
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 3,
      },
      // Precipitation probability — blue line with soft fill
      {
        label: labels.precip,
        data: hours.pop,
        yAxisID: "y1",
        fill: true,
        tension: 0.35,
        borderColor: "#60a5fa",       // sky-500
        borderWidth: 3,
        backgroundColor: "rgba(96,165,250,0.18)", // soft blue area
        pointRadius: 0,
        pointHoverRadius: 3,
      },
      // UV index — amber dashed line
      {
        label: labels.uv,
        data: hours.uv,
        yAxisID: "y1",
        fill: false,
        tension: 0.35,
        borderColor: "#fbbf24",       // amber-400
        borderDash: [6, 4],
        borderWidth: 3,
        pointRadius: 0,
        pointHoverRadius: 3,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false, // let the card height control the chart
    interaction: { mode: "index", intersect: false },
    plugins: {
      legend: {
        labels: { color: "white" },
      },
      tooltip: {
        backgroundColor: "rgba(8,12,22,0.9)",
        titleColor: "#eaf3ff",
        bodyColor: "#eaf3ff",
        borderColor: "rgba(255,255,255,0.15)",
        borderWidth: 1,
      },
    },
    scales: {
      x: {
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,.08)" },
      },
      y: {
        ticks: { color: "white" },
        grid: { color: "rgba(255,255,255,.08)" },
      },
      y1: {
        position: "right",
        ticks: { color: "white" },
        grid: { drawOnChartArea: false },
      },
    },
  };

  return (
    <div className="card p-5" style={{ height: 360 }}>
      <h3 className="font-semibold text-white mb-2">{labels.hourly}</h3>
      {hours.labels.length ? (
        <Line data={ds} options={options} />
      ) : (
        <div className="text-white/70">No hourly data for this date.</div>
      )}
    </div>
  );
}
