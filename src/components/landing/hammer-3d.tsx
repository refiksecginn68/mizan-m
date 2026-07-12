"use client";

import { useMemo, useRef, useState, useEffect, useCallback } from "react";
import { Canvas, useFrame } from "@react-three/fiber";
import { ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

// ── Malzemeler ────────────────────────────────────────────────────────────────
const WOOD_DARK = "#3d2b1f";
const WOOD_MID = "#5a3f2b";
const GOLD = "#c9a84c";
const BASE_NAVY = "#1a2942";

interface HammerRigProps {
  /** Vuruş tetikleyici sayaç — her artışta bir vuruş oynatılır */
  strikeSignal: number;
}

// Altın partikül sıçraması: vuruş anında kaideden yukarı saçılır
function StrikeParticles({ active }: { active: boolean }) {
  const pointsRef = useRef<THREE.Points>(null);
  const COUNT = 60;

  const { positions, velocities } = useMemo(() => {
    const pos = new Float32Array(COUNT * 3);
    const vel: THREE.Vector3[] = [];
    for (let i = 0; i < COUNT; i++) {
      pos[i * 3] = 0;
      pos[i * 3 + 1] = -0.55;
      pos[i * 3 + 2] = 0;
      vel.push(
        new THREE.Vector3(
          (Math.random() - 0.5) * 2.2,
          Math.random() * 2.4 + 0.6,
          (Math.random() - 0.5) * 2.2
        )
      );
    }
    return { positions: pos, velocities: vel };
  }, []);

  const lifeRef = useRef(0);

  useEffect(() => {
    if (active) {
      lifeRef.current = 1;
      // Partikülleri kaide üstüne sıfırla
      const attr = pointsRef.current?.geometry.getAttribute("position") as THREE.BufferAttribute | undefined;
      if (attr) {
        for (let i = 0; i < COUNT; i++) {
          attr.setXYZ(i, (Math.random() - 0.5) * 0.3, -0.55, (Math.random() - 0.5) * 0.3);
        }
        attr.needsUpdate = true;
      }
    }
  }, [active]);

  useFrame((_, delta) => {
    if (lifeRef.current <= 0 || !pointsRef.current) return;
    lifeRef.current = Math.max(0, lifeRef.current - delta * 1.6);
    const attr = pointsRef.current.geometry.getAttribute("position") as THREE.BufferAttribute;
    for (let i = 0; i < COUNT; i++) {
      attr.setXYZ(
        i,
        attr.getX(i) + velocities[i].x * delta,
        attr.getY(i) + velocities[i].y * delta - 2.2 * delta * (1 - lifeRef.current),
        attr.getZ(i) + velocities[i].z * delta
      );
    }
    attr.needsUpdate = true;
    (pointsRef.current.material as THREE.PointsMaterial).opacity = lifeRef.current;
  });

  return (
    <points ref={pointsRef}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
      </bufferGeometry>
      <pointsMaterial color={GOLD} size={0.035} transparent opacity={0} depthWrite={false} />
    </points>
  );
}

// Çekiç + kaide sahnesi: idle'da yavaş döner, sinyalde vuruş oynatır
function HammerRig({ strikeSignal }: HammerRigProps) {
  const groupRef = useRef<THREE.Group>(null);
  const hammerRef = useRef<THREE.Group>(null);
  const glowRef = useRef<THREE.Mesh>(null);
  // Vuruş ilerlemesi: 0 = beklemede, 0→1 arası animasyon oynar
  const progressRef = useRef(0);
  const playingRef = useRef(false);
  const [particleBurst, setParticleBurst] = useState(false);
  const burstFiredRef = useRef(false);

  useEffect(() => {
    if (strikeSignal > 0) {
      progressRef.current = 0;
      playingRef.current = true;
      burstFiredRef.current = false;
      setParticleBurst(false);
    }
  }, [strikeSignal]);

  useFrame((state, delta) => {
    // Idle: yavaş y-ekseni dönüşü
    if (groupRef.current) {
      groupRef.current.rotation.y += delta * 0.25;
    }

    if (!hammerRef.current) return;

    if (playingRef.current) {
      progressRef.current += delta * 2.2;
      const p = progressRef.current;

      if (p < 0.35) {
        // Aşağı darbe (hızlanan)
        const t = p / 0.35;
        hammerRef.current.rotation.x = THREE.MathUtils.lerp(0.35, -0.55, t * t);
      } else if (p < 1) {
        // Yukarı toparlanma + hafif salınım
        if (!burstFiredRef.current) {
          burstFiredRef.current = true;
          setParticleBurst(true);
        }
        const t = (p - 0.35) / 0.65;
        const ease = 1 - Math.pow(1 - t, 3);
        hammerRef.current.rotation.x = THREE.MathUtils.lerp(-0.55, 0.15, ease) + Math.sin(t * Math.PI * 2) * 0.04 * (1 - t);
      } else {
        hammerRef.current.rotation.x = 0.15;
        playingRef.current = false;
        setParticleBurst(false);
      }
    } else {
      // Beklemede hafif nefes alma
      hammerRef.current.rotation.x = 0.15 + Math.sin(state.clock.elapsedTime * 0.8) * 0.03;
    }

    // Vuruş anında kaidede kısa ışık pulse
    if (glowRef.current) {
      const mat = glowRef.current.material as THREE.MeshBasicMaterial;
      mat.opacity = THREE.MathUtils.lerp(mat.opacity, particleBurst ? 0.5 : 0, delta * 8);
    }
  });

  return (
    <group ref={groupRef} position={[0, 0.1, 0]}>
      {/* Kaide (ses bloğu) */}
      <mesh position={[0, -0.72, 0]} castShadow receiveShadow>
        <cylinderGeometry args={[0.55, 0.65, 0.22, 48]} />
        <meshStandardMaterial color={WOOD_DARK} roughness={0.55} metalness={0.1} />
      </mesh>
      <mesh position={[0, -0.585, 0]}>
        <cylinderGeometry args={[0.42, 0.42, 0.05, 48]} />
        <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.9} />
      </mesh>
      {/* Vuruş ışık pulse'ı */}
      <mesh ref={glowRef} position={[0, -0.55, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.72, 48]} />
        <meshBasicMaterial color={GOLD} transparent opacity={0} depthWrite={false} />
      </mesh>

      {/* Çekiç grubu — pivot sap arkasında */}
      <group ref={hammerRef} position={[0.55, 0.15, 0]} rotation={[0.15, 0, 0]}>
        {/* Sap */}
        <mesh position={[-0.55, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.045, 0.06, 1.15, 24]} />
          <meshStandardMaterial color={WOOD_MID} roughness={0.5} metalness={0.05} />
        </mesh>
        {/* Sap ucu altın bilezik */}
        <mesh position={[0.02, 0, 0]} rotation={[0, 0, Math.PI / 2]} castShadow>
          <cylinderGeometry args={[0.055, 0.055, 0.06, 24]} />
          <meshStandardMaterial color={GOLD} roughness={0.25} metalness={0.9} />
        </mesh>
        {/* Baş (tokmak) */}
        <mesh position={[-1.18, 0, 0]} rotation={[Math.PI / 2, 0, 0]} castShadow>
          <cylinderGeometry args={[0.17, 0.17, 0.5, 32]} />
          <meshStandardMaterial color={WOOD_DARK} roughness={0.45} metalness={0.12} />
        </mesh>
        {/* Baş uçları altın halkalar */}
        {[-0.24, 0.24].map((z) => (
          <mesh key={z} position={[-1.18, 0, z]} rotation={[Math.PI / 2, 0, 0]} castShadow>
            <cylinderGeometry args={[0.175, 0.175, 0.04, 32]} />
            <meshStandardMaterial color={GOLD} roughness={0.22} metalness={0.95} />
          </mesh>
        ))}
      </group>

      <StrikeParticles active={particleBurst} />
    </group>
  );
}

