"use client";

import React, { useEffect, useState } from "react";
import { ArrowUp, Compass, Orbit, Sparkles } from "lucide-react";

export function ScrollProgress3D() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [showScrollTop, setShowScrollTop] = useState(false);
  const [gyroAngle, setGyroAngle] = useState(0);

  useEffect(() => {
    let animId: number;

    const handleScroll = () => {
      const totalScroll = document.documentElement.scrollHeight - window.innerHeight;
      if (totalScroll <= 0) {
        setScrollProgress(0);
        setShowScrollTop(false);
        return;
      }
      const currentScroll = window.scrollY;
      const progress = Math.min(100, Math.max(0, Math.round((currentScroll / totalScroll) * 100)));
      setScrollProgress(progress);
      setShowScrollTop(currentScroll > 280);
      setGyroAngle((currentScroll * 0.45) % 360);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  return (
    <>
      {/* 3D Holographic Neon Top Progress Bar with Laser Gleam */}
      <div className="fixed top-0 left-0 right-0 z-50 h-1.5 bg-zinc-200/40 dark:bg-zinc-800/40 overflow-hidden pointer-events-none">
        <div
          className="h-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 transition-all duration-100 ease-out shadow-[0_0_15px_rgba(99,102,241,0.9)]"
          style={{ width: `${scrollProgress}%` }}
        />
      </div>

      {/* Floating 3D Spatial Gyroscope & Back to Top in Bottom Right */}
      {showScrollTop && (
        <div className="fixed bottom-6 right-6 z-40 flex items-center space-x-2.5 animate-in fade-in slide-in-from-bottom-5 duration-200 select-none">
          {/* 3D Holographic Compass & Depth Meter */}
          <div className="hidden sm:flex items-center space-x-2 px-3.5 py-2 rounded-2xl bg-white/85 dark:bg-zinc-900/85 backdrop-blur-xl border border-indigo-200/80 dark:border-indigo-800/80 text-zinc-700 dark:text-zinc-200 text-xs font-bold shadow-xl shadow-indigo-500/15">
            <div
              className="w-5 h-5 rounded-lg bg-indigo-50 dark:bg-indigo-950/80 border border-indigo-200 dark:border-indigo-800 flex items-center justify-center text-indigo-600 dark:text-indigo-400"
              style={{
                transform: `rotate(${gyroAngle}deg)`,
                transition: "transform 0.1s linear",
              }}
            >
              <Compass className="w-3.5 h-3.5" />
            </div>

            <div className="flex flex-col">
              <span className="text-[9px] uppercase tracking-wider text-indigo-600 dark:text-indigo-400 font-extrabold leading-none">
                3D ALTITUDE
              </span>
              <span className="text-xs font-mono font-bold leading-none mt-0.5">
                {Math.round(scrollProgress * 24)}m &bull; {scrollProgress}%
              </span>
            </div>
          </div>

          {/* 3D Elevated Rocket Back to Top */}
          <button
            type="button"
            onClick={scrollToTop}
            aria-label="Scroll back to top"
            className="w-11 h-11 rounded-2xl bg-gradient-to-tr from-indigo-600 via-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 active:scale-95 text-white flex items-center justify-center shadow-lg shadow-indigo-600/35 border border-indigo-400/40 transition-all duration-150 cursor-pointer group btn-3d-tactile"
          >
            <ArrowUp className="w-5 h-5 group-hover:-translate-y-1 transition-transform" />
          </button>
        </div>
      )}
    </>
  );
}
