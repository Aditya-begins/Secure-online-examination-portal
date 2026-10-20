import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';

interface CyberGlobe3DProps {
  className?: string;
  showShield?: boolean;
}

export const CyberGlobe3D: React.FC<CyberGlobe3DProps> = ({ className = '', showShield = true }) => {
  const mountRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const width = container.clientWidth || 550;
    const height = container.clientHeight || 480;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 1000);
    camera.position.z = 210;

    let renderer: THREE.WebGLRenderer;
    try {
      renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true, powerPreference: 'low-power' });
    } catch {
      return;
    }

    renderer.setSize(width, height);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    container.appendChild(renderer.domElement);

    const globeGroup = new THREE.Group();
    scene.add(globeGroup);

    // 1. Refined Particle Globe with Royal Blue & Indigo colors
    const particleCount = 1100;
    const geometry = new THREE.BufferGeometry();
    const positions = new Float32Array(particleCount * 3);
    const colors = new Float32Array(particleCount * 3);

    const radius = 64;
    const colorRoyal = new THREE.Color(0x2563EB); // #2563EB Primary Brand
    const colorIndigo = new THREE.Color(0x4F46E5); // #4F46E5 Secondary Brand
    const colorSky = new THREE.Color(0x38BDF8);

    for (let i = 0; i < particleCount; i++) {
      const phi = Math.acos(-1 + (2 * i) / particleCount);
      const theta = Math.sqrt(particleCount * Math.PI) * phi;

      const x = radius * Math.cos(theta) * Math.sin(phi);
      const y = radius * Math.sin(theta) * Math.sin(phi);
      const z = radius * Math.cos(phi);

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = z;

      const mixRatio = Math.sin(phi);
      const c = mixRatio > 0.6 ? colorRoyal : mixRatio > 0.3 ? colorIndigo : colorSky;
      colors[i * 3] = c.r;
      colors[i * 3 + 1] = c.g;
      colors[i * 3 + 2] = c.b;
    }

    geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

    const particleMaterial = new THREE.PointsMaterial({
      size: 2.2,
      vertexColors: true,
      transparent: true,
      opacity: 0.9,
    });

    const particles = new THREE.Points(geometry, particleMaterial);
    globeGroup.add(particles);

    // 2. Translucent Inner Geodesic Wireframe
    const innerGeo = new THREE.IcosahedronGeometry(radius * 0.96, 2);
    const innerMat = new THREE.MeshBasicMaterial({
      color: 0x3B82F6,
      wireframe: true,
      transparent: true,
      opacity: 0.22,
    });
    const innerSphere = new THREE.Mesh(innerGeo, innerMat);
    globeGroup.add(innerSphere);

    // 3. Subtle Elegant Rings
    const ringGeo = new THREE.TorusGeometry(radius * 1.22, 0.4, 8, 80);
    const ringMat = new THREE.MeshBasicMaterial({
      color: 0x4F46E5,
      transparent: true,
      opacity: 0.35,
    });
    const ring1 = new THREE.Mesh(ringGeo, ringMat);
    ring1.rotation.x = Math.PI / 3;
    globeGroup.add(ring1);

    const ring2 = new THREE.Mesh(ringGeo, ringMat.clone());
    ring2.rotation.x = -Math.PI / 4;
    ring2.rotation.y = Math.PI / 6;
    globeGroup.add(ring2);

    // 4. Subtle Education Nodes
    const nodesGroup = new THREE.Group();
    const nodeGeo = new THREE.SphereGeometry(1.5, 8, 8);
    const nodeMat = new THREE.MeshBasicMaterial({ color: 0x2563EB });

    for (let i = 0; i < 6; i++) {
      const node = new THREE.Mesh(nodeGeo, nodeMat);
      const angle = (i / 6) * Math.PI * 2;
      const orbitDist = radius * 1.3;
      node.position.set(Math.cos(angle) * orbitDist, Math.sin(angle * 2) * 15, Math.sin(angle) * orbitDist);
      nodesGroup.add(node);
    }
    globeGroup.add(nodesGroup);

    let targetRotX = 0;
    let targetRotY = 0;

    const handleMouseMove = (e: MouseEvent) => {
      const rect = container.getBoundingClientRect();
      const mouseX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const mouseY = -(((e.clientY - rect.top) / rect.height) * 2 - 1);
      targetRotY = mouseX * 0.35;
      targetRotX = mouseY * 0.35;
    };

    container.addEventListener('mousemove', handleMouseMove);

    const handleResize = () => {
      if (!container) return;
      const w = container.clientWidth;
      const h = container.clientHeight;
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };

    window.addEventListener('resize', handleResize);

    let animId: number;
    const animate = () => {
      animId = requestAnimationFrame(animate);

      globeGroup.rotation.y += 0.003;
      ring1.rotation.z += 0.005;
      ring2.rotation.z -= 0.003;
      nodesGroup.rotation.y += 0.006;

      globeGroup.rotation.x += (targetRotX - globeGroup.rotation.x) * 0.05;
      globeGroup.rotation.y += targetRotY * 0.5;

      renderer.render(scene, camera);
    };

    animate();

    return () => {
      cancelAnimationFrame(animId);
      container.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('resize', handleResize);
      if (renderer.domElement && container.contains(renderer.domElement)) {
        container.removeChild(renderer.domElement);
      }
      renderer.dispose();
      geometry.dispose();
      particleMaterial.dispose();
      innerGeo.dispose();
      innerMat.dispose();
      ringGeo.dispose();
      ringMat.dispose();
      nodeGeo.dispose();
      nodeMat.dispose();
    };
  }, [showShield]);

  return (
    <div className={`relative flex items-center justify-center pointer-events-auto ${className}`}>
      <div ref={mountRef} className="w-full h-full min-h-[340px] flex items-center justify-center cursor-grab active:cursor-grabbing" />
      {/* Subtle clean ambient backdrop */}
      <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 via-indigo-500/5 to-transparent rounded-full filter blur-2xl pointer-events-none" />
    </div>
  );
};
