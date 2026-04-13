import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { RainbowTextEffect } from './rainbow-text-effect';

const BirthdayEffect = () => {
  const containerRef = useRef<HTMLDivElement>(null);
  const [show, setShow] = useState(false);

  useEffect(() => {
    const check = () => {
      const d = new Date();
      setShow(d.getMonth() === 3 && d.getDate() === 13 && d.getHours() === 22 && d.getMinutes() === 22);
    };
    check();
    const int = setInterval(check, 10000);
    return () => clearInterval(int);
  }, []);

  useEffect(() => {
    if (!show || !containerRef.current) return;
    const container = containerRef.current;
    const scene = new THREE.Scene();
    const camera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1);
    const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
    renderer.setClearColor(0x000000, 0);
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
      transparent: true,
      uniforms: {
        iTime: { value: 0 },
        iResolution: { value: new THREE.Vector2(window.innerWidth, window.innerHeight) }
      },
      vertexShader: `void main() { gl_Position = vec4(position, 1.0); }`,
      fragmentShader: `
        uniform float iTime;
        uniform vec2 iResolution;
        float rand(vec2 n) { return fract(sin(dot(n, vec2(12.9898, 4.1414))) * 43758.5453); }
        float noise(vec2 p) {
          vec2 ip = floor(p), u = fract(p);
          u = u*u*(3.0-2.0*u);
          return mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
        }
        void main() {
          vec2 p = (gl_FragCoord.xy - iResolution.xy * 0.5) / iResolution.y * 8.0;
          vec4 o = vec4(0.0);
          for (float i = 0.0; i < 30.0; i++) {
            vec2 v = p + cos(i + iTime * 0.2 + vec2(13.0, 11.0)) * 2.0;
            vec4 c = mix(vec4(0.5, 0.0, 0.8, 0.8), vec4(1.0, 0.5, 0.0, 0.8), sin(i * 0.2 + iTime) * 0.5 + 0.5);
            o += c * 0.02 / length(v);
          }
          gl_FragColor = o;
        }
      `
    });

    const mesh = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), material);
    scene.add(mesh);

    let frameId: number;
    const animate = () => {
      material.uniforms.iTime.value += 0.016;
      renderer.render(scene, camera);
      frameId = requestAnimationFrame(animate);
    };
    animate();

    return () => {
      cancelAnimationFrame(frameId);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      renderer.dispose();
    };
  }, [show]);

  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] pointer-events-none flex items-center justify-center">
      <div ref={containerRef} className="absolute inset-0" />
      <RainbowTextEffect text="make a wish" className="relative z-10" />
    </div>
  );
};

export default BirthdayEffect;