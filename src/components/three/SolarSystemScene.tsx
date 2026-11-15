import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { ChevronDown, ChevronUp, Crosshair, Pause, Play, RotateCcw } from 'lucide-react';
import type { DestinationId } from '../../types/mission';
import {
  createAtmosphereRimMaterial,
  createNebulaSkyTexture,
  createPlanetTexture,
  createSolarPanelTexture,
  detectSoftwareGl,
  scheduleAfterDraw,
} from './threeUtils';

interface SolarSystemSceneProps {
  selectedId: DestinationId;
  onSelect: (id: DestinationId) => void;
  selectedName?: string;
  selectedDistance?: string;
  solarPercent?: number;
}

interface BodyConfig {
  id: DestinationId;
  label: string;
  orbitRadius: number;
  radius: number;
  speed: number;
  initialAngle: number;
  inclination: number;
  orbitColor: number;
}

const SOLAR_BODIES: BodyConfig[] = [
  { id: 'sun', label: 'Sun', orbitRadius: 0, radius: 2.35, speed: 0, initialAngle: 0, inclination: 0, orbitColor: 0xfbbf24 },
  { id: 'earth', label: 'Earth', orbitRadius: 7.5, radius: 0.85, speed: 0.35, initialAngle: 0.4, inclination: 0.02, orbitColor: 0x22d3ee },
  { id: 'moon', label: 'Moon', orbitRadius: 1.75, radius: 0.28, speed: 1.3, initialAngle: 1.1, inclination: 0.08, orbitColor: 0xcbd5e1 },
  { id: 'bennu', label: 'Bennu', orbitRadius: 10.6, radius: 0.38, speed: 0.25, initialAngle: 2.2, inclination: 0.07, orbitColor: 0x2dd4bf },
  { id: 'mars', label: 'Mars', orbitRadius: 13.8, radius: 0.68, speed: 0.2, initialAngle: -0.7, inclination: 0.03, orbitColor: 0xf97316 },
  { id: 'vesta', label: 'Vesta', orbitRadius: 19.2, radius: 0.52, speed: 0.13, initialAngle: 1.5, inclination: 0.09, orbitColor: 0xc084fc },
];

