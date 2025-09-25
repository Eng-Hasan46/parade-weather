// src/lib/nasa.js
// NASA POWER hourly precipitation (PRECTOTCORR, mm/hr) and GIBS IMERG overlay helpers

export async function getPowerHourlyPrecip(lat, lon, yyyymmdd) {
  // yyyymmdd like "2025-09-24" or "20250924"
  const d = yyyymmdd.replaceAll("-", "");
  const url =
    `https://power.larc.nasa.gov/api/temporal/hourly/point?parameters=PRECTOTCORR&community=ag&latitude=${lat}&longitude=${lon}&start=${d}&end=${d}&format=JSON`;

  const res = await fetch(url);
  if (!res.ok) throw new Error("POWER API failed");
  const data = await res.json();

  const param = data?.properties?.parameter?.PRECTOTCORR || {};
  // keys like "2025092400".."2025092423" → mm/hr
  const hours = [];
  const values = [];
  Object.keys(param).sort().forEach((k) => {
    const hh = k.slice(-2);
    hours.push(`${hh}:00`);
    values.push(param[k] == null ? null : Number(param[k]));
  });
  return { labels: hours, values }; // mm/hr series for that date
}

/**
 * Build a Leaflet-ready GIBS WMTS tile layer descriptor for IMERG Precipitation Rate (dark-friendly).
 * NOTE: GoogleMapsCompatible_Level9 supports z=0..9. Good for regional context.
 */
export function gibsImergLayerOptions(isoDate /* "YYYY-MM-DD" */) {
  // Subdomains a,b,c improve performance
  const url =
    "https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/" +
    `${isoDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`;
  const attribution =
    'NASA GIBS & GPM IMERG | Map © OpenStreetMap';
  return {
    url,
    options: {
      subdomains: ["a", "b", "c"],
      opacity: 0.7,           // semi-transparent on dark base
      maxZoom: 9,             // Level9 matrix
      tileSize: 256,
      attribution
    }
  };
}
