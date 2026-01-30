import React, { useEffect, useRef } from 'react';

interface ParticleData {
  x: number;
  y: number;
  vx: number;
  vy: number;
  size: number;
}

function createParticle(canvasWidth: number, canvasHeight: number, ease: number): ParticleData {
  return {
    x: Math.random() * canvasWidth,
    y: Math.random() * canvasHeight,
    vx: (Math.random() - 0.5) * (ease / 100),
    vy: (Math.random() - 0.5) * (ease / 100),
    size: Math.random() * 2 + 1,
  };
}

function updateParticle(particle: ParticleData, canvasWidth: number, canvasHeight: number): void {
  particle.x += particle.vx;
  particle.y += particle.vy;

  if (particle.x < 0 || particle.x > canvasWidth) particle.vx = -particle.vx;
  if (particle.y < 0 || particle.y > canvasHeight) particle.vy = -particle.vy;
}

function drawParticle(particle: ParticleData, ctx: CanvasRenderingContext2D): void {
  ctx.fillStyle = 'rgba(139, 92, 246, 0.5)'; // primary color with opacity
  ctx.beginPath();
  ctx.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
  ctx.fill();
}

interface ParticlesProps {
  className?: string;
  quantity?: number;
  staticity?: number;
  ease?: number;
  refresh?: boolean;
}

export const Particles: React.FC<ParticlesProps> = ({
  className = '',
  quantity = 50,
  staticity = 50,
  ease = 50,
  refresh = false,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let animationFrameId: number;
    const particles: ParticleData[] = [];

    const resizeCanvas = () => {
      canvas.width = canvas.offsetWidth;
      canvas.height = canvas.offsetHeight;
    };

    const initParticles = () => {
      particles.length = 0;
      for (let i = 0; i < quantity; i++) {
        particles.push(createParticle(canvas.width, canvas.height, ease));
      }
    };

    const animate = () => {
      if (!ctx || !canvas) return;
      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((particle) => {
        updateParticle(particle, canvas.width, canvas.height);
        drawParticle(particle, ctx);
      });

      animationFrameId = requestAnimationFrame(animate);
    };

    resizeCanvas();
    initParticles();
    animate();

    // Create named handler for proper cleanup
    const handleResize = () => {
      resizeCanvas();
      initParticles();
    };

    window.addEventListener('resize', handleResize);

    return () => {
      cancelAnimationFrame(animationFrameId);
      window.removeEventListener('resize', handleResize);
    };
  }, [quantity, staticity, ease, refresh]);

  return (
    <canvas
      ref={canvasRef}
      className={`absolute inset-0 ${className}`}
      style={{ width: '100%', height: '100%' }}
    />
  );
};
