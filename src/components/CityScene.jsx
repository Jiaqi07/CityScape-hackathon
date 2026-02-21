import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html, Float } from '@react-three/drei';
import * as THREE from 'three';
import { BUILDING_TYPES } from '../data/buildings';
import { getCityLayout, CITIES } from '../data/gridNodes';
import {
  BUILDING_COMPONENTS,
  CityBuilding,
  TransmissionLine,
  SubstationPylon,
} from './Buildings3D';

function EnergyParticle({ start, end, color, speed = 1, size = 0.04 }) {
  const ref = useRef();
  const t = useRef(Math.random());
  const curve = useMemo(() => {
    const s = new THREE.Vector3(...start);
    const e = new THREE.Vector3(...end);
    const mid = new THREE.Vector3().lerpVectors(s, e, 0.5);
    mid.y += 0.6 + Math.random() * 0.6;
    return new THREE.QuadraticBezierCurve3(s, mid, e);
  }, [start, end]);

  useFrame((_, dt) => {
    t.current += dt * speed * 0.5;
    if (t.current > 1) t.current = 0;
    if (ref.current) {
      const point = curve.getPoint(t.current);
      ref.current.position.copy(point);
      const scale = 0.7 + Math.sin(t.current * Math.PI) * 0.6;
      ref.current.scale.setScalar(scale);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[size, 8, 8]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={3} transparent opacity={0.9} />
    </mesh>
  );
}

function AmbientParticles({ count = 60, gridSize }) {
  const ref = useRef();
  const particles = useMemo(() => {
    const arr = [];
    const half = gridSize / 2;
    for (let i = 0; i < count; i++) {
      arr.push({
        x: (Math.random() - 0.5) * gridSize,
        y: 0.5 + Math.random() * 4,
        z: (Math.random() - 0.5) * gridSize,
        speed: 0.2 + Math.random() * 0.5,
        phase: Math.random() * Math.PI * 2,
      });
    }
    return arr;
  }, [count, gridSize]);

  useFrame((state) => {
    if (!ref.current) return;
    const positions = ref.current.geometry.attributes.position;
    const t = state.clock.elapsedTime;
    particles.forEach((p, i) => {
      positions.setXYZ(
        i,
        p.x + Math.sin(t * p.speed + p.phase) * 0.3,
        p.y + Math.sin(t * p.speed * 0.7 + p.phase) * 0.5,
        p.z + Math.cos(t * p.speed + p.phase) * 0.3,
      );
    });
    positions.needsUpdate = true;
  });

  return (
    <points ref={ref}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          count={particles.length}
          array={new Float32Array(particles.flatMap(p => [p.x, p.y, p.z]))}
          itemSize={3}
        />
      </bufferGeometry>
      <pointsMaterial color="#00d4ff" size={0.06} transparent opacity={0.3} sizeAttenuation />
    </points>
  );
}

function GroundPlane({ gridSize }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[gridSize + 30, gridSize + 30]} />
        <meshStandardMaterial color="#060d1a" metalness={0.15} roughness={0.85} />
      </mesh>
      <gridHelper
        args={[gridSize, gridSize, '#0d2040', '#091828']}
        position={[0, 0.005, 0]}
      />
      {/* Subtle glow ring at center */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, 0.008, 0]}>
        <ringGeometry args={[0.8, 1.5, 32]} />
        <meshStandardMaterial color="#00d4ff" emissive="#00d4ff" emissiveIntensity={0.3} transparent opacity={0.15} />
      </mesh>
    </group>
  );
}

