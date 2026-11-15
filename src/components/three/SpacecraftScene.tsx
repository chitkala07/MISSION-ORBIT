import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Layers, Pause, Play, RotateCcw } from 'lucide-react';
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

interface SpacecraftSceneProps {
  items: SelectedComponentItem[];
  thrusterActive?: boolean;
  destinationId?: DestinationId;
  compact?: boolean;
  highlightPulseKey?: number;
}

/**
 * Dynamic composite 3D Spacecraft Visualizer (Three.js).
 * Staged inside an orbital holographic assembly bay with concentric deck calibration rings,
 * alignment laser beacons, destination planet backdrop, module install flash ring, and ion plume.
 */
export const SpacecraftScene: React.FC<SpacecraftSceneProps> = ({
  items,
  thrusterActive = false,
  destinationId,
  compact = false,
  highlightPulseKey = 0,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const sceneRef = useRef<THREE.Scene | null>(null);
  const cameraRef = useRef<THREE.PerspectiveCamera | null>(null);
  const rendererRef = useRef<THREE.WebGLRenderer | null>(null);
  const spacecraftGroupRef = useRef<THREE.Group | null>(null);
  const planetBackdropRef = useRef<THREE.Group | null>(null);
  const pulseRingRef = useRef<THREE.Mesh | null>(null);
  const explodedRef = useRef<number>(0);
  const targetExplodedRef = useRef<number>(0);
  const thrusterActiveRef = useRef<boolean>(thrusterActive);
  const autoSpinRef = useRef<boolean>(true);
  const popScaleRef = useRef<number>(1);
  const pulseFlashRef = useRef<number>(0);
  const camResetRef = useRef<boolean>(false);

  const [exploded, setExploded] = useState(false);
  const [autoSpin, setAutoSpin] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  useEffect(() => {
    thrusterActiveRef.current = thrusterActive;
  }, [thrusterActive]);

  useEffect(() => {
    autoSpinRef.current = autoSpin;
  }, [autoSpin]);

  useEffect(() => {
    targetExplodedRef.current = exploded ? 1 : 0;
  }, [exploded]);

  useEffect(() => {
    if (highlightPulseKey > 0) {
      popScaleRef.current = 1.14;
      pulseFlashRef.current = 1;
    }
  }, [highlightPulseKey]);

  const getQty = (id: string) =>
    items.find((i) => i.componentId === id)?.quantity ?? 0;

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(280, container.clientWidth);
    const height = Math.max(260, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050716);
    scene.fog = new THREE.FogExp2(0x070a22, 0.011);
    sceneRef.current = scene;

    const camera = new THREE.PerspectiveCamera(42, width / height, 0.1, 140);
    camera.position.set(4.9, 3.1, 5.9);
    cameraRef.current = camera;

    const renderer = new THREE.WebGLRenderer({
      antialias: !isSoftwareGl,
      powerPreference: 'high-performance',
    });
    renderer.setSize(width, height);
    renderer.setPixelRatio(isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    renderer.outputColorSpace = THREE.SRGBColorSpace;
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.2;
    rendererRef.current = renderer;

    container.innerHTML = '';
    container.appendChild(renderer.domElement);

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const skyTex = createNebulaSkyTexture();

    // Cosmic Nebula Backdrop Dome
    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(55, 24, 18),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
    );
    scene.add(skyDome);

    // 3-Point Studio + Cosmic Accent Lighting Rig
    const keyLight = new THREE.DirectionalLight(0xfff1e0, 2.45);
    keyLight.position.set(7, 9, 6);
    scene.add(keyLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x3b0764, 0.9);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xe879f9, 1.3);
    rimLight.position.set(-7, 4, -8);
    scene.add(rimLight);

    // Orbital Hangar Assembly Deck (Concentric holographic telemetry rings + alignment pylons)
    const hangarDeck = new THREE.Group();
    hangarDeck.position.y = -2.1;

    const outerRing = new THREE.Mesh(
      new THREE.RingGeometry(2.7, 2.78, 72),
      new THREE.MeshBasicMaterial({
        color: 0x22d3ee,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.55,
      })
    );
    outerRing.rotation.x = Math.PI / 2;

    const innerRing = new THREE.Mesh(
      new THREE.RingGeometry(1.75, 1.81, 64),
      new THREE.MeshBasicMaterial({
        color: 0xa855f7,
        side: THREE.DoubleSide,
        transparent: true,
        opacity: 0.48,
      })
    );
    innerRing.rotation.x = Math.PI / 2;
    innerRing.position.y = 0.02;

    const deckPlate = new THREE.Mesh(
      new THREE.CircleGeometry(2.7, 48),
      new THREE.MeshBasicMaterial({
        color: 0x0f172a,
        transparent: true,
        opacity: 0.42,
        side: THREE.DoubleSide,
      })
    );
    deckPlate.rotation.x = Math.PI / 2;
    deckPlate.position.y = -0.02;

    hangarDeck.add(outerRing, innerRing, deckPlate);

    // 4 Perimeter Gantry Laser Beacons framing the assembly platform
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + Math.PI / 4;
      const pylon = new THREE.Mesh(
        new THREE.CylinderGeometry(0.025, 0.045, 0.65, 8),
        new THREE.MeshStandardMaterial({ color: 0x64748b, metalness: 0.75, roughness: 0.25 })
      );
      pylon.position.set(Math.cos(ang) * 2.85, 0.32, Math.sin(ang) * 2.85);
      const tip = new THREE.Mesh(
        new THREE.SphereGeometry(0.05, 8, 8),
        new THREE.MeshBasicMaterial({ color: i % 2 === 0 ? 0x22d3ee : 0xe879f9 })
      );
      tip.position.set(Math.cos(ang) * 2.85, 0.68, Math.sin(ang) * 2.85);
      hangarDeck.add(pylon, tip);
    }
    scene.add(hangarDeck);

    // Momentary Installation Pulse Ring
    const pulseRing = new THREE.Mesh(
      new THREE.TorusGeometry(1.45, 0.03, 10, 48),
      new THREE.MeshBasicMaterial({
        color: 0x34d399,
        transparent: true,
        opacity: 0,
      })
    );
    pulseRing.rotation.x = Math.PI / 2;
    scene.add(pulseRing);
    pulseRingRef.current = pulseRing;

    // Colorful Stars (InstancedMesh)
    const starCount = 170;
    const starMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.05, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      starCount
    );
    const dummy = new THREE.Object3D();
    const starPalette = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x67e8f9),
      new THREE.Color(0xe879f9),
      new THREE.Color(0xfde047),
    ];
    for (let i = 0; i < starCount; i++) {
      const th = (i * 137.5) % (Math.PI * 2);
      const ph = Math.acos(1 - 2 * ((i + 0.5) / starCount));
      const d = 24 + (i % 18);
      dummy.position.set(
        d * Math.sin(ph) * Math.cos(th),
        d * Math.cos(ph),
        d * Math.sin(ph) * Math.sin(th)
      );
      dummy.updateMatrix();
      starMesh.setMatrixAt(i, dummy.matrix);
      starMesh.setColorAt(i, starPalette[i % starPalette.length]);
    }
    starMesh.instanceMatrix.needsUpdate = true;
    if (starMesh.instanceColor) starMesh.instanceColor.needsUpdate = true;
    starMesh.computeBoundingSphere();
    scene.add(starMesh);

    const planetBackdrop = new THREE.Group();
    planetBackdrop.position.set(-7.5, -1.9, -11.5);
    scene.add(planetBackdrop);
    planetBackdropRef.current = planetBackdrop;

    const spacecraftRoot = new THREE.Group();
    scene.add(spacecraftRoot);
    spacecraftGroupRef.current = spacecraftRoot;

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 2.6;
    controls.maxDistance = 14;
    controls.target.set(0, 0, 0);

    let frameHandle = 0;
    let disposed = false;
    const clock = new THREE.Clock();
    const _resetCamTarget = new THREE.Vector3(4.9, 3.1, 5.9);
    const _zeroVec = new THREE.Vector3(0, 0, 0);

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.1, clock.getDelta());

      explodedRef.current = THREE.MathUtils.damp(
        explodedRef.current,
        targetExplodedRef.current,
        6,
        dt
      );
      popScaleRef.current = THREE.MathUtils.damp(popScaleRef.current, 1, 8, dt);

      if (pulseFlashRef.current > 0.01) {
        pulseFlashRef.current = Math.max(0, pulseFlashRef.current - dt * 1.8);
        const s = 1 + (1 - pulseFlashRef.current) * 1.4;
        pulseRing.scale.set(s, s, 1);
        (pulseRing.material as THREE.MeshBasicMaterial).opacity = pulseFlashRef.current * 0.85;
      } else {
        (pulseRing.material as THREE.MeshBasicMaterial).opacity = 0;
      }

      const exp = explodedRef.current;

      if (spacecraftRoot) {
        if (autoSpinRef.current) {
          spacecraftRoot.rotation.y += dt * (thrusterActiveRef.current ? 0.36 : 0.22);
        }
        spacecraftRoot.scale.setScalar(popScaleRef.current);
        spacecraftRoot.children.forEach((child) => {
          const base = child.userData.basePos as THREE.Vector3 | undefined;
          const dir = child.userData.explodeOffset as THREE.Vector3 | undefined;
          if (base && dir) {
            child.position.set(
              base.x + dir.x * exp,
              base.y + dir.y * exp,
              base.z + dir.z * exp
            );
          }
          if (child.name === 'ionPlume') {
            child.visible = thrusterActiveRef.current;
            const pulse = 0.88 + Math.sin(clock.elapsedTime * 10) * 0.16;
            child.scale.set(1, pulse, 1);
          }
        });
      }

      outerRing.rotation.z += dt * 0.15;
      innerRing.rotation.z -= dt * 0.22;

      if (planetBackdrop.children.length > 0) {
        planetBackdrop.rotation.y += dt * 0.08;
      }

      if (camResetRef.current) {
        camera.position.lerp(_resetCamTarget, 1 - Math.exp(-6 * dt));
        controls.target.lerp(_zeroVec, 1 - Math.exp(-6 * dt));
        if (camera.position.distanceTo(_resetCamTarget) < 0.08) {
          camResetRef.current = false;
        }
      }

      controls.update();
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
      const w = Math.max(280, container.clientWidth);
      const h = Math.max(260, container.clientHeight);
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
      controls.dispose();
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
      pulseRingRef.current = null;
    };
  }, []);

  // Destination planetary backdrop
  useEffect(() => {
    const grp = planetBackdropRef.current;
    if (!grp) return;

    while (grp.children.length > 0) {
      const child = grp.children[0];
      grp.remove(child);
      if (child instanceof THREE.Mesh) {
        child.geometry.dispose();
        if (Array.isArray(child.material)) child.material.forEach((m) => m.dispose());
        else child.material.dispose();
      }
    }

    if (!destinationId) return;

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

    const planetTex = createPlanetTexture(texKind, 4);
    const sphere = new THREE.Mesh(
      new THREE.SphereGeometry(4.2, 32, 24),
      new THREE.MeshStandardMaterial({
        map: planetTex,
        color: 0xffffff,
        roughness: 0.65,
        metalness: 0.08,
      })
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
      new THREE.SphereGeometry(4.54, 28, 20),
      createAtmosphereRimMaterial(rimColor, 1.05)
    );
    grp.add(sphere, atmo);

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [destinationId]);

  // Rebuild spacecraft modular 3D geometry whenever component selection changes
  useEffect(() => {
    const root = spacecraftGroupRef.current;
    if (!root) return;

    while (root.children.length > 0) {
      const child = root.children[0];
      root.remove(child);
      child.traverse((obj) => {
        if (obj instanceof THREE.Mesh) {
          obj.geometry.dispose();
          if (Array.isArray(obj.material)) obj.material.forEach((m) => m.dispose());
          else obj.material.dispose();
        }
      });
    }

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
    const darkCarbonMat = new THREE.MeshStandardMaterial({
      color: 0x1e293b,
      metalness: 0.35,
      roughness: 0.72,
    });
    const solarMat = new THREE.MeshStandardMaterial({
      map: solarTex,
      color: 0xffffff,
      metalness: 0.45,
      roughness: 0.2,
    });

    const addPart = (
      obj: THREE.Object3D,
      pos: [number, number, number],
      explodeOffset: [number, number, number]
    ) => {
      obj.position.set(pos[0], pos[1], pos[2]);
      obj.userData.basePos = new THREE.Vector3(...pos);
      obj.userData.explodeOffset = new THREE.Vector3(...explodeOffset);
      root.add(obj);
    };

    const bus = new THREE.Mesh(new THREE.CylinderGeometry(0.72, 0.72, 1.25, 8), busMat);
    addPart(bus, [0, 0, 0], [0, 0, 0]);

    const midBand = new THREE.Mesh(
      new THREE.CylinderGeometry(0.75, 0.75, 0.12, 8),
      darkCarbonMat
    );
    addPart(midBand, [0, 0.02, 0], [0, 0, 0]);

    const topCap = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.77, 0.12, 8), frameMat);
    addPart(topCap, [0, 0.68, 0], [0, 0.45, 0]);

    const botCap = new THREE.Mesh(new THREE.CylinderGeometry(0.77, 0.77, 0.12, 8), frameMat);
    addPart(botCap, [0, -0.68, 0], [0, -0.45, 0]);

    const computerQty = getQty('comp-computer');
    for (let i = 0; i < computerQty; i++) {
      const avBox = new THREE.Group();
      const chassis = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.32, 0.18), darkCarbonMat);
      const faceplate = new THREE.Mesh(
        new THREE.BoxGeometry(0.36, 0.22, 0.04),
        new THREE.MeshStandardMaterial({ color: 0x22d3ee, metalness: 0.5, roughness: 0.25 })
      );
      faceplate.position.z = 0.09;
      avBox.add(chassis, faceplate);
      addPart(avBox, [0, 0.18 - i * 0.38, 0.74], [0, 0, 0.7]);
    }

    const solarQty = getQty('comp-solar');
    if (solarQty > 0) {
      const wingPairs = Math.ceil(solarQty / 2);
      const panelLen = 1.25 + wingPairs * 0.42;
      for (const side of [-1, 1]) {
        const wing = new THREE.Group();
        const yoke = new THREE.Mesh(
          new THREE.CylinderGeometry(0.08, 0.08, 0.16, 10),
          busMat
        );
        yoke.rotation.z = Math.PI / 2;
        yoke.position.x = side * 0.08;

        const boom = new THREE.Mesh(
          new THREE.CylinderGeometry(0.035, 0.035, panelLen + 0.35, 10),
          frameMat
        );
        boom.rotation.z = Math.PI / 2;
        boom.position.x = side * (panelLen / 2 + 0.15);

        const panel = new THREE.Mesh(new THREE.BoxGeometry(panelLen, 0.04, 0.78), solarMat);
        panel.position.x = side * (panelLen / 2 + 0.32);

        const frame = new THREE.Mesh(
          new THREE.BoxGeometry(panelLen + 0.04, 0.025, 0.82),
          frameMat
        );
        frame.position.copy(panel.position);

        wing.add(yoke, boom, frame, panel);
        wing.rotation.x = 0.22;
        addPart(wing, [side * 0.72, 0.1, 0], [side * 0.9, 0.15, 0]);
      }
    }

    const batteryQty = getQty('comp-battery');
    for (let i = 0; i < Math.min(batteryQty, 4); i++) {
      const angle = (i * Math.PI) / 2 + Math.PI / 4;
      const cell = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.14, 0.46, 12),
        new THREE.MeshStandardMaterial({ color: 0x34d399, metalness: 0.45, roughness: 0.35 })
      );
      addPart(
        cell,
        [Math.cos(angle) * 0.78, -0.18, Math.sin(angle) * 0.78],
        [Math.cos(angle) * 0.55, 0, Math.sin(angle) * 0.55]
      );
    }

    const antennaQty = getQty('comp-antenna');
    for (let i = 0; i < antennaQty; i++) {
      const dishGroup = new THREE.Group();
      const mast = new THREE.Mesh(new THREE.CylinderGeometry(0.04, 0.05, 0.48, 12), frameMat);
      mast.position.y = 0.24;

      const pts = [
        new THREE.Vector2(0.01, 0),
        new THREE.Vector2(0.25, 0.04),
        new THREE.Vector2(0.5, 0.14),
        new THREE.Vector2(0.68, 0.32),
      ];
      const dish = new THREE.Mesh(
        new THREE.LatheGeometry(pts, 28),
        new THREE.MeshStandardMaterial({
          color: 0xf8fafc,
          roughness: 0.22,
          metalness: 0.3,
          side: THREE.DoubleSide,
        })
      );
      dish.position.y = 0.46;

      const feedHorn = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.06, 0.34, 12), busMat);
      feedHorn.position.y = 0.64;

      dishGroup.add(mast, dish, feedHorn);
      const xOff = antennaQty === 1 ? 0 : (i - (antennaQty - 1) / 2) * 0.62;
      dishGroup.scale.setScalar(i === 0 ? 1 : 0.65);
      addPart(dishGroup, [xOff, 0.72, 0], [xOff * 0.6, 0.8, 0]);
    }

    const cameraQty = getQty('comp-camera');
    for (let i = 0; i < cameraQty; i++) {
      const camGroup = new THREE.Group();
      const barrel = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.46, 16), darkCarbonMat);
      barrel.rotation.x = Math.PI / 2;
      const lensRing = new THREE.Mesh(new THREE.TorusGeometry(0.16, 0.025, 10, 24), frameMat);
      lensRing.position.z = 0.23;
      const glass = new THREE.Mesh(
        new THREE.CircleGeometry(0.14, 24),
        new THREE.MeshStandardMaterial({ color: 0x06b6d4, metalness: 0.9, roughness: 0.08 })
      );
      glass.position.z = 0.235;
      camGroup.add(barrel, lensRing, glass);
      addPart(camGroup, [-0.36 + i * 0.42, -0.24, 0.74], [-0.3, -0.1, 0.75]);
    }

    const sensorQty = getQty('comp-sensors');
    if (sensorQty > 0) {
      const boomGroup = new THREE.Group();
      const arm = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10), frameMat);
      arm.rotation.x = Math.PI / 2;
      arm.position.z = -0.45;
      const head = new THREE.Mesh(
        new THREE.OctahedronGeometry(0.14, 0),
        new THREE.MeshStandardMaterial({ color: 0xf472b6, metalness: 0.65, roughness: 0.2 })
      );
      head.position.z = -0.92;
      boomGroup.add(arm, head);
      addPart(boomGroup, [0.25, 0.35, -0.7], [0.25, 0.25, -0.7]);
    }

    const instQty = getQty('comp-instrument');
    if (instQty > 0) {
      const specGroup = new THREE.Group();
      const body = new THREE.Mesh(new THREE.BoxGeometry(0.42, 0.38, 0.34), frameMat);
      const emitter = new THREE.Mesh(
        new THREE.CylinderGeometry(0.08, 0.1, 0.2, 12),
        new THREE.MeshStandardMaterial({ color: 0xa855f7, metalness: 0.6, roughness: 0.25 })
      );
      emitter.rotation.x = Math.PI / 2;
      emitter.position.z = -0.22;
      specGroup.add(body, emitter);
      addPart(specGroup, [-0.28, -0.22, -0.78], [-0.3, -0.2, -0.75]);
    }

    const thermalQty = getQty('comp-thermal');
    if (thermalQty > 0) {
      for (const side of [-1, 1]) {
        const louver = new THREE.Mesh(
          new THREE.BoxGeometry(0.06, 0.65, 0.44),
          new THREE.MeshStandardMaterial({ color: 0xfef08a, metalness: 0.8, roughness: 0.22 })
        );
        addPart(louver, [side * 0.76, -0.28, 0], [side * 0.55, -0.2, 0]);
      }
    }

    const propQty = getQty('comp-propulsion');
    for (let i = 0; i < propQty; i++) {
      const thruster = new THREE.Group();
      const nozzle = new THREE.Mesh(
        new THREE.CylinderGeometry(0.14, 0.26, 0.38, 20),
        darkCarbonMat
      );
      const glowRing = new THREE.Mesh(
        new THREE.TorusGeometry(0.22, 0.028, 10, 24),
        new THREE.MeshBasicMaterial({ color: 0x22d3ee })
      );
      glowRing.rotation.x = Math.PI / 2;
      glowRing.position.y = -0.18;
      thruster.add(nozzle, glowRing);
      const xPos = propQty === 1 ? 0 : i === 0 ? -0.28 : 0.28;
      addPart(thruster, [xPos, -0.92, 0], [xPos * 0.5, -0.7, 0]);

      const plume = new THREE.Mesh(
        new THREE.ConeGeometry(0.22, 0.95, 16),
        new THREE.MeshBasicMaterial({
          color: 0x38bdf8,
          transparent: true,
          opacity: 0.72,
          depthWrite: false,
        })
      );
      plume.name = 'ionPlume';
      plume.rotation.x = Math.PI;
      plume.visible = thrusterActiveRef.current;
      addPart(plume, [xPos, -1.52, 0], [xPos * 0.5, -1.0, 0]);
    }

    if (getQty('comp-lander') > 0) {
      for (let i = 0; i < 4; i++) {
        const ang = (i * Math.PI) / 2 + Math.PI / 4;
        const legGroup = new THREE.Group();
        const strut = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.95, 10), frameMat);
        strut.rotation.z = -0.48;
        strut.position.set(0.32, -0.35, 0);
        const pad = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.17, 0.06, 14), busMat);
        pad.position.set(0.55, -0.78, 0);
        legGroup.add(strut, pad);
        legGroup.rotation.y = ang;
        addPart(legGroup, [Math.cos(ang) * 0.55, -0.62, -Math.sin(ang) * 0.55], [
          Math.cos(ang) * 0.5,
          -0.65,
          -Math.sin(ang) * 0.5,
        ]);
      }
    }

    if (rendererRef.current && sceneRef.current && cameraRef.current) {
      rendererRef.current.render(sceneRef.current, cameraRef.current);
    }
  }, [items]);

  return (
    <div
      className={`relative w-full ${
        compact ? 'h-[340px]' : 'h-[450px] lg:h-[510px]'
      } rounded-2xl overflow-hidden border border-violet-500/40 bg-[#050716] shadow-[0_0_42px_rgba(139,92,246,0.18)]`}
    >
      <div
        ref={mountRef}
        data-testid="spacecraft-canvas-mount"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      <div className="absolute top-3 left-3 pointer-events-none px-3 py-1.5 rounded-lg webgl-hud-panel text-xs text-cyan-100">
        {items.reduce((s, i) => s + i.quantity, 0)} active modules · Drag to inspect
      </div>

      {/* Collapsible Bottom Control Dock */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 flex flex-col items-center z-10">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1 px-2.5 py-0.5 rounded webgl-hud-panel text-[11px] font-medium text-cyan-200 hover:text-white flex items-center gap-1 cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3 h-3" aria-hidden="true" />
              Controls
            </>
          ) : (
            <>
              <ChevronDown className="w-3 h-3" aria-hidden="true" />
              Hide
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="px-3 py-1.5 rounded-lg webgl-hud-panel flex items-center gap-2">
            <button
              type="button"
              onClick={() => setExploded((v) => !v)}
              className={`px-2.5 py-1 rounded text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer transition-colors ${
                exploded
                  ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 font-semibold'
                  : 'bg-slate-800/90 text-slate-100 hover:bg-slate-700'
              }`}
            >
              <Layers className="w-3.5 h-3.5" aria-hidden="true" />
              {exploded ? 'Assemble View' : 'Exploded View'}
            </button>
            <button
              type="button"
              onClick={() => setAutoSpin((v) => !v)}
              className="px-2.5 py-1 rounded bg-slate-800/90 text-slate-100 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              {autoSpin ? (
                <>
                  <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                  Pause Spin
                </>
              ) : (
                <>
                  <Play className="w-3.5 h-3.5" aria-hidden="true" />
                  Spin Craft
                </>
              )}
            </button>
            <button
              type="button"
              onClick={() => {
                camResetRef.current = true;
              }}
              className="px-2.5 py-1 rounded bg-slate-800/90 text-slate-100 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
            >
              <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
              Reset Camera
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
