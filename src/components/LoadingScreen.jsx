import { useEffect, useState } from 'react';

export default function LoadingScreen({
  videoSrc,
  show,
  minDurationMs = 1400,
  fadeMs = 500,
  onDone,
}) {
  const [canDismiss, setCanDismiss] = useState(false);
  const [isFading, setIsFading] = useState(false);
  const [isGone, setIsGone] = useState(false);

  useEffect(() => {
    const t = window.setTimeout(() => setCanDismiss(true), Math.max(0, minDurationMs));
    return () => window.clearTimeout(t);
  }, [minDurationMs]);

  useEffect(() => {
    if (!show && canDismiss) setIsFading(true);
  }, [show, canDismiss]);

  useEffect(() => {
    if (!isFading) return;
    const t = window.setTimeout(() => {
      setIsGone(true);
      onDone?.();
    }, Math.max(0, fadeMs));
    return () => window.clearTimeout(t);
  }, [isFading, fadeMs, onDone]);

  if (isGone) return null;

  return (
    <div
      className={`absolute inset-0 z-[100] transition-opacity ${isFading ? 'opacity-0' : 'opacity-100'}`}
      style={{ transitionDuration: `${fadeMs}ms` }}
      aria-label="Loading…"
      role="status"
    >
      {/* Smooth backdrop */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(1000px 700px at 50% 30%, rgba(0,212,255,0.14), transparent 60%), radial-gradient(900px 700px at 50% 70%, rgba(168,85,247,0.10), transparent 62%), linear-gradient(180deg, #050a14 0%, #060b16 40%, #03060e 100%)',
        }}
      />

      {/* Centered square video card */}
      <div className="absolute inset-0 grid place-items-center px-6">
        <div
          className="w-[min(72vw,380px)] aspect-square rounded-2xl overflow-hidden border border-[rgba(255,255,255,0.10)] bg-[rgba(8,16,32,0.55)] shadow-[0_24px_80px_rgba(0,0,0,0.65)] backdrop-blur-2xl"
          style={{
            boxShadow:
              '0 24px 80px rgba(0,0,0,0.65), 0 0 0 1px rgba(0,212,255,0.06) inset',
          }}
        >
          <video
            className="w-full h-full object-contain"
            src={videoSrc}
            autoPlay
            muted
            playsInline
            loop
            preload="auto"
          />
        </div>
      </div>
    </div>
  );
}
