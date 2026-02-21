import { useState, useEffect, useRef } from 'react';
import maplibregl from 'maplibre-gl';
import 'maplibre-gl/dist/maplibre-gl.css';

const TEXAS_CENTER = [-99.0, 31.0];
const AUSTIN_CENTER = [-97.7431, 30.2672];
const START_ZOOM = 5.5;
const END_ZOOM = 14.5;
const END_PITCH = 60;
const END_BEARING = -20;
const FLY_DURATION_MS = 2500;
const HOLD_BEFORE_FLY_MS = 400;
const FADE_OUT_MS = 450;

export default function MapZoomTransition({ show, onComplete }) {
  const containerRef = useRef(null);
  const mapRef = useRef(null);
  const [phase, setPhase] = useState('idle');
  const [opacity, setOpacity] = useState(1);
  const [currentZoom, setCurrentZoom] = useState(START_ZOOM);
  const [coords, setCoords] = useState({ lat: TEXAS_CENTER[1], lng: TEXAS_CENTER[0] });
  const hasCompletedRef = useRef(false);
  const timersRef = useRef([]);

  useEffect(() => {
    if (!show) {
      setPhase('idle');
      setOpacity(1);
      return;
    }

    hasCompletedRef.current = false;
    setOpacity(1);
    setPhase('loading');

    const map = new maplibregl.Map({
      container: containerRef.current,
      style: 'https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json',
      center: TEXAS_CENTER,
      zoom: START_ZOOM,
      pitch: 0,
      bearing: 0,
      interactive: false,
      attributionControl: false,
      fadeDuration: 0,
    });

    mapRef.current = map;

    map.on('zoom', () => {
      setCurrentZoom(map.getZoom());
      const c = map.getCenter();
      setCoords({ lat: c.lat, lng: c.lng });
    });

    map.on('move', () => {
      const c = map.getCenter();
      setCoords({ lat: c.lat, lng: c.lng });
    });

    map.on('load', () => {
      setPhase('hold');

      const holdTimer = setTimeout(() => {
        setPhase('flying');

        map.flyTo({
          center: AUSTIN_CENTER,
          zoom: END_ZOOM,
          pitch: END_PITCH,
          bearing: END_BEARING,
          duration: FLY_DURATION_MS,
          essential: true,
          curve: 1.5,
          easing: (t) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2,
        });
      }, HOLD_BEFORE_FLY_MS);

      timersRef.current.push(holdTimer);
    });

    map.on('moveend', () => {
      if (hasCompletedRef.current) return;
      const z = map.getZoom();
      if (z >= END_ZOOM - 0.5) {
        hasCompletedRef.current = true;
        setPhase('fading');
        setOpacity(0);

        const fadeTimer = setTimeout(() => {
          onComplete?.();
        }, FADE_OUT_MS);
        timersRef.current.push(fadeTimer);
      }
    });

    return () => {
      timersRef.current.forEach(t => clearTimeout(t));
      timersRef.current = [];
      map.remove();
      mapRef.current = null;
    };
  }, [show, onComplete]);

  if (!show && phase === 'idle') return null;

  return (
    <div
      className="absolute inset-0 z-[90]"
      style={{
        opacity,
        transition: phase === 'fading' ? `opacity ${FADE_OUT_MS}ms ease-out` : 'none',
        pointerEvents: phase === 'fading' ? 'none' : 'auto',
      }}
    >
      {/* MapLibre container */}
      <div ref={containerRef} className="absolute inset-0" />

      {/* Vignette overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(5,10,20,0.6) 100%)',
        }}
      />

      {/* Top edge fade */}
      <div
        className="absolute top-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(to bottom, rgba(5,10,20,0.7), transparent)' }}
      />
      {/* Bottom edge fade */}
      <div
        className="absolute bottom-0 left-0 right-0 h-16 pointer-events-none"
        style={{ background: 'linear-gradient(to top, rgba(5,10,20,0.7), transparent)' }}
      />

      {/* Scan line */}
      <div
        className="absolute left-0 right-0 h-px pointer-events-none"
        style={{
          background: 'linear-gradient(90deg, transparent, rgba(0,212,255,0.35), transparent)',
          animation: 'scan-line 3s ease-in-out infinite',
          top: '50%',
        }}
      />

      {/* Crosshair at center */}
      {phase !== 'fading' && (
        <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
          <div className="relative" style={{ width: 80, height: 80 }}>
            {/* Horizontal line */}
            <div className="absolute top-1/2 left-0 right-0 h-px" style={{ background: 'rgba(0,212,255,0.25)' }} />
            {/* Vertical line */}
            <div className="absolute left-1/2 top-0 bottom-0 w-px" style={{ background: 'rgba(0,212,255,0.25)' }} />
            {/* Center dot */}
            <div
              className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 rounded-full"
              style={{
                width: 6, height: 6,
                background: '#00d4ff',
                boxShadow: '0 0 12px rgba(0,212,255,0.6), 0 0 24px rgba(0,212,255,0.3)',
              }}
            />
            {/* Corner brackets */}
            {[
              { top: 0, left: 0, borderTop: '1px solid rgba(0,212,255,0.4)', borderLeft: '1px solid rgba(0,212,255,0.4)' },
              { top: 0, right: 0, borderTop: '1px solid rgba(0,212,255,0.4)', borderRight: '1px solid rgba(0,212,255,0.4)' },
              { bottom: 0, left: 0, borderBottom: '1px solid rgba(0,212,255,0.4)', borderLeft: '1px solid rgba(0,212,255,0.4)' },
              { bottom: 0, right: 0, borderBottom: '1px solid rgba(0,212,255,0.4)', borderRight: '1px solid rgba(0,212,255,0.4)' },
            ].map((style, i) => (
              <div key={i} className="absolute" style={{ width: 12, height: 12, ...style }} />
            ))}
          </div>
        </div>
      )}

      {/* Top HUD label */}
      <div className="absolute top-5 left-1/2 -translate-x-1/2 text-center pointer-events-none select-none">
        <div
          className="font-mono text-[10px] tracking-[4px] uppercase"
          style={{
            color: 'rgba(0,212,255,0.6)',
            textShadow: '0 0 10px rgba(0,212,255,0.3)',
            opacity: phase === 'fading' ? 0 : 1,
            transition: 'opacity 400ms',
          }}
        >
          {phase === 'hold' || phase === 'loading'
            ? 'ERCOT GRID \u2014 TEXAS'
            : 'TARGETING AUSTIN, TX'}
        </div>
      </div>

      {/* Bottom-left coordinates HUD */}
      <div className="absolute bottom-5 left-5 pointer-events-none select-none">
        <div className="font-mono text-[9px] tracking-[1px]" style={{ color: 'rgba(0,212,255,0.4)' }}>
          <div>{coords.lat.toFixed(4)}&deg;N &nbsp; {Math.abs(coords.lng).toFixed(4)}&deg;W</div>
        </div>
      </div>

      {/* Bottom-right zoom HUD */}
      <div className="absolute bottom-5 right-5 pointer-events-none select-none">
        <div className="font-mono text-[9px] tracking-[1px]" style={{ color: 'rgba(0,212,255,0.4)' }}>
          <div>ZOOM {currentZoom.toFixed(1)}x</div>
        </div>
      </div>

      {/* Bottom center status */}
      {(phase === 'flying' || phase === 'fading') && (
        <div className="absolute bottom-5 left-1/2 -translate-x-1/2 pointer-events-none select-none">
          <div
            className="font-mono text-[9px] tracking-[3px] uppercase"
            style={{
              color: 'rgba(0,212,255,0.4)',
              opacity: phase === 'fading' ? 0 : 1,
              transition: 'opacity 400ms',
            }}
          >
            INITIALIZING DIGITAL TWIN
          </div>
        </div>
      )}

      {/* Austin marker label (appears during fly) */}
      {(phase === 'flying' || phase === 'fading') && currentZoom > 8 && (
        <div
          className="absolute top-1/2 left-1/2 pointer-events-none select-none"
          style={{
            transform: 'translate(24px, -40px)',
            opacity: phase === 'fading' ? 0 : Math.min(1, (currentZoom - 8) / 2),
            transition: phase === 'fading' ? 'opacity 400ms' : 'none',
          }}
        >
          <div className="font-mono text-[11px] font-semibold tracking-[2px]" style={{ color: '#00d4ff', textShadow: '0 0 8px rgba(0,212,255,0.5)' }}>
            AUSTIN
          </div>
          <div className="font-mono text-[8px] tracking-[1px]" style={{ color: 'rgba(0,212,255,0.5)' }}>
            POP 2.3M &middot; ERCOT NODE
          </div>
        </div>
      )}
    </div>
  );
}
