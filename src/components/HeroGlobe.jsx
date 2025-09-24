import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

const EARTH_TEX = "https://unpkg.com/three-globe/example/img/earth-dark.jpg";
const BUMP_TEX  = "https://unpkg.com/three-globe/example/img/earth-topology.png";
const CLOUDS_TEX = "https://unpkg.com/three-globe/example/img/earth-clouds.png";

export default function HeroGlobe({ children }) {
  const ref = useRef();
  const starGroup = useRef();

  useEffect(() => {
    const g = ref.current;
    if (!g) return;

    g.controls().autoRotate = true;
    g.controls().autoRotateSpeed = 0.3;
    g.pointOfView({ lat: 20, lng: 45, altitude: 2.1 }, 1200);

    // -------- add starfield --------
    const scene = g.scene();
    const group = new THREE.Group();
    starGroup.current = group;

    const starCount = 1000;       // increase for more stars
    const radius = 400;          // how far the stars are
    const positions = new Float32Array(starCount * 5);

    for (let i = 0; i < starCount; i++) {
      // random direction on unit sphere
      const theta = Math.acos(2 * Math.random() - 1);
      const phi = 2 * Math.PI * Math.random();
      const r = radius;
      positions[i*3+0] = r * Math.sin(theta) * Math.cos(phi);
      positions[i*3+1] = r * Math.sin(theta) * Math.sin(phi);
      positions[i*3+2] = r * Math.cos(theta);
    }

    const geo = new THREE.BufferGeometry();
    geo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const mat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 1.2,               // star size
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
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="glass pointer-events-auto w-[95%] md:w-[900px] p-4 md:p-6 rounded-2xl border-white/15">
          {children}
        </div>
      </div>
    </div>
  );
}
