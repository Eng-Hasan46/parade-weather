import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";

const icon = new L.Icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41], iconAnchor: [12, 41], shadowSize: [41, 41]
});

function ClickHandler({ onPick }){
  useMapEvents({ click(e){ const {lat,lng}=e.latlng; onPick({ name:`${lat.toFixed(3)}, ${lng.toFixed(3)}`, lat, lon: lng }); }});
  return null;
}

export default function MapPicker({ center=[26.2285,50.5860], point, onPick }){
  return (
    <div className="card overflow-hidden h-72">
      <MapContainer center={center} zoom={9} className="h-full w-full">
        <TileLayer attribution="&copy; OpenStreetMap" url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"/>
        <ClickHandler onPick={onPick}/>
        {point && <Marker position={[point.lat, point.lon]} icon={icon}/>}
      </MapContainer>
    </div>
  );
}
