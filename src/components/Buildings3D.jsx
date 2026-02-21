import { useRef, useMemo } from 'react';
import { useFrame, extend } from '@react-three/fiber';
import * as THREE from 'three';

extend({ Line_: THREE.Line });

const GLOW_INTENSITY = 0.5;

export function SolarFarm({ position, color = '#ffe043', scale = 1 }) {
  const groupRef = useRef();
  const glowRef = useRef();
  useFrame((state, dt) => {
    if (groupRef.current) groupRef.current.rotation.y += dt * 0.08;
    if (glowRef.current) {
      glowRef.current.material.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.15;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.05, 0]}>
        <boxGeometry args={[0.85, 0.1, 0.85]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.3} roughness={0.8} />
      </mesh>
      {[[-0.2, -0.2], [0.2, -0.2], [-0.2, 0.2], [0.2, 0.2]].map((p, i) => (
        <mesh key={i} ref={i === 0 ? glowRef : undefined} position={[p[0], 0.2, p[1]]} rotation={[-0.3, 0, 0]}>
          <boxGeometry args={[0.3, 0.02, 0.25]} />
          <meshStandardMaterial color="#1a3a5c" metalness={0.9} roughness={0.1} emissive={color} emissiveIntensity={GLOW_INTENSITY} />
        </mesh>
      ))}
      {/* Energy halo */}
      <mesh position={[0, 0.12, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.35, 0.42, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.15} />
      </mesh>
      <pointLight position={[0, 0.5, 0]} color={color} intensity={0.6} distance={3.5} />
    </group>
  );
}

export function WindTurbine({ position, color = '#00d4ff', scale = 1 }) {
  const bladeRef = useRef();
  const beaconRef = useRef();
  useFrame((state, dt) => {
    if (bladeRef.current) bladeRef.current.rotation.z += dt * 3;
    if (beaconRef.current) {
      beaconRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 2) * 0.4;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 1.0, 0]}>
        <cylinderGeometry args={[0.04, 0.08, 2.0, 8]} />
        <meshStandardMaterial color="#e0e8f0" metalness={0.6} roughness={0.3} />
      </mesh>
      <mesh position={[0, 2.05, 0]}>
        <boxGeometry args={[0.12, 0.1, 0.08]} />
        <meshStandardMaterial color="#d0d8e0" metalness={0.5} roughness={0.4} />
      </mesh>
      <group ref={bladeRef} position={[0, 2.05, 0.06]}>
        {[0, 120, 240].map((angle, i) => (
          <mesh key={i} rotation={[0, 0, (angle * Math.PI) / 180]}>
            <boxGeometry args={[0.03, 0.8, 0.01]} />
            <meshStandardMaterial color="#f0f4f8" metalness={0.3} roughness={0.5} />
          </mesh>
        ))}
      </group>
      {/* Aviation beacon */}
      <mesh ref={beaconRef} position={[0, 2.5, 0]}>
        <sphereGeometry args={[0.025, 8, 8]} />
        <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 2.5, 0]} color={color} intensity={0.5} distance={5} />
    </group>
  );
}