export const SolarSystemScene: React.FC<SolarSystemSceneProps> = ({
  selectedId,
  onSelect,
  selectedName,
  selectedDistance,
  solarPercent,
}) => {
  const mountRef = useRef<HTMLDivElement | null>(null);
  const selectedIdRef = useRef<DestinationId>(selectedId);
  const onSelectRef = useRef(onSelect);
  const pausedRef = useRef(false);
  const cameraPresetRef = useRef<DestinationId | 'overview' | null>(null);

  const [isPaused, setIsPaused] = useState(false);
  const [dockCollapsed, setDockCollapsed] = useState(false);

  useEffect(() => {
    selectedIdRef.current = selectedId;
    cameraPresetRef.current = selectedId;
  }, [selectedId]);

  useEffect(() => {
    onSelectRef.current = onSelect;
  }, [onSelect]);

  useEffect(() => {
    pausedRef.current = isPaused;
  }, [isPaused]);

  useEffect(() => {
    const container = mountRef.current;
    if (!container) return;

    const isSoftwareGl = detectSoftwareGl();
    const width = Math.max(320, container.clientWidth);
    const height = Math.max(320, container.clientHeight);

    const scene = new THREE.Scene();
    scene.background = new THREE.Color(0x050716);
    scene.fog = new THREE.FogExp2(0x070a22, 0.006);

    const camera = new THREE.PerspectiveCamera(45, width / height, 0.1, 250);
    camera.position.set(0, 17, 29);

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

    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    const envTex = pmremGenerator.fromScene(new RoomEnvironment(), 0.04).texture;
    scene.environment = envTex;
    pmremGenerator.dispose();

    const sunLight = new THREE.PointLight(0xffedd5, 3.8, 105, 0.5);
    sunLight.position.set(0, 0, 0);
    scene.add(sunLight);

    const hemiLight = new THREE.HemisphereLight(0x38bdf8, 0x31105e, 0.78);
    scene.add(hemiLight);

    const rimLight = new THREE.DirectionalLight(0xe879f9, 0.72);
    rimLight.position.set(-16, 22, -18);
    scene.add(rimLight);

    const maxAniso = renderer.capabilities.getMaxAnisotropy();
    const skyTex = createNebulaSkyTexture();
    const solarTex = createSolarPanelTexture(maxAniso);
    const textures = {
      sun: createPlanetTexture('sun', maxAniso),
      earth: createPlanetTexture('earth', maxAniso),
      moon: createPlanetTexture('moon', maxAniso),
      mars: createPlanetTexture('mars', maxAniso),
      asteroid: createPlanetTexture('asteroid', maxAniso),
    };

    const skyDome = new THREE.Mesh(
      new THREE.SphereGeometry(115, 32, 24),
      new THREE.MeshBasicMaterial({ map: skyTex, side: THREE.BackSide })
    );
    scene.add(skyDome);

    // Multi-colored Starfield (InstancedMesh)
    const starCount = 400;
    const starMesh = new THREE.InstancedMesh(
      new THREE.OctahedronGeometry(0.085, 0),
      new THREE.MeshBasicMaterial({ color: 0xffffff }),
      starCount
    );
    const dummy = new THREE.Object3D();
    const starColors = [
      new THREE.Color(0xffffff),
      new THREE.Color(0x67e8f9),
      new THREE.Color(0xe879f9),
      new THREE.Color(0xfde047),
      new THREE.Color(0x5eead4),
    ];
    for (let i = 0; i < starCount; i++) {
      const theta = (i * 137.5) % (Math.PI * 2);
      const phi = Math.acos(1 - 2 * ((i + 0.5) / starCount));
      const dist = 60 + (i % 34);
      dummy.position.set(
        dist * Math.sin(phi) * Math.cos(theta),
        dist * Math.cos(phi),
        dist * Math.sin(phi) * Math.sin(theta)
      );
      dummy.scale.setScalar(0.6 + (i % 4) * 0.3);
      dummy.updateMatrix();
      starMesh.setMatrixAt(i, dummy.matrix);
      starMesh.setColorAt(i, starColors[i % starColors.length]);
    }
    starMesh.instanceMatrix.needsUpdate = true;
    if (starMesh.instanceColor) starMesh.instanceColor.needsUpdate = true;
    starMesh.computeBoundingSphere();
    scene.add(starMesh);

    // Space Dust Particles
    const dustCount = 280;
    const dustPositions = new Float32Array(dustCount * 3);
    for (let i = 0; i < dustCount; i++) {
      const a = (i * 2.39996) % (Math.PI * 2);
      const r = 3.5 + ((i * 19) % 210) / 10;
      dustPositions[i * 3] = Math.cos(a) * r;
      dustPositions[i * 3 + 1] = (((i * 37) % 40) - 20) * 0.14;
      dustPositions[i * 3 + 2] = Math.sin(a) * r;
    }
    const dustGeo = new THREE.BufferGeometry();
    dustGeo.setAttribute('position', new THREE.BufferAttribute(dustPositions, 3));
    const dustPoints = new THREE.Points(
      dustGeo,
      new THREE.PointsMaterial({
        color: 0xa5f3fc,
        size: 0.11,
        transparent: true,
        opacity: 0.65,
      })
    );
    scene.add(dustPoints);

    // Asteroid belt instanced rocks between Mars and Vesta
    const beltCount = 160;
    const beltMesh = new THREE.InstancedMesh(
      new THREE.DodecahedronGeometry(0.12, 0),
      new THREE.MeshStandardMaterial({
        color: 0xc4b5fd,
        roughness: 0.85,
        metalness: 0.22,
      }),
      beltCount
    );
    for (let i = 0; i < beltCount; i++) {
      const angle = (i / beltCount) * Math.PI * 2 + (i % 7) * 0.08;
      const rad = 16.2 + ((i * 17) % 100) / 38;
      const y = (((i * 29) % 20) - 10) * 0.05;
      dummy.position.set(Math.cos(angle) * rad, y, Math.sin(angle) * rad);
      dummy.rotation.set(i * 0.4, i * 0.7, 0);
      dummy.scale.setScalar(0.65 + (i % 5) * 0.22);
      dummy.updateMatrix();
      beltMesh.setMatrixAt(i, dummy.matrix);
    }
    beltMesh.instanceMatrix.needsUpdate = true;
    beltMesh.computeBoundingSphere();
    scene.add(beltMesh);

    const bodyGroups = new Map<DestinationId, THREE.Group>();
    const clickableMeshes: THREE.Object3D[] = [];
    const angles = new Map<DestinationId, number>();

    const createOrbitRing = (radius: number, color: number, opacity: number) => {
      const pts: THREE.Vector3[] = [];
      const segments = 96;
      for (let i = 0; i <= segments; i++) {
        const a = (i / segments) * Math.PI * 2;
        pts.push(new THREE.Vector3(Math.cos(a) * radius, 0, Math.sin(a) * radius));
      }
      const geo = new THREE.BufferGeometry().setFromPoints(pts);
      const mat = new THREE.LineBasicMaterial({ color, transparent: true, opacity });
      return new THREE.Line(geo, mat);
    };

    for (const cfg of SOLAR_BODIES) {
      angles.set(cfg.id, cfg.initialAngle);
      const group = new THREE.Group();

      if (cfg.id === 'sun') {
        const core = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.radius, 36, 24),
          new THREE.MeshBasicMaterial({ map: textures.sun, color: 0xffffff })
        );
        core.userData.bodyId = 'sun';
        const corona = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.radius * 1.24, 24, 18),
          createAtmosphereRimMaterial(0xfacc15, 1.4)
        );
        const flareRing = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.radius * 1.35, 0.05, 12, 64),
          new THREE.MeshBasicMaterial({ color: 0xfb923c, transparent: true, opacity: 0.5 })
        );
        flareRing.rotation.x = Math.PI / 2.2;
        group.add(core, corona, flareRing);
        clickableMeshes.push(core);
      } else if (cfg.id === 'earth') {
        const planet = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.radius, 36, 24),
          new THREE.MeshStandardMaterial({
            map: textures.earth,
            color: 0xffffff,
            roughness: 0.45,
            metalness: 0.1,
          })
        );
        planet.userData.bodyId = 'earth';
        const clouds = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.radius * 1.03, 28, 20),
          new THREE.MeshStandardMaterial({
            color: 0xe0f2fe,
            transparent: true,
            opacity: 0.16,
            roughness: 0.9,
          })
        );
        clouds.name = 'cloudLayer';
        const atmo = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.radius * 1.14, 24, 18),
          createAtmosphereRimMaterial(0x22d3ee, 1.15)
        );
        const moonOrbit = createOrbitRing(1.75, 0x38bdf8, 0.45);
        group.add(planet, clouds, atmo, moonOrbit);
        clickableMeshes.push(planet);
      } else if (cfg.id === 'moon') {
        const moon = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.radius, 24, 18),
          new THREE.MeshStandardMaterial({
            map: textures.moon,
            color: 0xffffff,
            roughness: 0.85,
            metalness: 0.05,
          })
        );
        moon.userData.bodyId = 'moon';
        const rim = new THREE.Mesh(
          new THREE.TorusGeometry(cfg.radius * 1.6, 0.025, 8, 32),
          new THREE.MeshBasicMaterial({ color: 0xa78bfa, transparent: true, opacity: 0.48 })
        );
        rim.rotation.x = Math.PI / 2;
        group.add(moon, rim);
        clickableMeshes.push(moon);
      } else if (cfg.id === 'mars') {
        const mars = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.radius, 36, 24),
          new THREE.MeshStandardMaterial({
            map: textures.mars,
            color: 0xffffff,
            roughness: 0.78,
            metalness: 0.08,
          })
        );
        mars.userData.bodyId = 'mars';
        const haze = new THREE.Mesh(
          new THREE.SphereGeometry(cfg.radius * 1.14, 24, 18),
          createAtmosphereRimMaterial(0xfb923c, 1.05)
        );
        const phobos = new THREE.Mesh(
          new THREE.DodecahedronGeometry(0.085, 0),
          new THREE.MeshStandardMaterial({ color: 0xfdba74, roughness: 0.85 })
        );
        phobos.position.set(1.08, 0.16, 0);
        group.add(mars, haze, phobos);
        clickableMeshes.push(mars);
      } else {
        const mainRock = new THREE.Mesh(
          new THREE.DodecahedronGeometry(cfg.radius, 1),
          new THREE.MeshStandardMaterial({
            map: textures.asteroid,
            color: cfg.id === 'vesta' ? 0xd8b4fe : 0x5eead4,
            roughness: 0.8,
            metalness: 0.22,
          })
        );
        mainRock.scale.set(1.28, 0.9, 1.02);
        mainRock.userData.bodyId = cfg.id;
        const lobe = new THREE.Mesh(
          new THREE.DodecahedronGeometry(cfg.radius * 0.56, 0),
          new THREE.MeshStandardMaterial({ color: 0x94a3b8, roughness: 0.88 })
        );
        lobe.position.set(cfg.radius * 0.55, cfg.radius * 0.18, 0.08);
        const beaconRing = new THREE.Mesh(
          new THREE.RingGeometry(cfg.radius * 1.48, cfg.radius * 1.62, 32),
          new THREE.MeshBasicMaterial({
            color: cfg.id === 'vesta' ? 0xc084fc : 0x2dd4bf,
            side: THREE.DoubleSide,
            transparent: true,
            opacity: 0.7,
          })
        );
        beaconRing.rotation.x = Math.PI / 2;
        group.add(mainRock, lobe, beaconRing);
        clickableMeshes.push(mainRock);
      }

      // Holographic Orbital Target Lock Reticle + Vertical Beacon Beam
      const reticleGroup = new THREE.Group();
      reticleGroup.name = 'selectionRing';
      const innerRing = new THREE.Mesh(
        new THREE.RingGeometry(cfg.radius * 1.72, cfg.radius * 1.92, 48),
        new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.94,
        })
      );
      innerRing.rotation.x = Math.PI / 2;

      const outerTicks = new THREE.Mesh(
        new THREE.RingGeometry(cfg.radius * 2.1, cfg.radius * 2.2, 6),
        new THREE.MeshBasicMaterial({
          color: 0xe879f9,
          side: THREE.DoubleSide,
          transparent: true,
          opacity: 0.75,
        })
      );
      outerTicks.rotation.x = Math.PI / 2;

      const beaconSpire = new THREE.Mesh(
        new THREE.CylinderGeometry(0.015, 0.04, cfg.radius * 2.4, 8),
        new THREE.MeshBasicMaterial({
          color: 0x22d3ee,
          transparent: true,
          opacity: 0.52,
          depthWrite: false,
        })
      );
      beaconSpire.position.y = cfg.radius * 1.6;

      reticleGroup.add(innerRing, outerTicks, beaconSpire);
      reticleGroup.visible = cfg.id === selectedIdRef.current;
      group.add(reticleGroup);

      scene.add(group);
      bodyGroups.set(cfg.id, group);

      if (cfg.orbitRadius > 0 && cfg.id !== 'moon') {
        const ring = createOrbitRing(cfg.orbitRadius, cfg.orbitColor, 0.45);
        ring.rotation.z = cfg.inclination;
        scene.add(ring);
      }
    }

    // Dynamic Hohmann Transfer Arc connecting Earth to currently targeted destination
    const arcSegments = 40;
    const arcPositions = new Float32Array((arcSegments + 1) * 3);
    const arcGeo = new THREE.BufferGeometry();
    arcGeo.setAttribute('position', new THREE.BufferAttribute(arcPositions, 3));
    const transferArc = new THREE.Line(
      arcGeo,
      new THREE.LineBasicMaterial({
        color: 0x38bdf8,
        transparent: true,
        opacity: 0.72,
      })
    );
    scene.add(transferArc);

    // Animated Interplanetary Explorer Spacecraft
    const cruiser = new THREE.Group();
    const cBus = new THREE.Mesh(
      new THREE.CylinderGeometry(0.15, 0.15, 0.3, 8),
      new THREE.MeshStandardMaterial({ color: 0xf59e0b, metalness: 0.85, roughness: 0.25 })
    );
    const cWingMat = new THREE.MeshStandardMaterial({ map: solarTex, color: 0xffffff });
    const cWings = new THREE.Mesh(new THREE.BoxGeometry(0.86, 0.02, 0.19), cWingMat);
    const cPlume = new THREE.Mesh(
      new THREE.ConeGeometry(0.065, 0.28, 8),
      new THREE.MeshBasicMaterial({ color: 0x22d3ee, transparent: true, opacity: 0.85 })
    );
    cPlume.rotation.x = Math.PI;
    cPlume.position.y = -0.26;
    cruiser.add(cBus, cWings, cPlume);
    cruiser.rotation.x = Math.PI / 2;
    scene.add(cruiser);

    const controls = new OrbitControls(camera, renderer.domElement);
    controls.enableDamping = !isSoftwareGl;
    controls.dampingFactor = 0.06;
    controls.minDistance = 4;
    controls.maxDistance = 60;
    controls.maxPolarAngle = Math.PI * 0.48;

    controls.addEventListener('start', () => {
      cameraPresetRef.current = null;
    });

    const raycaster = new THREE.Raycaster();
    const pointer = new THREE.Vector2();
    let downX = 0;
    let downY = 0;

    const onPointerDown = (e: PointerEvent) => {
      downX = e.clientX;
      downY = e.clientY;
    };

    const onPointerUp = (e: PointerEvent) => {
      const dist = Math.hypot(e.clientX - downX, e.clientY - downY);
      if (dist > 6) return;
      const rect = renderer.domElement.getBoundingClientRect();
      pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(pointer, camera);
      const hits = raycaster.intersectObjects(clickableMeshes, false);
      if (hits.length > 0) {
        const hitId = hits[0].object.userData.bodyId as DestinationId | undefined;
        if (hitId) {
          onSelectRef.current(hitId);
        }
      }
    };

    renderer.domElement.addEventListener('pointerdown', onPointerDown);
    renderer.domElement.addEventListener('pointerup', onPointerUp);

    const _targetPos = new THREE.Vector3();
    const _desiredCamPos = new THREE.Vector3();
    const _earthPos = new THREE.Vector3();
    const _destPos = new THREE.Vector3();
    const clock = new THREE.Clock();
    let frameHandle = 0;
    let disposed = false;
    let cruiserAngle = 0.2;

    const updatePositions = (dt: number) => {
      for (const cfg of SOLAR_BODIES) {
        if (!pausedRef.current) {
          angles.set(cfg.id, (angles.get(cfg.id) ?? 0) + cfg.speed * dt);
        }
        const a = angles.get(cfg.id) ?? 0;
        const grp = bodyGroups.get(cfg.id);
        if (!grp) continue;

        if (cfg.id === 'sun') {
          grp.position.set(0, 0, 0);
          grp.rotation.y += dt * 0.14;
        } else if (cfg.id === 'moon') {
          const earthGrp = bodyGroups.get('earth');
          if (earthGrp) _earthPos.copy(earthGrp.position);
          grp.position.set(
            _earthPos.x + Math.cos(a) * cfg.orbitRadius,
            Math.sin(a) * 0.14,
            _earthPos.z + Math.sin(a) * cfg.orbitRadius
          );
          grp.rotation.y += dt * 0.35;
        } else {
          const x = Math.cos(a) * cfg.orbitRadius;
          const z = Math.sin(a) * cfg.orbitRadius;
          const y = Math.sin(a) * cfg.orbitRadius * Math.sin(cfg.inclination);
          grp.position.set(x, y, z);
          grp.rotation.y += dt * 0.45;
          if (cfg.id === 'earth') {
            const cld = grp.getObjectByName('cloudLayer');
            if (cld) cld.rotation.y += dt * 0.18;
          }
        }

        const ring = grp.getObjectByName('selectionRing');
        if (ring) {
          ring.visible = cfg.id === selectedIdRef.current;
          ring.rotation.y += dt * 0.8;
        }
      }

      // Update Hohmann Transfer Arc between Earth and selected non-Earth/non-Sun target
      const eGrp = bodyGroups.get('earth');
      const dGrp = bodyGroups.get(selectedIdRef.current);
      if (eGrp && dGrp && selectedIdRef.current !== 'earth' && selectedIdRef.current !== 'sun') {
        transferArc.visible = true;
        _earthPos.copy(eGrp.position);
        _destPos.copy(dGrp.position);
        const posAttr = arcGeo.getAttribute('position') as THREE.BufferAttribute;
        for (let i = 0; i <= arcSegments; i++) {
          const u = i / arcSegments;
          const px = THREE.MathUtils.lerp(_earthPos.x, _destPos.x, u);
          const pz = THREE.MathUtils.lerp(_earthPos.z, _destPos.z, u);
          const py =
            THREE.MathUtils.lerp(_earthPos.y, _destPos.y, u) +
            Math.sin(u * Math.PI) * 1.4;
          posAttr.setXYZ(i, px, py, pz);
        }
        posAttr.needsUpdate = true;
      } else {
        transferArc.visible = false;
      }

      if (!pausedRef.current) {
        beltMesh.rotation.y += dt * 0.03;
        dustPoints.rotation.y += dt * 0.012;
        cruiserAngle += dt * 0.32;
      }
      const cruiserR = 10.6 + Math.sin(cruiserAngle * 2) * 3.1;
      cruiser.position.set(
        Math.cos(cruiserAngle) * cruiserR,
        0.5 + Math.sin(cruiserAngle * 3) * 0.35,
        Math.sin(cruiserAngle) * cruiserR
      );
      cruiser.rotation.z = -cruiserAngle;

      const preset = cameraPresetRef.current;
      if (preset === 'overview') {
        _targetPos.set(0, 0, 0);
        _desiredCamPos.set(0, 17, 29);
        controls.target.lerp(_targetPos, 1 - Math.exp(-5 * dt));
        camera.position.lerp(_desiredCamPos, 1 - Math.exp(-4 * dt));
        if (camera.position.distanceTo(_desiredCamPos) < 0.18) {
          cameraPresetRef.current = null;
        }
      } else if (preset) {
        const focusGrp = bodyGroups.get(preset);
        if (focusGrp) {
          _targetPos.copy(focusGrp.position);
          const offsetScale = preset === 'moon' ? 4.0 : preset === 'sun' ? 9.5 : 5.6;
          _desiredCamPos.set(
            _targetPos.x + offsetScale,
            _targetPos.y + offsetScale * 0.62,
            _targetPos.z + offsetScale * 1.15
          );
          controls.target.lerp(_targetPos, 1 - Math.exp(-5.5 * dt));
          camera.position.lerp(_desiredCamPos, 1 - Math.exp(-4.5 * dt));
          if (camera.position.distanceTo(_desiredCamPos) < 0.25) {
            cameraPresetRef.current = null;
          }
        }
      }
    };

    const tick = () => {
      if (disposed) return;
      const dt = Math.min(0.1, clock.getDelta());
      updatePositions(dt);
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

    updatePositions(0.016);
    if (!isSoftwareGl) {
      renderer.compile(scene, camera);
    }
    tick();

    const handleResize = () => {
      if (!container) return;
      const w = Math.max(320, container.clientWidth);
      const h = Math.max(320, container.clientHeight);
      camera.aspect = w / h;
      camera.updateProjectionMatrix();
      renderer.setSize(w, h);
    };
    window.addEventListener('resize', handleResize);

    return () => {
      disposed = true;
      cancelAnimationFrame(frameHandle);
      clearTimeout(frameHandle);
      window.removeEventListener('resize', handleResize);
      renderer.domElement.removeEventListener('pointerdown', onPointerDown);
      renderer.domElement.removeEventListener('pointerup', onPointerUp);
      controls.dispose();
      envTex.dispose();
      skyTex.dispose();
      solarTex.dispose();
      dustGeo.dispose();
      arcGeo.dispose();
      Object.values(textures).forEach((t) => t.dispose());
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

  const handleResetView = () => {
    cameraPresetRef.current = 'overview';
  };

  return (
    <div className="relative w-full h-full min-h-[520px] rounded-2xl overflow-hidden border border-cyan-500/35 bg-[#050716] shadow-[0_0_42px_rgba(34,211,238,0.14)]">
      <div
        ref={mountRef}
        data-testid="solar-system-canvas-mount"
        className="w-full h-full cursor-grab active:cursor-grabbing"
      />

      <div className="absolute top-3 left-3 pointer-events-none px-3 py-1.5 rounded-lg webgl-hud-panel text-xs text-cyan-100">
        Drag to orbit · Scroll to zoom · Click any planet or asteroid
      </div>

      {selectedName && (
        <div className="absolute top-3 right-3 pointer-events-none px-3 py-1.5 rounded-lg webgl-hud-panel text-xs flex items-center gap-2">
          <Crosshair className="w-3.5 h-3.5 text-cyan-300" aria-hidden="true" />
          <span className="font-semibold text-white">{selectedName}</span>
          {selectedDistance && (
            <span className="font-mono text-cyan-300 hidden sm:inline">· {selectedDistance}</span>
          )}
          {typeof solarPercent === 'number' && (
            <span className="font-mono text-amber-300 hidden md:inline">· {solarPercent}% Sun</span>
          )}
        </div>
      )}

      {/* Collapsible Bottom Control Dock (Zero Viewport Occlusion) */}
      <div className="absolute bottom-3 left-1/2 -translate-x-1/2 w-[94%] max-w-[800px] flex flex-col items-center z-10">
        <button
          type="button"
          onClick={() => setDockCollapsed((v) => !v)}
          className="mb-1.5 px-3 py-1 rounded-md webgl-hud-panel text-xs font-medium text-cyan-200 hover:text-white flex items-center gap-1.5 cursor-pointer"
        >
          {dockCollapsed ? (
            <>
              <ChevronUp className="w-3.5 h-3.5" aria-hidden="true" />
              Show Orbit Dock
            </>
          ) : (
            <>
              <ChevronDown className="w-3.5 h-3.5" aria-hidden="true" />
              Hide Orbit Dock
            </>
          )}
        </button>

        {!dockCollapsed && (
          <div className="w-full px-3 py-2.5 rounded-xl webgl-hud-panel flex flex-wrap items-center justify-between gap-2">
            <div className="flex flex-wrap items-center gap-1.5">
              {SOLAR_BODIES.map((b) => {
                const active = selectedId === b.id;
                return (
                  <button
                    key={b.id}
                    type="button"
                    onClick={() => onSelect(b.id)}
                    className={`px-2.5 py-1.5 rounded-md text-xs font-medium whitespace-nowrap shrink-0 transition-colors cursor-pointer ${
                      active
                        ? 'bg-gradient-to-r from-cyan-400 to-violet-400 text-slate-950 font-semibold'
                        : 'bg-slate-800/90 text-slate-200 hover:bg-slate-700 hover:text-white'
                    }`}
                  >
                    {b.label}
                  </button>
                );
              })}
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setIsPaused((p) => !p)}
                className="px-2.5 py-1.5 rounded-md bg-slate-800/90 text-slate-100 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                {isPaused ? (
                  <>
                    <Play className="w-3.5 h-3.5" aria-hidden="true" />
                    Resume Orbits
                  </>
                ) : (
                  <>
                    <Pause className="w-3.5 h-3.5" aria-hidden="true" />
                    Pause Orbits
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={handleResetView}
                className="px-2.5 py-1.5 rounded-md bg-slate-800/90 text-slate-100 hover:bg-slate-700 text-xs font-medium flex items-center gap-1.5 whitespace-nowrap cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" aria-hidden="true" />
                System View
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
