import React, { useRef, useEffect, useState, useCallback } from 'react';
import { Student, WheelConfig } from '../types';
import { soundEngine } from '../utils/audio';
import { Play, RotateCcw, Volume2, VolumeX, Maximize2, Minimize2, Sparkles } from 'lucide-react';

interface LuckyWheelProps {
  students: Student[];
  config: WheelConfig;
  onSpinEnd: (winner: Student) => void;
  isSpinning: boolean;
  setIsSpinning: (spinning: boolean) => void;
  isFullscreen: boolean;
  onToggleFullscreen: () => void;
}

// Color palettes for different wheel themes
const THEME_PALETTES: Record<WheelConfig['wheelTheme'], string[]> = {
  rainbow: [
    '#EF4444', '#F97316', '#F59E0B', '#10B981', '#06B6D4',
    '#3B82F6', '#6366F1', '#8B5CF6', '#EC4899', '#14B8A6'
  ],
  ocean: [
    '#0284C7', '#0EA5E9', '#38BDF8', '#0D9488', '#14B8A6',
    '#2DD4BF', '#0369A1', '#0891B2', '#06B6D4', '#67E8F9'
  ],
  sunset: [
    '#DC2626', '#E11D48', '#EA580C', '#F97316', '#F59E0B',
    '#D97706', '#B45309', '#C026D3', '#9333EA', '#7C3AED'
  ],
  emerald: [
    '#059669', '#10B981', '#34D399', '#047857', '#065F46',
    '#0D9488', '#14B8A6', '#15803D', '#16A34A', '#22C55E'
  ],
  galaxy: [
    '#4F46E5', '#6366F1', '#818CF8', '#7C3AED', '#9333EA',
    '#A855F7', '#C026D3', '#DB2777', '#E11D48', '#2563EB'
  ]
};

