"use client";

export function FilmGrain() {
  return (
    <div
      aria-hidden="true"
      className="grain-overlay pointer-events-none fixed inset-0 z-[9999] select-none"
    >
      <svg className="w-full h-full opacity-60">
        <filter id="film-grain-filter">
          <feTurbulence
            type="fractalNoise"
            baseFrequency="0.75"
            numOctaves="3"
            stitchTiles="stitch"
          />
          <feColorMatrix
            type="matrix"
            values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 0.15 0"
          />
        </filter>
        <rect width="100%" height="100%" filter="url(#film-grain-filter)" />
      </svg>
    </div>
  );
}