function ChunkOverlay({ gridSize, chunkSize, unlocked, activeTool, hoveredTile }) {
  const half = gridSize / 2;
  const chunksPerSide = Math.ceil(gridSize / chunkSize);
  const planes = [];

  const hoveredChunk = hoveredTile?.x != null
    ? [Math.floor(hoveredTile.x / chunkSize), Math.floor(hoveredTile.z / chunkSize)]
    : null;

  for (let cx = 0; cx < chunksPerSide; cx++) {
    for (let cz = 0; cz < chunksPerSide; cz++) {
      const key = `${cx},${cz}`;
      const isUnlocked = unlocked.has(key);
      const centerX = (cx * chunkSize + chunkSize / 2) - half;
      const centerZ = (cz * chunkSize + chunkSize / 2) - half;
      const isHovered = hoveredChunk && hoveredChunk[0] === cx && hoveredChunk[1] === cz;

      const baseOpacity = isUnlocked ? 0.05 : 0.16;
      const opacity = isHovered && activeTool === 'expand' ? 0.32 : baseOpacity;
      const color = isUnlocked ? '#0f2540' : '#0a1220';
      const emissive = isUnlocked ? '#00d4ff' : '#ff3355';
      const emissiveIntensity = isUnlocked ? 0.03 : 0.015;

      planes.push(
        <mesh
          key={key}
          rotation={[-Math.PI / 2, 0, 0]}
          position={[centerX + 0.5, 0.003, centerZ + 0.5]}
        >
          <planeGeometry args={[chunkSize, chunkSize]} />
          <meshStandardMaterial
            color={color}
            transparent
            opacity={opacity}
            emissive={emissive}
            emissiveIntensity={isHovered && activeTool === 'expand' ? 0.15 : emissiveIntensity}
          />
        </mesh>
      );

      if (isUnlocked) {
        planes.push(
          <lineSegments
            key={`border-${key}`}
            position={[centerX + 0.5, 0.006, centerZ + 0.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <edgesGeometry args={[new THREE.PlaneGeometry(chunkSize, chunkSize)]} />
            <lineBasicMaterial color="#00d4ff" transparent opacity={0.08} />
          </lineSegments>
        );
      }
    }
  }

  return <group>{planes}</group>;
}

function CityDecorations({ cityId, gridSize }) {
  const layout = useMemo(() => getCityLayout(cityId), [cityId]);
  const half = gridSize / 2;

  return (
    <group>
      {layout.map((b, i) => (
        <CityBuilding
          key={`${cityId}-${i}`}
          position={[b.x - half + 0.5, 0, b.z - half + 0.5]}
          height={b.height}
          type={b.type}
          seed={i}
        />
      ))}
    </group>
  );
}

function Roads({ buildings, gridSize }) {
  const half = gridSize / 2;

  const roadSegments = useMemo(() => {
    if (buildings.length === 0) return [];
    const segments = [];
    const occupied = new Set(buildings.map(b => `${b.gridX},${b.gridZ}`));

    buildings.forEach((b) => {
      const bx = b.gridX - half + 0.5;
      const bz = b.gridZ - half + 0.5;

      const neighbors = [
        [b.gridX + 1, b.gridZ],
        [b.gridX - 1, b.gridZ],
        [b.gridX, b.gridZ + 1],
        [b.gridX, b.gridZ - 1],
      ];
      neighbors.forEach(([nx, nz]) => {
        if (occupied.has(`${nx},${nz}`)) {
          const mx = (bx + (nx - half + 0.5)) / 2;
          const mz = (bz + (nz - half + 0.5)) / 2;
          const isHoriz = nx !== b.gridX;
          segments.push({ x: mx, z: mz, isHoriz, key: `${b.gridX},${b.gridZ}-${nx},${nz}` });
        }
      });

      segments.push({ x: bx, z: bz, isRing: true, key: `ring-${b.gridX},${b.gridZ}` });
    });

    const unique = new Map();
    segments.forEach(s => {
      if (!unique.has(s.key)) unique.set(s.key, s);
    });
    return Array.from(unique.values());
  }, [buildings, half]);

  return (
    <group>
      {roadSegments.map(seg => {
        if (seg.isRing) {
          return (
            <mesh key={seg.key} position={[seg.x, 0.012, seg.z]} rotation={[-Math.PI / 2, 0, 0]}>
              <ringGeometry args={[0.42, 0.48, 4]} />
              <meshStandardMaterial
                color="#0d1e30"
                emissive="#00d4ff"
                emissiveIntensity={0.04}
                transparent
                opacity={0.5}
              />
            </mesh>
          );
        }
        return (
          <mesh
            key={seg.key}
            position={[seg.x, 0.011, seg.z]}
            rotation={[-Math.PI / 2, 0, seg.isHoriz ? 0 : Math.PI / 2]}
          >
            <planeGeometry args={[1.0, 0.12]} />
            <meshStandardMaterial
              color="#0f1e2e"
              emissive="#1a3a5a"
              emissiveIntensity={0.08}
              transparent
              opacity={0.6}
            />
          </mesh>
        );
      })}
    </group>
  );
}

function Pathways({ buildings, gridSize }) {
  const half = gridSize / 2;

  const paths = useMemo(() => {
    if (buildings.length < 2) return [];
    const result = [];

    const cityBuildings = buildings.filter(b => {
      const spec = BUILDING_TYPES[b.type];
      return spec?.category === 'city';
    });

    for (let i = 0; i < cityBuildings.length; i++) {
      let nearest = null;
      let nearestDist = Infinity;
      for (let j = 0; j < cityBuildings.length; j++) {
        if (i === j) continue;
        const dx = cityBuildings[i].gridX - cityBuildings[j].gridX;
        const dz = cityBuildings[i].gridZ - cityBuildings[j].gridZ;
        const dist = Math.abs(dx) + Math.abs(dz);
        if (dist < nearestDist && dist <= 6) {
          nearestDist = dist;
          nearest = j;
        }
      }
      if (nearest !== null) {
        const a = cityBuildings[i];
        const b = cityBuildings[nearest];
        const key = [i, nearest].sort().join('-');
        result.push({
          key: `path-${key}`,
          start: [a.gridX - half + 0.5, 0.013, a.gridZ - half + 0.5],
          end: [b.gridX - half + 0.5, 0.013, b.gridZ - half + 0.5],
        });
      }
    }

    const unique = new Map();
    result.forEach(p => { if (!unique.has(p.key)) unique.set(p.key, p); });
    return Array.from(unique.values());
  }, [buildings, half]);

  return (
    <group>
      {paths.map(p => {
        const sx = p.start[0], sz = p.start[2];
        const ex = p.end[0], ez = p.end[2];
        const dx = ex - sx, dz = ez - sz;
        const len = Math.sqrt(dx * dx + dz * dz);
        const angle = Math.atan2(dx, dz);
        const mx = (sx + ex) / 2;
        const mz = (sz + ez) / 2;

        return (
          <group key={p.key}>
            <mesh position={[mx, 0.01, mz]} rotation={[-Math.PI / 2, 0, -angle]}>
              <planeGeometry args={[0.05, len]} />
              <meshStandardMaterial
                color="#0a1a28"
                emissive="#1a4060"
                emissiveIntensity={0.06}
                transparent
                opacity={0.4}
              />
            </mesh>
            {/* Dashed line effect */}
            {Array.from({ length: Math.floor(len / 0.3) }, (_, i) => {
              const frac = (i + 0.5) / Math.floor(len / 0.3);
              const px = sx + dx * frac;
              const pz = sz + dz * frac;
              return (
                <mesh key={i} position={[px, 0.014, pz]} rotation={[-Math.PI / 2, 0, 0]}>
                  <circleGeometry args={[0.02, 6]} />
                  <meshStandardMaterial
                    color="#2a5070"
                    emissive="#3a7090"
                    emissiveIntensity={0.15}
                    transparent
                    opacity={0.35}
                  />
                </mesh>
              );
            })}
          </group>
        );
      })}
    </group>
  );
}

function SmartEnergyNetwork({ buildings, gridSize }) {
  const half = gridSize / 2;

  const connections = useMemo(() => {
    const energyBuildings = buildings.filter(b => {
      const spec = BUILDING_TYPES[b.type];
      return spec?.type === 'generation' || spec?.type === 'storage';
    });
    const loadBuildings = buildings.filter(b => {
      const spec = BUILDING_TYPES[b.type];
      return spec?.type === 'load';
    });

    if (energyBuildings.length === 0 || loadBuildings.length === 0) return [];

    const result = [];
    loadBuildings.forEach((load, li) => {
      let nearestIdx = 0;
      let nearestDist = Infinity;
      energyBuildings.forEach((gen, gi) => {
        const dx = load.gridX - gen.gridX;
        const dz = load.gridZ - gen.gridZ;
        const dist = Math.sqrt(dx * dx + dz * dz);
        if (dist < nearestDist) {
          nearestDist = dist;
          nearestIdx = gi;
        }
      });

      if (nearestDist < 20) {
        const gen = energyBuildings[nearestIdx];
        const genSpec = BUILDING_TYPES[gen.type];
        const loadSpec = BUILDING_TYPES[load.type];
        result.push({
          key: `energy-${li}-${nearestIdx}`,
          start: [gen.gridX - half + 0.5, 0.25, gen.gridZ - half + 0.5],
          end: [load.gridX - half + 0.5, 0.25, load.gridZ - half + 0.5],
          color: genSpec.color,
          loadColor: loadSpec.color,
          dist: nearestDist,
        });
      }
    });

    return result;
  }, [buildings, half]);

  return (
    <group>
      {connections.map(c => {
        const geometry = new THREE.BufferGeometry().setFromPoints(
          new THREE.QuadraticBezierCurve3(
            new THREE.Vector3(...c.start),
            new THREE.Vector3(
              (c.start[0] + c.end[0]) / 2,
              0.25 + c.dist * 0.06,
              (c.start[2] + c.end[2]) / 2,
            ),
            new THREE.Vector3(...c.end),
          ).getPoints(24)
        );

        const particleCount = Math.max(1, Math.min(3, Math.floor(c.dist / 3)));
        return (
          <group key={c.key}>
            <line geometry={geometry}>
              <lineBasicMaterial color={c.color} transparent opacity={0.12} />
            </line>
            {Array.from({ length: particleCount }, (_, i) => (
              <EnergyParticle
                key={`${c.key}-p${i}`}
                start={c.start}
                end={c.end}
                color={c.color}
                speed={0.6 + i * 0.3}
                size={0.035}
              />
            ))}
          </group>
        );
      })}
    </group>
  );
}

function PlacedBuildings({ buildings, gridSize, selectedBuilding, hoveredBuilding, onSelectBuilding, onHoverBuilding }) {
  const half = gridSize / 2;

  return (
    <group>
      {buildings.map((b, i) => {
        const Component = BUILDING_COMPONENTS[b.type];
        if (!Component) return null;
        const spec = BUILDING_TYPES[b.type];
        const pos = [b.gridX - half + 0.5, 0, b.gridZ - half + 0.5];
        const isSelected = selectedBuilding === i;
        const isHovered = hoveredBuilding === i;

        return (
          <group
            key={i}
            onClick={(e) => { e.stopPropagation(); onSelectBuilding(i); }}
            onPointerEnter={(e) => { e.stopPropagation(); onHoverBuilding(i); }}
            onPointerLeave={(e) => { e.stopPropagation(); onHoverBuilding(null); }}
          >
            <Component position={pos} color={spec.color} />

            {/* Selection ring */}
            {isSelected && (
              <SelectionRing position={pos} color="#ffffff" />
            )}

            {/* Hover glow */}
            {isHovered && !isSelected && (
              <mesh position={[pos[0], 0.015, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.44, 0.5, 32]} />
                <meshStandardMaterial color={spec.color} emissive={spec.color} emissiveIntensity={0.6} transparent opacity={0.4} />
              </mesh>
            )}

            {/* Power status indicator */}
            {spec.type === 'generation' && (
              <mesh position={[pos[0] + 0.35, spec.height + 0.1, pos[2]]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#00ff88" emissive="#00ff88" emissiveIntensity={2} />
              </mesh>
            )}
            {spec.type === 'load' && spec.category === 'energy' && (
              <mesh position={[pos[0] + 0.35, spec.height + 0.1, pos[2]]}>
                <sphereGeometry args={[0.04, 8, 8]} />
                <meshStandardMaterial color="#ff6b6b" emissive="#ff6b6b" emissiveIntensity={2} />
              </mesh>
            )}

            <Html position={[pos[0], spec.height + 0.3, pos[2]]} center distanceFactor={12}>
              <div style={{
                background: isHovered ? 'rgba(8,16,32,0.95)' : 'rgba(8,16,32,0.8)',
                border: `1px solid ${spec.color}${isHovered ? '80' : '30'}`,
                borderRadius: 6,
                padding: isHovered ? '4px 10px' : '2px 6px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
                transition: 'all 0.2s ease',
                transform: isHovered ? 'scale(1.15)' : 'scale(1)',
                boxShadow: isHovered ? `0 0 12px ${spec.color}40` : 'none',
              }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: spec.color, fontWeight: isHovered ? 600 : 400 }}>
                  {spec.name}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: '#3a5a7a', marginLeft: 4 }}>
                  {spec.type === 'generation' ? '+' : '-'}{spec.mw}MW
                </span>
                {isHovered && spec.sim && (
                  <div style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 6, color: '#5a7a9a', marginTop: 2 }}>
                    {spec.sim.housing > 0 && <span>🏠{spec.sim.housing} </span>}
                    {spec.sim.jobs > 0 && <span>💼{spec.sim.jobs}</span>}
                  </div>
                )}
              </div>
            </Html>
          </group>
        );
      })}
    </group>
  );
}

