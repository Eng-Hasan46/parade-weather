export async function geocodeCity(q, lang='en'){
  if(!q || q.trim().length<2) return [];
  const url=`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(q)}&count=5&language=${lang}&format=json`;
  const r=await fetch(url); const d=await r.json();
  return (d.results||[]).map(x=>({ name:`${x.name}${x.admin1? ', '+x.admin1:''}${x.country? ', '+x.country:''}`, lat:x.latitude, lon:x.longitude }));
}
export async function getForecast(lat,lon){
  const u=`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&hourly=temperature_2m,apparent_temperature,precipitation_probability,uv_index,wind_speed_10m&daily=temperature_2m_max,temperature_2m_min,uv_index_max,precipitation_probability_max&timezone=auto`;
  const r=await fetch(u); if(!r.ok) throw new Error('Failed to fetch forecast'); return r.json();
}
