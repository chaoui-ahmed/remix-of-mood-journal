import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';

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
    renderer.setSize(window.innerWidth, window.innerHeight);
    container.appendChild(renderer.domElement);

    const material = new THREE.ShaderMaterial({
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
          return mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y) * mix(mix(rand(ip), rand(ip + vec2(1.0, 0.0)), u.x), mix(rand(ip + vec2(0.0, 1.0)), rand(ip + vec2(1.0, 1.0)), u.x), u.y);
        }
        float fbm(vec2 x) {
          float v = 0.0, a = 0.3;
          vec2 shift = vec2(100);
          mat2 rot = mat2(cos(0.5), sin(0.5), -sin(0.5), cos(0.5));
          for (int i = 0; i < 3; ++i) { v += a * noise(x); x = rot * x * 2.0 + shift; a *= 0.4; }
          return v;
        }
        void main() {
          vec2 shake = vec2(sin(iTime * 1.2) * 0.005, cos(iTime * 2.1) * 0.005);
          vec2 p = ((gl_FragCoord.xy + shake * iResolution.xy) - iResolution.xy * 0.5) / iResolution.y * mat2(6.0, -4.0, 4.0, 6.0);
          vec2 v;
          vec4 o = vec4(0.0);
          float f = 2.0 + fbm(p + vec2(iTime * 5.0, 0.0)) * 0.5;
          for (float i = 0.0; i < 35.0; i++) {
            v = p + cos(i * i + (iTime + p.x * 0.08) * 0.025 + i * vec2(13.0, 11.0)) * 3.5 + vec2(sin(iTime * 3.0 + i) * 0.003, cos(iTime * 3.5 - i) * 0.003);
            float tailNoise = fbm(v + vec2(iTime * 0.5, i)) * 0.3 * (1.0 - (i / 35.0));
            vec4 c = mix(vec4(0.5, 0.0, 0.8, 1.0), vec4(1.0, 0.5, 0.0, 1.0), sin(i * 0.2 + iTime * 0.4) * 0.5 + 0.5);
            vec4 cur = c * exp(sin(i * i + iTime * 0.8)) / length(max(v, vec2(v.x * f * 0.015, v.y * 1.5)));
            o += cur * (1.0 + tailNoise * 0.8) * (smoothstep(0.0, 1.0, i / 35.0) * 0.6);
          }
          gl_FragColor = tanh(pow(o / 100.0, vec4(1.6))) * 1.5;
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

    const handleResize = () => {
      renderer.setSize(window.innerWidth, window.innerHeight);
      material.uniforms.iResolution.value.set(window.innerWidth, window.innerHeight);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(frameId);
      window.removeEventListener('resize', handleResize);
      if (container.contains(renderer.domElement)) container.removeChild(renderer.domElement);
      material.dispose();
      renderer.dispose();
    };
  }, [show]);

  if (!show) return null;
  return <div ref={containerRef} className="fixed inset-0 z-50 bg-black pointer-events-none" />;
};

export default BirthdayEffect;