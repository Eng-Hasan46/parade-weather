import { useMemo } from "react";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler } from "chart.js";
ChartJS.register(LineElement, PointElement, LinearScale, CategoryScale, Legend, Tooltip, Filler);

export default function DualAxisChart({ data, date, labels }){
  const hours = useMemo(()=>{
    const idxs=[]; (data?.hourly?.time||[]).forEach((t,i)=>{ if(t.startsWith(date)) idxs.push(i); });
    const L = idxs.map(i => (data.hourly.time[i]||'').slice(11,16));
    return { labels:L,
      temp: idxs.map(i=>data.hourly.temperature_2m[i]),
      pop:  idxs.map(i=>data.hourly.precipitation_probability[i]),
      uv:   idxs.map(i=>data.hourly.uv_index[i]) };
  }, [data, date]);

  const ds = {
    labels: hours.labels,
    datasets: [
      { label: labels.temp, data: hours.temp, yAxisID:'y', fill:false, tension:.35 },
      { label: labels.precip, data: hours.pop, yAxisID:'y1', fill:true, backgroundColor:"rgba(14,165,233,.25)", tension:.35 },
      { label: labels.uv, data: hours.uv, yAxisID:'y1', borderDash:[4,4], tension:.35 }
    ]
  };

  const options = {
    responsive:true,
    interaction:{ mode:'index', intersect:false },
    plugins:{ legend:{ labels:{ color:'white' } } },
    scales:{
      x:{ ticks:{ color:'white' }, grid:{ color:'rgba(255,255,255,.1)' } },
      y:{ ticks:{ color:'white' }, grid:{ color:'rgba(255,255,255,.1)' } },
      y1:{ position:'right', ticks:{ color:'white' }, grid:{ drawOnChartArea:false } }
    }
  };

  return (
    <div className="card p-5">
      <h3 className="font-semibold text-white mb-2">{labels.hourly}</h3>
      {hours.labels.length ? <Line data={ds} options={options}/> : <div className="text-white/70">No hourly data for this date.</div>}
    </div>
  );
}
