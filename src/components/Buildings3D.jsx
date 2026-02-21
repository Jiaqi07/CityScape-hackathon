import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

extend({ Line_: THREE.Line });

const GLOW_INTENSITY = 0.4;

export function SolarFarm({ position, color = '#ffe043', scale = 1 }) {
  const ref = useRef();
  useFrame((_, dt) => {
    if (ref.current) ref.current.rotation.y += dt * 0.1;
  });
  return (
    <group position={position} scale={scale}>
      {/* Base pad */}
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.8, 0.1, 0.8]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Solar panels — tilted flat rectangles */}
      {[[-0.2, 0, -0.2], [0.2, 0, -0.2], [-0.2, 0, 0.2], [0.2, 0, 0.2]].map((p, i) => (
        <mesh key={i} position={[p[0], 0.2, p[2]]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.25]} />
          <meshStandardMaterial color="#1a3a5c" metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={GLOW_INTENSITY} />
        </mesh>
      ))}
      <pointLight position={[0, 0.5, 0]} color={color} intensity={0.5} distance={3} />
    </group>
  );
}

export function WindTurbine({ position, color = '#00d4ff', scale = 1 }) {
  const bladeRef = useRef();
  useFrame((_, dt) => {
    if (bladeRef.current) bladeRef.current.rotation.z += dt * 3;
  });
  return (
    <group position={position} scale={scale}>
      {/* Tower */}
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 2.0, 8]} />
        <meshStandardMaterial color="#e0e8f0" metalness={0.6} roughness={0.3} />
      </mesh>
      {/* Nacelle */}
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.08]} />
        <meshStandardMaterial color="#d0d8e0" metalness={0.5} roughness={0.4} />
      </mesh>
      {/* Blades */}
      <group ref={bladeRef} position={[0, 2.05, 0.06]}>
        {[0, 120, 240].map((angle, i) => (
          <mesh key={i} rotation={[0, 0, (angle * Math.PI) / 180]} position={[0, 0, 0]}>
            <boxGeometry args={[0.03, 0.8, 0.01]} />
            <meshStandardMaterial color="#f0f4f8" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
      </group>
      <pointLight position={[0, 2.5, 0]} color={color} intensity={0.4} distance={4} />
    </group>
  );
}

export function BatteryStorage({ position, color = '#a855f7', scale = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
    }
  });
  return (
    <group position={position} scale={scale}>
      {/* Container rows */}
      {[-0.2, 0, 0.2].map((z, i) => (
        <mesh key={i} position={[0, 0.25, z]} ref={i === 1 ? ref : undefined}>
          <boxGeometry args={[0.7, 0.5, 0.15]} />
          <meshStandardMaterial color="#2a1a3e" metalness={0.4} roughness={0.6} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Status light */}
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1} />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color={color} intensity={0.6} distance={3} />
    </group>
  );
}

export function DataCenter({ position, color = '#ff6b6b', scale = 1 }) {
  const lightRef = useRef();
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
    }
  });
  return (
    <group position={position} scale={scale}>
      {/* Main building */}
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.7, 1.0, 0.6]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* Server rack glow lines */}
      {[0.15, 0.3, 0.45, 0.6, 0.75].map((y, i) => (
        <mesh key={i} position={[0.351, y, 0]}>
          <boxGeometry args={[0.01, 0.02, 0.5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.8} />
        </mesh>
      ))}
      {/* Cooling unit */}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Status LED */}
      <mesh ref={lightRef} position={[0.36, 0.85, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color={color} intensity={0.5} distance={3} />
    </group>
  );
}

export function HydrogenPlant({ position, color = '#00ff88', scale = 1 }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
    }
  });
  return (
    <group position={position} scale={scale}>
      {/* Main tank */}
      <mesh ref={ref} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.8, 16]} />
        <meshStandardMaterial color="#0a2a1a" metalness={0.6} roughness={0.4} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      {/* Dome top */}
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0a3a1a" metalness={0.6} roughness={0.4} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Pipes */}
      <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        <meshStandardMaterial color="#3a5a4a" metalness={0.7} roughness={0.3} />
      </mesh>
      <pointLight position={[0, 1.0, 0]} color={color} intensity={0.5} distance={3} />
    </group>
  );
}