export function BatteryStorage({ position, color = '#a855f7', scale = 1 }) {
  const ref = useRef();
  const chargeRef = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.15;
    }
    if (chargeRef.current) {
      const t = (Math.sin(state.clock.elapsedTime * 0.8) + 1) / 2;
      chargeRef.current.scale.y = 0.3 + t * 0.7;
    }
  });
  return (
    <group position={position} scale={scale}>
      {[-0.2, 0, 0.2].map((z, i) => (
        <mesh key={i} position={[0, 0.25, z]} ref={i === 1 ? ref : undefined}>
          <boxGeometry args={[0.7, 0.5, 0.15]} />
          <meshStandardMaterial color="#2a1a3e" metalness={0.4} roughness={0.6} emissive={color} emissiveIntensity={0.3} />
        </mesh>
      ))}
      {/* Charge level indicator */}
      <mesh ref={chargeRef} position={[0.36, 0.25, 0]}>
        <boxGeometry args={[0.02, 0.45, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.8} />
      </mesh>
      <mesh position={[0, 0.55, 0]}>
        <sphereGeometry args={[0.05, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} />
      </mesh>
      <pointLight position={[0, 0.6, 0]} color={color} intensity={0.7} distance={3.5} />
    </group>
  );
}

export function DataCenter({ position, color = '#ff6b6b', scale = 1 }) {
  const lightRef = useRef();
  const rackRefs = useRef([]);
  useFrame((state) => {
    if (lightRef.current) {
      lightRef.current.material.emissiveIntensity = 0.5 + Math.sin(state.clock.elapsedTime * 4) * 0.3;
    }
    rackRefs.current.forEach((r, i) => {
      if (r) {
        r.material.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 3 + i * 0.7) * 0.3;
      }
    });
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.5, 0]}>
        <boxGeometry args={[0.7, 1.0, 0.6]} />
        <meshStandardMaterial color="#1a1a2e" metalness={0.7} roughness={0.3} />
      </mesh>
      {[0.15, 0.3, 0.45, 0.6, 0.75].map((y, i) => (
        <mesh key={i} position={[0.351, y, 0]} ref={el => rackRefs.current[i] = el}>
          <boxGeometry args={[0.01, 0.02, 0.5]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.8} />
        </mesh>
      ))}
      <mesh position={[0, 1.05, 0]}>
        <boxGeometry args={[0.3, 0.1, 0.3]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.5} roughness={0.5} />
      </mesh>
      {/* Ventilation effect */}
      <mesh position={[0, 1.12, 0]}>
        <cylinderGeometry args={[0.08, 0.08, 0.04, 8]} />
        <meshStandardMaterial color="#333" metalness={0.6} roughness={0.4} emissive="#ff3333" emissiveIntensity={0.15} />
      </mesh>
      <mesh ref={lightRef} position={[0.36, 0.85, 0]}>
        <sphereGeometry args={[0.03, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.5} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color={color} intensity={0.6} distance={3.5} />
    </group>
  );
}

export function HydrogenPlant({ position, color = '#00ff88', scale = 1 }) {
  const ref = useRef();
  const bubbleRef = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 1.5) * 0.2;
    }
    if (bubbleRef.current) {
      bubbleRef.current.position.y = 0.9 + (state.clock.elapsedTime % 1) * 0.3;
      bubbleRef.current.material.opacity = 0.6 - (state.clock.elapsedTime % 1) * 0.6;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh ref={ref} position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.25, 0.25, 0.8, 16]} />
        <meshStandardMaterial color="#0a2a1a" metalness={0.6} roughness={0.4} emissive={color} emissiveIntensity={0.3} />
      </mesh>
      <mesh position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.25, 16, 8, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#0a3a1a" metalness={0.6} roughness={0.4} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.3, 0.2, 0]} rotation={[0, 0, Math.PI / 2]}>
        <cylinderGeometry args={[0.03, 0.03, 0.3, 8]} />
        <meshStandardMaterial color="#3a5a4a" metalness={0.7} roughness={0.3} />
      </mesh>
      {/* H2 bubble effect */}
      <mesh ref={bubbleRef} position={[0, 0.9, 0]}>
        <sphereGeometry args={[0.04, 8, 8]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.5} />
      </mesh>
      <pointLight position={[0, 1.0, 0]} color={color} intensity={0.6} distance={3.5} />
    </group>
  );
}

