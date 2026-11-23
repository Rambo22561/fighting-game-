import React, { useRef, useState } from 'react';
import { Shield, ArrowUp, Zap } from 'lucide-react';

interface TouchControlsProps {
  energy: number;
  specialName: string;
  onMove: (x: number, z: number) => void;
  onBlock: (active: boolean) => void;
  onJump: () => void;
  onPunch: () => void;
  onKick: () => void;
  onSpecial: () => void;
}

export const TouchControls: React.FC<TouchControlsProps> = ({
  energy,
  specialName,
  onMove,
  onBlock,
  onJump,
  onPunch,
  onKick,
  onSpecial,
}) => {
  // Virtual Joystick state
  const joyBaseRef = useRef<HTMLDivElement>(null);
  const joyPointerId = useRef<number | null>(null);
  const [knobOffset, setKnobOffset] = useState({ x: 0, y: 0 });
  const [joyActive, setJoyActive] = useState(false);

  // Active button visual feedback states
  const [pressedBtn, setPressedBtn] = useState<string | null>(null);
  const [blocking, setBlocking] = useState(false);

  const MAX_RADIUS = 44;

  const updateJoystick = (clientX: number, clientY: number) => {
    const el = joyBaseRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;

    let dx = clientX - cx;
    let dy = clientY - cy;
    const dist = Math.hypot(dx, dy);

    if (dist > MAX_RADIUS) {
      dx = (dx / dist) * MAX_RADIUS;
      dy = (dy / dist) * MAX_RADIUS;
    }

    setKnobOffset({ x: dx, y: dy });

    const normX = Math.abs(dx) < 6 ? 0 : dx / MAX_RADIUS;
    const normZ = Math.abs(dy) < 6 ? 0 : dy / MAX_RADIUS;
    onMove(normX, normZ);
  };

  const safeCapture = (el: HTMLElement, pointerId: number) => {
    try {
      el.setPointerCapture(pointerId);
    } catch {
      // Ignore synthetic pointer events without an active pointer ID
    }
  };

  const handleJoyDown = (e: React.PointerEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (joyPointerId.current !== null) return;
    joyPointerId.current = e.pointerId;
    safeCapture(e.currentTarget, e.pointerId);
    setJoyActive(true);
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.preventDefault();
    updateJoystick(e.clientX, e.clientY);
  };

  const handleJoyUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (joyPointerId.current !== e.pointerId) return;
    e.preventDefault();
    joyPointerId.current = null;
    setJoyActive(false);
    setKnobOffset({ x: 0, y: 0 });
    onMove(0, 0);
  };

  const specialReady = energy >= 100;

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-20 flex items-end justify-between px-4 pb-4 sm:px-6 sm:pb-5">
      {/* LEFT THUMB ZONE: Virtual Analog Joystick */}
      <div
        ref={joyBaseRef}
        onPointerDown={handleJoyDown}
        onPointerMove={handleJoyMove}
        onPointerUp={handleJoyUp}
        onPointerCancel={handleJoyUp}
        role="application"
        aria-label="Movement Joystick"
        className={`pointer-events-auto relative flex h-32 w-32 touch-none items-center justify-center rounded-full border transition-colors duration-100 ${
          joyActive
            ? 'border-amber-400/70 bg-[#0b0e14]/80'
            : 'border-white/20 bg-[#0b0e14]/60'
        }`}
      >
        {/* Crosshair ticks */}
        <div className="pointer-events-none absolute inset-3 rounded-full border border-white/10" />
        <span className="pointer-events-none absolute top-2 text-[10px] font-semibold text-white/35">
          IN
        </span>
        <span className="pointer-events-none absolute bottom-2 text-[10px] font-semibold text-white/35">
          OUT
        </span>
        <span className="pointer-events-none absolute left-2.5 text-[10px] font-semibold text-white/35">
          L
        </span>
        <span className="pointer-events-none absolute right-2.5 text-[10px] font-semibold text-white/35">
          R
        </span>

        {/* Thumb Knob */}
        <div
          style={{
            transform: `translate3d(${knobOffset.x}px, ${knobOffset.y}px, 0)`,
          }}
          className={`pointer-events-none h-13 w-13 rounded-full border shadow-lg transition-colors duration-75 ${
            joyActive
              ? 'border-amber-300 bg-amber-500/85'
              : 'border-white/40 bg-slate-700/85'
          }`}
        />
      </div>

      {/* RIGHT THUMB ZONE: Ergonomic Fighting Action Cluster */}
      <div className="pointer-events-auto relative h-40 w-56 touch-none sm:w-64">
        {/* SPECIAL BUTTON (Top-Left of cluster) */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            safeCapture(e.currentTarget, e.pointerId);
            setPressedBtn('special');
            onSpecial();
          }}
          onPointerUp={() => setPressedBtn(null)}
          onPointerCancel={() => setPressedBtn(null)}
          disabled={!specialReady}
          aria-label={`Special Attack: ${specialName}`}
          className={`absolute top-0 left-2 flex h-13 w-13 items-center justify-center rounded-full border font-display text-xs font-bold tracking-wider transition-transform duration-75 active:scale-90 ${
            specialReady
              ? 'border-amber-300 bg-amber-500 text-slate-950 shadow-[0_0_20px_rgba(245,158,11,0.55)]'
              : 'border-white/15 bg-[#0b0e14]/70 text-slate-400'
          } ${pressedBtn === 'special' ? 'scale-90' : ''}`}
        >
          <div className="flex flex-col items-center leading-none">
            <Zap className="h-4 w-4" />
            <span className="mt-0.5 text-[10px] font-mono-num">
              {specialReady ? 'MAX' : `${energy}%`}
            </span>
          </div>
        </button>

        {/* JUMP BUTTON (Top-Right of cluster) */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            safeCapture(e.currentTarget, e.pointerId);
            setPressedBtn('jump');
            onJump();
          }}
          onPointerUp={() => setPressedBtn(null)}
          onPointerCancel={() => setPressedBtn(null)}
          aria-label="Jump"
          className={`absolute top-1 right-2 flex h-13 w-13 items-center justify-center rounded-full border border-white/25 bg-[#161b26]/85 text-slate-100 transition-transform duration-75 ${
            pressedBtn === 'jump' ? 'scale-90 border-sky-400 bg-sky-600/80' : ''
          }`}
        >
          <div className="flex flex-col items-center leading-none">
            <ArrowUp className="h-4 w-4" />
            <span className="mt-0.5 text-[10px] font-semibold">JUMP</span>
          </div>
        </button>

        {/* BLOCK BUTTON (Bottom-Left of cluster — hold to guard) */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            safeCapture(e.currentTarget, e.pointerId);
            setBlocking(true);
            onBlock(true);
          }}
          onPointerUp={(e) => {
            e.preventDefault();
            setBlocking(false);
            onBlock(false);
          }}
          onPointerCancel={() => {
            setBlocking(false);
            onBlock(false);
          }}
          aria-label="Block"
          className={`absolute bottom-1 left-0 flex h-14 w-14 items-center justify-center rounded-full border transition-transform duration-75 ${
            blocking
              ? 'scale-95 border-sky-300 bg-sky-600/90 text-white'
              : 'border-white/25 bg-[#161b26]/85 text-sky-300'
          }`}
        >
          <div className="flex flex-col items-center leading-none">
            <Shield className="h-4 w-4" />
            <span className="mt-0.5 text-[10px] font-semibold">GUARD</span>
          </div>
        </button>

        {/* KICK BUTTON (Bottom-Center of cluster) */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            safeCapture(e.currentTarget, e.pointerId);
            setPressedBtn('kick');
            onKick();
          }}
          onPointerUp={() => setPressedBtn(null)}
          onPointerCancel={() => setPressedBtn(null)}
          aria-label="Kick"
          className={`absolute bottom-2 left-18 flex h-15 w-15 items-center justify-center rounded-full border transition-transform duration-75 ${
            pressedBtn === 'kick'
              ? 'scale-90 border-blue-300 bg-blue-600 text-white'
              : 'border-blue-400/50 bg-[#172136]/90 text-blue-100'
          }`}
        >
          <span className="font-display text-sm font-bold tracking-wider">KICK</span>
        </button>

        {/* PUNCH BUTTON (Primary Largest CTA on Bottom-Right) */}
        <button
          type="button"
          onPointerDown={(e) => {
            e.preventDefault();
            safeCapture(e.currentTarget, e.pointerId);
            setPressedBtn('punch');
            onPunch();
          }}
          onPointerUp={() => setPressedBtn(null)}
          onPointerCancel={() => setPressedBtn(null)}
          aria-label="Punch"
          className={`absolute right-0 bottom-0 flex h-18 w-18 items-center justify-center rounded-full border-2 transition-transform duration-75 ${
            pressedBtn === 'punch'
              ? 'scale-90 border-red-200 bg-red-600 text-white'
              : 'border-red-400/75 bg-red-700/90 text-white shadow-lg'
          }`}
        >
          <span className="font-display text-base font-extrabold tracking-wider">PUNCH</span>
        </button>
      </div>
    </div>
  );
};
