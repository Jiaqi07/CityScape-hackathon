import { useRef, useMemo, useState, useCallback } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { OrbitControls, Html } from '@react-three/drei';
import * as THREE from 'three';
import { BUILDING_TYPES } from '../data/buildings';
import { getCityLayout, CITIES } from '../data/gridNodes';
import {
  BUILDING_COMPONENTS,
  CityBuilding,
  TransmissionLine,
  SubstationPylon,
} from './Buildings3D';

function EnergyParticle({ start, end, color, speed = 1 }) {
  const ref = useRef();
  const t = useRef(Math.random());

  useFrame((_, dt) => {
    t.current += dt * speed * 0.5;
    if (t.current > 1) t.current = 0;
    if (ref.current) {
      const s = new THREE.Vector3(...start);
      const e = new THREE.Vector3(...end);
      const mid = new THREE.Vector3().lerpVectors(s, e, 0.5);
      mid.y += 1.0;
      const curve = new THREE.QuadraticBezierCurve3(s, mid, e);
      const point = curve.getPoint(t.current);
      ref.current.position.copy(point);
    }
  });

  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.04, 6, 6]} />
      <meshStandardMaterial color={color} emissive={color} emissiveIntensity={2} />
    </mesh>
  );
}

function GroundPlane({ gridSize }) {
  return (
    <group>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]} receiveShadow>
        <planeGeometry args={[gridSize + 20, gridSize + 20]} />
        <meshStandardMaterial color="#080e1a" metalness={0.1} roughness={0.9} />
      </mesh>
      <gridHelper
        args={[gridSize, gridSize, '#0f2540', '#0a1a2a']}
        position={[0, 0.005, 0]}
      />
    </group>
  );
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

function PlacedBuildings({ buildings, gridSize, selectedBuilding, onSelectBuilding }) {
  const half = gridSize / 2;

  return (
    <group>
      {buildings.map((b, i) => {
        const Component = BUILDING_COMPONENTS[b.type];
        if (!Component) return null;
        const spec = BUILDING_TYPES[b.type];
        const pos = [b.gridX - half + 0.5, 0, b.gridZ - half + 0.5];
        const isSelected = selectedBuilding === i;

        return (
          <group key={i} onClick={(e) => { e.stopPropagation(); onSelectBuilding(i); }}>
            <Component position={pos} color={spec.color} />
            {isSelected && (
              <mesh position={[pos[0], 0.02, pos[2]]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[0.5, 0.55, 32]} />
                <meshStandardMaterial color="#ffffff" emissive="#ffffff" emissiveIntensity={1} transparent opacity={0.6} />
              </mesh>
            )}
            <Html position={[pos[0], spec.height + 0.3, pos[2]]} center distanceFactor={12}>
              <div style={{
                background: 'rgba(8,16,32,0.85)',
                border: `1px solid ${spec.color}40`,
                borderRadius: 4,
                padding: '2px 6px',
                whiteSpace: 'nowrap',
                pointerEvents: 'none',
              }}>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 8, color: spec.color }}>
                  {spec.name}
                </span>
                <span style={{ fontFamily: 'JetBrains Mono, monospace', fontSize: 7, color: '#3a5a7a', marginLeft: 4 }}>
                  {spec.mw}MW
                </span>
              </div>
            </Html>
          </group>
        );
      })}
    </group>
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
        <ringGeometry args={[0.45, 0.5, 32]} />
        <meshStandardMaterial
          color={spec.color}
          emissive={spec.color}
          emissiveIntensity={0.8}
          transparent
          opacity={0.5}
        />
      </mesh>
    </group>
  );
}