// Ana 3D bileşen: mouse hareketinde debounce'lu vuruş tetikler.
// SSR kapalı (hammer-scene.tsx dynamic import ile yükler).
export default function Hammer3D() {
  const [strikeSignal, setStrikeSignal] = useState(0);
  const lastStrikeRef = useRef(0);

  // Debounce 600ms: sürekli mouse hareketi tek vuruşa indirgenir
  const handlePointerMove = useCallback(() => {
    const now = Date.now();
    if (now - lastStrikeRef.current < 600) return;
    lastStrikeRef.current = now;
    setStrikeSignal((s) => s + 1);
  }, []);

  return (
    <div
      className="w-full h-full cursor-pointer"
      onPointerMove={handlePointerMove}
      role="img"
      aria-label="Üç boyutlu tokmak animasyonu — fareyi hareket ettirince tokmak vurur"
    >
      <Canvas
        camera={{ position: [0, 0.6, 3.4], fov: 42 }}
        dpr={[1, 1.75]}
        gl={{ antialias: true, alpha: true }}
      >
        <ambientLight intensity={0.35} />
        <directionalLight position={[3, 4, 2]} intensity={1.1} castShadow color="#fff7e0" />
        <pointLight position={[-2, 1, -1]} intensity={0.4} color={GOLD} />
        <HammerRig strikeSignal={strikeSignal} />
        <ContactShadows position={[0, -0.85, 0]} opacity={0.5} scale={5} blur={2.4} far={2} color={BASE_NAVY} />
        <Environment preset="city" />
      </Canvas>
    </div>
  );
}
