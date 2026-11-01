import React, { useState, useMemo } from 'react';
import { Student } from '../types';
import { ConfirmModal } from './ConfirmModal';
import {
  Users,
  UserPlus,
  Trash2,
  CheckSquare,
  Square,
  Search,
  FileSpreadsheet,
  RotateCcw,
  CheckCircle,
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
  Sparkles,
  Plus
} from 'lucide-react';

interface StudentManagerProps {
  students: Student[];
  onAddStudent: (name: string) => void;
  onUpdateStudent: (id: string, updates: Partial<Student>) => void;
  onDeleteStudent: (id: string) => void;
  onBulkDeleteStudents: (ids: string[]) => void;
  onBulkToggleActive: (ids: string[], active: boolean) => void;
  onResetPickedCounts: (ids?: string[]) => void;
  onOpenBulkAdd: () => void;
  onOpenImportExport: () => void;
}

export const StudentManager: React.FC<StudentManagerProps> = ({
  students,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onBulkDeleteStudents,
  onBulkToggleActive,
  onResetPickedCounts,
  onOpenBulkAdd,
  onOpenImportExport
}) => {
  const [newStudentName, setNewStudentName] = useState('');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [filterMode, setFilterMode] = useState<'all' | 'active' | 'inactive'>('all');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState<string>('');

  // In-app confirmation dialog state
  const [confirmDialog, setConfirmDialog] = useState<{
    isOpen: boolean;
    title: string;
    message: string;
    confirmText?: string;
    isDanger?: boolean;
    action: () => void;
  }>({
    isOpen: false,
    title: '',
    message: '',
    action: () => {}
  });

  // Filter students based on search and status
  const filteredStudents = useMemo(() => {
    return students.filter(s => {
      const matchSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchSearch) return false;
      if (filterMode === 'active') return s.active;
      if (filterMode === 'inactive') return !s.active;
      return true;
    });
  }, [students, searchQuery, filterMode]);

  const activeCount = useMemo(() => students.filter(s => s.active).length, [students]);
  const pickedTotalCount = useMemo(() => students.reduce((acc, s) => acc + s.pickedCount, 0), [students]);

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStudentName.trim()) return;
    onAddStudent(newStudentName.trim());
    setNewStudentName('');
  };

  const toggleSelectStudent = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedIds(next);
  };

  const handleSelectAllFiltered = () => {
    if (selectedIds.size === filteredStudents.length && filteredStudents.length > 0) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    }
  };

  const handleBulkDelete = () => {
    if (selectedIds.size === 0) return;
    setConfirmDialog({
      isOpen: true,
      title: 'Xóa học sinh đã chọn',
      message: `Bạn có chắc chắn muốn xóa ${selectedIds.size} học sinh đã chọn khỏi danh sách?`,
      confirmText: `Xóa (${selectedIds.size})`,
      isDanger: true,
      action: () => {
        onBulkDeleteStudents(Array.from(selectedIds));
        setSelectedIds(new Set());
      }
    });
  };

  const handleBulkToggle = (active: boolean) => {
    if (selectedIds.size === 0) return;
    onBulkToggleActive(Array.from(selectedIds), active);
  };

  const handleBulkResetPicked = () => {
    if (selectedIds.size === 0) {
      setConfirmDialog({
        isOpen: true,
        title: 'Đặt lại lượt gọi',
        message: 'Đặt lại số lần gọi của tất cả học sinh trong lớp về 0?',
        confirmText: 'Đặt lại về 0',
        isDanger: false,
        action: () => {
          onResetPickedCounts();
        }
      });
    } else {
      onResetPickedCounts(Array.from(selectedIds));
    }
  };

  const handleStartEdit = (student: Student) => {
    setEditingId(student.id);
    setEditingName(student.name);
  };

  const handleSaveEdit = (id: string) => {
    if (editingName.trim()) {
      onUpdateStudent(id, { name: editingName.trim() });
    }
    setEditingId(null);
  };

  // Color generator for avatar based on name
  const getAvatarColor = (name: string) => {
    const colors = [
      'bg-red-500', 'bg-blue-500', 'bg-emerald-500', 'bg-amber-500',
      'bg-purple-500', 'bg-pink-500', 'bg-indigo-500', 'bg-teal-500'
    ];
    let hash = 0;
    for (let i = 0; i < name.length; i++) {
      hash = name.charCodeAt(i) + ((hash << 5) - hash);
    }
    return colors[Math.abs(hash) % colors.length];
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
      {/* Top Header */}
      <div className="p-4 border-b border-slate-100 bg-slate-900 text-white flex items-center justify-between shrink-0">
        <div className="flex items-center gap-2.5">
          <div className="p-2 bg-blue-500/20 text-blue-400 rounded-xl">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-base leading-tight">Danh Sách Học Sinh</h2>
            <div className="flex items-center gap-2 text-xs text-slate-400 mt-0.5">
              <span>Tổng: <strong className="text-white">{students.length}</strong></span>
              <span>•</span>
              <span className="text-emerald-400">Tham gia: <strong>{activeCount}</strong></span>
              <span>•</span>
              <span className="text-amber-400">Đã gọi: <strong>{pickedTotalCount}</strong></span>
            </div>
          </div>
        </div>

        {/* Action buttons: Import/Export and Bulk Add */}
        <div className="flex items-center gap-1.5">
          <button
            onClick={onOpenBulkAdd}
            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Dán danh sách nhiều học sinh cùng lúc"
          >
            <UserPlus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Thêm hàng loạt</span>
          </button>
          <button
            onClick={onOpenImportExport}
            className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow-sm transition-all"
            title="Nhập và xuất file Excel / Word"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Excel / Word</span>
          </button>
        </div>
      </div>

      {/* Quick Add Single Student Input */}
      <div className="p-3 border-b border-slate-100 bg-slate-50 shrink-0">
        <form onSubmit={handleAddSubmit} className="flex gap-2">
          <div className="relative flex-1">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Nhập tên học sinh rồi nhấn Enter..."
              className="w-full pl-3 pr-8 py-2 rounded-xl bg-white border border-slate-200 focus:border-blue-500 focus:ring-2 focus:ring-blue-100 text-slate-900 placeholder:text-slate-400 text-xs font-medium outline-none transition-all"
            />
            {newStudentName && (
              <button
                type="button"
                onClick={() => setNewStudentName('')}
                className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!newStudentName.trim()}
            className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition-colors shrink-0 shadow-sm"
          >
            <Plus className="w-4 h-4" />
            Thêm
          </button>
        </form>
      </div>

      {/* Filter and Search Bar */}
      <div className="px-3 py-2 border-b border-slate-100 flex items-center justify-between gap-2 bg-white shrink-0">
        <div className="relative flex-1 max-w-[200px]">
          <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo tên..."
            className="w-full pl-8 pr-2 py-1.5 rounded-lg bg-slate-100 border-none text-slate-900 placeholder:text-slate-500 text-xs outline-none focus:bg-white focus:ring-1 focus:ring-blue-500"
          />
        </div>

        {/* Tab filter pills */}
        <div className="flex bg-slate-100 p-0.5 rounded-lg text-[11px] font-semibold text-slate-600">
          <button
            onClick={() => setFilterMode('all')}
            className={`px-2 py-1 rounded-md transition-all ${
              filterMode === 'all' ? 'bg-white text-blue-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Tất cả ({students.length})
          </button>
          <button
            onClick={() => setFilterMode('active')}
            className={`px-2 py-1 rounded-md transition-all ${
              filterMode === 'active' ? 'bg-white text-emerald-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Tham gia ({activeCount})
          </button>
          <button
            onClick={() => setFilterMode('inactive')}
            className={`px-2 py-1 rounded-md transition-all ${
              filterMode === 'inactive' ? 'bg-white text-rose-600 shadow-xs' : 'hover:text-slate-900'
            }`}
          >
            Tạm loại ({students.length - activeCount})
          </button>
        </div>
      </div>

      {/* Bulk Action Bar (Visible when items selected or available) */}
      <div className="px-3 py-2 bg-slate-100/80 border-b border-slate-200 flex items-center justify-between text-xs shrink-0">
        <div className="flex items-center gap-2">
          <button
            onClick={handleSelectAllFiltered}
            className="flex items-center gap-1.5 font-bold text-slate-700 hover:text-blue-600 transition-colors"
          >
            {selectedIds.size > 0 && selectedIds.size === filteredStudents.length ? (
              <CheckSquare className="w-4 h-4 text-blue-600" />
            ) : (
              <Square className="w-4 h-4 text-slate-400" />
            )}
            <span>
              {selectedIds.size > 0 ? `Đã chọn (${selectedIds.size})` : 'Chọn tất cả'}
            </span>
          </button>
        </div>

        {selectedIds.size > 0 ? (
          /* Actions for Selected */
          <div className="flex items-center gap-1.5 animate-in fade-in duration-150">
            <button
              onClick={() => handleBulkToggle(true)}
              className="px-2 py-1 bg-emerald-100 hover:bg-emerald-200 text-emerald-800 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors"
              title="Bật học sinh đã chọn vào vòng quay"
            >
              <Eye className="w-3 h-3" />
              Bật quay
            </button>
            <button
              onClick={() => handleBulkToggle(false)}
              className="px-2 py-1 bg-slate-200 hover:bg-slate-300 text-slate-700 rounded-md font-semibold text-[11px] flex items-center gap-1 transition-colors"
              title="Tạm loại khỏi vòng quay"
            >
              <EyeOff className="w-3 h-3" />
              Tạm loại
            </button>
            <button
              onClick={handleBulkDelete}
              className="px-2.5 py-1 bg-rose-600 hover:bg-rose-700 text-white rounded-md font-bold text-[11px] flex items-center gap-1 transition-colors shadow-xs"
              title="Xóa các học sinh đã chọn"
            >
              <Trash2 className="w-3 h-3" />
              Xóa ({selectedIds.size})
            </button>
          </div>
        ) : (
          /* General actions when nothing is selected */
          <div className="flex items-center gap-2">
            <button
              onClick={handleBulkResetPicked}
              className="text-[11px] text-slate-500 hover:text-slate-800 flex items-center gap-1 font-medium transition-colors"
              title="Đặt lại số lượt gọi của tất cả học sinh về 0"
            >
              <RotateCcw className="w-3 h-3" />
              Reset lượt gọi
            </button>
            {students.length > 0 && (
              <button
                onClick={() => {
                  setConfirmDialog({
                    isOpen: true,
                    title: 'Xóa toàn bộ danh sách học sinh',
                    message: `CẢNH BÁO: Thầy/cô có chắc chắn muốn xóa toàn bộ ${students.length} học sinh trong lớp này?`,
                    confirmText: 'Xác nhận xóa hết',
                    isDanger: true,
                    action: () => {
                      onBulkDeleteStudents(students.map(s => s.id));
                      setSelectedIds(new Set());
                    }
                  });
                }}
                className="text-[11px] text-rose-600 hover:text-rose-800 flex items-center gap-1 font-medium transition-colors cursor-pointer"
                title="Xóa toàn bộ học sinh"
              >
                <Trash2 className="w-3 h-3" />
                Xóa hết
              </button>
            )}
          </div>
        )}
      </div>

      {/* Student List Content with independent scrollbar and overscroll containment */}
      <div className="flex-1 overflow-y-auto overscroll-contain student-scroll-container divide-y divide-slate-100 p-1 min-h-0 focus:outline-none">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-3">
              <Users className="w-6 h-6" />
            </div>
            <p className="text-xs font-semibold text-slate-600 mb-1">
              {students.length === 0
                ? 'Chưa có học sinh nào trong lớp'
                : 'Không tìm thấy học sinh phù hợp'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mb-4">
              Thầy cô có thể thêm trực tiếp, dán danh sách hàng loạt hoặc nhập từ file Excel / Word.
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={onOpenBulkAdd}
                className="px-3 py-1.5 bg-blue-600 text-white rounded-xl text-xs font-bold hover:bg-blue-700 transition-colors shadow-xs"
              >
                + Thêm hàng loạt
              </button>
              <button
                onClick={onOpenImportExport}
                className="px-3 py-1.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-xs"
              >
                Nhập file Excel/Word
              </button>
            </div>
          </div>
        ) : (
          filteredStudents.map((student, idx) => {
            const isSelected = selectedIds.has(student.id);
            const isEditing = editingId === student.id;

            return (
              <div
                key={student.id}
                className={`flex items-center justify-between p-2.5 rounded-xl transition-all group ${
                  isSelected ? 'bg-blue-50/70 border border-blue-200' : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Checkbox, Avatar, Name */}
                <div className="flex items-center gap-2.5 flex-1 min-w-0 pr-2">
                  <button
                    onClick={() => toggleSelectStudent(student.id)}
                    className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                  >
                    {isSelected ? (
                      <CheckSquare className="w-4 h-4 text-blue-600" />
                    ) : (
                      <Square className="w-4 h-4" />
                    )}
                  </button>

                  {/* Initial Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-xs ${
                      student.active ? getAvatarColor(student.name) : 'bg-slate-400'
                    }`}
                  >
                    {student.name.trim().charAt(student.name.trim().lastIndexOf(' ') + 1) || student.name.charAt(0)}
                  </div>

                  {/* Name (View or Inline Edit) */}
                  {isEditing ? (
                    <div className="flex items-center gap-1.5 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(student.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="px-2 py-0.5 border border-blue-500 rounded text-xs font-semibold w-full outline-none text-slate-900 bg-white"
                      />
                      <button
                        onClick={() => handleSaveEdit(student.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleStartEdit(student)}
                    >
                      <span
                        className={`text-xs font-semibold truncate block ${
                          student.active ? 'text-slate-800' : 'text-slate-400 line-through'
                        }`}
                      >
                        {student.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Picked count, Active toggle, Delete */}
                <div className="flex items-center gap-1.5 shrink-0">
                  {student.pickedCount > 0 && (
                    <span
                      className="px-2 py-0.5 rounded-full bg-amber-100 text-amber-800 font-bold text-[10px]"
                      title={`Đã trúng vòng quay ${student.pickedCount} lần`}
                    >
                      {student.pickedCount} lần
                    </span>
                  )}

                  {/* Active / Inactive switch */}
                  <button
                    onClick={() => onUpdateStudent(student.id, { active: !student.active })}
                    className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                      student.active
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                    title={student.active ? "Đang tham gia quay (Bấm để tạm loại)" : "Đang tạm loại (Bấm để bật lại)"}
                  >
                    {student.active ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                  </button>

                  {/* Quick Edit */}
                  <button
                    onClick={() => handleStartEdit(student)}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors opacity-0 group-hover:opacity-100"
                    title="Chỉnh sửa tên"
                  >
                    <Edit2 className="w-3.5 h-3.5" />
                  </button>

                  {/* Delete button */}
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      onDeleteStudent(student.id);
                    }}
                    className="p-1.5 text-slate-300 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors opacity-60 group-hover:opacity-100 cursor-pointer"
                    title="Xóa học sinh này"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Footer Info */}
      <div className="p-2.5 bg-slate-50 border-t border-slate-100 text-center shrink-0">
        <span className="text-[11px] text-slate-500">
          💡 Thầy cô có thể click vào tên để sửa, bấm con mắt để tạm loại học sinh đã trả lời.
        </span>
      </div>

      {/* Confirmation Dialog */}
      <ConfirmModal
        isOpen={confirmDialog.isOpen}
        title={confirmDialog.title}
        message={confirmDialog.message}
        confirmText={confirmDialog.confirmText}
        isDanger={confirmDialog.isDanger}
        onConfirm={() => {
          confirmDialog.action();
          setConfirmDialog(prev => ({ ...prev, isOpen: false }));
        }}
        onCancel={() => setConfirmDialog(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};
