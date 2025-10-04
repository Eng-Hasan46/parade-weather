// src/components/HeroGlobeLandDark.jsx
import { useEffect, useRef } from "react";
import Globe from "globe.gl";

/**
 * Dark hero globe:
 * - Land is visible (warm/earth tones)
 * - Oceans are dark (not blue)
 * - Soft atmosphere glow
 * - Auto-rotates
 *
 * Uses a public dark-earth texture (oceans black, land highlighted).
 */
export default function HeroGlobeLandDark({ children }) {
  const globeRef = useRef(null);
  const globeApi = useRef(null);

  useEffect(() => {
    // Create globe
    const g = Globe()(globeRef.current);

    // Texture with dark oceans + visible land
    // (Public asset from three-globe examples)
    g.globeImageUrl("https://unpkg.com/three-globe/example/img/earth-dark.jpg");

    // Optional bump map for subtle relief
    g.bumpImageUrl("https://unpkg.com/three-globe/example/img/earth-topology.png");

    // Atmosphere
    g.showAtmosphere(true);
    g.atmosphereColor("rgba(120,180,255,0.65)");
    g.atmosphereAltitude(0.22);

    // Background black (space)
    g.backgroundColor("#000000");

    // Smooth autorotation
    const controls = g.controls();
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.55;

    // Camera POV — closer for a bigger planet
    g.pointOfView({ lat: 18, lng: 25, altitude: 1.75 }, 1200);

    globeApi.current = g;
    return () => {
      // Cleanup
      try {
        g._destructor && g._destructor();
      } catch {}
    };
  }, []);

  return (
    <section className="relative h-[85vh] w-full overflow-hidden">
      {/* starry vignette / subtle gradient (optional, matches your theme) */}
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(1000px_600px_at_50%_-10%,rgba(59,130,246,.18),transparent_60%)]" />

      {/* Globe canvas */}
      <div ref={globeRef} className="absolute inset-0" />

      {/* Content overlay card */}
      <div className="relative z-10 h-full flex items-center justify-center px-4">
        <div className="bg-black/40 backdrop-blur-md rounded-2xl shadow-2xl p-6 md:p-8 max-w-3xl w-[92%]">
          {children}
        </div>
      </div>
    </section>
  );
}