function PowerLines({ buildings, gridSize, substationPos }) {
  const half = gridSize / 2;
  const lines = [];
  const particles = [];

  buildings.forEach((b, i) => {
    const spec = BUILDING_TYPES[b.type];
    if (!spec) return;
    const bPos = [b.gridX - half + 0.5, 0.3, b.gridZ - half + 0.5];
    const sPos = substationPos || [0, 0.3, 0];
    lines.push({ start: bPos, end: sPos, color: spec.color, key: `line-${i}` });
    for (let p = 0; p < 2; p++) {
      const isGen = spec.type === 'generation';
      particles.push({
        start: isGen ? bPos : sPos,
        end: isGen ? sPos : bPos,
        color: spec.color,
        speed: 0.8 + Math.random() * 0.4,
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
        <mesh
          position={[hoveredTile.x - half + 0.5, 0.015, hoveredTile.z - half + 0.5]}
          rotation={[-Math.PI / 2, 0, 0]}
        >
          <planeGeometry args={[0.95, 0.95]} />
          <meshStandardMaterial
            color={BUILDING_TYPES[activeTool]?.color || '#00d4ff'}
            transparent
            opacity={0.25}
            emissive={BUILDING_TYPES[activeTool]?.color || '#00d4ff'}
            emissiveIntensity={0.5}
          />
        </mesh>
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

function SceneContent({
  activeCity,
  activeTool,
  placedBuildings,
  selectedBuilding,
  ercotData,
  onPlaceBuilding,
  onSelectBuilding,
  onDeselectBuilding,
}) {
  const [hoveredTile, setHoveredTile] = useState({ x: null, z: null });
  const city = CITIES[activeCity];
  const gridSize = city?.gridSize || 16;

  const occupiedTiles = useMemo(() => {
    const set = new Set();
    placedBuildings.forEach(b => set.add(`${b.gridX},${b.gridZ}`));
    return set;
  }, [placedBuildings]);

  const handleTileClick = useCallback((gx, gz) => {
    if (activeTool) {
      const key = `${gx},${gz}`;
      if (!occupiedTiles.has(key)) {
        onPlaceBuilding(activeTool, gx, gz);
      }
    } else {
      onDeselectBuilding();
    }
  }, [activeTool, occupiedTiles, onPlaceBuilding, onDeselectBuilding]);

  const handleTileHover = useCallback((x, z) => {
    setHoveredTile({ x, z });
  }, []);

  const loadPct = ercotData?.demand && city?.cap
    ? Math.min(1, ercotData.demand / 70000 * (city.cap / 5500))
    : 0.6;

  return (
    <>
      <CameraRig gridSize={gridSize} />

      {/* Lighting — bright enough to see everything */}
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 20, 10]} intensity={1.5} color="#8090c0" castShadow />
      <directionalLight position={[-8, 12, -8]} intensity={0.6} color="#4060a0" />
      <pointLight position={[0, 8, 0]} intensity={1.0} color="#00d4ff" distance={30} />
      <hemisphereLight args={['#2040a0', '#050a14', 0.8]} />

      <fog attach="fog" args={['#050a14', gridSize * 1.2, gridSize * 3]} />

      <GroundPlane gridSize={gridSize} />
      <CityDecorations cityId={activeCity} gridSize={gridSize} />

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
        onSelectBuilding={onSelectBuilding}
      />

      {hoveredTile.x !== null && activeTool && !occupiedTiles.has(`${hoveredTile.x},${hoveredTile.z}`) && (
        <GhostBuilding
          gridX={hoveredTile.x}
          gridZ={hoveredTile.z}
          gridSize={gridSize}
          activeTool={activeTool}
        />
      )}

      <SubstationPylon position={[0, 0, 0]} loadPct={loadPct} scale={1.2} />

      <PowerLines
        buildings={placedBuildings}
        gridSize={gridSize}
        substationPos={[0, 0.3, 0]}
      />

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
  onSelectBuilding,
  onDeselectBuilding,
}) {
  const city = CITIES[activeCity];
  const gridSize = city?.gridSize || 16;

  return (
    <div className="absolute inset-0" style={{ background: '#050a14' }}>
      <Canvas
        camera={{ position: [gridSize * 0.7, gridSize * 0.6, gridSize * 0.7], fov: 45 }}
        dpr={[1, 2]}
        gl={{ antialias: true, alpha: false, powerPreference: 'high-performance' }}
        onCreated={({ gl }) => {
          gl.setClearColor('#050a14');
          gl.toneMapping = THREE.ACESFilmicToneMapping;
          gl.toneMappingExposure = 1.5;
        }}
      >
        <SceneContent
          activeCity={activeCity}
          activeTool={activeTool}
          placedBuildings={placedBuildings}
          selectedBuilding={selectedBuilding}
          ercotData={ercotData}
          onPlaceBuilding={onPlaceBuilding}
          onSelectBuilding={onSelectBuilding}
          onDeselectBuilding={onDeselectBuilding}
        />
      </Canvas>
    </div>
  );
}
