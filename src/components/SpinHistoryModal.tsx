import React, { useState } from 'react';
import { SpinHistoryItem } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { History, Trash2, X, Clock, Award, Download } from 'lucide-react';

interface SpinHistoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  history: SpinHistoryItem[];
  onClearHistory: () => void;
}

export const SpinHistoryModal: React.FC<SpinHistoryModalProps> = ({
  isOpen,
  onClose,
  history,
  onClearHistory
}) => {
  const [showConfirmClear, setShowConfirmClear] = useState(false);

  if (!isOpen) return null;

  const handleExportHistoryText = () => {
    const text = history
      .map((h, i) => `${i + 1}. [${new Date(h.timestamp).toLocaleTimeString('vi-VN')}] ${h.studentName} (${h.className})`)
      .join('\n');
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `Lich_Su_Quay_${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <>
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
        <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden border border-slate-100 flex flex-col max-h-[85vh]">
          {/* Header */}
          <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
            <div className="flex items-center gap-2.5">
              <div className="p-2 bg-amber-500/20 text-amber-400 rounded-xl">
                <History className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Lịch Sử Lượt Quay</h3>
                <p className="text-xs text-slate-400">Các học sinh đã được gọi tên trong buổi học</p>
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
          <div className="p-6 overflow-y-auto space-y-3">
            {history.length === 0 ? (
              <div className="py-12 text-center text-slate-400">
                <Clock className="w-10 h-10 mx-auto mb-2 text-slate-300" />
                <p className="text-sm font-semibold text-slate-600">Chưa có lượt quay nào</p>
                <p className="text-xs mt-1">Khi bạn quay số gọi tên học sinh, lịch sử sẽ xuất hiện tại đây.</p>
              </div>
            ) : (
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden">
                {history.map((item, idx) => (
                  <div
                    key={item.id}
                    className="p-3 bg-white hover:bg-slate-50 flex items-center justify-between text-xs transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-800 font-bold flex items-center justify-center text-[11px]">
                        {history.length - idx}
                      </span>
                      <div>
                        <div className="font-bold text-slate-800 text-sm flex items-center gap-1.5">
                          <span>{item.studentName}</span>
                          <span className="text-[10px] px-1.5 py-0.5 rounded bg-slate-100 text-slate-500 font-normal">
                            {item.className}
                          </span>
                        </div>
                        <div className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5">
                          <Clock className="w-3 h-3" />
                          {new Date(item.timestamp).toLocaleTimeString('vi-VN')} - {new Date(item.timestamp).toLocaleDateString('vi-VN')}
                        </div>
                      </div>
                    </div>

                    <div className="flex items-center text-amber-500">
                      <Award className="w-4 h-4" />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-between">
            {history.length > 0 ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={handleExportHistoryText}
                  className="px-3 py-1.5 rounded-lg border border-slate-300 text-slate-700 hover:bg-slate-100 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Download className="w-3.5 h-3.5" />
                  Tải file nhật ký
                </button>
                <button
                  onClick={() => setShowConfirmClear(true)}
                  className="px-3 py-1.5 rounded-lg text-rose-600 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Xóa lịch sử
                </button>
              </div>
            ) : <div />}

            <button
              onClick={onClose}
              className="px-5 py-2 rounded-xl bg-slate-900 text-white text-xs font-bold hover:bg-slate-800 transition-colors cursor-pointer"
            >
              Đóng
            </button>
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmClear}
        title="Xóa lịch sử quay"
        message="Bạn có chắc chắn muốn xóa toàn bộ lịch sử các lượt quay trong buổi học này?"
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={() => {
          onClearHistory();
          setShowConfirmClear(false);
        }}
        onCancel={() => setShowConfirmClear(false)}
      />
    </>
  );
};
