import React, { useState } from 'react';
import { WheelConfig } from '../types';
import {
  X,
  Settings,
  Volume2,
  VolumeX,
  Palette,
  Clock,
  Check,
  GraduationCap,
  Phone,
  MessageCircle,
  Copy,
  School,
  Heart
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
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopyPhone = () => {
    navigator.clipboard.writeText('0913117321');
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

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
              <p className="text-xs text-slate-400">Tùy chỉnh cấu hình & thông tin tác giả</p>
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

          {/* Author Information */}
          <div className="pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2 mb-3">
              <div className="p-1.5 bg-blue-100 text-blue-700 rounded-lg">
                <GraduationCap className="w-4 h-4" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider">Thông Tin Tác Giả</h4>
                <p className="text-[11px] text-slate-400">Ứng dụng hỗ trợ giảng dạy & lớp học</p>
              </div>
            </div>

            <div className="bg-gradient-to-br from-slate-50 via-blue-50/40 to-indigo-50/40 border border-blue-100/90 rounded-2xl p-4 shadow-xs">
              <div className="flex items-start gap-3.5">
                {/* Avatar badge */}
                <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-600 to-indigo-600 text-white flex items-center justify-center font-black text-sm shadow-md shadow-blue-500/20 shrink-0">
                  TH
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-sm font-extrabold text-slate-900">Thầy Ngô Thanh Hùng</span>
                    <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-blue-100 text-blue-700 border border-blue-200">
                      Tác giả
                    </span>
                  </div>

                  <div className="mt-1.5 text-xs text-slate-600 flex items-start gap-1.5 leading-relaxed">
                    <School className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                    <span>Giáo viên trường THCS Bình San - Mỹ Đức, An Giang</span>
                  </div>

                  {/* Contact / Action buttons */}
                  <div className="mt-3 pt-3 border-t border-slate-200/70 flex flex-wrap items-center gap-2">
                    <a
                      href="tel:0913117321"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 text-slate-700 text-xs font-bold transition-all shadow-2xs hover:shadow-xs active:scale-95"
                      title="Gọi điện trực tiếp"
                    >
                      <Phone className="w-3.5 h-3.5 text-emerald-600" />
                      <span>0913117321</span>
                    </a>

                    <a
                      href="https://zalo.me/0913117321"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold transition-all shadow-xs hover:shadow-blue-500/20 active:scale-95"
                      title="Nhắn tin Zalo"
                    >
                      <MessageCircle className="w-3.5 h-3.5" />
                      <span>Zalo: 0913117321</span>
                    </a>

                    <button
                      type="button"
                      onClick={handleCopyPhone}
                      className={`inline-flex items-center gap-1 px-2.5 py-1.5 rounded-xl border text-xs font-semibold transition-all cursor-pointer ${
                        copied
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                          : 'bg-white border-slate-200 hover:bg-slate-50 text-slate-600'
                      }`}
                      title="Sao chép số điện thoại / Zalo"
                    >
                      {copied ? (
                        <>
                          <Check className="w-3.5 h-3.5 text-emerald-600" />
                          <span>Đã sao chép!</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3.5 h-3.5 text-slate-500" />
                          <span>Sao chép</span>
                        </>
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between shrink-0">
          <div className="flex items-center gap-1.5 text-[11px] text-slate-400">
            <Heart className="w-3.5 h-3.5 text-rose-500 fill-rose-500" />
            <span>Dành cho quý thầy cô & học sinh</span>
          </div>
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
