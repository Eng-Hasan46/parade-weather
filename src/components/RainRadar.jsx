// src/components/RainRadar.jsx
import { useEffect, useMemo, useRef, useState } from "react";
import { MapContainer, TileLayer } from "react-leaflet";
import "leaflet/dist/leaflet.css";

/**
 * Live rain overlay with two sources:
 * 1) RainViewer animated radar (preferred)
 * 2) NASA GIBS GPM IMERG (colorized) fallback (~30–60 min latency)
 */
export default function RainRadar({
  center = [26.07, 50.55], // near Bahrain to match your use case
  zoom = 5,
  opacity = 0.85,
  className = "",
  height = "70vh",
}) {
  const [frames, setFrames] = useState([]);     // RainViewer frames
  const [idx, setIdx] = useState(0);
  const [playing, setPlaying] = useState(true);
  const [ovOpacity, setOvOpacity] = useState(opacity);
  const [useGIBS, setUseGIBS] = useState(false); // fallback toggle
  const mounted = useRef(false);

  const isBrowser = typeof window !== "undefined";
  if (!isBrowser) return null;

  // Fetch RainViewer frames
  useEffect(() => {
    mounted.current = true;
    (async () => {
      try {
        const r = await fetch("https://tilecache.rainviewer.com/api/maps.json", { cache: "no-store" });
        const json = await r.json();
        const all = [
          ...(json?.radar?.past || []),
          ...(json?.radar?.nowcast || []),
        ];
        if (!mounted.current) return;
        setFrames(all);
        setIdx(Math.max(0, all.length - 1));
        setUseGIBS(all.length === 0); // if nothing, go GIBS
      } catch (e) {
        console.warn("RainViewer frames fetch failed", e);
        if (mounted.current) setUseGIBS(true);
      }
    })();
    return () => { mounted.current = false; };
  }, []);

  // Animate RainViewer
  useEffect(() => {
    if (!playing || frames.length === 0) return;
    const id = setInterval(() => setIdx(i => (i + 1) % frames.length), 800);
    return () => clearInterval(id);
  }, [playing, frames.length]);

  const current = frames[idx];

  const timestampLabel = useMemo(() => {
    if (useGIBS) {
      const t = gibsTime();
      return new Date(t).toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
    }
    if (!current?.time) return "";
    const d = new Date(current.time * 1000);
    return d.toLocaleString(undefined, { hour: "2-digit", minute: "2-digit", day: "2-digit", month: "short" });
  }, [current, useGIBS]);

  // ===== RainViewer tile URL (bright color scheme) =====
  // path: .../256/{z}/{x}/{y}/{color}/1_1.png  (color 3 is vivid)
  const rvUrl = current
    ? `https://tilecache.rainviewer.com/v2/radar/${current.path}/256/{z}/{x}/{y}/3/1_1.png`
    : null;

  // ===== NASA GIBS IMERG (Colorized) WMTS URL =====
  // Uses "best" endpoint; colorized precipitation rate layer
  const gibsUrl = `https://gibs.earthdata.nasa.gov/wmts/epsg3857/best/wmts.cgi?` +
    `SERVICE=WMTS&REQUEST=GetTile&VERSION=1.0.0` +
    `&LAYER=GPM_IMERG_Precipitation_Rate&STYLE=default` +
    `&TILEMATRIXSET=GoogleMapsCompatible_Level&FORMAT=image/png` +
    `&TIME=${encodeURIComponent(gibsTime())}` +
    `&TILEMATRIX={z}&TILECOL={x}&TILEROW={y}`;

  const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
  const DARK_ATTR  = '&copy; OpenStreetMap &copy; CARTO | Radar © RainViewer / NASA GIBS';

  return (
    <div className={`card p-4 ${className}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="text-white/80">
          Live Rain Radar <span className="text-white/50">• {timestampLabel || "—"}</span>
        </div>

        <div className="flex items-center gap-2">
          {!useGIBS && (
            <>
              <button
                onClick={() => setPlaying(p => !p)}
                className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20"
                title={playing ? "Pause" : "Play"}
              >
                {playing ? "Pause" : "Play"}
              </button>
              <button
                onClick={() => setIdx(i => (i - 1 + (frames.length || 1)) % (frames.length || 1))}
                className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20"
                title="Prev"
                disabled={!frames.length}
              >‹</button>
              <button
                onClick={() => setIdx(i => (i + 1) % (frames.length || 1))}
                className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20"
                title="Next"
                disabled={!frames.length}
              >›</button>
            </>
          )}

          <div className="flex items-center gap-2 ml-2">
            <span className="text-xs text-white/60">Opacity</span>
            <input
              type="range"
              min={0} max={1} step={0.05}
              value={ovOpacity}
              onChange={e => setOvOpacity(parseFloat(e.target.value))}
            />
          </div>

          <button
            onClick={() => setUseGIBS(v => !v)}
            className="rounded-full px-3 py-1 bg-white/10 hover:bg-white/20 ml-2"
            title="Toggle data source"
          >
            {useGIBS ? "Use RainViewer" : "Use NASA GIBS"}
          </button>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl" style={{ height }}>
        <div className="h-full w-full">
          <MapContainer
            key={`${center[0]}-${center[1]}-${zoom}-${useGIBS ? "g" : "r"}`}
            center={center}
            zoom={zoom}
            minZoom={2}
            className="h-full w-full map-dark"
            worldCopyJump
          >
            <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />

            {/* Primary: RainViewer (vivid colors + blend) */}
            {!useGIBS && rvUrl && (
              <TileLayer
                url={rvUrl}
                opacity={ovOpacity}
                tileSize={256}
                zIndex={600}
                className="rv-tiles"
                attribution='Radar tiles © RainViewer'
              />
            )}

            {/* Fallback: NASA GIBS IMERG (colorized) */}
            {useGIBS && (
              <TileLayer
                url={gibsUrl}
                opacity={ovOpacity}
                tileSize={256}
                zIndex={600}
                className="gibs-tiles"
                attribution='GPM IMERG © NASA GIBS'
              />
            )}
          </MapContainer>
        </div>
      </div>

      <div className="mt-2 text-[10px] text-white/50">
        Data: RainViewer (near-real-time) / NASA GIBS IMERG (colorized, ~30–60 min latency). Display only; not for safety-critical use.
      </div>

      {!frames.length && !useGIBS && (
        <div className="mt-3 text-sm text-white/60">
          No RainViewer frames right now — auto-switching to NASA GIBS. You can toggle back anytime.
        </div>
      )}
    </div>
  );
}

/** Round to last half-hour ISO time for GIBS IMERG */
function gibsTime() {
  const d = new Date();
  d.setUTCSeconds(0,0);
  const m = d.getUTCMinutes();
  d.setUTCMinutes(m >= 30 ? 30 : 0);
  return d.toISOString().slice(0,19) + "Z";
}