function SelectionRing({ position, color }) {
  const ref = useRef();
  useFrame((state) => {
    if (ref.current) {
      ref.current.scale.setScalar(1 + Math.sin(state.clock.elapsedTime * 3) * 0.08);
      ref.current.material.opacity = 0.4 + Math.sin(state.clock.elapsedTime * 3) * 0.2;
    }
  });
  return (
    <mesh ref={ref} position={[position[0], 0.02, position[2]]} rotation={[-Math.PI / 2, 0, 0]}>
      <ringGeometry args={[0.48, 0.55, 32]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={1.2} transparent opacity={0.6} />
    </mesh>
  );
}

function GhostBuilding({ gridX, gridZ, gridSize, activeTool }) {
  if (gridX === null || !activeTool) return null;
  const half = gridSize / 2;
  const Component = BUILDING_COMPONENTS[activeTool];
  const spec = BUILDING_TYPES[activeTool];
  if (!Component || !spec) return null;

  return (
    <group>
      <Component
        position={[gridX - half + 0.5, 0, gridZ - half + 0.5]}
        color={spec.color}
        scale={0.9}
      />
      <mesh
        position={[gridX - half + 0.5, 0.02, gridZ - half + 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <ringGeometry args={[0.42, 0.5, 32]} />
        <meshStandardMaterial
          color={spec.color}
          emissive={spec.color}
          emissiveIntensity={1.0}
          transparent
          opacity={0.5}
        />
      </mesh>
      {/* Placement zone glow */}
      <mesh
        position={[gridX - half + 0.5, 0.013, gridZ - half + 0.5]}
        rotation={[-Math.PI / 2, 0, 0]}
      >
        <circleGeometry args={[0.6, 32]} />
        <meshStandardMaterial
          color={spec.color}
          emissive={spec.color}
          emissiveIntensity={0.3}
          transparent
          opacity={0.12}
        />
      </mesh>
    </group>
  );
}

function PowerLines({ buildings, gridSize, substationPos }) {
  const half = gridSize / 2;
  const lines = [];
  const particles = [];

  const energyBuildings = buildings.filter(b => {
    const spec = BUILDING_TYPES[b.type];
    return spec?.category === 'energy';
  });

  energyBuildings.forEach((b, i) => {
    const spec = BUILDING_TYPES[b.type];
    if (!spec) return;
    const bPos = [b.gridX - half + 0.5, 0.3, b.gridZ - half + 0.5];
    const sPos = substationPos || [0, 0.3, 0];
    lines.push({ start: bPos, end: sPos, color: spec.color, key: `line-${i}` });
    const pCount = spec.type === 'generation' ? 3 : 2;
    for (let p = 0; p < pCount; p++) {
      const isGen = spec.type === 'generation';
      particles.push({
        start: isGen ? bPos : sPos,
        end: isGen ? sPos : bPos,
        color: spec.color,
        speed: 0.6 + Math.random() * 0.6,
        key: `particle-${i}-${p}`,
      });
    }
  });

  return (
    <group>
      {lines.map(l => (
        <TransmissionLine key={l.key} start={l.start} end={l.end} loadPct={0.5} />
      ))}
      {particles.map(p => (
        <EnergyParticle key={p.key} start={p.start} end={p.end} color={p.color} speed={p.speed} />
      ))}
    </group>
  );
}

function InteractiveGrid({ gridSize, activeTool, occupiedTiles, onTileClick, onTileHover, hoveredTile }) {
  const half = gridSize / 2;

  const handlePointerMove = useCallback((e) => {
    e.stopPropagation();
    const point = e.point;
    const gx = Math.floor(point.x + half);
    const gz = Math.floor(point.z + half);
    if (gx >= 0 && gx < gridSize && gz >= 0 && gz < gridSize) {
      onTileHover(gx, gz);
    }
  }, [gridSize, half, onTileHover]);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    const point = e.point;
    const gx = Math.floor(point.x + half);
    const gz = Math.floor(point.z + half);
    if (gx >= 0 && gx < gridSize && gz >= 0 && gz < gridSize) {
      onTileClick(gx, gz);
    }
  }, [gridSize, half, onTileClick]);

  return (
    <group>
      <mesh
        rotation={[-Math.PI / 2, 0, 0]}
        position={[0, 0.02, 0]}
        onPointerMove={activeTool ? handlePointerMove : undefined}
        onClick={handleClick}
        onPointerLeave={() => onTileHover(null, null)}
      >
        <planeGeometry args={[gridSize, gridSize]} />
        <meshStandardMaterial visible={false} />
      </mesh>
      {hoveredTile.x !== null && activeTool && (
        <group>
          <mesh
            position={[hoveredTile.x - half + 0.5, 0.015, hoveredTile.z - half + 0.5]}
            rotation={[-Math.PI / 2, 0, 0]}
          >
            <planeGeometry args={[0.95, 0.95]} />
            <meshStandardMaterial
              color={BUILDING_TYPES[activeTool]?.color || '#00d4ff'}
              transparent
              opacity={0.2}
              emissive={BUILDING_TYPES[activeTool]?.color || '#00d4ff'}
              emissiveIntensity={0.4}
            />
          </mesh>
          {/* Corner markers */}
          {[[-0.45, -0.45], [0.45, -0.45], [-0.45, 0.45], [0.45, 0.45]].map(([dx, dz], ci) => (
            <mesh
              key={ci}
              position={[hoveredTile.x - half + 0.5 + dx, 0.018, hoveredTile.z - half + 0.5 + dz]}
              rotation={[-Math.PI / 2, 0, 0]}
            >
              <circleGeometry args={[0.03, 8]} />
              <meshStandardMaterial
                color={BUILDING_TYPES[activeTool]?.color || '#00d4ff'}
                emissive={BUILDING_TYPES[activeTool]?.color || '#00d4ff'}
                emissiveIntensity={1}
                transparent
                opacity={0.7}
              />
            </mesh>
          ))}
        </group>
      )}
    </group>
  );
}

function CameraRig({ gridSize }) {
  return (
    <OrbitControls
      makeDefault
      maxPolarAngle={Math.PI / 2.3}
      minPolarAngle={Math.PI / 6}
      maxDistance={gridSize * 2}
      minDistance={4}
      enableDamping
      dampingFactor={0.05}
      target={[0, 0, 0]}
    />
  );
}

function CityLabel({ name, population, color, gridSize }) {
  return (
    <Html position={[0, 3.5, 0]} center>
      <div style={{ textAlign: 'center', pointerEvents: 'none', userSelect: 'none' }}>
        <div style={{
          fontFamily: 'Space Grotesk, sans-serif',
          fontSize: 22,
          fontWeight: 700,
          color: color,
          letterSpacing: 3,
          textShadow: `0 0 20px ${color}60, 0 0 40px ${color}30`,
        }}>
          {name}
        </div>
        <div style={{
          fontFamily: 'JetBrains Mono, monospace',
          fontSize: 10,
          color: '#3a5a7a',
          letterSpacing: 2,
          marginTop: 2,
        }}>
          POP {population}
        </div>
      </div>
    </Html>
  );
}

function RiverEffect({ gridSize, riverZ }) {
  const half = gridSize / 2;
  const ref = useRef();

  useFrame((state) => {
    if (ref.current) {
      ref.current.material.emissiveIntensity = 0.06 + Math.sin(state.clock.elapsedTime * 0.5) * 0.03;
    }
  });

  return (
    <mesh ref={ref} position={[0, 0.009, riverZ - half + 0.5]} rotation={[-Math.PI / 2, 0, 0]}>
      <planeGeometry args={[gridSize, 2.5]} />
      <meshStandardMaterial
        color="#041828"
        emissive="#0050a0"
        emissiveIntensity={0.06}
        transparent
        opacity={0.5}
        metalness={0.8}
        roughness={0.2}
      />
    </mesh>
  );
}

function SceneContent({
  activeCity,
  activeTool,
  placedBuildings,
  selectedBuilding,
  ercotData,
  onPlaceBuilding,
  unlockedChunks,
  chunkSize,
  onUnlockChunk,
  onSelectBuilding,
  onDeselectBuilding,
}) {
  const [hoveredTile, setHoveredTile] = useState({ x: null, z: null });
  const [hoveredBuilding, setHoveredBuilding] = useState(null);
  const city = CITIES[activeCity];
  const gridSize = city?.worldSize || 40;

  const unlocked = useMemo(() => {
    const s = new Set();
    (unlockedChunks || []).forEach(([cx, cz]) => s.add(`${cx},${cz}`));
    return s;
  }, [unlockedChunks]);

  const isUnlockedTile = useCallback((x, z) => {
    const cx = Math.floor(x / chunkSize);
    const cz = Math.floor(z / chunkSize);
    return unlocked.has(`${cx},${cz}`);
  }, [chunkSize, unlocked]);

  const occupiedTiles = useMemo(() => {
    const set = new Set();
    placedBuildings.forEach(b => set.add(`${b.gridX},${b.gridZ}`));
    return set;
  }, [placedBuildings]);

  const handleTileClick = useCallback((gx, gz) => {
    if (activeTool === 'expand') {
      const cx = Math.floor(gx / chunkSize);
      const cz = Math.floor(gz / chunkSize);
      const key = `${cx},${cz}`;
      if (unlocked.has(key)) return;
      const neighbors = [
        [cx - 1, cz], [cx + 1, cz], [cx, cz - 1], [cx, cz + 1],
      ];
      const ok = neighbors.some(([nx, nz]) => unlocked.has(`${nx},${nz}`));
      if (ok) onUnlockChunk(cx, cz);
      return;
    }

    if (activeTool) {
      if (!isUnlockedTile(gx, gz)) return;
      const key = `${gx},${gz}`;
      if (!occupiedTiles.has(key)) {
        onPlaceBuilding(activeTool, gx, gz);
      }
      return;
    }

    onDeselectBuilding();
  }, [activeTool, chunkSize, isUnlockedTile, occupiedTiles, onDeselectBuilding, onPlaceBuilding, onUnlockChunk, unlocked]);

  const handleTileHover = useCallback((x, z) => {
    setHoveredTile({ x, z });
  }, []);

  const loadPct = ercotData?.demand && city?.cap
    ? Math.min(1, ercotData.demand / 70000 * (city.cap / 5500))
    : 0.6;

  return (
    <>
      <CameraRig gridSize={gridSize} />

      {/* Enhanced lighting */}
      <ambientLight intensity={0.45} />
      <directionalLight position={[12, 22, 12]} intensity={1.4} color="#8090c0" castShadow />
      <directionalLight position={[-10, 14, -10]} intensity={0.5} color="#4060a0" />
      <pointLight position={[0, 10, 0]} intensity={1.2} color="#00d4ff" distance={35} />
      <pointLight position={[8, 5, 8]} intensity={0.4} color="#ff8c42" distance={20} />
      <pointLight position={[-8, 5, -8]} intensity={0.4} color="#a855f7" distance={20} />
      <hemisphereLight args={['#2040a0', '#050a14', 0.7]} />

      <fog attach="fog" args={['#050a14', gridSize * 1.0, gridSize * 2.5]} />

      <GroundPlane gridSize={gridSize} />
      <ChunkOverlay
        gridSize={gridSize}
        chunkSize={chunkSize}
        unlocked={unlocked}
        activeTool={activeTool}
        hoveredTile={hoveredTile}
      />
      <CityDecorations cityId={activeCity} gridSize={gridSize} />

      {city?.riverZ && <RiverEffect gridSize={gridSize} riverZ={city.riverZ} />}

      <AmbientParticles gridSize={gridSize} />

      <InteractiveGrid
        gridSize={gridSize}
        activeTool={activeTool}
        occupiedTiles={occupiedTiles}
        onTileClick={handleTileClick}
        onTileHover={handleTileHover}
        hoveredTile={hoveredTile}
      />

      <PlacedBuildings
        buildings={placedBuildings}
        gridSize={gridSize}
        selectedBuilding={selectedBuilding}
        hoveredBuilding={hoveredBuilding}
        onSelectBuilding={onSelectBuilding}
        onHoverBuilding={setHoveredBuilding}
      />

      {hoveredTile.x !== null && activeTool && activeTool !== 'expand' && isUnlockedTile(hoveredTile.x, hoveredTile.z) && !occupiedTiles.has(`${hoveredTile.x},${hoveredTile.z}`) && (
        <GhostBuilding
          gridX={hoveredTile.x}
          gridZ={hoveredTile.z}
          gridSize={gridSize}
          activeTool={activeTool}
        />
      )}

      {hoveredTile.x !== null && activeTool && activeTool !== 'expand' && !isUnlockedTile(hoveredTile.x, hoveredTile.z) && (
        <mesh
          position={[hoveredTile.x - gridSize / 2 + 0.5, 0.018, hoveredTile.z - gridSize / 2 + 0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.95, 0.95]} />
          <meshStandardMaterial color="#0b1424" emissive="#ff3355" emissiveIntensity={0.18} transparent opacity={0.35} />
        </mesh>
      )}

      {hoveredTile.x !== null && activeTool === 'expand' && (
        <mesh
          position={[hoveredTile.x - gridSize / 2 + 0.5, 0.018, hoveredTile.z - gridSize / 2 + 0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.95, 0.95]} />
          <meshStandardMaterial color="#c0d4e8" emissive="#c0d4e8" emissiveIntensity={0.15} transparent opacity={0.15} />
        </mesh>
      )}

      <SubstationPylon position={[0, 0, 0]} loadPct={loadPct} scale={1.2} />

      <PowerLines
        buildings={placedBuildings}
        gridSize={gridSize}
        substationPos={[0, 0.3, 0]}
      />

      <SmartEnergyNetwork buildings={placedBuildings} gridSize={gridSize} />
      <Roads buildings={placedBuildings} gridSize={gridSize} />
      <Pathways buildings={placedBuildings} gridSize={gridSize} />

      {city && (
        <CityLabel name={city.name} population={city.population} color={city.color} gridSize={gridSize} />
      )}
    </>
  );
}

export default function CityScene({
  activeCity,
  activeTool,
  placedBuildings,
  selectedBuilding,
  ercotData,
  onPlaceBuilding,
  unlockedChunks,
  chunkSize,
  onUnlockChunk,
  onSelectBuilding,
  onDeselectBuilding,
  onReady,
}) {
  const city = CITIES[activeCity];
  const gridSize = city?.worldSize || 40;
  const cs = chunkSize || city?.chunkSize || 8;

  return (
    <div className="absolute inset-0" style={{ background: '#050a14' }}>
      <Canvas
        camera={{ position: [gridSize * 0.65, gridSize * 0.55, gridSize * 0.65], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#050a14');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.6;
          onReady?.();
        }}
      >
        <SceneContent
          activeCity={activeCity}
          activeTool={activeTool}
          placedBuildings={placedBuildings}
          selectedBuilding={selectedBuilding}
          ercotData={ercotData}
          onPlaceBuilding={onPlaceBuilding}
          unlockedChunks={unlockedChunks}
          chunkSize={cs}
          onUnlockChunk={onUnlockChunk}
          onSelectBuilding={onSelectBuilding}
          onDeselectBuilding={onDeselectBuilding}
        />
      </Canvas>
    </div>
  );
}
