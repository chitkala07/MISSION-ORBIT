import * as THREE from 'three';

/**
 * Detects software WebGL renderers (SwiftShader, llvmpipe, WARP) from the GPU renderer string
 * so CPU-rendered headless browsers stay responsive without altering scene content or app logic.
 */
export function detectSoftwareGl(): boolean {
  if (typeof document === 'undefined') return true;
  try {
    const canvas = document.createElement('canvas');
    const gl = canvas.getContext('webgl2') || canvas.getContext('webgl');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param) || '');
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

/**
 * Paces software WebGL animation frames after GPU/CPU command completion so the main thread
 * and DOM interaction remain snappy even without hardware acceleration.
 */
export function scheduleAfterDraw(
  renderer: THREE.WebGLRenderer,
  cb: () => void,
  setHandle: (id: number) => void
) {
  const gl = renderer.getContext() as WebGL2RenderingContext | null;
  if (!gl || typeof gl.fenceSync !== 'function') {
    setHandle(window.setTimeout(cb, 80));
    return;
  }
  const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
  gl.flush();
  const poll = () => {
    const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
    if (state === gl.UNSIGNALED) {
      setHandle(window.setTimeout(poll, 5));
    } else {
      if (sync) gl.deleteSync(sync);
      setHandle(window.setTimeout(cb, 80));
    }
  };
  setHandle(window.setTimeout(poll, 5));
}

export function createNebulaSkyTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  const base = ctx.createLinearGradient(0, 0, 1024, 512);
  base.addColorStop(0, '#07081c');
  base.addColorStop(0.35, '#120d36');
  base.addColorStop(0.68, '#0b1838');
  base.addColorStop(1, '#060718');
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, 1024, 512);

  const clouds = [
    { x: 220, y: 170, r: 240, c0: 'rgba(168, 85, 247, 0.34)', c1: 'rgba(168, 85, 247, 0)' },
    { x: 640, y: 210, r: 260, c0: 'rgba(6, 182, 212, 0.3)', c1: 'rgba(6, 182, 212, 0)' },
    { x: 830, y: 340, r: 210, c0: 'rgba(236, 72, 153, 0.25)', c1: 'rgba(236, 72, 153, 0)' },
    { x: 390, y: 350, r: 200, c0: 'rgba(249, 115, 22, 0.16)', c1: 'rgba(249, 115, 22, 0)' },
    { x: 110, y: 320, r: 190, c0: 'rgba(45, 212, 191, 0.2)', c1: 'rgba(45, 212, 191, 0)' },
  ];

  for (const cl of clouds) {
    const rg = ctx.createRadialGradient(cl.x, cl.y, 12, cl.x, cl.y, cl.r);
    rg.addColorStop(0, cl.c0);
    rg.addColorStop(1, cl.c1);
    ctx.fillStyle = rg;
    ctx.fillRect(0, 0, 1024, 512);
  }

  // Luminous milky-way star dust flecks
  for (let i = 0; i < 420; i++) {
    const x = (i * 197 + 43) % 1024;
    const y = (i * 113 + 29) % 512;
    const alpha = 0.25 + ((i * 17) % 70) / 100;
    const palette = ['#ffffff', '#67e8f9', '#e879f9', '#fde047'];
    ctx.fillStyle = palette[i % palette.length];
    ctx.globalAlpha = alpha;
    ctx.beginPath();
    ctx.arc(x, y, i % 9 === 0 ? 1.8 : 0.9, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  return tex;
}

export function createAtmosphereRimMaterial(
  colorHex: number,
  intensity = 0.85
): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: {
      uColor: { value: new THREE.Color(colorHex) },
      uIntensity: { value: intensity },
    },
    vertexShader: `
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vNormal = normalize(normalMatrix * normal);
        vec4 mvPos = modelViewMatrix * vec4(position, 1.0);
        vViewPos = -mvPos.xyz;
        gl_Position = projectionMatrix * mvPos;
      }
    `,
    fragmentShader: `
      uniform vec3 uColor;
      uniform float uIntensity;
      varying vec3 vNormal;
      varying vec3 vViewPos;
      void main() {
        vec3 viewDir = normalize(vViewPos);
        float rim = pow(1.0 - max(0.0, dot(viewDir, vNormal)), 2.8);
        gl_FragColor = vec4(uColor * uIntensity, rim * 0.78);
      }
    `,
    transparent: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.FrontSide,
  });
}

