import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

// More colorful Earth textures
const EARTH_TEX = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BUMP_TEX = "https://unpkg.com/three-globe/example/img/earth-topology.png";
const CLOUDS_TEX = "https://unpkg.com/three-globe/example/img/earth-clouds.png";

export default function HeroGlobe({ children }) {
  const ref = useRef();

  useEffect(() => {
    const g = ref.current;
    if (!g) return;
    // slow auto-rotation
    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.6;
    // start slightly tilted
    g.pointOfView({ lat: 20, lng: 45, altitude: 2.2 }, 1200);
  }, []);

  return (
    <div className="relative h-[65vh] md:h-[70vh] w-full overflow-hidden rounded-3xl weather-hero">
      {/* Weather particles/rain animation */}
      <Globe
        ref={ref}
        width={undefined}
        height={undefined}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={EARTH_TEX}
        bumpImageUrl={BUMP_TEX}
        showGraticules={true}
        graticulesLineColor="rgba(59,130,246,0.2)"
        atmosphereColor="#475569"
        atmosphereAltitude={0.2}
        cloudsData={[{ id: 1 }]}
        cloudAltitude={0.01}
        cloudRotationSpeed={0.015}
        cloudImageUrl={CLOUDS_TEX}
        enablePointerInteraction={true}
      />

      {/* Floating overlay (your search panel or anything) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="glass pointer-events-auto w-[95%] md:w-[900px] p-4 md:p-6 rounded-2xl">
          {children}
        </div>
      </div>
    </div>
  );
}