export function NuclearReactor({ position, color = '#ff8c42', scale = 1 }) {
  const domeRef = useRef();
  const steamRef = useRef();
  useFrame((state) => {
    if (domeRef.current) {
      domeRef.current.material.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime) * 0.1;
    }
    if (steamRef.current) {
      const t = state.clock.elapsedTime;
      steamRef.current.scale.setScalar(1 + Math.sin(t * 0.8) * 0.3);
      steamRef.current.material.opacity = 0.12 + Math.sin(t * 0.6) * 0.06;
      steamRef.current.position.y = 1.05 + Math.sin(t * 0.3) * 0.1;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.4, 0]}>
        <cylinderGeometry args={[0.35, 0.4, 0.8, 16]} />
        <meshStandardMaterial color="#2a2a3e" metalness={0.5} roughness={0.5} />
      </mesh>
      <mesh ref={domeRef} position={[0, 0.8, 0]}>
        <sphereGeometry args={[0.35, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2]} />
        <meshStandardMaterial color="#3a3a4e" metalness={0.4} roughness={0.5} emissive={color} emissiveIntensity={0.2} />
      </mesh>
      <mesh position={[0.5, 0.5, 0]}>
        <cylinderGeometry args={[0.2, 0.15, 1.0, 12]} />
        <meshStandardMaterial color="#4a4a5e" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Animated steam cloud */}
      <mesh ref={steamRef} position={[0.5, 1.05, 0]}>
        <sphereGeometry args={[0.15, 10, 10]} />
        <meshStandardMaterial color="#ffffff" transparent opacity={0.12} />
      </mesh>
      {/* Containment ring */}
      <mesh position={[0, 0.02, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.42, 0.48, 32]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} transparent opacity={0.25} />
      </mesh>
      <pointLight position={[0, 1.2, 0]} color={color} intensity={0.7} distance={5} />
    </group>
  );
}

export function SubstationPylon({ position, color = '#00d4ff', loadPct = 0.5, scale = 1 }) {
  const glowColor = loadPct > 0.9 ? '#ff3355' : loadPct > 0.75 ? '#ffb800' : '#00ff88';
  const pulseRef = useRef();
  useFrame((state) => {
    if (pulseRef.current) {
      pulseRef.current.material.emissiveIntensity = 0.3 + Math.sin(state.clock.elapsedTime * 2) * 0.2;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.1, 0]}>
        <boxGeometry args={[0.5, 0.2, 0.5]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.6} roughness={0.4} />
      </mesh>
      <mesh ref={pulseRef} position={[0, 0.35, 0]}>
        <boxGeometry args={[0.3, 0.3, 0.3]} />
        <meshStandardMaterial color="#2a3a4a" metalness={0.7} roughness={0.3} emissive={glowColor} emissiveIntensity={0.3} />
      </mesh>
      {[-0.15, 0, 0.15].map((x, i) => (
        <mesh key={i} position={[x, 0.6, 0]}>
          <cylinderGeometry args={[0.02, 0.02, 0.2, 6]} />
          <meshStandardMaterial color="#5a6a7a" metalness={0.8} roughness={0.2} />
        </mesh>
      ))}
      {/* Base glow ring */}
      <mesh position={[0, 0.015, 0]} rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[0.3, 0.38, 32]} />
        <meshStandardMaterial color={glowColor} emissive={glowColor} emissiveIntensity={0.25} transparent opacity={0.3} />
      </mesh>
      <pointLight position={[0, 0.7, 0]} color={glowColor} intensity={1.0} distance={5} />
    </group>
  );
}

export function SuburbanHomes({ position, color = '#7dd3fc', scale = 1 }) {
  const windowRef = useRef();
  useFrame((state) => {
    if (windowRef.current) {
      windowRef.current.material.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime * 0.8 + 1.2) * 0.08;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.95, 0.04, 0.95]} />
        <meshStandardMaterial color="#0b2a18" roughness={0.9} />
      </mesh>
      {[-0.22, 0.22].map((x, i) => (
        <group key={i} position={[x, 0.02, 0]}>
          <mesh position={[0, 0.16, 0]}>
            <boxGeometry args={[0.28, 0.26, 0.28]} />
            <meshStandardMaterial color="#182338" metalness={0.2} roughness={0.8} emissive={color} emissiveIntensity={0.05} />
          </mesh>
          <mesh position={[0, 0.3, 0]} rotation={[0, Math.PI / 4, 0]}>
            <coneGeometry args={[0.22, 0.18, 4]} />
            <meshStandardMaterial color="#2a2a3a" roughness={0.9} />
          </mesh>
          {/* Window glow */}
          <mesh ref={i === 0 ? windowRef : undefined} position={[0.141, 0.15, 0]}>
            <boxGeometry args={[0.005, 0.08, 0.1]} />
            <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} transparent opacity={0.7} />
          </mesh>
        </group>
      ))}
      {/* Mailbox */}
      <mesh position={[0, 0.1, 0.42]}>
        <boxGeometry args={[0.04, 0.12, 0.04]} />
        <meshStandardMaterial color="#3a4a5a" metalness={0.4} roughness={0.6} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color={color} intensity={0.3} distance={3} />
    </group>
  );
}