export const LuckyWheel: React.FC<LuckyWheelProps> = ({
  students,
  config,
  onSpinEnd,
  isSpinning,
  setIsSpinning,
  isFullscreen,
  onToggleFullscreen
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Wheel physics state stored in refs to avoid re-renders during RAF
  const currentAngleRef = useRef<number>(0);
  const angularVelocityRef = useRef<number>(0);
  const targetAngleRef = useRef<number>(0);
  const startAngleRef = useRef<number>(0);
  const startTimeRef = useRef<number>(0);
  const spinDurationMsRef = useRef<number>(config.spinDuration * 1000);
  const lastTickSegmentRef = useRef<number>(-1);
  const needleAngleRef = useRef<number>(0); // needle deflection angle
  const animationFrameIdRef = useRef<number | null>(null);

  const [winnerDisplay, setWinnerDisplay] = useState<Student | null>(null);
  const [ledPhase, setLedPhase] = useState<number>(0);

  // Active students only
  const activeStudents = students.filter(s => s.active);
  const numSegments = activeStudents.length;
  const sliceAngle = numSegments > 0 ? (2 * Math.PI) / numSegments : 0;

  // LED blink timer
  useEffect(() => {
    const interval = setInterval(() => {
      setLedPhase(p => (p + 1) % 4);
    }, 250);
    return () => clearInterval(interval);
  }, []);

  // Update volume and enabled on sound engine
  useEffect(() => {
    soundEngine.setVolume(config.volume);
    soundEngine.setEnabled(config.soundEnabled);
  }, [config.volume, config.soundEnabled]);

  /**
   * Determine winning student at an angle
   * Pointer is at 12 o'clock = -Math.PI / 2 (or 270 deg)
   */
  const getWinnerAtAngle = useCallback((angle: number): { student: Student; index: number } | null => {
    if (activeStudents.length === 0) return null;
    const normalized = (angle % (2 * Math.PI) + 2 * Math.PI) % (2 * Math.PI);
    // Pointer is at the top: angle 3*PI/2 in canvas coordinate system
    const pointerAngle = (3 * Math.PI / 2);
    let relativeAngle = (pointerAngle - normalized) % (2 * Math.PI);
    if (relativeAngle < 0) relativeAngle += 2 * Math.PI;

    const segmentIndex = Math.floor(relativeAngle / sliceAngle) % activeStudents.length;
    return {
      student: activeStudents[segmentIndex],
      index: segmentIndex
    };
  }, [activeStudents, sliceAngle]);

  // Render the Canvas
  const drawWheel = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const logicalWidth = canvas.width / dpr;
    const logicalHeight = canvas.height / dpr;

    if (logicalWidth < 100 || logicalHeight < 100) return;

    const centerX = logicalWidth / 2;
    const centerY = logicalHeight / 2;
    // Strictly positive radius, min 60px
    const radius = Math.max(60, Math.min(centerX, centerY) - 26);

    ctx.save();
    // Normalize canvas transform to logical CSS pixels
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    if (activeStudents.length === 0) {
      // Empty State Wheel
      ctx.save();
      ctx.beginPath();
      ctx.arc(centerX, centerY, radius, 0, 2 * Math.PI);
      ctx.fillStyle = '#f1f5f9';
      ctx.fill();
      ctx.lineWidth = 8;
      ctx.strokeStyle = '#cbd5e1';
      ctx.stroke();

      ctx.font = 'bold 20px "Plus Jakarta Sans", sans-serif';
      ctx.fillStyle = '#64748b';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('Chưa có học sinh tham gia', centerX, centerY - 15);
      ctx.font = '14px "Plus Jakarta Sans", sans-serif';
      ctx.fillText('Vui lòng thêm hoặc tích chọn học sinh để quay', centerX, centerY + 18);
      ctx.restore();
      ctx.restore();
      return;
    }

    const palette = THEME_PALETTES[config.wheelTheme] || THEME_PALETTES.rainbow;
    const currentAngle = currentAngleRef.current;

    // 1. Draw outer gold / silver bezel shadow
    ctx.save();
    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 18, 0, 2 * Math.PI);
    ctx.fillStyle = '#0f172a';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.35)';
    ctx.shadowBlur = 25;
    ctx.shadowOffsetY = 10;
    ctx.fill();
    ctx.restore();

    // 2. Draw metallic rim with radial gradient
    ctx.save();
    const rimGrad = ctx.createRadialGradient(
      centerX, centerY, radius,
      centerX, centerY, radius + 18
    );
    rimGrad.addColorStop(0, '#f59e0b');
    rimGrad.addColorStop(0.3, '#fbbf24');
    rimGrad.addColorStop(0.7, '#d97706');
    rimGrad.addColorStop(1, '#78350f');

    ctx.beginPath();
    ctx.arc(centerX, centerY, radius + 18, 0, 2 * Math.PI);
    ctx.fillStyle = rimGrad;
    ctx.fill();
    ctx.restore();

    // 3. Draw flashing LEDs on rim
    const numLeds = Math.max(16, Math.min(48, activeStudents.length * 2));
    for (let i = 0; i < numLeds; i++) {
      const ledAngle = (i / numLeds) * 2 * Math.PI;
      const ledX = centerX + Math.cos(ledAngle) * (radius + 9);
      const ledY = centerY + Math.sin(ledAngle) * (radius + 9);
      const isLit = (i + ledPhase) % 2 === 0;

      ctx.save();
      ctx.beginPath();
      ctx.arc(ledX, ledY, isSpinning ? 4.5 : 4, 0, 2 * Math.PI);
      if (isLit) {
        ctx.fillStyle = '#fffbeb';
        ctx.shadowColor = '#fef08a';
        ctx.shadowBlur = isSpinning ? 12 : 6;
      } else {
        ctx.fillStyle = '#92400e';
      }
      ctx.fill();
      ctx.restore();
    }

    // 4. Draw Segments
    ctx.save();
    ctx.translate(centerX, centerY);
    ctx.rotate(currentAngle);

    for (let i = 0; i < numSegments; i++) {
      const startSegAngle = i * sliceAngle;
      const endSegAngle = (i + 1) * sliceAngle;
      const color = palette[i % palette.length];

      // Segment wedge
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.arc(0, 0, radius, startSegAngle, endSegAngle);
      ctx.closePath();

      // Create subtle radial gradient for wedge depth
      const wedgeGrad = ctx.createRadialGradient(0, 0, Math.min(10, radius * 0.1), 0, 0, radius);
      wedgeGrad.addColorStop(0, '#ffffff33');
      wedgeGrad.addColorStop(0.6, color);
      wedgeGrad.addColorStop(1, color);

      ctx.fillStyle = wedgeGrad;
      ctx.fill();

      // Border between segments
      ctx.lineWidth = numSegments > 30 ? 1 : 2;
      ctx.strokeStyle = '#ffffff';
      ctx.stroke();

      // Draw pins on the outer edge of each slice
      ctx.save();
      ctx.rotate(startSegAngle);
      ctx.beginPath();
      ctx.arc(Math.max(10, radius - 2), 0, 3, 0, 2 * Math.PI);
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0,0,0,0.5)';
      ctx.shadowBlur = 3;
      ctx.fill();
      ctx.restore();

      // Draw Student Name Text inside slice
      ctx.save();
      ctx.rotate(startSegAngle + sliceAngle / 2);
      ctx.textAlign = 'right';
      ctx.textBaseline = 'middle';
      ctx.fillStyle = '#ffffff';
      ctx.shadowColor = 'rgba(0, 0, 0, 0.6)';
      ctx.shadowBlur = 4;
      ctx.shadowOffsetX = 1;
      ctx.shadowOffsetY = 1;

      // Dynamic font size depending on number of students and slice space
      let fontSize = 16;
      if (numSegments > 40) fontSize = 10;
      else if (numSegments > 25) fontSize = 12;
      else if (numSegments > 15) fontSize = 14;
      else if (numSegments < 8) fontSize = 18;

      ctx.font = `bold ${fontSize}px "Plus Jakarta Sans", sans-serif`;

      const studentName = activeStudents[i].name;
      // Truncate if too long
      const maxTextLength = Math.max(30, radius - 80);
      let displayName = studentName;
      if (ctx.measureText(displayName).width > maxTextLength) {
        while (ctx.measureText(displayName + '…').width > maxTextLength && displayName.length > 2) {
          displayName = displayName.slice(0, -1);
        }
        displayName += '…';
      }

      ctx.fillText(displayName, Math.max(20, radius - 20), 0);
      ctx.restore();
    }

    ctx.restore(); // restore wheel translation & rotation

    // 5. Draw Center Bezel & Hub
    ctx.save();
    const hubRadius = Math.min(42, Math.max(24, radius * 0.22));

    // Shadow
    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius + 4, 0, 2 * Math.PI);
    ctx.fillStyle = 'rgba(0, 0, 0, 0.25)';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
    ctx.shadowBlur = 15;
    ctx.fill();

    // Golden center disc
    const centerGrad = ctx.createRadialGradient(
      centerX - 5, centerY - 5, 5,
      centerX, centerY, hubRadius
    );
    centerGrad.addColorStop(0, '#ffffff');
    centerGrad.addColorStop(0.3, '#fef08a');
    centerGrad.addColorStop(0.8, '#f59e0b');
    centerGrad.addColorStop(1, '#b45309');

    ctx.beginPath();
    ctx.arc(centerX, centerY, hubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = centerGrad;
    ctx.fill();
    ctx.lineWidth = 3;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Center icon/logo
    const innerHubRadius = hubRadius * 0.48;
    ctx.beginPath();
    ctx.arc(centerX, centerY, innerHubRadius, 0, 2 * Math.PI);
    ctx.fillStyle = '#dc2626';
    ctx.fill();

    // Star in center
    ctx.fillStyle = '#ffffff';
    ctx.font = `bold ${Math.round(innerHubRadius * 0.9)}px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText('★', centerX, centerY);
    ctx.restore();

    // 6. Draw Top Pointer / Needle (at 12 o'clock pointing down)
    ctx.save();
    const needleDeflection = needleAngleRef.current;
    const pinTopX = centerX;
    const pinTopY = centerY - radius - 8;

    ctx.translate(pinTopX, pinTopY);
    ctx.rotate(needleDeflection);

    // Pointer shadow
    ctx.shadowColor = 'rgba(0, 0, 0, 0.45)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 4;

    // Pointer triangle pointing inward
    ctx.beginPath();
    ctx.moveTo(-16, -10);
    ctx.lineTo(16, -10);
    ctx.lineTo(0, 42); // needle tip dipping into wheel
    ctx.closePath();

    const ptrGrad = ctx.createLinearGradient(-16, -10, 16, 42);
    ptrGrad.addColorStop(0, '#ef4444');
    ptrGrad.addColorStop(0.5, '#dc2626');
    ptrGrad.addColorStop(1, '#991b1b');

    ctx.fillStyle = ptrGrad;
    ctx.fill();
    ctx.lineWidth = 2.5;
    ctx.strokeStyle = '#ffffff';
    ctx.stroke();

    // Pointer pivot pin
    ctx.beginPath();
    ctx.arc(0, -6, 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#f8fafc';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#0f172a';
    ctx.stroke();

    ctx.restore();

    // Restore root transform
    ctx.restore();
  }, [activeStudents, config.wheelTheme, isSpinning, ledPhase, numSegments, sliceAngle]);

  // Handle Resize and Canvas DPI setup
  const resizeCanvas = useCallback(() => {
    const canvas = canvasRef.current;
    const container = containerRef.current;
    if (!canvas || !container) return;

    const rect = container.getBoundingClientRect();
    const rawWidth = rect.width;
    const rawHeight = rect.height;

    // Use minimum of container's width and height so wheel fits perfectly in any aspect ratio
    const available = Math.min(
      rawWidth > 40 ? rawWidth : 420,
      rawHeight > 40 ? rawHeight : 420
    );

    // Subtle safety margin to prevent any sub-pixel overflow
    const size = Math.max(180, Math.floor(available - 8));
    const dpr = window.devicePixelRatio || 1;

    canvas.width = Math.round(size * dpr);
    canvas.height = Math.round(size * dpr);
    canvas.style.width = `${size}px`;
    canvas.style.height = `${size}px`;

    drawWheel();
  }, [drawWheel]);

  useEffect(() => {
    resizeCanvas();
    const container = containerRef.current;
    if (!container) return;

    const ro = new ResizeObserver(() => {
      resizeCanvas();
    });
    ro.observe(container);

    window.addEventListener('resize', resizeCanvas);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', resizeCanvas);
    };
  }, [resizeCanvas]);

  // Redraw when state or students change
  useEffect(() => {
    drawWheel();
  }, [drawWheel]);

  /**
   * Start Spin Animation
   */
  const handleSpin = useCallback(() => {
    if (isSpinning || activeStudents.length < 2) return;

    setIsSpinning(true);
    setWinnerDisplay(null);
    soundEngine.playSpinStart();

    // Randomize winning slice and total revolutions (between 6 and 10 full turns)
    const extraTurns = 6 + Math.floor(Math.random() * 4);
    const randomStopOffset = Math.random() * (2 * Math.PI);
    const targetDelta = extraTurns * 2 * Math.PI + randomStopOffset;

    startAngleRef.current = currentAngleRef.current;
    targetAngleRef.current = currentAngleRef.current + targetDelta;
    startTimeRef.current = performance.now();
    spinDurationMsRef.current = config.spinDuration * 1000;
    lastTickSegmentRef.current = -1;

    let tensionStarted = false;

    // Cubic ease out function
    const easeOutCubic = (t: number) => {
      return 1 - Math.pow(1 - t, 3.8);
    };

    const animate = (currentTime: number) => {
      const elapsed = currentTime - startTimeRef.current;
      const progress = Math.min(elapsed / spinDurationMsRef.current, 1);
      const easedProgress = easeOutCubic(progress);

      const newAngle = startAngleRef.current + (targetAngleRef.current - startAngleRef.current) * easedProgress;
      currentAngleRef.current = newAngle;

      // Speed calculation for tick sounds & needle deflection
      const remainingTime = 1 - progress;
      const currentSpeed = (1 - progress) * (1 - progress); // slows down progressively

      // Update continuous wheel spinning flutter sound with current rotation speed
      soundEngine.updateSpinFlutter(currentSpeed);

      // Start drumroll / suspense tension in last 35% of spin
      if (progress > 0.65 && !tensionStarted) {
        tensionStarted = true;
        soundEngine.startTensionRoll();
      }

      // Check current segment passing pointer to trigger tick sound
      const currentSeg = getWinnerAtAngle(newAngle);
      if (currentSeg && currentSeg.index !== lastTickSegmentRef.current) {
        lastTickSegmentRef.current = currentSeg.index;
        soundEngine.playTick(currentSpeed);
        // Deflect needle upwards momentarily
        needleAngleRef.current = -0.35 * Math.min(1, currentSpeed * 2);
      } else {
        // Needle springs back
        needleAngleRef.current *= 0.82;
      }

      drawWheel();

      if (progress < 1) {
        animationFrameIdRef.current = requestAnimationFrame(animate);
      } else {
        // Spin finished!
        soundEngine.stopSpinFlutter();
        soundEngine.stopTensionRoll();
        needleAngleRef.current = 0;
        drawWheel();

        const winner = getWinnerAtAngle(currentAngleRef.current);
        if (winner) {
          setWinnerDisplay(winner.student);
          // Trigger celebratory fanfare + enthusiastic classroom applause!
          soundEngine.playWinnerCelebration();

          setIsSpinning(false);
          onSpinEnd(winner.student);
        } else {
          setIsSpinning(false);
        }
      }
    };

    animationFrameIdRef.current = requestAnimationFrame(animate);
  }, [activeStudents.length, config.spinDuration, drawWheel, getWinnerAtAngle, isSpinning, onSpinEnd, setIsSpinning]);

  // Clean up RAF on unmount
  useEffect(() => {
    return () => {
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      soundEngine.stopSpinFlutter();
      soundEngine.stopTensionRoll();
    };
  }, []);

  // Keyboard shortcut: Spacebar or Enter to spin
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.code === 'Space' || e.code === 'Enter') {
        const activeEl = document.activeElement;
        const isInputField = activeEl && (activeEl.tagName === 'INPUT' || activeEl.tagName === 'TEXTAREA');
        if (!isInputField && !isSpinning && activeStudents.length >= 2) {
          e.preventDefault();
          handleSpin();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleSpin, isSpinning, activeStudents.length]);

  return (
    <div className="flex flex-col items-center justify-center relative w-full h-full select-none">
      {/* Top Controls Bar for Wheel */}
      <div className="absolute top-2 right-2 flex items-center gap-2 z-20">
        <button
          onClick={onToggleFullscreen}
          className="p-2.5 rounded-xl bg-white/90 backdrop-blur-md text-slate-700 shadow-md hover:bg-slate-100 hover:text-blue-600 transition-all border border-slate-200"
          title={isFullscreen ? "Thu nhỏ màn hình (Esc)" : "Toàn màn hình chiếu"}
        >
          {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
        </button>
      </div>

      {/* Main Wheel Canvas Container (Fluids inside parent bounds) */}
      <div 
        ref={containerRef}
        className="flex-1 min-h-0 w-full flex items-center justify-center relative p-1 sm:p-2 overflow-hidden"
      >
        <canvas
          ref={canvasRef}
          className="cursor-pointer max-w-full max-h-full drop-shadow-2xl object-contain"
          onClick={!isSpinning && activeStudents.length >= 2 ? handleSpin : undefined}
          title="Bấm để quay"
        />

        {/* Big Center Action Overlay Button */}
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <button
            onClick={handleSpin}
            disabled={isSpinning || activeStudents.length < 2}
            className={`pointer-events-auto w-20 h-20 sm:w-24 sm:h-24 rounded-full flex flex-col items-center justify-center text-white font-extrabold shadow-2xl transition-all duration-300 transform ${
              isSpinning
                ? 'bg-gradient-to-tr from-amber-600 to-amber-500 scale-95 opacity-90 cursor-not-allowed'
                : activeStudents.length < 2
                ? 'bg-slate-400 opacity-60 cursor-not-allowed'
                : 'bg-gradient-to-tr from-rose-600 via-red-500 to-amber-500 hover:scale-105 active:scale-95 hover:shadow-red-500/50 cursor-pointer animate-pulse'
            }`}
            style={{
              boxShadow: isSpinning ? '0 0 25px rgba(245, 158, 11, 0.6)' : '0 0 35px rgba(225, 29, 72, 0.7)'
            }}
          >
            {isSpinning ? (
              <>
                <RotateCcw className="w-5 h-5 sm:w-6 sm:h-6 animate-spin mb-0.5" />
                <span className="text-[10px] sm:text-[11px] tracking-wider uppercase">ĐANG QUAY</span>
              </>
            ) : (
              <>
                <Play className="w-6 h-6 sm:w-7 sm:h-7 fill-white translate-x-0.5 mb-0.5" />
                <span className="text-[11px] sm:text-xs tracking-wider uppercase font-black">QUAY NGAY</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Under-wheel Status & Quick Hint (Locked inside viewport) */}
      <div className="shrink-0 mt-1 sm:mt-2 flex flex-col items-center gap-1 text-center">
        {activeStudents.length < 2 ? (
          <div className="px-3 py-1.5 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs font-medium flex items-center gap-1.5 shadow-xs">
            <span>⚠️ Cần ít nhất 2 học sinh đang tham gia để bắt đầu quay</span>
          </div>
        ) : (
          <div className="flex items-center gap-2 text-xs font-medium text-slate-400">
            <span className="inline-flex items-center px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 text-[11px] font-semibold">
              {activeStudents.length} học sinh sẵn sàng
            </span>
            <span>•</span>
            <span className="hidden sm:inline">Phím tắt: <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px] font-mono">Space</kbd> hoặc <kbd className="px-1.5 py-0.5 bg-slate-800 text-slate-300 rounded border border-slate-700 text-[10px] font-mono">Enter</kbd></span>
          </div>
        )}
      </div>
    </div>
  );
};
