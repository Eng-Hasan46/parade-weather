import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

const EARTH_TEX  = "https://unpkg.com/three-globe/example/img/earth-dark.jpg";
const BUMP_TEX   = "https://unpkg.com/three-globe/example/img/earth-topology.png";
const CLOUDS_TEX = "https://unpkg.com/three-globe/example/img/earth-clouds.png";

const GLOBE_SIZE = 200;

export default function HeroGlobe({ children }) {
  const ref = useRef();
  const starGroup = useRef();

  useEffect(() => {
    const g = ref.current;
    if (!g) return;

    // Set POV first (keeps your current visual scale)
    g.pointOfView({ lat: 20, lng: 45, altitude: 2.1 }, 1200);

    // Controls & camera
    const controls = g.controls();
    const camera = g.camera();

    // Disable zoom completely and lock distance so size never changes
    controls.enableZoom = false;
    const fixedDist = camera.position.length(); // distance after pointOfView
    controls.minDistance = fixedDist;
    controls.maxDistance = fixedDist;

    // Keep rotation/tilt; avoid panning so it stays centered
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI - 0.05;

    // -------- add starfield --------
    const scene = g.scene();
    const group = new THREE.Group();
    starGroup.current = group;

    const starCount = 1000;     // more stars => denser field
    const radius = 400;         // how far the stars are placed
    const positions = new Float32Array(starCount * 3); // x,y,z

    for (let i = 0; i < starCount; i++) {
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      positions[i * 3 + 0] = radius * Math.sin(theta) * Math.cos(phi);
      positions[i * 3 + 1] = radius * Math.sin(theta) * Math.sin(phi);
      positions[i * 3 + 2] = radius * Math.cos(theta);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.85
    });

    const stars = new THREE.Points(geo, mat);
    group.add(stars);
    scene.add(group);

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      group.rotation.y += 0.0006; // gentle drift
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      scene.remove(group);
      group.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    };
  }, []);

  return (
    <div className="relative h-[100vh] w-full overflow-hidden rounded-3xl space-hero">
      {/* Globe shifted a bit to the right */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div style={{ transform: `translateX(0px)` }}>


          <Globe
            ref={ref}
            backgroundColor="rgba(0,0,0,0)"
            globeImageUrl={EARTH_TEX}
            bumpImageUrl={BUMP_TEX}
            atmosphereColor="#7dd3fc"
            atmosphereAltitude={0.25}
            cloudsData={[{ id: 1 }]}
            cloudAltitude={0.01}
            cloudRotationSpeed={0.02}
            cloudImageUrl={CLOUDS_TEX}
          />
        </div>
      </div>



      {/* Overlay content stays centered on the page */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="glass pointer-events-auto w-[95%] md:w-[900px] p-4 md:p-6 rounded-2xl border-white/15">
          {children}
        </div>
      </div>
    </div>
  );
}
