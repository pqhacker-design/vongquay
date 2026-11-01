import React, { useState, useRef } from 'react';
import { Student } from '../types';
import {
  parseStudentsFromExcel,
  parseStudentsFromWord,
  exportStudentsToExcel,
  exportStudentsToWord,
  downloadSampleExcel,
  downloadSampleWord
} from '../utils/fileImportExport';
import {
  X,
  FileSpreadsheet,
  FileText,
  Upload,
  Download,
  Copy,
  Check,
  AlertCircle,
  CheckSquare,
  Square,
  Trash2,
  FileDown
} from 'lucide-react';

interface ImportExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  className: string;
  students: Student[];
  onImportStudents: (names: string[], overwrite: boolean) => void;
}

export const ImportExportModal: React.FC<ImportExportModalProps> = ({
  isOpen,
  onClose,
  className,
  students,
  onImportStudents
}) => {
  const [activeTab, setActiveTab] = useState<'import' | 'export'>('import');
  const [dragOver, setDragOver] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Preview of parsed file
  const [previewNames, setPreviewNames] = useState<string[]>([]);
  const [selectedPreviewIndices, setSelectedPreviewIndices] = useState<Set<number>>(new Set());
  const [detectedSource, setDetectedSource] = useState<string>('');
  const [overwriteMode, setOverwriteMode] = useState<boolean>(false);

  const [copied, setCopied] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileProcess = async (file: File) => {
    setError(null);
    setLoading(true);
    const fileName = file.name.toLowerCase();

    try {
      if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
        const result = await parseStudentsFromExcel(file);
        if (result.names.length === 0) {
          throw new Error('Không tìm thấy tên học sinh nào trong file Excel này.');
        }
        setPreviewNames(result.names);
        setSelectedPreviewIndices(new Set(result.names.map((_, i) => i)));
        setDetectedSource(`Excel: ${file.name} (Cột nhận diện: ${result.detectedColumn})`);
      } else if (fileName.endsWith('.docx')) {
        const result = await parseStudentsFromWord(file);
        if (result.names.length === 0) {
          throw new Error('Không tìm thấy tên học sinh nào trong văn bản Word này.');
        }
        setPreviewNames(result.names);
        setSelectedPreviewIndices(new Set(result.names.map((_, i) => i)));
        setDetectedSource(`Word: ${file.name}`);
      } else {
        throw new Error('Chỉ hỗ trợ file Excel (.xlsx, .xls, .csv) hoặc Word (.docx)');
      }
    } catch (err: unknown) {
      const errMsg = err instanceof Error ? err.message : 'Đã xảy ra lỗi khi đọc file';
      setError(errMsg);
      setPreviewNames([]);
    } finally {
      setLoading(false);
    }
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileProcess(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileProcess(e.target.files[0]);
    }
  };

  const toggleSelectPreview = (index: number) => {
    const next = new Set(selectedPreviewIndices);
    if (next.has(index)) {
      next.delete(index);
    } else {
      next.add(index);
    }
    setSelectedPreviewIndices(next);
  };

  const toggleSelectAllPreview = () => {
    if (selectedPreviewIndices.size === previewNames.length) {
      setSelectedPreviewIndices(new Set());
    } else {
      setSelectedPreviewIndices(new Set(previewNames.map((_, i) => i)));
    }
  };

  const handleConfirmImport = () => {
    const chosenNames = previewNames.filter((_, i) => selectedPreviewIndices.has(i));
    if (chosenNames.length === 0) {
      setError('Vui lòng chọn ít nhất một học sinh để nhập');
      return;
    }
    onImportStudents(chosenNames, overwriteMode);
    onClose();
  };

  const handleCopyClipboard = () => {
    const text = students.map((s, idx) => `${idx + 1}. ${s.name}`).join('\n');
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl overflow-hidden border border-slate-100 flex flex-col max-h-[92vh]">
        {/* Modal Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-900 text-white">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-bold text-lg leading-tight">Nhập & Xuất File (Excel / Word)</h3>
              <p className="text-xs text-slate-400">Đồng bộ danh sách học sinh lớp {className}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tabs Bar */}
        <div className="flex border-b border-slate-200 bg-slate-50 px-6 pt-3">
          <button
            onClick={() => setActiveTab('import')}
            className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'import'
                ? 'border-blue-600 text-blue-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Upload className="w-4 h-4" />
            Nhập file vào hệ thống
          </button>
          <button
            onClick={() => setActiveTab('export')}
            className={`flex items-center gap-2 pb-3 px-4 font-bold text-sm border-b-2 transition-colors cursor-pointer ${
              activeTab === 'export'
                ? 'border-emerald-600 text-emerald-600'
                : 'border-transparent text-slate-500 hover:text-slate-800'
            }`}
          >
            <Download className="w-4 h-4" />
            Xuất danh sách ra file ({students.length})
          </button>
        </div>

        {/* Tab Content */}
        <div className="p-6 overflow-y-auto space-y-5">
          {activeTab === 'import' ? (
            <>
              {/* Drag Drop Area */}
              <div
                onDragOver={(e) => {
                  e.preventDefault();
                  setDragOver(true);
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`border-2 border-dashed rounded-2xl p-6 text-center cursor-pointer transition-all ${
                  dragOver
                    ? 'border-blue-500 bg-blue-50/70 scale-[0.99]'
                    : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50/60'
                }`}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv, .docx"
                  onChange={handleFileChange}
                  className="hidden"
                />

                <div className="flex justify-center items-center gap-3 mb-3">
                  <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-600 flex items-center justify-center shadow-sm">
                    <FileSpreadsheet className="w-6 h-6" />
                  </div>
                  <div className="w-12 h-12 rounded-xl bg-blue-100 text-blue-600 flex items-center justify-center shadow-sm">
                    <FileText className="w-6 h-6" />
                  </div>
                </div>

                <h4 className="font-bold text-slate-800 text-base mb-1">
                  Kéo thả file Excel (.xlsx, .csv) hoặc Word (.docx) vào đây
                </h4>
                <p className="text-xs text-slate-500 mb-3">
                  Hoặc bấm vào khung để duyệt file từ máy tính
                </p>

                <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-100 text-slate-600 text-xs font-semibold">
                  <span>Hỗ trợ cả file Excel có nhiều cột (STT, Họ tên, Lớp) & file văn bản Word</span>
                </div>
              </div>

              {/* Sample Download Links */}
              <div className="flex flex-wrap items-center justify-between gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                <span className="text-xs text-slate-500 font-medium">Bạn chưa có file sẵn?</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSampleExcel();
                    }}
                    className="text-xs font-bold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Tải mẫu Excel
                  </button>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      downloadSampleWord();
                    }}
                    className="text-xs font-bold text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 px-3 py-1.5 rounded-lg flex items-center gap-1.5 transition-colors"
                  >
                    <FileDown className="w-3.5 h-3.5" />
                    Tải mẫu Word
                  </button>
                </div>
              </div>

              {/* Error Alert */}
              {error && (
                <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                  <span>{error}</span>
                </div>
              )}

              {/* Loading indicator */}
              {loading && (
                <div className="p-4 text-center text-sm font-medium text-slate-500 animate-pulse">
                  Đang phân tích cấu trúc file...
                </div>
              )}

              {/* Preview Table if names loaded */}
              {previewNames.length > 0 && (
                <div className="space-y-3 border-t border-slate-200 pt-3">
                  <div className="flex items-center justify-between">
                    <div>
                      <h5 className="font-bold text-sm text-slate-800 flex items-center gap-2">
                        <span>Đã tìm thấy {previewNames.length} học sinh</span>
                        <span className="text-xs font-normal text-slate-500">({detectedSource})</span>
                      </h5>
                    </div>
                    <button
                      onClick={toggleSelectAllPreview}
                      className="text-xs font-semibold text-blue-600 hover:text-blue-800 flex items-center gap-1"
                    >
                      {selectedPreviewIndices.size === previewNames.length ? (
                        <>
                          <CheckSquare className="w-4 h-4" /> Bỏ chọn tất cả
                        </>
                      ) : (
                        <>
                          <Square className="w-4 h-4" /> Chọn tất cả
                        </>
                      )}
                    </button>
                  </div>

                  {/* List preview items */}
                  <div className="max-h-52 overflow-y-auto border border-slate-200 rounded-xl divide-y divide-slate-100 bg-white">
                    {previewNames.map((name, idx) => {
                      const isSelected = selectedPreviewIndices.has(idx);
                      return (
                        <div
                          key={idx}
                          onClick={() => toggleSelectPreview(idx)}
                          className={`flex items-center gap-3 px-4 py-2 text-xs font-medium cursor-pointer transition-colors ${
                            isSelected ? 'bg-blue-50/50 text-slate-800' : 'text-slate-400 bg-white hover:bg-slate-50'
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {}}
                            className="rounded text-blue-600 focus:ring-blue-500 w-4 h-4 pointer-events-none"
                          />
                          <span className="w-6 text-slate-400">{idx + 1}.</span>
                          <span className="font-semibold flex-1">{name}</span>
                        </div>
                      );
                    })}
                  </div>

                  {/* Import options */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 flex items-center justify-between">
                    <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={overwriteMode}
                        onChange={(e) => setOverwriteMode(e.target.checked)}
                        className="rounded text-rose-600 focus:ring-rose-500 w-4 h-4"
                      />
                      <span>Xóa danh sách cũ và thay thế hoàn toàn</span>
                    </label>
                    <span className="text-xs text-slate-500">
                      (Mặc định: Thêm nối tiếp vào danh sách hiện tại)
                    </span>
                  </div>

                  {/* Confirm Button */}
                  <button
                    onClick={handleConfirmImport}
                    className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 text-white font-bold rounded-xl shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 text-sm"
                  >
                    <Upload className="w-4 h-4" />
                    Xác nhận nhập {selectedPreviewIndices.size} học sinh vào lớp {className}
                  </button>
                </div>
              )}
            </>
          ) : (
            /* Export Tab */
            <div className="space-y-4">
              <div className="p-4 rounded-xl bg-slate-50 border border-slate-200">
                <h4 className="font-bold text-sm text-slate-800 mb-1">Xuất dữ liệu lớp học: {className}</h4>
                <p className="text-xs text-slate-500">
                  Tổng cộng: <strong className="text-slate-700">{students.length}</strong> học sinh.
                  File xuất bao gồm STT, Họ và tên, Trạng thái tham gia, Số lượt đã gọi quay và Ghi chú.
                </p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* Export Excel Card */}
                <div className="p-5 rounded-2xl border-2 border-emerald-200 bg-emerald-50/40 hover:bg-emerald-50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-emerald-600 text-white flex items-center justify-center shadow-md mb-3">
                      <FileSpreadsheet className="w-6 h-6" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-base">File Microsoft Excel</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Định dạng chuẩn .xlsx, dễ dàng tính toán, phân lớp, in ấn bảng điểm và lưu trữ.
                    </p>
                  </div>
                  <button
                    onClick={() => exportStudentsToExcel(students, className)}
                    disabled={students.length === 0}
                    className="mt-4 w-full py-2.5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Tải file Excel (.xlsx)
                  </button>
                </div>

                {/* Export Word Card */}
                <div className="p-5 rounded-2xl border-2 border-blue-200 bg-blue-50/40 hover:bg-blue-50 transition-all flex flex-col justify-between">
                  <div>
                    <div className="w-12 h-12 rounded-xl bg-blue-600 text-white flex items-center justify-center shadow-md mb-3">
                      <FileText className="w-6 h-6" />
                    </div>
                    <h5 className="font-bold text-slate-900 text-base">Văn bản Word</h5>
                    <p className="text-xs text-slate-500 mt-1">
                      Định dạng .doc đầy đủ khung tiêu đề trường lớp, ngày tháng và chữ ký giáo viên để in ngay.
                    </p>
                  </div>
                  <button
                    onClick={() => exportStudentsToWord(students, className)}
                    disabled={students.length === 0}
                    className="mt-4 w-full py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white font-bold rounded-xl shadow-sm text-xs flex items-center justify-center gap-2 transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Tải file Word (.doc)
                  </button>
                </div>
              </div>

              {/* Copy plain text option */}
              <div className="p-4 rounded-xl border border-slate-200 bg-white flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-slate-100 text-slate-700">
                    <Copy className="w-5 h-5" />
                  </div>
                  <div>
                    <div className="text-xs font-bold text-slate-800">Sao chép danh sách văn bản</div>
                    <div className="text-[11px] text-slate-500">Sao chép vào khay nhớ tạm để dán vào Zalo hoặc chat</div>
                  </div>
                </div>
                <button
                  onClick={handleCopyClipboard}
                  disabled={students.length === 0}
                  className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-bold rounded-xl text-xs flex items-center gap-1.5 transition-colors"
                >
                  {copied ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-400" />
                      Đã chép!
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5" />
                      Sao chép
                    </>
                  )}
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3.5 bg-slate-50 border-t border-slate-100 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-800 text-xs font-bold transition-colors"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
};
