"use client";

import React, { useEffect, useRef } from "react";

interface Particle3D {
  x: number;
  y: number;
  z: number;
  origX: number;
  origY: number;
  size: number;
  color: string;
  speed: number;
  pulsePhase: number;
}

interface GeometricCrystal3D {
  type: "octahedron" | "cube" | "pyramid";
  x: number;
  y: number;
  z: number;
  rotX: number;
  rotY: number;
  rotZ: number;
  rotSpeedX: number;
  rotSpeedY: number;
  rotSpeedZ: number;
  size: number;
  color: string;
}

export function Scene3DBackground() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let animId: number;
    let width = (canvas.width = window.innerWidth);
    let height = (canvas.height = window.innerHeight);

    // Dynamic scroll tracking with smooth lerp
    let scrollY = window.scrollY;
    let targetScrollY = window.scrollY;
    let scrollVelocity = 0;

    // Mouse parallax tracking
    let mouseX = 0;
    let mouseY = 0;
    let targetMouseX = 0;
    let targetMouseY = 0;

    const handleResize = () => {
      if (!canvas) return;
      width = canvas.width = window.innerWidth;
      height = canvas.height = window.innerHeight;
    };

    const handleScroll = () => {
      targetScrollY = window.scrollY;
    };

    const handleMouseMove = (e: MouseEvent) => {
      targetMouseX = (e.clientX / width - 0.5) * 2;
      targetMouseY = (e.clientY / height - 0.5) * 2;
    };

    window.addEventListener("resize", handleResize, { passive: true });
    window.addEventListener("scroll", handleScroll, { passive: true });
    window.addEventListener("mousemove", handleMouseMove, { passive: true });

    // Elegant cyber-hologram color palette
    const colors = [
      "rgba(99, 102, 241,", // Indigo
      "rgba(139, 92, 246,", // Violet
      "rgba(168, 85, 247,", // Purple
      "rgba(59, 130, 246,", // Electric Blue
      "rgba(20, 184, 166,", // Cyan / Teal
      "rgba(236, 72, 153,", // Pink accent
    ];

    // Generate 150 3D spatial particles
    const particleCount = 150;
    const particles: Particle3D[] = [];
    for (let i = 0; i < particleCount; i++) {
      const z = Math.random() * 1600 - 200;
      const x = (Math.random() - 0.5) * width * 1.8;
      const y = (Math.random() - 0.5) * height * 2.5;
      particles.push({
        x,
        y,
        z,
        origX: x,
        origY: y,
        size: Math.random() * 2.8 + 0.8,
        color: colors[Math.floor(Math.random() * colors.length)],
        speed: Math.random() * 0.5 + 0.25,
        pulsePhase: Math.random() * Math.PI * 2,
      });
    }

    // Geometry Definitions
    // 1. Octahedron
    const octaVerts = [
      { x: 0, y: 1.1, z: 0 },
      { x: 0, y: -1.1, z: 0 },
      { x: 1, y: 0, z: 0 },
      { x: -1, y: 0, z: 0 },
      { x: 0, y: 0, z: 1 },
      { x: 0, y: 0, z: -1 },
    ];
    const octaEdges = [
      [0, 2], [0, 3], [0, 4], [0, 5],
      [1, 2], [1, 3], [1, 4], [1, 5],
      [2, 4], [4, 3], [3, 5], [5, 2],
    ];

    // 2. Cube
    const cubeVerts = [
      { x: -0.7, y: -0.7, z: -0.7 },
      { x: 0.7, y: -0.7, z: -0.7 },
      { x: 0.7, y: 0.7, z: -0.7 },
      { x: -0.7, y: 0.7, z: -0.7 },
      { x: -0.7, y: -0.7, z: 0.7 },
      { x: 0.7, y: -0.7, z: 0.7 },
      { x: 0.7, y: 0.7, z: 0.7 },
      { x: -0.7, y: 0.7, z: 0.7 },
    ];
    const cubeEdges = [
      [0, 1], [1, 2], [2, 3], [3, 0],
      [4, 5], [5, 6], [6, 7], [7, 4],
      [0, 4], [1, 5], [2, 6], [3, 7],
    ];

    // 3. Pyramid
    const pyramidVerts = [
      { x: 0, y: -1, z: 0 },
      { x: -0.8, y: 0.7, z: -0.8 },
      { x: 0.8, y: 0.7, z: -0.8 },
      { x: 0.8, y: 0.7, z: 0.8 },
      { x: -0.8, y: 0.7, z: 0.8 },
    ];
    const pyramidEdges = [
      [0, 1], [0, 2], [0, 3], [0, 4],
      [1, 2], [2, 3], [3, 4], [4, 1],
    ];

    // Place floating 3D crystals in 3D outer perimeter (never directly blocking central reading content)
    const crystals: GeometricCrystal3D[] = [
      {
        type: "octahedron",
        x: -width * 0.38,
        y: -height * 0.25,
        z: 400,
        rotX: 0.4,
        rotY: 0.3,
        rotZ: 0.1,
        rotSpeedX: 0.008,
        rotSpeedY: 0.012,
        rotSpeedZ: 0.005,
        size: 55,
        color: "rgba(99, 102, 241,",
      },
      {
        type: "cube",
        x: width * 0.42,
        y: -height * 0.28,
        z: 550,
        rotX: 0.2,
        rotY: 0.5,
        rotZ: 0.3,
        rotSpeedX: -0.007,
        rotSpeedY: 0.009,
        rotSpeedZ: 0.004,
        size: 45,
        color: "rgba(168, 85, 247,",
      },
      {
        type: "pyramid",
        x: width * 0.38,
        y: height * 0.32,
        z: 320,
        rotX: 0.7,
        rotY: 0.2,
        rotZ: 0.5,
        rotSpeedX: 0.009,
        rotSpeedY: -0.011,
        rotSpeedZ: 0.006,
        size: 50,
        color: "rgba(20, 184, 166,",
      },
      {
        type: "octahedron",
        x: -width * 0.42,
        y: height * 0.35,
        z: 600,
        rotX: 0.1,
        rotY: 0.8,
        rotZ: 0.2,
        rotSpeedX: -0.006,
        rotSpeedY: 0.014,
        rotSpeedZ: 0.005,
        size: 65,
        color: "rgba(236, 72, 153,",
      },
      {
        type: "cube",
        x: width * 0.05,
        y: height * 0.55,
        z: 750,
        rotX: 0.5,
        rotY: 0.4,
        rotZ: 0.6,
        rotSpeedX: 0.008,
        rotSpeedY: -0.008,
        rotSpeedZ: 0.007,
        size: 40,
        color: "rgba(59, 130, 246,",
      },
    ];

    const fov = 480;
    let time = 0;

    const render = () => {
      time += 0.02;

      // Smooth interpolation for scroll velocity and mouse position
      scrollVelocity = (targetScrollY - scrollY) * 0.085;
      scrollY += scrollVelocity;

      mouseX += (targetMouseX - mouseX) * 0.05;
      mouseY += (targetMouseY - mouseY) * 0.05;

      ctx.clearRect(0, 0, width, height);

      const centerX = width / 2;
      const centerY = height / 2;

      // 3D Perspective Projection Function with Mouse Gimbal Parallax
      const project = (x: number, y: number, z: number) => {
        const angleY = mouseX * 0.2;
        const angleX = mouseY * 0.16;

        // Rotate along Y (horizontal camera pan)
        const cosY = Math.cos(angleY);
        const sinY = Math.sin(angleY);
        const x1 = x * cosY - z * sinY;
        const z1 = z * cosY + x * sinY;

        // Rotate along X (vertical camera pitch)
        const cosX = Math.cos(angleX);
        const sinX = Math.sin(angleX);
        const y2 = y * cosX - z1 * sinX;
        const z2 = z1 * cosX + y * sinX;

        const depth = Math.max(12, fov + z2);
        const scale = fov / depth;

        return {
          px: centerX + x1 * scale,
          py: centerY + y2 * scale,
          scale,
          z: z2,
        };
      };

      // 1. Render 3D Perspective Cyber Horizon Grid at the bottom plane
      const gridZStart = 100;
      const gridZEnd = 1400;
      const gridStepZ = 120;
      const gridWidth = width * 1.8;
      const gridY = height * 0.62;

      ctx.save();
      const gridScrollOffset = (scrollY * 0.4) % gridStepZ;

      // Horizontal lines receding into 3D horizon
      for (let z = gridZStart - gridScrollOffset; z <= gridZEnd; z += gridStepZ) {
        if (z < 50) continue;
        const pLeft = project(-gridWidth / 2, gridY, z);
        const pRight = project(gridWidth / 2, gridY, z);
        const alpha = Math.max(0.01, (1 - z / gridZEnd) * 0.14);

        ctx.strokeStyle = `rgba(99, 102, 241, ${alpha})`;
        ctx.lineWidth = Math.max(0.6, 1.2 * pLeft.scale);
        ctx.beginPath();
        ctx.moveTo(pLeft.px, pLeft.py);
        ctx.lineTo(pRight.px, pRight.py);
        ctx.stroke();
      }

      // Longitudinal lines pointing towards vanishing point
      const xLines = 14;
      for (let i = -xLines; i <= xLines; i++) {
        const xPos = (i / xLines) * (gridWidth / 2);
        const pNear = project(xPos, gridY, gridZStart);
        const pFar = project(xPos, gridY, gridZEnd);
        const alpha = Math.max(0.02, (1 - Math.abs(i) / (xLines + 2)) * 0.12);

        ctx.strokeStyle = `rgba(139, 92, 246, ${alpha})`;
        ctx.lineWidth = 0.8;
        ctx.beginPath();
        ctx.moveTo(pNear.px, pNear.py);
        ctx.lineTo(pFar.px, pFar.py);
        ctx.stroke();
      }
      ctx.restore();

      // 2. Render 3D Floating Spatial Particles
      for (let i = 0; i < particles.length; i++) {
        const p = particles[i];

        // Move forward along Z with scroll speed and ambient velocity
        p.z -= scrollVelocity * 0.75 + p.speed;

        // Loop seamlessly in 3D volume
        if (p.z < -fov + 25) {
          p.z = 1400;
          p.x = (Math.random() - 0.5) * width * 1.8;
          p.y = (Math.random() - 0.5) * height * 2.5;
        } else if (p.z > 1450) {
          p.z = -80;
        }

        // Gentle breathing pulsation
        p.pulsePhase += 0.025;
        const pulse = 1 + Math.sin(p.pulsePhase) * 0.2;

        const proj = project(p.x, p.y, p.z);

        if (
          proj.scale > 0 &&
          proj.px >= -40 &&
          proj.px <= width + 40 &&
          proj.py >= -40 &&
          proj.py <= height + 40
        ) {
          const depthAlpha = Math.max(0.08, Math.min(0.85, (1 - p.z / 1400)));
          const rad = Math.max(0.7, p.size * proj.scale * pulse);

          ctx.fillStyle = `${p.color} ${depthAlpha})`;
          ctx.beginPath();
          ctx.arc(proj.px, proj.py, rad, 0, Math.PI * 2);
          ctx.fill();

          // Speed streak trails during fast scrolling
          if (Math.abs(scrollVelocity) > 2) {
            const streakLen = Math.min(45, Math.abs(scrollVelocity) * 3) * proj.scale;
            ctx.strokeStyle = `${p.color} ${depthAlpha * 0.6})`;
            ctx.lineWidth = rad * 0.75;
            ctx.beginPath();
            ctx.moveTo(proj.px, proj.py);
            ctx.lineTo(
              proj.px - mouseX * 2,
              proj.py - (scrollVelocity > 0 ? streakLen : -streakLen)
            );
            ctx.stroke();
          }
        }
      }

      // 3. Connect close spatial particles with 3D Holographic Constellation Lines
      for (let i = 0; i < particles.length; i += 3) {
        for (let j = i + 1; j < Math.min(i + 6, particles.length); j++) {
          const p1 = particles[i];
          const p2 = particles[j];
          const dx = p1.x - p2.x;
          const dy = p1.y - p2.y;
          const dz = p1.z - p2.z;
          const dist3D = Math.sqrt(dx * dx + dy * dy + dz * dz);

          if (dist3D < 145) {
            const proj1 = project(p1.x, p1.y, p1.z);
            const proj2 = project(p2.x, p2.y, p2.z);
            const lineAlpha = (1 - dist3D / 145) * 0.18 * ((proj1.scale + proj2.scale) / 2);
            ctx.strokeStyle = `rgba(99, 102, 241, ${lineAlpha})`;
            ctx.lineWidth = 0.65;
            ctx.beginPath();
            ctx.moveTo(proj1.px, proj1.py);
            ctx.lineTo(proj2.px, proj2.py);
            ctx.stroke();
          }
        }
      }

      // 4. Render Floating 3D Geometric Crystals
      crystals.forEach((crystal) => {
        // Continuous smooth rotation with scroll acceleration
        crystal.rotX += crystal.rotSpeedX + scrollVelocity * 0.0008;
        crystal.rotY += crystal.rotSpeedY + scrollVelocity * 0.0012;
        crystal.rotZ += crystal.rotSpeedZ;

        // Subtle floating bob in 3D
        const floatY = Math.sin(time + crystal.size) * 12;

        const cosX = Math.cos(crystal.rotX);
        const sinX = Math.sin(crystal.rotX);
        const cosY = Math.cos(crystal.rotY);
        const sinY = Math.sin(crystal.rotY);
        const cosZ = Math.cos(crystal.rotZ);
        const sinZ = Math.sin(crystal.rotZ);

        // Select geometry vertices and edges
        let baseVerts = octaVerts;
        let baseEdges = octaEdges;
        if (crystal.type === "cube") {
          baseVerts = cubeVerts;
          baseEdges = cubeEdges;
        } else if (crystal.type === "pyramid") {
          baseVerts = pyramidVerts;
          baseEdges = pyramidEdges;
        }

        // Transform vertices in 3D local orientation
        const transformedVerts = baseVerts.map((v) => {
          // Rotate Z
          const xz = v.x * cosZ - v.y * sinZ;
          const yz = v.y * cosZ + v.x * sinZ;

          // Rotate Y
          const xy = xz * cosY - v.z * sinY;
          const zy = v.z * cosY + xz * sinY;

          // Rotate X
          const yx = yz * cosX - zy * sinX;
          const zx = zy * cosX + yz * sinX;

          const worldX = crystal.x + xy * crystal.size;
          const worldY = crystal.y + floatY + yx * crystal.size;
          const worldZ = crystal.z + zx * crystal.size;

          return project(worldX, worldY, worldZ);
        });

        const centerProj = project(crystal.x, crystal.y + floatY, crystal.z);
        const crystalAlpha = Math.max(0.1, Math.min(0.65, (1 - crystal.z / 1200) * 0.7));

        // Draw crystal wireframe edges with dynamic neon glow
        ctx.strokeStyle = `${crystal.color} ${crystalAlpha})`;
        ctx.lineWidth = Math.max(0.9, 1.8 * centerProj.scale);

        baseEdges.forEach(([i1, i2]) => {
          const pt1 = transformedVerts[i1];
          const pt2 = transformedVerts[i2];
          ctx.beginPath();
          ctx.moveTo(pt1.px, pt1.py);
          ctx.lineTo(pt2.px, pt2.py);
          ctx.stroke();
        });

        // Draw glowing vertex nodes
        transformedVerts.forEach((pt) => {
          ctx.fillStyle = `${crystal.color} ${crystalAlpha + 0.25})`;
          ctx.beginPath();
          ctx.arc(pt.px, pt.py, Math.max(1.2, 2.5 * pt.scale), 0, Math.PI * 2);
          ctx.fill();
        });
      });

      animId = requestAnimationFrame(render);
    };

    render();

    return () => {
      cancelAnimationFrame(animId);
      window.removeEventListener("resize", handleResize);
      window.removeEventListener("scroll", handleScroll);
      window.removeEventListener("mousemove", handleMouseMove);
    };
  }, []);

  return (
    <div className="fixed inset-0 pointer-events-none -z-10 overflow-hidden select-none">
      <canvas ref={canvasRef} className="w-full h-full block" />
      {/* 3D Atmospheric Radial Ambient Lights */}
      <div className="absolute top-0 left-1/4 w-[500px] h-[500px] bg-indigo-500/10 dark:bg-indigo-600/15 rounded-full blur-[140px] pointer-events-none" />
      <div className="absolute bottom-1/3 right-1/4 w-[600px] h-[600px] bg-purple-500/10 dark:bg-purple-600/15 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-2/3 left-1/10 w-[400px] h-[400px] bg-teal-500/5 dark:bg-teal-500/10 rounded-full blur-[120px] pointer-events-none" />
    </div>
  );
}