export function ApartmentsMidrise({ position, color = '#60a5fa', scale = 1 }) {
  const glowRef = useRef();
  const windowRefs = useRef([]);
  useFrame((state) => {
    if (glowRef.current) glowRef.current.material.emissiveIntensity = 0.15 + Math.sin(state.clock.elapsedTime * 1.5) * 0.05;
    windowRefs.current.forEach((r, i) => {
      if (r) r.material.emissiveIntensity = 0.2 + Math.sin(state.clock.elapsedTime * 0.5 + i * 1.3) * 0.12;
    });
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.6, 0]}>
        <boxGeometry args={[0.75, 1.2, 0.6]} />
        <meshStandardMaterial color="#152033" metalness={0.3} roughness={0.7} />
      </mesh>
      {/* Window ribbons on both sides */}
      <mesh ref={glowRef} position={[0.376, 0.6, 0]}>
        <boxGeometry args={[0.01, 0.9, 0.5]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.15} transparent opacity={0.75} />
      </mesh>
      {[0.25, 0.45, 0.65, 0.85].map((y, i) => (
        <mesh key={i} ref={el => windowRefs.current[i] = el} position={[-0.376, y, 0]}>
          <boxGeometry args={[0.01, 0.06, 0.12]} />
          <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.2} transparent opacity={0.6} />
        </mesh>
      ))}
      {/* Rooftop feature */}
      <mesh position={[0.15, 1.22, 0]}>
        <boxGeometry args={[0.15, 0.04, 0.15]} />
        <meshStandardMaterial color="#1a2a3a" metalness={0.5} roughness={0.4} />
      </mesh>
      <pointLight position={[0, 1.4, 0]} color={color} intensity={0.4} distance={4} />
    </group>
  );
}

export function RetailBlock({ position, color = '#fb7185', scale = 1 }) {
  const neonRef = useRef();
  useFrame((state) => {
    if (neonRef.current) {
      neonRef.current.material.emissiveIntensity = 0.6 + Math.sin(state.clock.elapsedTime * 3) * 0.3;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.9, 0.44, 0.7]} />
        <meshStandardMaterial color="#171b2b" metalness={0.3} roughness={0.8} />
      </mesh>
      {/* Animated neon sign */}
      <mesh ref={neonRef} position={[0, 0.5, 0.36]}>
        <boxGeometry args={[0.55, 0.08, 0.02]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.8} transparent opacity={0.9} />
      </mesh>
      {/* Awning */}
      <mesh position={[0, 0.35, 0.42]}>
        <boxGeometry args={[0.8, 0.02, 0.12]} />
        <meshStandardMaterial color="#2a1a2a" roughness={0.8} />
      </mesh>
      {/* Door */}
      <mesh position={[0, 0.14, 0.351]}>
        <boxGeometry args={[0.12, 0.26, 0.01]} />
        <meshStandardMaterial color="#0a1020" metalness={0.3} roughness={0.6} emissive={color} emissiveIntensity={0.05} />
      </mesh>
      <pointLight position={[0, 0.8, 0.3]} color={color} intensity={0.5} distance={3.5} />
    </group>
  );
}

