import { useEffect, useRef, useState } from 'react';
import { useReducedMotion } from 'framer-motion';

export default function AnimatedBackground() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [mouse, setMouse] = useState({ x: 0, y: 0 });
  const reducedMotion = useReducedMotion();

  useEffect(() => {
    if (reducedMotion) return;
    let raf = 0;
    const handleMove = (e: MouseEvent) => {
      cancelAnimationFrame(raf);
      raf = requestAnimationFrame(() => {
        const { innerWidth, innerHeight } = window;
        setMouse({
          x: (e.clientX / innerWidth - 0.5) * 2,
          y: (e.clientY / innerHeight - 0.5) * 2,
        });
      });
    };
    window.addEventListener('mousemove', handleMove);
    return () => {
      window.removeEventListener('mousemove', handleMove);
      cancelAnimationFrame(raf);
    };
  }, [reducedMotion]);

  const lines = Array.from({ length: 12 }, (_, i) => i);

  return (
    <div
      ref={containerRef}
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden"
      aria-hidden="true"
    >
      {/* Base gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-charcoal via-charcoal-light to-charcoal" />

      {/* Mouse-responsive radial light */}
      {!reducedMotion && (
        <div
          className="absolute inset-0 transition-transform duration-1000 ease-out"
          style={{
            transform: `translate(${mouse.x * 30}px, ${mouse.y * 30}px)`,
          }}
        >
          <div
            className="absolute top-1/2 left-1/2 w-[800px] h-[800px] -translate-x-1/2 -translate-y-1/2 rounded-full"
            style={{
              background:
                'radial-gradient(circle, rgba(197, 248, 42, 0.04) 0%, transparent 60%)',
            }}
          />
        </div>
      )}

      {/* Animated contour lines */}
      <svg
        className="absolute inset-0 w-full h-full"
        preserveAspectRatio="none"
        viewBox="0 0 1440 900"
        style={{
          transform: `translate(${mouse.x * 15}px, ${mouse.y * 15}px)`,
          transition: 'transform 1.2s cubic-bezier(0.22, 1, 0.36, 1)',
        }}
      >
        <defs>
          <linearGradient id="lineGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="rgba(197, 248, 42, 0.06)" />
            <stop offset="50%" stopColor="rgba(45, 212, 191, 0.04)" />
            <stop offset="100%" stopColor="rgba(197, 248, 42, 0.02)" />
          </linearGradient>
        </defs>
        {lines.map((i) => {
          const y = 80 + i * 65;
          const offset = i * 12;
          return (
            <path
              key={i}
              d={`M -100 ${y} C 300 ${y - 40 + offset * 0.3}, 500 ${y + 50 - offset * 0.2}, 800 ${y - 20 + offset * 0.15} S 1300 ${y + 30 - offset * 0.25}, 1600 ${y - 10 + offset * 0.1}`}
              fill="none"
              stroke="url(#lineGradient)"
              strokeWidth="1"
              style={{
                animation: reducedMotion
                  ? 'none'
                  : `contour-flow ${8 + i * 0.5}s ease-in-out ${i * 0.3}s infinite alternate`,
              }}
            />
          );
        })}
      </svg>

      {/* Fine grain overlay */}
      <div
        className="absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage:
            "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 400 400' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.6'/%3E%3C/svg%3E\")",
        }}
      />

      {/* Vignette */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(15, 15, 14, 0.5) 100%)',
        }}
      />
    </div>
  );
}
