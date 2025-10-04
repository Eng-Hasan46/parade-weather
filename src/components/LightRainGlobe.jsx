// src/components/LightRainGlobe.jsx
import { useEffect, useRef } from "react";
import Globe from "react-globe.gl";
import * as THREE from "three";

const EARTH_TEX = "https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg";
const BUMP_TEX = "https://unpkg.com/three-globe/example/img/earth-topology.png";
const CLOUDS_TEX = "https://unpkg.com/three-globe/example/img/earth-water.png";

export default function LightRainGlobe({ children }) {
  const ref = useRef();
  const rainGroup = useRef();
  const shimmerGroup = useRef();

  useEffect(() => {
    const g = ref.current;
    if (!g) return;

    g.pointOfView({ lat: 20, lng: 45, altitude: 2.1 }, 1200);

    const controls = g.controls();
    const camera = g.camera();

    controls.enableZoom = false;
    const fixedDist = camera.position.length();
    controls.minDistance = fixedDist;
    controls.maxDistance = fixedDist;
    controls.enablePan = false;
    controls.autoRotate = true;
    controls.autoRotateSpeed = 0.3;
    controls.minPolarAngle = 0.05;
    controls.maxPolarAngle = Math.PI - 0.05;

    const scene = g.scene();

    // Rain droplets
    const rainGrp = new THREE.Group();
    const dropCount = 800;
    const dropRadius = 320;
    const positions = new Float32Array(dropCount * 3);
    const velocities = [];

    for (let i = 0; i < dropCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = dropRadius + Math.random() * 100;

      positions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      positions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      positions[i * 3 + 2] = r * Math.cos(phi);

      velocities.push({ speed: 0.5 + Math.random() * 1.5 });
    }

    const dropGeo = new THREE.BufferGeometry();
    dropGeo.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    const dropMat = new THREE.PointsMaterial({
      color: 0x88ddff,
      size: 1.5,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.6
    });

    const rainDrops = new THREE.Points(dropGeo, dropMat);
    rainGrp.add(rainDrops);
    scene.add(rainGrp);
    rainGroup.current = rainGrp;

    // Shimmer ring
    const shimmerGrp = new THREE.Group();
    const shimmerCount = 300;
    const shimmerPositions = new Float32Array(shimmerCount * 3);

    for (let i = 0; i < shimmerCount; i++) {
      const theta = Math.random() * Math.PI * 2;
      const phi = Math.random() * Math.PI;
      const r = 380;

      shimmerPositions[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
      shimmerPositions[i * 3 + 1] = r * Math.sin(phi) * Math.sin(theta);
      shimmerPositions[i * 3 + 2] = r * Math.cos(phi);
    }

    const shimmerGeo = new THREE.BufferGeometry();
    shimmerGeo.setAttribute("position", new THREE.BufferAttribute(shimmerPositions, 3));

    const shimmerMat = new THREE.PointsMaterial({
      color: 0xffffff,
      size: 2,
      sizeAttenuation: true,
      transparent: true,
      opacity: 0.4
    });

    const shimmer = new THREE.Points(shimmerGeo, shimmerMat);
    shimmerGrp.add(shimmer);
    scene.add(shimmerGrp);
    shimmerGroup.current = shimmerGrp;

    let raf;
    const animate = () => {
      raf = requestAnimationFrame(animate);

      // fall animation
      const pos = dropGeo.attributes.position.array;
      for (let i = 0; i < dropCount; i++) {
        pos[i * 3 + 1] -= velocities[i].speed;
        if (pos[i * 3 + 1] < -dropRadius) {
          const theta = Math.random() * Math.PI * 2;
          const phi = Math.random() * Math.PI;
          const r = dropRadius + Math.random() * 100;
          pos[i * 3 + 0] = r * Math.sin(phi) * Math.cos(theta);
          pos[i * 3 + 1] = dropRadius;
          pos[i * 3 + 2] = r * Math.cos(phi);
        }
      }
      dropGeo.attributes.position.needsUpdate = true;

      shimmerGrp.rotation.y += 0.001;
      shimmerGrp.rotation.x += 0.0005;
    };
    animate();

    return () => {
      cancelAnimationFrame(raf);
      scene.remove(rainGrp);
      scene.remove(shimmerGrp);
      rainGrp.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
      shimmerGrp.traverse(obj => {
        if (obj.geometry) obj.geometry.dispose();
        if (obj.material) obj.material.dispose();
      });
    };
  }, []);

  return (
    <div className="relative h-[100vh] w-full overflow-hidden rounded-3xl bg-gradient-to-b from-sky-100 via-blue-50 to-cyan-100">
      <div className="absolute inset-0 flex items-center justify-center">
        <Globe
          ref={ref}
          backgroundColor="rgba(0,0,0,0)"
          globeImageUrl={EARTH_TEX}
          bumpImageUrl={BUMP_TEX}
          atmosphereColor="#60a5fa"
          atmosphereAltitude={0.3}
          cloudsData={[{ id: 1 }]}
          cloudAltitude={0.015}
          cloudRotationSpeed={0.025}
          cloudImageUrl={CLOUDS_TEX}
        />
      </div>

      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <div className="bg-white/80 backdrop-blur-md pointer-events-auto w-[95%] md:w-[900px] p-4 md:p-6 rounded-2xl border border-blue-200/50 shadow-xl">
          {children || (
            <div className="text-center">
              <h1 className="text-4xl md:text-6xl font-bold bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent mb-4">
                Rain & Weather
              </h1>
              <p className="text-lg text-gray-700">
                Tracking precipitation patterns across the globe
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