export function NuclearReactor({ position, color = '#ff8c42', scale = 1 }) {
  const domeRef = useRef();
  useFrame((state) => {
    if (domeRef.current) {
      domeRef.current.material.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
  });
  return (
    <group position={position} scale={scale}>
      {/* Containment building */}
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.8, 16]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Dome */}
      <mesh ref={domeRef} position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a3a4e" metalness={0.4} roughness={0.5} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      {/* Cooling tower */}
      <mesh position={[0.5, 0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 1.0, 12]} />
        <meshStandardMaterial color="#4a4a5e" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Steam effect — small sphere */}
      <mesh position={[0.5, 1.05, 0]}>
        <sphereGeometry args={[0.12, 8, 8]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.15} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color={color} intensity={0.6} distance={4} />
    </group>
  );
}

export function SubstationPylon({ position, color = '#00d4ff', loadPct = 0.5, scale = 1 }) {
  const glowColor = loadPct > 0.9 ? '#ff3355' : loadPct > 0.75 ? '#ffb800' : '#00ff88';
  return (
    <group position={position} scale={scale}>
      {/* Base */}
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.5]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.6} roughness={0.4} />
      </mesh>
      {/* Transformer */}
      <mesh position={[0, 0.35, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.3} emissive={glowColor} emissiveIntensity={0.2} />
      </mesh>
      {/* Insulators */}
      {[-0.15, 0, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      <pointLight position={[0, 0.7, 0]} color={glowColor} intensity={0.8} distance={4} />
    </group>
  );
}

// Decorative city buildings
export function CityBuilding({ position, height = 1, type = 'commercial', seed = 0 }) {
  const colors = {
    commercial: { base: '#1a2a4a', emissive: '#2040a0', windows: '#3060c0' },
    residential: { base: '#2a2a3a', emissive: '#404060', windows: '#606080' },
    industrial: { base: '#2a2a2a', emissive: '#5a4a2a', windows: '#8a7a4a' },
  };
  const c = colors[type] || colors.commercial;
  const dims = useMemo(() => {
    const s = Math.sin(seed * 127.1 + 311.7) * 0.5 + 0.5;
    return { width: 0.6 + s * 0.3, depth: 0.6 + (1 - s) * 0.3 };
  }, [seed]);

  return (
    <group position={position}>
      <mesh position={[0, height / 2, 0]}>
        <boxGeometry args={[dims.width, height, dims.depth]} />
        <meshStandardMaterial
          color={c.base}
          metalness={0.5}
          roughness={0.5}
          emissive={c.emissive}
          emissiveIntensity={0.08}
        />
      </mesh>
      {/* Window strips */}
      {Array.from({ length: Math.floor(height / 0.2) }, (_, i) => (
        <mesh key={i} position={[dims.width / 2 + 0.001, 0.15 + i * 0.2, 0]}>
          <planeGeometry args={[0.01, 0.08]} />
          <meshStandardMaterial
            color={c.windows}
            emissive={c.windows}
            emissiveIntensity={0.3}
            transparent
            opacity={0.6}
          />
        </mesh>
      ))}
    </group>
  );
}

// Transmission line between two 3D points
export function TransmissionLine({ start, end, loadPct = 0.5 }) {
  const color = loadPct > 0.9 ? '#ff3355' : loadPct > 0.75 ? '#ffb800' : '#00ff88';
  const geometry = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().lerpVectors(s, e, 0.5);
    mid.y += 0.5;
    const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
    const pts = curve.getPoints(20);
    return new THREE.BufferGeometry().setFromPoints(pts);
  }, [start, end]);

  return (
    <line_  geometry={geometry}>
      <lineBasicMaterial color={color} transparent opacity={0.3} />
    </line_>
  );
}

export const BUILDING_COMPONENTS = {
  solar: SolarFarm,
  wind: WindTurbine,
  battery: BatteryStorage,
  datacenter: DataCenter,
  hydrogen: HydrogenPlant,
  nuclear: NuclearReactor,
  substation: SubstationPylon,
};
