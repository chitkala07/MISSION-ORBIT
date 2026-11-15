import React, { useEffect, useRef } from 'react';
import * as THREE from 'three';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import type { DestinationId, SelectedComponentItem } from '../../types/mission';
import {
  createAtmosphereRimMaterial,
  createFoilBumpTexture,
  createNebulaSkyTexture,
  createPlanetTexture,
  createSolarPanelTexture,
  detectSoftwareGl,
  scheduleAfterDraw,
} from './threeUtils';

interface MissionLaunchSceneProps {
  items: SelectedComponentItem[];
  rocketId: string;
  destinationId: DestinationId;
  progress: number;
  countdown: number | null;
  simRunning: boolean;
  hasActiveEvent: boolean;
  completed: boolean;
}

/**
 * Dedicated multi-phase 3D Launch & Deep-Space Flight Sequence (Three.js).
 * - Progress 0 (Countdown / Prep): 3D Rocket on illuminated Launch Pad + Gantry Tower + Cryo Vapor
 * - Progress 1..24% (Liftoff): Roaring orange rocket exhaust ascent as launchpad recedes
 * - Progress 25..65% (Space Cruise): Custom modular 3D Spacecraft cruising past star streaks
 * - Progress 66..100% (Arrival & Orbit): Target world looms into foreground orbital insertion
 */
