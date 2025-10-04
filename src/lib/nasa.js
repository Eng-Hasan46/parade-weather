// src/lib/nasa.js
// NASA POWER hourly precipitation (PRECTOTCORR, mm/hr) + GIBS IMERG helpers

// --- utils ---
function ymd(isoLike) {
  // accepts "YYYY-MM-DD" or "YYYYMMDD"
  return isoLike.includes("-") ? isoLike.replaceAll("-", "") : isoLike;
}
function withTimeout(ms) {
  const ctrl = new AbortController();
  const id = setTimeout(() => ctrl.abort(), ms);
  return { signal: ctrl.signal, done: () => clearTimeout(id) };
}

/**
 * Fetch hourly precipitation (mm/hr) from NASA POWER for a specific date and point.
 * @returns {Promise<{labels:string[], values:(number|null)[]}>}
 */
export async function getPowerHourlyPrecip(lat, lon, yyyymmdd) {
  const d = ymd(yyyymmdd);
  const url =
    `https://power.larc.nasa.gov/api/temporal/hourly/point` +
    `?parameters=PRECTOTCORR&community=ag&latitude=${lat}&longitude=${lon}` +
    `&start=${d}&end=${d}&format=JSON`;

  const t = withTimeout(12000); // 12s safety timeout
  let res;
  try {
    res = await fetch(url, { signal: t.signal });
  } finally {
    t.done();
  }
  if (!res || !res.ok) throw new Error("POWER API failed");

  const data = await res.json();
  const param = data?.properties?.parameter?.PRECTOTCORR || {};

  // keys like "2025092400".."2025092423" → mm/hr
  const keys = Object.keys(param).sort();            // 24 hourly keys if available
  const labels = keys.map(k => `${k.slice(-2)}:00`); // "HH:00"
  const values = keys.map(k => (param[k] == null ? null : Number(param[k])));

  return { labels, values };
}

/**
 * Convenience: sum a day's POWER precipitation in mm (assumes 1h timestep).
 * Nulls are treated as 0 to avoid breaking sums if a few hours are missing.
 */
export function sumPowerDailyMm(values = []) {
  return values.reduce((acc, v) => acc + (Number.isFinite(v) ? v : 0), 0);
}

/**
 * Build a Leaflet-ready GIBS WMTS tile layer descriptor for IMERG Precipitation Rate.
 * NOTE: GoogleMapsCompatible_Level9 supports z=0..9 (regional context).
 */
export function gibsImergLayerOptions(isoDate /* "YYYY-MM-DD" */, opacity = 0.7) {
  // Subdomains a,b,c improve performance
  const url =
    "https://gibs-{s}.earthdata.nasa.gov/wmts/epsg3857/best/IMERG_Precipitation_Rate/default/" +
    `${isoDate}/GoogleMapsCompatible_Level9/{z}/{y}/{x}.png`;
  const attribution = 'NASA GIBS & GPM IMERG | Map © OpenStreetMap';

  return {
    url,
    options: {
      subdomains: ["a", "b", "c"],
      opacity,
      maxZoom: 9,
      tileSize: 256,
      attribution
    }
  };
}

/**
 * If you ever need today's date in UTC for IMERG tiles (YYYY-MM-DD).
 */
export function todayUtcIso() {
  const d = new Date();
  const y = d.getUTCFullYear();
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}
