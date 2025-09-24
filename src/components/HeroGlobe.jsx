import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";

// TEMP texture (we can swap to a NASA GIBS layer later)
const EARTH_TEX = "https://unpkg.com/three-globe/example/img/earth-dark.jpg";
const BUMP_TEX  = "https://unpkg.com/three-globe/example/img/earth-topology.png";
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
    <div className="relative h-[65vh] md:h-[70vh] w-full overflow-hidden rounded-3xl space-hero">
      {/* Stars are done by CSS on parent (space-hero) */}
      <Globe
        ref={ref}
        width={undefined}
        height={undefined}
        backgroundColor="rgba(0,0,0,0)"
        globeImageUrl={EARTH_TEX}
        bumpImageUrl={BUMP_TEX}
        showGraticules={false}
        atmosphereColor="#7dd3fc"
        atmosphereAltitude={0.25}
        cloudsData={[{ id: 1 }]}
        cloudAltitude={0.01}
        cloudRotationSpeed={0.02}
        cloudImageUrl={CLOUDS_TEX}
      />

      {/* Floating overlay (your search panel or anything) */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="glass pointer-events-auto w-[95%] md:w-[900px] p-4 md:p-6 rounded-2xl border-white/15">
          {children}
        </div>
      </div>
    </div>
  );
}
