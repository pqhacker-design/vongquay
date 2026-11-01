import React, { useState, useMemo } from 'react';
import { parseStudentsFromText } from '../utils/fileImportExport';
import { X, UserPlus, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface BulkAddModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddStudents: (names: string[]) => void;
}

export const BulkAddModal: React.FC<BulkAddModalProps> = ({ isOpen, onClose, onAddStudents }) => {
  const [rawText, setRawText] = useState('');

  const parsedNames = useMemo(() => {
    return parseStudentsFromText(rawText);
  }, [rawText]);

  if (!isOpen) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (parsedNames.length === 0) return;
    onAddStudents(parsedNames);
    setRawText('');
    onClose();
  };

  const handleSamplePaste = () => {
    setRawText(
`1. Nguyễn Hoàng Long
2. Trần Thảo My
3. Lê Minh Triết
4. Phạm Quỳnh Như
5. Đặng Tuấn Kiệt
6. Bùi Lan Hương
7. Võ Quốc Huy
8. Đỗ Thu Thảo
9. Vũ Đức Anh
10. Mai Phương Linh`
    );
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-xl overflow-hidden border border-slate-100 flex flex-col max-h-[90vh]">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-600 to-indigo-600 text-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-white/20 rounded-xl backdrop-blur-sm">
              <UserPlus className="w-5 h-5 text-white" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Thêm học sinh hàng loạt</h3>
              <p className="text-xs text-blue-100">Dán danh sách từ Word, Excel, Zalo, Messenger...</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-white/80 hover:text-white hover:bg-white/20 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto space-y-4">
          <div className="flex items-center justify-between">
            <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Nhập hoặc Dán danh sách học sinh:
            </label>
            <button
              type="button"
              onClick={handleSamplePaste}
              className="text-xs text-blue-600 hover:text-blue-800 font-semibold flex items-center gap-1 hover:underline"
            >
              <Sparkles className="w-3.5 h-3.5" />
              Điền danh sách mẫu
            </button>
          </div>

          <textarea
            rows={8}
            value={rawText}
            onChange={(e) => setRawText(e.target.value)}
            placeholder={`Thầy cô có thể dán theo các định dạng:
1. Nguyễn Văn A
2. Trần Thị B
Hoặc mỗi tên một dòng, ngăn cách bởi dấu phẩy, tab từ Excel...`}
            style={{ color: '#0f172a', backgroundColor: '#ffffff' }}
            className="w-full px-4 py-3 rounded-xl border border-slate-300 focus:border-blue-500 focus:ring-4 focus:ring-blue-100 text-slate-900 bg-white placeholder:text-slate-400 font-sans text-sm font-medium leading-relaxed resize-none transition-all outline-none"
          />

          {/* Realtime parsed preview */}
          <div className="p-3.5 rounded-xl bg-slate-50 border border-slate-200">
            <div className="flex items-center justify-between text-xs font-semibold text-slate-700 mb-2">
              <span className="flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                Hệ thống nhận diện được: <strong className="text-blue-600 font-bold text-sm">{parsedNames.length}</strong> học sinh
              </span>
              {parsedNames.length > 0 && (
                <span className="text-slate-400 font-normal">Tự động bỏ số thứ tự & khoảng trắng</span>
              )}
            </div>

            {parsedNames.length > 0 ? (
              <div className="flex flex-wrap gap-1.5 max-h-32 overflow-y-auto p-1 bg-white rounded-lg border border-slate-200">
                {parsedNames.map((name, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center px-2.5 py-0.5 rounded-md bg-blue-50 text-blue-700 text-xs font-medium border border-blue-100"
                  >
                    {name}
                  </span>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 italic">Chưa có tên học sinh nào được nhập.</p>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-50 border-t border-slate-100 flex items-center justify-between gap-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2.5 rounded-xl border border-slate-300 text-slate-700 text-sm font-semibold hover:bg-slate-100 transition-colors"
          >
            Hủy bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={parsedNames.length === 0}
            className="px-6 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 disabled:cursor-not-allowed text-white text-sm font-bold shadow-md hover:shadow-lg transition-all flex items-center gap-2"
          >
            <UserPlus className="w-4 h-4" />
            Thêm {parsedNames.length > 0 ? `(${parsedNames.length})` : ''} học sinh vào lớp
          </button>
        </div>
      </div>
    </div>
  );
};
