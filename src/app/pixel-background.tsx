"use client";

import { useEffect, useRef } from "react";

const CELL = 14; // grid step in CSS px
const SIZE = 10; // pixel square size in CSS px

/** A grid of dim pixels that slowly ripple, drawn on a canvas behind the hero. */
export function PixelBackground() {
  const ref = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = ref.current;
    const ctx = canvas?.getContext("2d");
    if (!canvas || !ctx) return;

    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let w = 0;
    let h = 0;
    let frame = 0;

    const resize = () => {
      const dpr = window.devicePixelRatio || 1;
      w = canvas.clientWidth;
      h = canvas.clientHeight;
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    };

    const draw = (time: number) => {
      const t = time / 1000;
      ctx.clearRect(0, 0, w, h);
      const cols = Math.ceil(w / CELL);
      const rows = Math.ceil(h / CELL);
      for (let y = 0; y < rows; y++) {
        for (let x = 0; x < cols; x++) {
          // overlapping slow waves give a drifting, cloudy pattern
          const v =
            Math.sin(x * 0.18 + t * 0.6) +
            Math.sin(y * 0.22 - t * 0.45) +
            Math.sin((x + y) * 0.11 + t * 0.3) +
            Math.sin(Math.hypot(x - cols / 2, y) * 0.25 - t * 0.8);
          const n = (v + 4) / 8; // 0..1
          if (n < 0.55) continue;
          const alpha = (n - 0.55) * 0.5; // max ~0.22
          ctx.fillStyle = `rgba(74, 222, 128, ${alpha.toFixed(3)})`;
          ctx.fillRect(x * CELL, y * CELL, SIZE, SIZE);
        }
      }
      if (!reduceMotion) frame = requestAnimationFrame(draw);
    };

    resize();
    window.addEventListener("resize", resize);
    frame = requestAnimationFrame(draw);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("resize", resize);
    };
  }, []);

  return (
    <canvas
      ref={ref}
      aria-hidden="true"
      className="pointer-events-none absolute inset-x-0 top-0 h-[95svh] w-full [mask-image:linear-gradient(to_bottom,black_40%,transparent)]"
    />
  );
}