export function createPlanetTexture(
  kind: 'sun' | 'earth' | 'moon' | 'mars' | 'asteroid',
  maxAnisotropy: number
): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 1024;
  canvas.height = 512;
  const ctx = canvas.getContext('2d')!;

  if (kind === 'sun') {
    const grad = ctx.createLinearGradient(0, 0, 1024, 512);
    grad.addColorStop(0, '#f97316');
    grad.addColorStop(0.4, '#facc15');
    grad.addColorStop(0.7, '#fb923c');
    grad.addColorStop(1, '#ea580c');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 420; i++) {
      const x = (i * 149) % 1024;
      const y = (i * 83) % 512;
      const r = 10 + (i % 34);
      ctx.fillStyle =
        i % 3 === 0
          ? 'rgba(254, 249, 195, 0.35)'
          : i % 3 === 1
          ? 'rgba(251, 146, 60, 0.28)'
          : 'rgba(194, 65, 12, 0.24)';
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
  } else if (kind === 'earth') {
    const ocean = ctx.createLinearGradient(0, 0, 0, 512);
    ocean.addColorStop(0, '#0c4a6e');
    ocean.addColorStop(0.5, '#0369a1');
    ocean.addColorStop(1, '#075985');
    ctx.fillStyle = ocean;
    ctx.fillRect(0, 0, 1024, 512);

    // Subtle deep-ocean currents
    for (let i = 0; i < 22; i++) {
      const rx = (i * 193) % 1024;
      const ry = 40 + ((i * 71) % 430);
      const rg = ctx.createRadialGradient(rx, ry, 10, rx, ry, 120);
      rg.addColorStop(0, 'rgba(34, 211, 238, 0.16)');
      rg.addColorStop(1, 'rgba(34, 211, 238, 0)');
      ctx.fillStyle = rg;
      ctx.fillRect(0, 0, 1024, 512);
    }

    // Organic layered continents with turquoise coastal shelves
    const continents = [
      [210, 175, 115, 72],
      [285, 225, 74, 48],
      [345, 305, 74, 92],
      [580, 155, 130, 74],
      [625, 295, 86, 88],
      [715, 215, 64, 52],
      [835, 325, 72, 50],
      [440, 220, 46, 36],
    ];
    for (const [x, y, rx, ry] of continents) {
      ctx.fillStyle = 'rgba(45, 212, 191, 0.28)';
      ctx.beginPath();
      ctx.ellipse(x, y, rx + 14, ry + 11, 0.35, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#15803d';
      ctx.beginPath();
      ctx.ellipse(x, y, rx, ry, 0.3, 0, Math.PI * 2);
      ctx.fill();

      ctx.fillStyle = '#22c55e';
      ctx.beginPath();
      ctx.ellipse(x - 12, y - 8, rx * 0.54, ry * 0.44, 0.2, 0, Math.PI * 2);
      ctx.fill();
    }

    // Polar ice caps
    ctx.fillStyle = 'rgba(241, 245, 249, 0.9)';
    ctx.fillRect(0, 0, 1024, 24);
    ctx.fillRect(0, 488, 1024, 24);

    // Feathered radial cloud wisps (never hard-edged ovals)
    for (let i = 0; i < 48; i++) {
      const cx = (i * 137 + 29) % 1024;
      const cy = 48 + ((i * 67) % 416);
      const r = 34 + (i % 42);
      ctx.save();
      ctx.translate(cx, cy);
      ctx.scale(2.4, 0.48);
      const cg = ctx.createRadialGradient(0, 0, 2, 0, 0, r);
      cg.addColorStop(0, 'rgba(248, 250, 252, 0.38)');
      cg.addColorStop(0.55, 'rgba(224, 242, 254, 0.16)');
      cg.addColorStop(1, 'rgba(255, 255, 255, 0)');
      ctx.fillStyle = cg;
      ctx.beginPath();
      ctx.arc(0, 0, r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();
    }
  } else if (kind === 'moon') {
    const grad = ctx.createLinearGradient(0, 0, 0, 512);
    grad.addColorStop(0, '#cbd5e1');
    grad.addColorStop(0.5, '#94a3b8');
    grad.addColorStop(1, '#bae6fd');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 180; i++) {
      const x = (i * 167 + 23) % 1024;
      const y = (i * 97 + 19) % 512;
      const r = 6 + (i % 28);
      ctx.fillStyle = i % 3 === 0 ? '#64748b' : i % 3 === 1 ? '#e2e8f0' : '#7dd3fc';
      ctx.globalAlpha = i % 3 === 2 ? 0.22 : 0.72;
      ctx.beginPath();
      ctx.arc(x, y, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  } else if (kind === 'mars') {
    const marsGrad = ctx.createLinearGradient(0, 0, 1024, 512);
    marsGrad.addColorStop(0, '#ea580c');
    marsGrad.addColorStop(0.5, '#f97316');
    marsGrad.addColorStop(1, '#c2410c');
    ctx.fillStyle = marsGrad;
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 92; i++) {
      ctx.fillStyle = i % 2 === 0 ? 'rgba(154, 52, 18, 0.55)' : 'rgba(253, 186, 116, 0.35)';
      ctx.beginPath();
      ctx.ellipse(
        (i * 131) % 1024,
        44 + ((i * 71) % 420),
        48 + (i % 30),
        18 + (i % 14),
        0.22,
        0,
        Math.PI * 2
      );
      ctx.fill();
    }
    // Polar ice caps
    ctx.fillStyle = '#f8fafc';
    ctx.fillRect(0, 0, 1024, 24);
    ctx.fillRect(0, 488, 1024, 24);
  } else {
    const astGrad = ctx.createLinearGradient(0, 0, 1024, 512);
    astGrad.addColorStop(0, '#6d28d9');
    astGrad.addColorStop(0.5, '#475569');
    astGrad.addColorStop(1, '#0f766e');
    ctx.fillStyle = astGrad;
    ctx.fillRect(0, 0, 1024, 512);
    for (let i = 0; i < 180; i++) {
      ctx.fillStyle =
        i % 3 === 0 ? '#a78bfa' : i % 3 === 1 ? '#2dd4bf' : '#94a3b8';
      ctx.globalAlpha = 0.5;
      ctx.beginPath();
      ctx.arc((i * 139) % 1024, (i * 77) % 512, 4 + (i % 18), 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.ClampToEdgeWrapping;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export function createSolarPanelTexture(maxAnisotropy: number): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 256;
  const ctx = canvas.getContext('2d')!;

  const grad = ctx.createLinearGradient(0, 0, 256, 256);
  grad.addColorStop(0, '#0f295a');
  grad.addColorStop(1, '#1e1b4b');
  ctx.fillStyle = grad;
  ctx.fillRect(0, 0, 256, 256);

  ctx.strokeStyle = '#38bdf8';
  ctx.lineWidth = 2;
  for (let x = 0; x <= 256; x += 32) {
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, 256);
    ctx.stroke();
  }
  for (let y = 0; y <= 256; y += 16) {
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(256, y);
    ctx.stroke();
  }
  ctx.strokeStyle = '#cbd5e1';
  ctx.lineWidth = 6;
  ctx.strokeRect(3, 3, 250, 250);

  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  tex.anisotropy = Math.min(8, maxAnisotropy);
  return tex;
}

export function createFoilBumpTexture(): THREE.CanvasTexture {
  const canvas = document.createElement('canvas');
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext('2d')!;

  ctx.fillStyle = '#808080';
  ctx.fillRect(0, 0, 128, 128);
  for (let i = 0; i < 180; i++) {
    const x = (i * 37) % 128;
    const y = (i * 53) % 128;
    ctx.strokeStyle = i % 2 === 0 ? '#b0b0b0' : '#555555';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(x, y);
    ctx.lineTo(x + ((i % 15) - 7), y + ((i % 13) - 6));
    ctx.stroke();
  }

  const tex = new THREE.CanvasTexture(canvas);
  tex.wrapS = THREE.RepeatWrapping;
  tex.wrapT = THREE.RepeatWrapping;
  return tex;
}