export const MissionLaunchScene: React.FC<MissionLaunchSceneProps> = ({
  items,
  rocketId,
  destinationId,
  progress,
  countdown,
  simRunning,
  hasActiveEvent,
  completed,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);

  const padGroupRef = useRef<THREE.Group | null>(null);
  const rocketGroupRef = useRef<THREE.Group | null>(null);
  const craftGroupRef = useRef<THREE.Group | null>(null);
  const planetGroupRef = useRef<THREE.Group | null>(null);
  const smokeMeshRef = useRef<THREE.InstancedMesh | null>(null);

  const stateRef = useRef({
    progress,
    countdown,
    simRunning,
    hasActiveEvent,
    completed,
  });

  useEffect(() => {
    stateRef.current = {
      progress,
      countdown,
      simRunning,
      hasActiveEvent,
      completed,
    };

    const isLaunchPhase = progress < 25;
    if (padGroupRef.current) {
      padGroupRef.current.visible = progress < 22;
      if (progress === 0) padGroupRef.current.position.y = 0;
    }
    if (rocketGroupRef.current) {
      rocketGroupRef.current.visible = isLaunchPhase;
      if (progress === 0) rocketGroupRef.current.position.set(0, -0.35, 0);
    }
    if (craftGroupRef.current) craftGroupRef.current.visible = !isLaunchPhase;
    if (smokeMeshRef.current) smokeMeshRef.current.visible = progress < 18;

    if (planetGroupRef.current) {
      if (isLaunchPhase) {
        planetGroupRef.current.position.set(-7.5, 2.5, -24);
        planetGroupRef.current.scale.setScalar(0.55);
      } else {
        const cruiseFactor = Math.min(1, (progress - 25) / 75);
        planetGroupRef.current.scale.setScalar(0.72 + cruiseFactor * 0.78);
        planetGroupRef.current.position.set(
          THREE.MathUtils.lerp(-8.2, -3.9, cruiseFactor),
          THREE.MathUtils.lerp(1.4, -0.7, cruiseFactor),
          THREE.MathUtils.lerp(-18.5, -7.8, cruiseFactor)
        );
      }
    }

    if (cameraRef.current) {
      if (progress === 0) {
        cameraRef.current.position.set(4.8, 2.2, 8.2);
        cameraRef.current.lookAt(0, 1.1, 0);
      } else if (!isLaunchPhase) {
        cameraRef.current.position.set(4.2, 1.9, 6.2);
        cameraRef.current.lookAt(-0.6, 0, -1.2);
      }
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [progress, countdown, simRunning, hasActiveEvent, completed]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(300, container.clientWidth);
    const height = Math.max(280, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050716);
    scene.fog = new THREE.FogExp2(0x070a22, 0.01);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(44, width / height, 0.1, 180);
    camera.position.set(4.8, 2.2, 8.2);
    camera.lookAt(0, 1.1, 0);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.22;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmrem = new THREE.PMREMGenerator(renderer);
    const envTex = pmrem.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmrem.dispose();

    const skyTex = createNebulaSkyTexture();
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(75, 24, 18),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
    );
    scene.add(skyDome);

    // 3-Point Dramatic Launch & Deep Space Lighting
    const sunKey = new THREE.DirectionalLight(0xfff1d6, 2.6);
    sunKey.position.set(9, 10, 8);
    scene.add(sunKey);

    const hemi = new THREE.HemisphereLight(0x38bdf8, 0x3b0764, 0.9);
    scene.add(hemi);

    const rim = new THREE.DirectionalLight(0xe879f9, 1.3);
    rim.position.set(-8, 4, -8);
    scene.add(rim);

    // Starfield (InstancedMesh)
    const starCount = 220;
    const starMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.055, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      starCount
    );
    const dummy = new THREE.Object3D();
    const starColors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x67e8f9),
      new THREE.Color(0xe879f9),
      new THREE.Color(0xfde047),
    ];
    for (let i = 0; i < starCount; i++) {
      const th = (i * 137.5) % (Math.PI * 2);
      const ph = Math.acos(1 - 2 * ((i + 0.5) / starCount));
      const r = 26 + (i % 24);
      dummy.position.set(
        r * Math.sin(ph) * Math.cos(th),
        r * Math.cos(ph),
        r * Math.sin(ph) * Math.sin(th)
      );
      dummy.updateMatrix();
      starMesh.setMatrixAt(i, dummy.matrix);
      starMesh.setColorAt(i, starColors[i % starColors.length]);
    }
    starMesh.instanceMatrix.needsUpdate = true;
    if (starMesh.instanceColor) starMesh.instanceColor.needsUpdate = true;
    starMesh.computeBoundingSphere();
    scene.add(starMesh);

    // Launch Complex Pad + Umbilical Tower
    const padGroup = new THREE.Group();
    const padDeck = new THREE.Mesh(
      new THREE.CylinderGeometry(3.4, 3.8, 0.45, 24),
      new THREE.MeshStandardMaterial({ color: 0x1e293b, roughness: 0.72, metalness: 0.35 })
    );
    padDeck.position.y = -2.2;

    const padGlowRing = new THREE.Mesh(
      new THREE.RingGeometry(1.7, 1.9, 48),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.72,
      })
    );
    padGlowRing.rotation.x = Math.PI / 2;
    padGlowRing.position.y = -1.96;

    const gantryTower = new THREE.Mesh(
      new THREE.BoxGeometry(0.65, 5.2, 0.65),
      new THREE.MeshStandardMaterial({ color: 0x475569, metalness: 0.65, roughness: 0.35 })
    );
    gantryTower.position.set(-1.55, 0.5, -0.35);

    const armBridge = new THREE.Mesh(
      new THREE.BoxGeometry(1.2, 0.16, 0.24),
      new THREE.MeshStandardMaterial({ color: 0x94a3b8, metalness: 0.7, roughness: 0.3 })
    );
    armBridge.position.set(-0.85, 2.2, -0.2);

    const beaconTop = new THREE.Mesh(
      new THREE.SphereGeometry(0.11, 10, 10),
      new THREE.MeshBasicMaterial({ color: 0xf97316 })
    );
    beaconTop.position.set(-1.55, 3.22, -0.35);

    padGroup.add(padDeck, padGlowRing, gantryTower, armBridge, beaconTop);
    scene.add(padGroup);
    padGroupRef.current = padGroup;

    // Rocket Assembly Group (rebuilt by rocketId)
    const rocketGroup = new THREE.Group();
    scene.add(rocketGroup);
    rocketGroupRef.current = rocketGroup;

    // Modular Spacecraft Group (rebuilt by items)
    const craftGroup = new THREE.Group();
    scene.add(craftGroup);
    craftGroupRef.current = craftGroup;

    // Destination Planet Group (rebuilt by destinationId)
    const planetGroup = new THREE.Group();
    planetGroup.position.set(-5.8, -0.8, -11.5);
    scene.add(planetGroup);
    planetGroupRef.current = planetGroup;

    // Cryo / Launch Smoke Ring Particles (InstancedMesh)
    const smokeCount = 24;
    const smokeMesh = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.28, 1),
      new THREE.MeshBasicMaterial({
        color: 0xe2e8f0,
        transparent: true,
        opacity: 0.35,
      }),
      smokeCount
    );
    scene.add(smokeMesh);
    smokeMeshRef.current = smokeMesh;

    const clock = new THREE.Clock();
    const _camPos = new THREE.Vector3(4.8, 2.2, 8.2);
    const _camLook = new THREE.Vector3(0, 1.1, 0);
    let frameHandle = 0;
    let disposed = false;

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.1, clock.getDelta());
      const t = clock.elapsedTime;
      const { progress: prog, countdown: cd, hasActiveEvent: evtOpen } = stateRef.current;

      const isLaunchPhase = prog < 25;
      padGroup.visible = prog < 22;
      rocketGroup.visible = isLaunchPhase;
      craftGroup.visible = !isLaunchPhase;
      smokeMesh.visible = prog < 18;

      if (isLaunchPhase) {
        // Rocket on pad -> liftoff ascent
        const ascentFactor = Math.max(0, prog / 24);
        const shake = cd !== null || (prog > 0 && prog < 12) ? Math.sin(t * 48) * 0.035 : 0;

        rocketGroup.position.set(shake, -0.35 + ascentFactor * 4.8, 0);
        padGroup.position.y = -ascentFactor * 6.5;

        const rocketExhaust = rocketGroup.getObjectByName('rocketPlume');
        if (rocketExhaust) {
          rocketExhaust.visible = prog > 0 || (cd !== null && cd <= 1);
          const flamePulse = 0.85 + Math.sin(t * 28) * 0.22;
          rocketExhaust.scale.set(1, flamePulse, 1);
        }

        // Update cryo vapor / ignition smoke rings
        for (let i = 0; i < smokeCount; i++) {
          const ang = (i / smokeCount) * Math.PI * 2 + t * 0.6;
          const life = ((t * (prog > 0 ? 1.5 : 0.45) + i / smokeCount) % 1);
          const spread = (prog > 0 ? 2.8 : 1.1) * life + 0.5;
          dummy.position.set(
            Math.cos(ang) * spread,
            -1.95 + life * (prog > 0 ? 1.3 : 0.65) - ascentFactor * 6.5,
            Math.sin(ang) * spread
          );
          dummy.scale.setScalar((0.5 + life * 1.4) * (prog > 0 ? 1.3 : 0.7));
          dummy.updateMatrix();
          smokeMesh.setMatrixAt(i, dummy.matrix);
        }
        smokeMesh.instanceMatrix.needsUpdate = true;

        // Planet small & distant during launch
        planetGroup.position.set(-7.5, 2.5, -24);
        planetGroup.scale.setScalar(0.55);

        _camPos.set(4.8, 2.0 + ascentFactor * 1.4, 8.2);
        _camLook.set(0, 0.9 + ascentFactor * 2.2, 0);
      } else {
        // Deep Space Cruise -> Planetary Arrival
        const cruiseFactor = Math.min(1, (prog - 25) / 75);
        const craftOsc = Math.sin(t * 1.6) * 0.16;

        craftGroup.position.set(0.6, craftOsc, 0.4);
        craftGroup.rotation.y = Math.sin(t * 0.45) * 0.35 + 0.55;
        craftGroup.rotation.z = evtOpen ? Math.sin(t * 8) * 0.05 : -0.14;

        const ionPlume = craftGroup.getObjectByName('ionPlume');
        if (ionPlume) {
          ionPlume.visible = prog < 100;
          const pulse = 0.88 + Math.sin(t * 14) * 0.18;
          ionPlume.scale.set(1, pulse, 1);
        }

        // Destination planet sweeps closer into dramatic orbital foreground
        const pScale = 0.72 + cruiseFactor * 0.78;
        planetGroup.scale.setScalar(pScale);
        planetGroup.position.set(
          THREE.MathUtils.lerp(-8.2, -3.9, cruiseFactor),
          THREE.MathUtils.lerp(1.4, -0.7, cruiseFactor),
          THREE.MathUtils.lerp(-18.5, -7.8, cruiseFactor)
        );
        planetGroup.rotation.y += dt * 0.14;

        _camPos.set(4.2, 1.9, 6.2);
        _camLook.set(-0.6, 0, -1.2);
      }

      skyDome.rotation.y += dt * (isLaunchPhase ? 0.008 : 0.024);
      starMesh.rotation.y += dt * (isLaunchPhase ? 0.005 : 0.025);

      camera.position.lerp(_camPos, 1 - Math.exp(-5 * dt));
      camera.lookAt(_camLook);

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
      const w = Math.max(300, container.clientWidth);
      const h = Math.max(280, container.clientHeight);
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
      scene.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
      renderer.dispose();
      sceneRef.current = null;
      cameraRef.current = null;
      rendererRef.current = null;
    };
  }, []);

  // Build 3D Launch Vehicle matched to selected rocket
  useEffect(() => {
    const rGrp = rocketGroupRef.current;
    if (!rGrp) return;

    while (rGrp.children.length > 0) {
      const c = rGrp.children[0];
      rGrp.remove(c);
      c.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const hullMat = new THREE.MeshStandardMaterial({
      color: 0xf8fafc,
      roughness: 0.28,
      metalness: 0.35,
    });
    const accentColor =
      rocketId === 'rocket-titan'
        ? 0xec4899
        : rocketId === 'rocket-helios'
        ? 0xf97316
        : rocketId === 'rocket-astra'
        ? 0xa855f7
        : 0x22d3ee;
    const accentMat = new THREE.MeshStandardMaterial({
      color: accentColor,
      metalness: 0.55,
      roughness: 0.25,
    });
    const darkMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.6,
      roughness: 0.4,
    });

    const coreBody = new THREE.Mesh(new THREE.CylinderGeometry(0.42, 0.46, 3.1, 20), hullMat);
    const interstage = new THREE.Mesh(new THREE.CylinderGeometry(0.43, 0.43, 0.32, 20), accentMat);
    interstage.position.y = 0.72;
    const fairing = new THREE.Mesh(new THREE.ConeGeometry(0.44, 1.05, 20), hullMat);
    fairing.position.y = 2.05;
    const engineBell = new THREE.Mesh(new THREE.CylinderGeometry(0.22, 0.36, 0.42, 16), darkMat);
    engineBell.position.y = -1.72;

    const rocketPlume = new THREE.Mesh(
      new THREE.ConeGeometry(0.44, 1.85, 16),
      new THREE.MeshBasicMaterial({
        color: 0xfb923c,
        transparent: true,
        opacity: 0.88,
        depthWrite: false,
      })
    );
    rocketPlume.name = 'rocketPlume';
    rocketPlume.rotation.x = Math.PI;
    rocketPlume.position.y = -2.85;
    rocketPlume.visible = false;

    rGrp.add(coreBody, interstage, fairing, engineBell, rocketPlume);

    // Side Strap-On Boosters for Astra/Helios/Titan
    if (rocketId === 'rocket-helios' || rocketId === 'rocket-titan' || rocketId === 'rocket-astra') {
      const boosterCount = rocketId === 'rocket-titan' ? 3 : 2;
      for (let i = 0; i < boosterCount; i++) {
        const ang = (i / boosterCount) * Math.PI * 2;
        const bx = Math.cos(ang) * 0.65;
        const bz = Math.sin(ang) * 0.65;
        const bCore = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.2, 2.0, 14), hullMat);
        bCore.position.set(bx, -0.5, bz);
        const bNose = new THREE.Mesh(new THREE.ConeGeometry(0.18, 0.42, 14), accentMat);
        bNose.position.set(bx, 0.7, bz);
        rGrp.add(bCore, bNose);
      }
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [rocketId]);

  // Build Destination Planet Backdrop
  useEffect(() => {
    const pGrp = planetGroupRef.current;
    if (!pGrp) return;

    while (pGrp.children.length > 0) {
      const c = pGrp.children[0];
      pGrp.remove(c);
      if (c instanceof THREE.Mesh) {
        c.geometry.dispose();
        if (Array.isArray(c.material)) c.material.forEach((m) => m.dispose());
        else c.material.dispose();
      }
    }

    const texKind =
      destinationId === 'earth'
        ? 'earth'
        : destinationId === 'moon'
        ? 'moon'
        : destinationId === 'mars'
        ? 'mars'
        : destinationId === 'sun'
        ? 'sun'
        : 'asteroid';

    const tex = createPlanetTexture(texKind, 4);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(3.8, 36, 26),
      new THREE.MeshStandardMaterial({ map: tex, color: 0xffffff, roughness: 0.62, metalness: 0.08 })
    );
    const rimColor =
      destinationId === 'mars'
        ? 0xfb923c
        : destinationId === 'moon'
        ? 0xa78bfa
        : destinationId === 'bennu' || destinationId === 'vesta'
        ? 0x2dd4bf
        : 0x22d3ee;

    const atmo = new THREE.Mesh(
      new THREE.SphereGeometry(4.12, 28, 20),
      createAtmosphereRimMaterial(rimColor, 1.1)
    );
    pGrp.add(sphere, atmo);

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [destinationId]);

  // Build Player's Modular Spacecraft for Cruise & Arrival Stages
  useEffect(() => {
    const root = craftGroupRef.current;
    if (!root) return;

    while (root.children.length > 0) {
      const c = root.children[0];
      root.remove(c);
      c.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

    const getQty = (id: string) =>
      items.find((i) => i.componentId === id)?.quantity ?? 0;

    const foilBump = createFoilBumpTexture();
    const solarTex = createSolarPanelTexture(4);
    const busMat = new THREE.MeshStandardMaterial({
      color: 0xf59e0b,
      metalness: 0.85,
      roughness: 0.28,
      bumpMap: foilBump,
      bumpScale: 0.02,
    });
    const frameMat = new THREE.MeshStandardMaterial({
      color: 0xe2e8f0,
      metalness: 0.82,
      roughness: 0.25,
    });
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      color: 0xffffff,
      metalness: 0.45,
      roughness: 0.2,
    });

    const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.62, 0.62, 1.1, 8), busMat);
    root.add(bus);

    const solarQty = getQty('comp-solar');
    if (solarQty > 0) {
      const len = 1.1 + Math.ceil(solarQty / 2) * 0.35;
      for (const side of [-1, 1]) {
        const wing = new THREE.Mesh(new THREE.BoxGeometry(len, 0.035, 0.68), solarMat);
        wing.position.set(side * (len / 2 + 0.65), 0.1, 0);
        wing.rotation.x = 0.22;
        root.add(wing);
      }
    }

    const antennaQty = getQty('comp-antenna');
    if (antennaQty > 0) {
      const dish = new THREE.Mesh(
        new THREE.LatheGeometry(
          [
            new THREE.Vector2(0.01, 0),
            new THREE.Vector2(0.24, 0.04),
            new THREE.Vector2(0.56, 0.26),
          ],
          24
        ),
        new THREE.MeshStandardMaterial({ color: 0xf8fafc, roughness: 0.22, side: THREE.DoubleSide })
      );
      dish.position.y = 0.72;
      root.add(dish);
    }

    const camQty = getQty('comp-camera');
    if (camQty > 0) {
      const cam = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.16, 0.38, 14),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.8, roughness: 0.2 })
      );
      cam.rotation.x = Math.PI / 2;
      cam.position.set(-0.25, -0.2, 0.62);
      root.add(cam);
    }

    const plume = new THREE.Mesh(
      new THREE.ConeGeometry(0.2, 0.9, 14),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        transparent: true,
        opacity: 0.78,
        depthWrite: false,
      })
    );
    plume.name = 'ionPlume';
    plume.rotation.x = Math.PI;
    plume.position.y = -1.1;
    root.add(plume);

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [items]);

  const stageLabel =
    progress === 0
      ? countdown !== null
        ? `Countdown T-${countdown}`
        : 'Pad Standby'
      : progress < 25
      ? 'Ascent & Liftoff'
      : progress < 66
      ? 'Deep Space Cruise'
      : progress < 100
      ? 'Orbital Insertion'
      : 'Orbit Achieved';

  return (
    <div className="relative w-full h-[380px] sm:h-[420px] rounded-2xl overflow-hidden border border-cyan-500/40 bg-[#050716] shadow-[0_0_46px_rgba(34,211,238,0.16)]">
      <div
        ref={mountRef}
        data-testid="mission-launch-canvas-mount"
        className="w-full h-full"
      />

      <div className="absolute top-3 left-3 pointer-events-none px-3 py-1.5 rounded-lg webgl-hud-panel text-xs font-mono text-cyan-200">
        Flight View: <strong className="text-white">{stageLabel}</strong>
      </div>
    </div>
  );
};
