import { useState } from "react";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25,41], iconAnchor: [12,41], shadowSize: [41,41]
});

// Dark Matter (Carto) tiles — great dark theme
const DARK_TILES = "https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png";
const DARK_ATTR =
  '&copy; <a href="https://www.openstreetmap.org/copyright">OSM</a> &copy; ' +
  '<a href="https://carto.com/attributions">CARTO</a>';

function ClickHandler({ onPick, onClose }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onPick({ name: `${lat.toFixed(3)}, ${lng.toFixed(3)}`, lat, lon: lng });
      if (onClose) onClose();
    }
  });
  return null;
}

export default function MapPicker({ center=[26.2285,50.5860], point, onPick }) {
  const [open, setOpen] = useState(false);

  return (
    <div>
      {/* Compact summary card with button */}
      <div className="card p-5 flex items-center justify-between gap-4">
        <div className="text-white/80">
          {point ? `📍 ${point.name}` : "Pick a location manually on the map"}
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-full px-5 py-3 bg-white/10 hover:bg-white/20 text-white"
            onClick={() => setOpen(true)}
          >
            Open Map
          </button>
        </div>
      </div>

      {/* Fullscreen modal with dark map */}
      {open && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="relative w-full max-w-6xl">
            <div className="absolute -top-10 right-0">
              <button
                onClick={() => setOpen(false)}
                className="rounded-full px-4 py-2 bg-white/10 hover:bg-white/20 text-white"
              >
                Close
              </button>
            </div>

            <div className="rounded-2xl overflow-hidden shadow-[0_0_50px_rgba(0,0,0,.8)] map-dark">
              <MapContainer center={point ? [point.lat, point.lon] : center} zoom={9} className="h-[70vh] w-full">
                <TileLayer url={DARK_TILES} attribution={DARK_ATTR} />
                <ClickHandler onPick={onPick} onClose={() => setOpen(false)} />
                {point && <Marker position={[point.lat, point.lon]} icon={icon} />}
              </MapContainer>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
