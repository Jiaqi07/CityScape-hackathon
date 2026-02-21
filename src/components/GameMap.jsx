import { useEffect, useRef, useCallback } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';
import { TRANSMISSION_LINES } from '../data/gridNodes';
import { BUILDING_TYPES, findNearestSubstation } from '../data/buildings';

export default function GameMap({
  substations,
  placedBuildings,
  selectedBuilding,
  activeTool,
  onPlaceBuilding,
  onSelectBuilding,
  onDeselectBuilding,
}) {
  const containerRef = useRef(null);
  const canvasRef = useRef(null);
  const mapRef = useRef(null);
  const frameRef = useRef(0);
  const animRef = useRef(0);
  const particlesRef = useRef([]);

  const proj = useCallback((lng, lat) => {
    if (!mapRef.current) return { x: -999, y: -999 };
    return mapRef.current.project([lng, lat]);
  }, []);

  // Initialize map
  useEffect(() => {
    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: [-99.0, 31.0],
      zoom: 5.8,
      maxZoom: 14,
      minZoom: 4,
      pitch: 0,
    });
    map.addControl(new maplibregl.NavigationControl({ showCompass: false }), 'top-right');
    mapRef.current = map;

    map.on('load', () => rebuildParticles());
    map.on('moveend', () => rebuildParticles());

    return () => map.remove();
  }, []);

  // Rebuild particles when data changes
  const rebuildParticles = useCallback(() => {
    if (!mapRef.current || !substations.length) return;
    const p = [];
    TRANSMISSION_LINES.forEach(([a, b]) => {
      const n1 = substations[a], n2 = substations[b];
      if (!n1 || !n2) return;
      const avgLoad = ((n1.loadPct || 0.7) + (n2.loadPct || 0.7)) / 2;
      const count = Math.floor(1 + avgLoad * 3);
      for (let i = 0; i < count; i++) {
        p.push({
          from: [n1.lng, n1.lat],
          to: [n2.lng, n2.lat],
          t: Math.random(),
          speed: 0.001 + avgLoad * 0.003,
          loadPct: avgLoad,
        });
      }
    });
    // Building → substation connection particles
    placedBuildings.forEach(b => {
      const spec = BUILDING_TYPES[b.type];
      const nearest = findNearestSubstation(b.lng, b.lat, substations);
      if (!nearest || !spec) return;
      for (let i = 0; i < 3; i++) {
        const isGen = spec.type === 'generation';
        p.push({
          from: isGen ? [b.lng, b.lat] : [nearest.lng, nearest.lat],
          to: isGen ? [nearest.lng, nearest.lat] : [b.lng, b.lat],
          t: Math.random(),
          speed: 0.003,
          color: spec.color,
          building: true,
        });
      }
    });
    particlesRef.current = p;
  }, [substations, placedBuildings]);

  useEffect(() => { rebuildParticles(); }, [rebuildParticles]);

  // Canvas resize
  useEffect(() => {
    const resize = () => {
      const c = canvasRef.current;
      if (!c || !c.parentElement) return;
      c.width = c.parentElement.clientWidth;
      c.height = c.parentElement.clientHeight;
    };
    resize();
    window.addEventListener('resize', resize);
    return () => window.removeEventListener('resize', resize);
  }, []);

  // Main render loop
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');

    const draw = () => {
      const W = canvas.width, H = canvas.height;
      ctx.clearRect(0, 0, W, H);
      frameRef.current++;
      const frame = frameRef.current;
      if (!mapRef.current?.isStyleLoaded()) { animRef.current = requestAnimationFrame(draw); return; }

      // Transmission lines
      TRANSMISSION_LINES.forEach(([a, b]) => {
        const n1 = substations[a], n2 = substations[b];
        if (!n1 || !n2) return;
        const p1 = proj(n1.lng, n1.lat), p2 = proj(n2.lng, n2.lat);
        const avgLoad = ((n1.loadPct || 0.7) + (n2.loadPct || 0.7)) / 2;
        const col = avgLoad > 0.9 ? '#ff3355' : avgLoad > 0.75 ? '#ffb800' : '#00ff88';
        ctx.save();
        ctx.globalAlpha = 0.12;
        ctx.strokeStyle = col;
        ctx.lineWidth = 0.6;
        const mx = (p1.x + p2.x) / 2, my = Math.min(p1.y, p2.y) - 15;
        ctx.beginPath(); ctx.moveTo(p1.x, p1.y); ctx.quadraticCurveTo(mx, my, p2.x, p2.y); ctx.stroke();
        ctx.restore();
      });

      // Building → substation connections
      placedBuildings.forEach(b => {
        const spec = BUILDING_TYPES[b.type];
        const nearest = findNearestSubstation(b.lng, b.lat, substations);
        if (!nearest || !spec) return;
        const pb = proj(b.lng, b.lat), ps = proj(nearest.lng, nearest.lat);
        ctx.save();
        ctx.globalAlpha = 0.2;
        ctx.strokeStyle = spec.color;
        ctx.lineWidth = 1;
        ctx.setLineDash([4, 6]);
        ctx.beginPath(); ctx.moveTo(pb.x, pb.y); ctx.lineTo(ps.x, ps.y); ctx.stroke();
        ctx.restore();
      });

      // Particles
      particlesRef.current.forEach(p => {
        p.t += p.speed;
        if (p.t > 1) p.t = 0;
        const a = proj(...p.from), b = proj(...p.to);
        const mx = (a.x + b.x) / 2, my = Math.min(a.y, b.y) - (p.building ? 8 : 15);
        const mt = 1 - p.t, t = p.t;
        const x = mt * mt * a.x + 2 * mt * t * mx + t * t * b.x;
        const y = mt * mt * a.y + 2 * mt * t * my + t * t * b.y;
        if (x < -10 || x > W + 10 || y < -10 || y > H + 10) return;
        const col = p.color || (p.loadPct > 0.9 ? '#ff3355' : p.loadPct > 0.75 ? '#ffb800' : '#00ff88');
        ctx.save();
        ctx.globalAlpha = p.building ? 0.7 : 0.5;
        ctx.fillStyle = col;
        ctx.shadowColor = col;
        ctx.shadowBlur = p.building ? 5 : 3;
        ctx.beginPath(); ctx.arc(x, y, p.building ? 2 : 1.3, 0, Math.PI * 2); ctx.fill();
        ctx.restore();
      });

      // Substation nodes
      const zoom = mapRef.current.getZoom();
      substations.forEach(n => {
        const p = proj(n.lng, n.lat);
        if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) return;
        const loadPct = n.loadPct || 0.7;
        const col = loadPct > 0.9 ? '#ff3355' : loadPct > 0.75 ? '#ffb800' : '#00ff88';
        const r = 3 + loadPct * 5;

        // Halo
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r + 12);
        grad.addColorStop(0, col + '18');
        grad.addColorStop(1, col + '00');
        ctx.save(); ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 12, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        // Dot
        ctx.save(); ctx.fillStyle = col; ctx.shadowColor = col; ctx.shadowBlur = 8;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        // Core
        ctx.save(); ctx.fillStyle = '#050a14';
        ctx.beginPath(); ctx.arc(p.x, p.y, r * 0.25, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        // Label
        if (zoom > 5.8) {
          ctx.save();
          ctx.font = `500 ${Math.min(10, 6 + zoom * 0.3)}px 'JetBrains Mono', monospace`;
          ctx.fillStyle = 'rgba(192,212,232,0.4)';
          ctx.textAlign = 'center';
          ctx.fillText(n.name, p.x, p.y + r + 11);
          if (n.load) {
            ctx.font = `400 ${Math.min(8, 5 + zoom * 0.2)}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = col + '80';
            ctx.fillText(`${n.load} MW`, p.x, p.y + r + 20);
          }
          ctx.restore();
        }
      });

      // Placed buildings
      placedBuildings.forEach((b, i) => {
        const spec = BUILDING_TYPES[b.type];
        if (!spec) return;
        const p = proj(b.lng, b.lat);
        if (p.x < -30 || p.x > W + 30 || p.y < -30 || p.y > H + 30) return;
        const isSelected = selectedBuilding === i;
        const r = 10;

        // Selection ring
        if (isSelected) {
          ctx.save(); ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.globalAlpha = 0.6;
          ctx.beginPath(); ctx.arc(p.x, p.y, r + 6, 0, Math.PI * 2); ctx.stroke(); ctx.restore();
        }

        // Glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, r + 14);
        grad.addColorStop(0, spec.color + '25');
        grad.addColorStop(1, spec.color + '00');
        ctx.save(); ctx.fillStyle = grad;
        ctx.beginPath(); ctx.arc(p.x, p.y, r + 14, 0, Math.PI * 2); ctx.fill(); ctx.restore();

        // Circle
        ctx.save();
        ctx.fillStyle = 'rgba(8,16,32,0.85)';
        ctx.strokeStyle = spec.color;
        ctx.lineWidth = 1.5;
        ctx.shadowColor = spec.color;
        ctx.shadowBlur = 10;
        ctx.beginPath(); ctx.arc(p.x, p.y, r, 0, Math.PI * 2);
        ctx.fill(); ctx.stroke(); ctx.restore();

        // Icon
        ctx.save();
        ctx.font = `${r}px sans-serif`;
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(spec.icon, p.x, p.y);
        ctx.restore();

        // Label
        if (zoom > 6.5) {
          ctx.save();
          ctx.font = `500 9px 'JetBrains Mono', monospace`;
          ctx.fillStyle = spec.color + '90';
          ctx.textAlign = 'center';
          ctx.fillText(`${spec.name}`, p.x, p.y + r + 12);
          ctx.fillStyle = 'rgba(192,212,232,0.35)';
          ctx.font = '400 8px "JetBrains Mono", monospace';
          ctx.fillText(`${spec.mw} MW`, p.x, p.y + r + 22);
          ctx.restore();
        }
      });

      // Placement preview (ghost building following cursor)
      // Handled via CSS cursor, not canvas

      animRef.current = requestAnimationFrame(draw);
    };
    animRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(animRef.current);
  }, [substations, placedBuildings, selectedBuilding, proj]);

  // Click handler
  const handleClick = useCallback((e) => {
    if (!mapRef.current) return;
    const rect = canvasRef.current.getBoundingClientRect();
    const mx = e.clientX - rect.left, my = e.clientY - rect.top;

    // If placing a building
    if (activeTool) {
      const lngLat = mapRef.current.unproject([mx, my]);
      onPlaceBuilding(activeTool, lngLat.lng, lngLat.lat);
      return;
    }

    // Check if clicking a placed building
    for (let i = 0; i < placedBuildings.length; i++) {
      const b = placedBuildings[i];
      const p = proj(b.lng, b.lat);
      if (Math.hypot(p.x - mx, p.y - my) < 16) {
        onSelectBuilding(i);
        return;
      }
    }
    onDeselectBuilding();
  }, [activeTool, placedBuildings, proj, onPlaceBuilding, onSelectBuilding, onDeselectBuilding]);

  const cursorStyle = activeTool ? 'crosshair' : 'grab';

  return (
    <div className="absolute inset-0">
      <div ref={containerRef} className="absolute inset-0" />
      <canvas ref={canvasRef} className="absolute inset-0 pointer-events-none z-10" />
      <div className="absolute inset-0 z-[15]" onClick={handleClick} style={{ cursor: cursorStyle }} />
      {/* Scan line */}
      <div className="absolute top-0 left-0 right-0 h-px z-20 pointer-events-none"
           style={{
             background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.4), transparent)',
             animation: 'scan-line 8s ease-in-out infinite',
           }} />
    </div>
  );
}
