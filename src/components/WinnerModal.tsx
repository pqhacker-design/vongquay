import React, { useEffect } from 'react';
import confetti from 'canvas-confetti';
import { Student } from '../types';
import { Trophy, Sparkles, X, UserX, RotateCcw, Award } from 'lucide-react';

interface WinnerModalProps {
  winner: Student | null;
  onClose: () => void;
  onSpinAgain: () => void;
  onRemoveWinner: (studentId: string) => void;
  autoRemoveEnabled: boolean;
}

export const WinnerModal: React.FC<WinnerModalProps> = ({
  winner,
  onClose,
  onSpinAgain,
  onRemoveWinner,
  autoRemoveEnabled
}) => {
  useEffect(() => {
    if (!winner) return;

    // Trigger explosive confetti celebration
    const duration = 2.5 * 1000;
    const end = Date.now() + duration;

    const frame = () => {
      confetti({
        particleCount: 4,
        angle: 60,
        spread: 55,
        origin: { x: 0, y: 0.7 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
      });
      confetti({
        particleCount: 4,
        angle: 120,
        spread: 55,
        origin: { x: 1, y: 0.7 },
        colors: ['#ef4444', '#f59e0b', '#10b981', '#3b82f6', '#8b5cf6']
      });

      if (Date.now() < end) {
        requestAnimationFrame(frame);
      }
    };
    frame();

    // Central star burst
    setTimeout(() => {
      confetti({
        particleCount: 80,
        spread: 100,
        origin: { y: 0.6 }
      });
    }, 200);
  }, [winner]);

  if (!winner) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/75 backdrop-blur-md animate-in fade-in duration-300">
      <div className="relative w-full max-w-lg bg-gradient-to-b from-amber-500 via-rose-500 to-indigo-700 p-1.5 rounded-3xl shadow-2xl animate-in zoom-in-90 duration-300">
        <div className="bg-slate-900 rounded-[22px] p-6 sm:p-8 text-center text-white relative overflow-hidden flex flex-col items-center">
          {/* Subtle background glow rays */}
          <div className="absolute -top-24 -left-24 w-72 h-72 bg-amber-500/20 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -right-24 w-72 h-72 bg-rose-500/20 rounded-full blur-3xl pointer-events-none" />

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-2 rounded-full text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>

          {/* Trophy badge icon with pulse */}
          <div className="relative mb-4">
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-tr from-amber-400 to-yellow-300 flex items-center justify-center text-slate-900 shadow-xl shadow-amber-500/30 transform hover:rotate-6 transition-transform">
              <Trophy className="w-11 h-11 text-amber-900 fill-amber-500" />
            </div>
            <div className="absolute -top-1 -right-1 p-1 bg-rose-500 text-white rounded-full shadow">
              <Sparkles className="w-4 h-4" />
            </div>
          </div>

          {/* Subtitle */}
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-amber-300 text-xs font-extrabold uppercase tracking-widest mb-3">
            🎉 XIN CHÚC MỪNG BẠN
          </span>

          {/* Winner name in huge bold text for classroom visibility */}
          <h2 className="text-3xl sm:text-5xl font-black text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 via-amber-300 to-yellow-100 tracking-tight drop-shadow-md py-2 px-4 max-w-full break-words">
            {winner.name}
          </h2>

          {/* Pick count information */}
          <div className="mt-2 text-xs font-medium text-slate-300 flex items-center gap-2">
            <Award className="w-4 h-4 text-amber-400" />
            <span>Đây là lần thứ <strong className="text-amber-300 font-bold">{winner.pickedCount}</strong> bạn được gọi tên</span>
          </div>

          {/* Action Buttons */}
          <div className="mt-8 w-full flex flex-col sm:flex-row items-center gap-3">
            <button
              onClick={() => {
                onRemoveWinner(winner.id);
                onClose();
              }}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl border border-slate-700 bg-slate-800/80 hover:bg-slate-700 text-slate-200 font-bold text-xs flex items-center justify-center gap-2 transition-all cursor-pointer"
              title="Tạm loại bạn này để không bị gọi lại trong các lượt quay tiếp"
            >
              <UserX className="w-4 h-4 text-rose-400" />
              Tạm loại khỏi vòng quay
            </button>

            <button
              onClick={() => {
                onClose();
                onSpinAgain();
              }}
              className="w-full sm:w-1/2 py-3 px-4 rounded-xl bg-gradient-to-r from-amber-500 via-rose-500 to-indigo-600 hover:from-amber-600 hover:to-indigo-700 text-white font-extrabold text-xs shadow-lg shadow-rose-500/30 flex items-center justify-center gap-2 transition-all cursor-pointer transform hover:scale-[1.02]"
            >
              <RotateCcw className="w-4 h-4" />
              Tiếp tục quay ngay
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
