import React from 'react';
import { WheelConfig } from '../types';
import {
  X,
  Settings,
  Volume2,
  VolumeX,
  Palette,
  Clock,
  Check
} from 'lucide-react';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  config: WheelConfig;
  onUpdateConfig: (updates: Partial<WheelConfig>) => void;
}

export const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  config,
  onUpdateConfig
}) => {
  if (!isOpen) return null;

  const themes: { id: WheelConfig['wheelTheme']; name: string; colors: string[] }[] = [
    { id: 'rainbow', name: 'Cầu vồng rực rỡ', colors: ['#EF4444', '#F59E0B', '#10B981', '#3B82F6', '#8B5CF6'] },
    { id: 'ocean', name: 'Đại dương xanh ngát', colors: ['#0284C7', '#0EA5E9', '#0D9488', '#2DD4BF', '#0369A1'] },
    { id: 'sunset', name: 'Hoàng hôn rực cháy', colors: ['#DC2626', '#EA580C', '#F59E0B', '#C026D3', '#7C3AED'] },
    { id: 'emerald', name: 'Lục bảo tươi mới', colors: ['#059669', '#10B981', '#34D399', '#065F46', '#16A34A'] },
    { id: 'galaxy', name: 'Dải ngân hà huyền bí', colors: ['#4F46E5', '#7C3AED', '#A855F7', '#DB2777', '#2563EB'] }
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <Settings className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Cài Đặt Vòng Quay</h3>
              <p className="text-xs text-slate-400">Tùy chỉnh âm thanh, thời gian và giao diện</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-6">
          {/* Spin Duration */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
                <Clock className="w-4 h-4 text-blue-600" />
                Thời gian quay mỗi lượt:
              </label>
              <span className="text-xs font-black text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                {config.spinDuration} giây
              </span>
            </div>
            <input
              type="range"
              min="3"
              max="15"
              step="1"
              value={config.spinDuration}
              onChange={(e) => onUpdateConfig({ spinDuration: Number(e.target.value) })}
              className="w-full accent-blue-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-slate-400">
              <span>3s (Nhanh)</span>
              <span>6s (Chuẩn)</span>
              <span>10s (Hồi hộp)</span>
              <span>15s (Cực lâu)</span>
            </div>
          </div>

          {/* Sound & Volume */}
          <div className="space-y-3 pt-3 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                {config.soundEnabled ? (
                  <Volume2 className="w-4 h-4 text-emerald-600" />
                ) : (
                  <VolumeX className="w-4 h-4 text-slate-400" />
                )}
                <div>
                  <div className="text-xs font-bold text-slate-700">Âm thanh sống động</div>
                  <div className="text-[11px] text-slate-400">Tiếng quay số cơ học, kèn chiến thắng và tiếng vỗ tay rộn ràng</div>
                </div>
              </div>
              <input
                type="checkbox"
                checked={config.soundEnabled}
                onChange={(e) => onUpdateConfig({ soundEnabled: e.target.checked })}
                className="w-5 h-5 rounded text-emerald-600 focus:ring-emerald-500 cursor-pointer"
              />
            </div>

            {config.soundEnabled && (
              <div className="pl-6 space-y-1">
                <div className="flex justify-between text-xs text-slate-600 font-medium">
                  <span>Âm lượng:</span>
                  <span>{Math.round(config.volume * 100)}%</span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={config.volume}
                  onChange={(e) => onUpdateConfig({ volume: Number(e.target.value) })}
                  className="w-full accent-emerald-600 cursor-pointer"
                />
              </div>
            )}
          </div>

          {/* Theme Selector */}
          <div className="space-y-2 pt-3 border-t border-slate-100">
            <label className="text-xs font-bold text-slate-700 flex items-center gap-1.5">
              <Palette className="w-4 h-4 text-amber-500" />
              Bảng màu vòng quay:
            </label>
            <div className="grid grid-cols-1 gap-2">
              {themes.map((th) => (
                <button
                  key={th.id}
                  onClick={() => onUpdateConfig({ wheelTheme: th.id })}
                  className={`flex items-center justify-between p-2.5 rounded-xl border text-xs font-bold transition-all cursor-pointer ${
                    config.wheelTheme === th.id
                      ? 'border-blue-600 bg-blue-50/70 text-blue-900 ring-2 ring-blue-200'
                      : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div className="flex -space-x-1">
                      {th.colors.map((c, i) => (
                        <span
                          key={i}
                          className="w-4 h-4 rounded-full border border-white shadow-xs"
                          style={{ backgroundColor: c }}
                        />
                      ))}
                    </div>
                    <span>{th.name}</span>
                  </div>
                  {config.wheelTheme === th.id && <Check className="w-4 h-4 text-blue-600" />}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end shrink-0">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Hoàn tất
          </button>
        </div>
      </div>
    </div>
  );
};
