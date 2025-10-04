// src/components/LeafParticles.jsx
import { useEffect, useRef } from "react";
import * as THREE from "three";

// Tiny inline SVG (transparent background) as a texture – no external files needed.
const LEAF_URL =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64' viewBox='0 0 64 64'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cpath d='M6 38c9-16 24-26 44-28-2 20-12 35-28 44-6 3-10 2-12-1-2-3-1-6 2-9-2-2-4-4-6-6z' fill='%2310b981'/%3E%3Cpath d='M18 44c8-5 16-13 22-22' stroke='%23029669' stroke-width='2' stroke-linecap='round'/%3E%3C/g%3E%3C/svg%3E";

export default function LeafParticles() {
  const mountRef = useRef(null);

  useEffect(() => {
    const w = window.innerWidth;
    const h = window.innerHeight;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, w / h, 1, 3000);
    camera.position.z = 800;

    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
    renderer.setSize(w, h);
    renderer.domElement.style.pointerEvents = "none";

    if (mountRef.current) {
      mountRef.current.appendChild(renderer.domElement);
    }

    // Particles (leaves)
    const count = 280;
    const positions = new Float32Array(count * 3);
    const phases = new Float32Array(count);
    const speeds = new Float32Array(count);
    const sway = new Float32Array(count);
    const sizes = new Float32Array(count);

    for (let i = 0; i < count; i++) {
      positions[i * 3 + 0] = (Math.random() - 0.5) * 2000; // x
      positions[i * 3 + 1] = (Math.random() - 0.5) * 1200; // y
      positions[i * 3 + 2] = Math.random() * -1200;        // z (push back)
      phases[i] = Math.random() * Math.PI * 2;
      speeds[i] = 0.2 + Math.random() * 0.35;               // fall speed
      sway[i] = 0.4 + Math.random() * 0.8;                  // horizontal sway amplitude
      sizes[i] = 18 + Math.random() * 20;                   // pixel size
    }

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));

    // NOTE: PointsMaterial doesn't support per-point size. We'll vary via shader-like trick:
    // We’ll animate scale globally slightly, and we randomize initial sizes by duplicating materials if needed.
    // To keep it simple & fast, one material works fine visually.
    const texture = new THREE.TextureLoader().load(LEAF_URL);
    texture.anisotropy = renderer.capabilities.getMaxAnisotropy?.() ?? 1;

    const material = new THREE.PointsMaterial({
      size: 28,
      map: texture,
      transparent: true,
      opacity: 0.85,
      alphaTest: 0.01,
      depthWrite: false
    });

    const particles = new THREE.Points(geometry, material);
    particles.renderOrder = -1; // ensure behind most things
    scene.add(particles);

    let raf;
    let t = 0;
    const animate = () => {
      raf = requestAnimationFrame(animate);
      t += 0.005;

      const pos = geometry.attributes.position.array;
      for (let i = 0; i < count; i++) {
        // sway horizontally
        pos[i * 3 + 0] += Math.sin(t * 2 + phases[i]) * 0.25 * sway[i];
        // fall down
        pos[i * 3 + 1] -= speeds[i];

        // recycle when below screen
        if (pos[i * 3 + 1] < -700) {
          pos[i * 3 + 1] = 700;
          pos[i * 3 + 0] = (Math.random() - 0.5) * 2000;
          pos[i * 3 + 2] = Math.random() * -1200;
        }
      }
      geometry.attributes.position.needsUpdate = true;

      // gentle global scale pulse to fake size variety
      const base = 1 + Math.sin(t) * 0.05;
      particles.scale.set(base, base, 1);

      renderer.render(scene, camera);
    };
    animate();

    const onResize = () => {
      const W = window.innerWidth;
      const H = window.innerHeight;
      camera.aspect = W / H;
      camera.updateProjectionMatrix();
      renderer.setSize(W, H);
    };
    window.addEventListener("resize", onResize);

    return () => {
      cancelAnimationFrame(raf);
      window.removeEventListener("resize", onResize);
      if (mountRef.current?.contains(renderer.domElement)) {
        mountRef.current.removeChild(renderer.domElement);
      }
      geometry.dispose();
      material.dispose();
      texture.dispose();
      renderer.dispose();
    };
  }, []);

  return <div ref={mountRef} className="fixed inset-0 -z-10" />;
}
