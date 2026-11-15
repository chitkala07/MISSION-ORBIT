import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import {
  createAtmosphereRimMaterial,
  createFoilBumpTexture,
  createNebulaSkyTexture,
  createPlanetTexture,
  createSolarPanelTexture,
  detectSoftwareGl,
  scheduleAfterDraw,
} from './threeUtils';

/**
 * Full-bleed animated 3D hero stage for the MISSION: ORBIT title screen.
 * Features a colourful nebula sky dome, layered Earth with drifting atmospheric ring,
 * orbiting Moon, distant Mars, solar glow, ringed cosmic giant, and a multi-part hero spacecraft.
 */
export const HeroSpaceScene: React.FC = () => {
  const mountRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(320, container.clientWidth);
    const height = Math.max(320, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050716);
    scene.fog = new THREE.FogExp2(0x070a22, 0.0075);

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 220);
    camera.position.set(-1.3, 0.75, 12.1);
    camera.lookAt(2.1, -0.15, 0);

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.18;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const skyTex = createNebulaSkyTexture();
    const earthTex = createPlanetTexture('earth', maxAniso);
    const marsTex = createPlanetTexture('mars', maxAniso);
    const moonTex = createPlanetTexture('moon', maxAniso);
    const sunTex = createPlanetTexture('sun', maxAniso);
    const solarTex = createSolarPanelTexture(maxAniso);
    const foilBump = createFoilBumpTexture();

    // Sky Nebula Dome
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(95, 32, 24),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
    );
    scene.add(skyDome);

    // Warm Solar Key + Cool Cyan/Violet Fill Lights + Magenta Cosmic Rim
    const keyLight = new THREE.DirectionalLight(0xfff1d6, 2.65);
    keyLight.position.set(-10, 8, 11);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x3b0764, 0.9);
    scene.add(hemiLight);

    const magentaRim = new THREE.DirectionalLight(0xe879f9, 1.35);
    magentaRim.position.set(11, -3, -9);
    scene.add(magentaRim);

    // Colorful Starfield (InstancedMesh)
    const starCount = 380;
    const starGeo = new THREE.OctahedronGeometry(0.06, 0);
    const starMat = new THREE.MeshBasicMaterial({ color: 0xffffff });
    const starMesh = new THREE.InstancedMesh(starGeo, starMat, starCount);
    const dummy = new THREE.Object3D();
    const starPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x67e8f9),
      new THREE.Color(0xf0abfc),
      new THREE.Color(0xfde047),
      new THREE.Color(0x5eead4),
    ];
    for (let i = 0; i < starCount; i++) {
      const th = (i * 137.5) % (Math.PI * 2);
      const ph = Math.acos(1 - 2 * ((i + 0.5) / starCount));
      const r = 28 + (i % 38);
      dummy.position.set(
        r * Math.sin(ph) * Math.cos(th),
        r * Math.cos(ph),
        r * Math.sin(ph) * Math.sin(th)
      );
      dummy.scale.setScalar(0.55 + (i % 5) * 0.25);
      dummy.updateMatrix();
      starMesh.setMatrixAt(i, dummy.matrix);
      starMesh.setColorAt(i, starPalette[i % starPalette.length]);
    }
    starMesh.instanceMatrix.needsUpdate = true;
    if (starMesh.instanceColor) starMesh.instanceColor.needsUpdate = true;
    starMesh.computeBoundingSphere();
    scene.add(starMesh);

    // Floating Cosmic Dust Particles
    const dustCount = 160;
    const dustPos = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      dustPos[i * 3] = (((i * 73) % 240) - 100) * 0.12;
      dustPos[i * 3 + 1] = (((i * 41) % 140) - 70) * 0.09;
      dustPos[i * 3 + 2] = (((i * 59) % 160) - 80) * 0.09;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPos, 3));
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0x67e8f9,
        size: 0.08,
        transparent: true,
        opacity: 0.65,
      })
    );
    scene.add(dustPoints);

    // Foreground Hero Planet (Right-third placement so left title area stays crystal clear)
    const foregroundPlanet = new THREE.Group();
    foregroundPlanet.position.set(4.15, -0.35, 0);

    const earthSphere = new THREE.Mesh(
      new THREE.SphereGeometry(3.05, 48, 36),
      new THREE.MeshStandardMaterial({
        map: earthTex,
        color: 0xffffff,
        roughness: 0.44,
        metalness: 0.1,
      })
    );
    const earthAtmo = new THREE.Mesh(
      new THREE.SphereGeometry(3.28, 36, 28),
      createAtmosphereRimMaterial(0x22d3ee, 1.15)
    );
    const orbitalHalo = new THREE.Mesh(
      new THREE.TorusGeometry(4.45, 0.028, 12, 96),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        transparent: true,
        opacity: 0.55,
      })
    );
    orbitalHalo.rotation.set(Math.PI / 2.35, 0.25, 0);

    const innerScanHalo = new THREE.Mesh(
      new THREE.TorusGeometry(3.78, 0.016, 10, 80),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.48,
      })
    );
    innerScanHalo.rotation.set(Math.PI / 2.1, -0.18, 0);

    foregroundPlanet.add(earthSphere, earthAtmo, orbitalHalo, innerScanHalo);
    scene.add(foregroundPlanet);

    // Orbiting Moon
    const moonMesh = new THREE.Mesh(
      new THREE.SphereGeometry(0.56, 24, 18),
      new THREE.MeshStandardMaterial({
        map: moonTex,
        color: 0xffffff,
        roughness: 0.88,
      })
    );
    scene.add(moonMesh);

    // Background Mars, Distant Ringed Exoplanet & Sun on right-side cosmic vista
    const bgMars = new THREE.Group();
    bgMars.position.set(9.1, -3.1, -13);
    bgMars.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(1.32, 32, 24),
        new THREE.MeshStandardMaterial({ map: marsTex, roughness: 0.78 })
      ),
      new THREE.Mesh(
        new THREE.SphereGeometry(1.48, 24, 18),
        createAtmosphereRimMaterial(0xfb923c, 0.95)
      )
    );
    scene.add(bgMars);

    const bgRinged = new THREE.Group();
    bgRinged.position.set(11.6, 1.2, -19);
    const giantSphere = new THREE.Mesh(
      new THREE.SphereGeometry(1.05, 24, 18),
      new THREE.MeshStandardMaterial({ color: 0xa855f7, roughness: 0.5, metalness: 0.15 })
    );
    const giantRing = new THREE.Mesh(
      new THREE.RingGeometry(1.45, 2.25, 48),
      new THREE.MeshBasicMaterial({
        color: 0xf472b6,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.42,
      })
    );
    giantRing.rotation.set(Math.PI / 2.5, 0.35, 0);
    bgRinged.add(giantSphere, giantRing);
    scene.add(bgRinged);

    const bgSun = new THREE.Group();
    bgSun.position.set(9.8, 5.1, -24);
    bgSun.add(
      new THREE.Mesh(
        new THREE.SphereGeometry(2.15, 24, 18),
        new THREE.MeshBasicMaterial({ map: sunTex, color: 0xffffff })
      ),
      new THREE.Mesh(
        new THREE.SphereGeometry(2.65, 24, 18),
        createAtmosphereRimMaterial(0xfacc15, 1.38)
      )
    );
    scene.add(bgSun);

    // Composite Animated Hero Spacecraft cruising foreground orbit
    const craft = new THREE.Group();
    const bus = new THREE.Mesh(
      new THREE.CylinderGeometry(0.34, 0.34, 0.62, 8),
      new THREE.MeshStandardMaterial({
        color: 0xf59e0b,
        metalness: 0.88,
        roughness: 0.25,
        bumpMap: foilBump,
        bumpScale: 0.02,
      })
    );
    const collarTop = new THREE.Mesh(
      new THREE.CylinderGeometry(0.37, 0.37, 0.07, 8),
      new THREE.MeshStandardMaterial({ color: 0xe2e8f0, metalness: 0.85, roughness: 0.2 })
    );
    collarTop.position.y = 0.33;

    const dish = new THREE.Mesh(
      new THREE.LatheGeometry(
        [
          new THREE.Vector2(0.01, 0),
          new THREE.Vector2(0.18, 0.04),
          new THREE.Vector2(0.34, 0.15),
        ],
        24
      ),
      new THREE.MeshStandardMaterial({
        color: 0xf8fafc,
        metalness: 0.35,
        roughness: 0.22,
        side: THREE.DoubleSide,
      })
    );
    dish.position.y = 0.44;

    const wingMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      color: 0xffffff,
      metalness: 0.48,
      roughness: 0.2,
    });
    const wingL = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.03, 0.38), wingMat);
    wingL.position.x = -0.92;
    const wingR = new THREE.Mesh(new THREE.BoxGeometry(1.12, 0.03, 0.38), wingMat);
    wingR.position.x = 0.92;

    const strobeL = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee })
    );
    strobeL.position.set(-1.49, 0.03, 0);
    const strobeR = new THREE.Mesh(
      new THREE.SphereGeometry(0.045, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xf472b6 })
    );
    strobeR.position.set(1.49, 0.03, 0);

    const ionGlow = new THREE.Mesh(
      new THREE.ConeGeometry(0.13, 0.56, 14),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.82,
        depthWrite: false,
      })
    );
    ionGlow.rotation.x = Math.PI;
    ionGlow.position.y = -0.6;

    craft.add(bus, collarTop, dish, wingL, wingR, strobeL, strobeR, ionGlow);
    craft.rotation.set(0.38, 0.42, -0.44);
    scene.add(craft);

    const clock = new THREE.Clock();
    let frameHandle = 0;
    let disposed = false;

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.1, clock.getDelta());
      const t = clock.elapsedTime;

      earthSphere.rotation.y += dt * 0.13;
      orbitalHalo.rotation.z += dt * 0.08;
      innerScanHalo.rotation.z -= dt * 0.11;
      skyDome.rotation.y += dt * 0.009;
      bgMars.rotation.y += dt * 0.16;
      bgRinged.rotation.y += dt * 0.12;
      dustPoints.rotation.y += dt * 0.015;

      moonMesh.position.set(
        foregroundPlanet.position.x + Math.cos(t * 0.38) * 5.25,
        foregroundPlanet.position.y + Math.sin(t * 0.38) * 1.15,
        Math.sin(t * 0.38) * 5.25
      );

      // Cruising hero spacecraft arc around foreground Earth
      const craftAngle = t * 0.42;
      craft.position.set(
        foregroundPlanet.position.x - 2.65 + Math.cos(craftAngle) * 1.75,
        1.2 + Math.sin(craftAngle * 1.3) * 0.45,
        3.0 + Math.sin(craftAngle) * 1.1
      );
      craft.rotation.y += dt * 0.25;
      ionGlow.scale.y = 0.85 + Math.sin(t * 11) * 0.16;

      camera.position.x = -1.3 + Math.sin(t * 0.22) * 0.24;
      camera.position.y = 0.75 + Math.cos(t * 0.18) * 0.16;
      camera.lookAt(2.1, -0.15, 0);

      renderer.render(scene, camera);
      if (isSoftwareGl) {
        scheduleAfterDraw(renderer, tick, (id) => {
          frameHandle = id;
        });
      } else {
        frameHandle = requestAnimationFrame(tick);
      }
    };

    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    const onResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(320, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', onResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameHandle);
      clearTimeout(frameHandle);
      window.removeEventListener('resize', onResize);
      envTex.dispose();
      skyTex.dispose();
      earthTex.dispose();
      marsTex.dispose();
      moonTex.dispose();
      sunTex.dispose();
      solarTex.dispose();
      foilBump.dispose();
      dustGeo.dispose();
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
    };
  }, []);

  return (
    <div
      ref={mountRef}
      data-testid="hero-space-canvas"
      className="w-full h-full min-h-[440px]"
    />
  );
};