export function TechCampus({ position, color = '#22c55e', scale = 1 }) {
  const ref = useRef();
  const logoRef = useRef();
  useFrame((state) => {
    if (ref.current) ref.current.material.emissiveIntensity = 0.08 + Math.sin(state.clock.elapsedTime * 2.2) * 0.04;
    if (logoRef.current) {
      logoRef.current.material.emissiveIntensity = 0.4 + Math.sin(state.clock.elapsedTime * 1.5) * 0.3;
    }
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.22, 0]}>
        <boxGeometry args={[0.95, 0.44, 0.75]} />
        <meshStandardMaterial color="#0f1f18" metalness={0.2} roughness={0.9} />
      </mesh>
      <mesh ref={ref} position={[0.15, 0.35, 0]}>
        <boxGeometry args={[0.35, 0.36, 0.55]} />
        <meshStandardMaterial color="#0b2a18" metalness={0.6} roughness={0.2} emissive={color} emissiveIntensity={0.08} transparent opacity={0.9} />
      </mesh>
      <mesh ref={logoRef} position={[-0.38, 0.32, 0.32]}>
        <boxGeometry args={[0.08, 0.6, 0.08]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.6} />
      </mesh>
      {/* Courtyard */}
      <mesh position={[-0.2, 0.01, 0.3]}>
        <boxGeometry args={[0.2, 0.02, 0.2]} />
        <meshStandardMaterial color="#0a2a18" roughness={1} emissive="#1a5a3a" emissiveIntensity={0.04} />
      </mesh>
      <pointLight position={[0, 1.0, 0]} color={color} intensity={0.4} distance={4.5} />
    </group>
  );
}

export function ParkTile({ position, color = '#34d399', scale = 1 }) {
  const treeRefs = useRef([]);
  useFrame((state) => {
    treeRefs.current.forEach((r, i) => {
      if (r) {
        r.rotation.z = Math.sin(state.clock.elapsedTime * 0.5 + i * 1.5) * 0.03;
      }
    });
  });
  return (
    <group position={position} scale={scale}>
      <mesh position={[0, 0.02, 0]}>
        <boxGeometry args={[0.95, 0.04, 0.95]} />
        <meshStandardMaterial color="#0b2a18" roughness={1} emissive={color} emissiveIntensity={0.04} />
      </mesh>
      {[[-0.25, -0.2], [0.25, -0.15], [0.1, 0.25], [-0.15, 0.2]].map((p, i) => (
        <group key={i} ref={el => treeRefs.current[i] = el} position={[p[0], 0.02, p[1]]}>
          <mesh position={[0, 0.16, 0]}>
            <cylinderGeometry args={[0.03, 0.03, 0.25, 6]} />
            <meshStandardMaterial color="#2a1a12" roughness={1} />
          </mesh>
          <mesh position={[0, 0.34, 0]}>
            <coneGeometry args={[0.12, 0.28, 7]} />
            <meshStandardMaterial color="#0f4028" roughness={1} emissive={color} emissiveIntensity={0.06} />
          </mesh>
        </group>
      ))}
      {/* Bench */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[0.15, 0.04, 0.06]} />
        <meshStandardMaterial color="#3a2a1a" roughness={0.9} />
      </mesh>
      {/* Path through park */}
      <mesh position={[0, 0.03, 0]} rotation={[-Math.PI / 2, 0, Math.PI / 4]}>
        <planeGeometry args={[0.08, 0.9]} />
        <meshStandardMaterial color="#1a2a1a" roughness={1} transparent opacity={0.6} />
      </mesh>
      <pointLight position={[0, 0.8, 0]} color={color} intensity={0.28} distance={3.5} />
    </group>
  );
}

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
      {height > 1.5 && (
        <mesh position={[0, height + 0.02, 0]}>
          <sphereGeometry args={[0.02, 6, 6]} />
          <meshStandardMaterial color="#ff2200" emissive="#ff2200" emissiveIntensity={0.8} />
        </mesh>
      )}
    </group>
  );
}

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
      <lineBasicMaterial color={color} transparent opacity={0.35} />
    </line_>
  );
}

export const BUILDING_COMPONENTS = {
  home: SuburbanHomes,
  apartments: ApartmentsMidrise,
  retail: RetailBlock,
  tech: TechCampus,
  park: ParkTile,

  solar: SolarFarm,
  wind: WindTurbine,
  battery: BatteryStorage,
  datacenter: DataCenter,
  hydrogen: HydrogenPlant,
  nuclear: NuclearReactor,
  substation: SubstationPylon,
};
