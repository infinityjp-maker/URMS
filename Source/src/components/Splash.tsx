import "./Splash.css";
import { useEffect, useRef, useState } from "react";
import Logo from "../assets/urms-logo.svg";

type Props = { hidden?: boolean };

export default function Splash({ hidden = false }: Props) {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const animRef = useRef<number | null>(null);
  const [dontShow, setDontShow] = useState(() => {
    try {
      return !!localStorage.getItem("urms.skipSplash");
    } catch {
      return false;
    }
  });
  const [iconSrc, setIconSrc] = useState<string | null>(null);

  // try to dynamically import a high-res PNG if user added one
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // dynamic import will succeed only if file exists in the project
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore
        const mod = await import(/* @vite-ignore */ "../assets/urms-icon.png");
        if (mounted && mod && mod.default) setIconSrc(mod.default);
      } catch (e) {
        if (mounted) setIconSrc(null);
      }
    })();
    return () => { mounted = false; };
  }, []);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    let w = (canvas!.width = window.innerWidth);
    let h = (canvas!.height = window.innerHeight);

    const particles = Array.from({ length: 40 }).map(() => ({
      x: Math.random() * w,
      y: Math.random() * h,
      r: 1 + Math.random() * 3.2,
      dx: (Math.random() - 0.5) * 0.9,
      dy: -0.2 - Math.random() * 0.9,
      hue: 200 + Math.random() * 140, // bluish-magenta range
      streak: Math.random() > 0.85,
    }));

    const rings: Array<{ x: number; y: number; t: number; hue: number } > = [];
    let frame = 0;

    function resize() {
      w = (canvas!.width = window.innerWidth);
      h = (canvas!.height = window.innerHeight);
    }
    window.addEventListener("resize", resize);

    function draw() {
      if (!ctx) return;
      frame++;
      // soft fade with slight trail to emphasize glow
      ctx.globalCompositeOperation = "source-over";
      ctx.fillStyle = "rgba(2,4,8,0.18)";
      ctx.fillRect(0, 0, w, h);

      ctx.globalCompositeOperation = "lighter";
      particles.forEach((p) => {
        p.x += p.dx;
        p.y += p.dy;
        if (p.y < -12) p.y = h + 12;
        if (p.x < -12) p.x = w + 12;
        if (p.x > w + 12) p.x = -12;

        // main glow
        const grad = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, p.r * 14);
        grad.addColorStop(0, `hsla(${p.hue},90%,60%,0.95)`);
        grad.addColorStop(0.2, `hsla(${p.hue},85%,55%,0.55)`);
        grad.addColorStop(1, `hsla(${p.hue},85%,50%,0)`);
        ctx.fillStyle = grad;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r * 10, 0, Math.PI * 2);
        ctx.fill();

        // subtle streaks for some particles
        if (p.streak) {
          ctx.save();
          ctx.translate(p.x, p.y);
          ctx.rotate((frame % 360) * 0.002 + (p.dx + p.dy));
          const lg = ctx.createLinearGradient(-p.r * 6, 0, p.r * 6, 0);
          lg.addColorStop(0, `hsla(${p.hue},90%,60%,0.0)`);
          lg.addColorStop(0.5, `hsla(${p.hue},90%,60%,0.65)`);
          lg.addColorStop(1, `hsla(${p.hue},90%,60%,0.0)`);
          ctx.fillStyle = lg;
          ctx.fillRect(-p.r * 6, -p.r * 2, p.r * 12, p.r * 4);
          ctx.restore();
        }

        // occasional small spark
        if (Math.random() > 0.998) {
          rings.push({ x: p.x, y: p.y, t: 0, hue: p.hue });
        }
      });

      // draw and advance rings
      for (let i = rings.length - 1; i >= 0; i--) {
        const r = rings[i];
        r.t += 1;
        const radius = r.t * 3 + 8;
        const alpha = Math.max(0, 1 - r.t * 0.03);
        ctx.beginPath();
        ctx.strokeStyle = `hsla(${r.hue},90%,60%,${alpha * 0.9})`;
        ctx.lineWidth = 2 + r.t * 0.08;
        ctx.arc(r.x, r.y, radius, 0, Math.PI * 2);
        ctx.stroke();
        if (alpha <= 0.02) rings.splice(i, 1);
      }

      // random big pulses near center occasionally
      if (frame % 400 === 0) {
        rings.push({ x: w / 2 + (Math.random() - 0.5) * 80, y: h / 2 + (Math.random() - 0.5) * 60, t: 0, hue: 290 });
      }

      animRef.current = requestAnimationFrame(draw);
    }
    animRef.current = requestAnimationFrame(draw);

    return () => {
      window.removeEventListener("resize", resize);
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, []);

  function onSkipChange(e: React.ChangeEvent<HTMLInputElement>) {
    const checked = e.currentTarget.checked;
    try {
      if (checked) localStorage.setItem("urms.skipSplash", "1");
      else localStorage.removeItem("urms.skipSplash");
    } catch {}
    setDontShow(checked);
  }

  return (
    <div className={`app-splash ${hidden ? "hidden" : ""}`} role="status" aria-live="polite">
      <canvas ref={canvasRef} className="splash-canvas" aria-hidden="true" />
      <div className="splash-card futuristic" aria-hidden={hidden}>
        <div className="logo-wrap">
          <img src={iconSrc || Logo} className="splash-svg" alt="URMS" />
          <div className="logo-shine" aria-hidden="true" />
          <div className="logo-halo" aria-hidden="true" />
        </div>
        <div className="splash-sub">Initializing systems</div>
        <div className="splash-progress" aria-hidden="true">
          <span className="dot" style={{ ['--i' as any]: 0 }} />
          <span className="dot" style={{ ['--i' as any]: 1 }} />
          <span className="dot" style={{ ['--i' as any]: 2 }} />
        </div>
        <label className="splash-skip">
          <input type="checkbox" checked={dontShow} onChange={onSkipChange} /> Don't show again
        </label>
      </div>
    </div>
  );
}
