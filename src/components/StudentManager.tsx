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
  Eye,
  EyeOff,
  Edit2,
  Check,
  X,
  Plus,
  UsersRound
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
  onOpenGroupDivision?: (selectedIds?: string[]) => void;
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
  onOpenImportExport,
  onOpenGroupDivision
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
    <div className="flex flex-col h-full bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden min-h-0">
      {/* 1. Header Row 1: Title and Status Counts */}
      <div className="px-3 py-2 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
        <div className="flex items-center gap-2">
          <div className="p-1 bg-blue-500/20 text-blue-400 rounded-lg shrink-0">
            <Users className="w-4 h-4" />
          </div>
          <h2 className="font-extrabold text-sm text-white tracking-tight">Học Sinh</h2>
        </div>

        <div className="flex items-center gap-1.5">
          <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-blue-500/20 text-blue-300 border border-blue-500/30">
            {activeCount}/{students.length} HS
          </span>
          {pickedTotalCount > 0 && (
            <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/30" title="Tổng số lượt đã gọi trúng">
              {pickedTotalCount} lượt
            </span>
          )}
        </div>
      </div>

      {/* 2. Header Row 2: 3 Main Action Buttons in a Clean 3-Column Grid */}
      <div className="p-1.5 bg-slate-800/95 border-b border-slate-700/80 shrink-0 grid grid-cols-3 gap-1.5">
        <button
          type="button"
          onClick={() => onOpenGroupDivision?.(selectedIds.size > 0 ? Array.from(selectedIds) : undefined)}
          className="py-1.5 px-1 bg-indigo-600 hover:bg-indigo-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          title="Chia nhóm ngẫu nhiên cho học sinh"
        >
          <UsersRound className="w-3.5 h-3.5 shrink-0" />
          <span>Chia nhóm</span>
        </button>

        <button
          type="button"
          onClick={onOpenBulkAdd}
          className="py-1.5 px-1 bg-blue-600 hover:bg-blue-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          title="Dán danh sách nhiều học sinh cùng lúc"
        >
          <UserPlus className="w-3.5 h-3.5 shrink-0" />
          <span>Thêm DS</span>
        </button>

        <button
          type="button"
          onClick={onOpenImportExport}
          className="py-1.5 px-1 bg-emerald-600 hover:bg-emerald-500 active:scale-95 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 shadow-2xs transition-all cursor-pointer whitespace-nowrap"
          title="Nhập và xuất file Excel / Word"
        >
          <FileSpreadsheet className="w-3.5 h-3.5 shrink-0" />
          <span>Excel/Word</span>
        </button>
      </div>

      {/* 3. Inputs Row: Quick Add and Search */}
      <div className="p-2 bg-slate-50 border-b border-slate-200/80 shrink-0 space-y-1.5">
        {/* Quick Add Form */}
        <form onSubmit={handleAddSubmit} className="flex items-center gap-1.5">
          <div className="relative flex-1 min-w-0">
            <input
              type="text"
              value={newStudentName}
              onChange={(e) => setNewStudentName(e.target.value)}
              placeholder="Thêm tên HS rồi Enter..."
              className="w-full pl-2.5 pr-6 py-1 rounded-lg bg-white border border-slate-200 focus:border-blue-500 focus:ring-1 focus:ring-blue-200 text-slate-900 placeholder:text-slate-400 text-xs font-medium outline-none transition-all h-7.5"
            />
            {newStudentName && (
              <button
                type="button"
                onClick={() => setNewStudentName('')}
                className="absolute right-1.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3 h-3" />
              </button>
            )}
          </div>
          <button
            type="submit"
            disabled={!newStudentName.trim()}
            className="px-2.5 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-lg text-xs font-bold flex items-center gap-0.5 transition-colors shrink-0 h-7.5 cursor-pointer shadow-2xs"
            title="Thêm học sinh này vào lớp"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Thêm</span>
          </button>
        </form>

        {/* Search Box */}
        <div className="relative w-full">
          <Search className="w-3 h-3 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm tên học sinh..."
            className="w-full pl-7 pr-6 py-1 rounded-lg bg-white border border-slate-200 text-slate-900 placeholder:text-slate-400 text-xs outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-200 h-7 font-medium"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600"
            >
              <X className="w-3 h-3" />
            </button>
          )}
        </div>
      </div>

      {/* 4. Filter Tabs & Selection / Bulk Actions (Structured in 2 Rows for compactness) */}
      {selectedIds.size > 0 ? (
        /* Dedicated 2-Row Bulk Actions Bar when students are selected */
        <div className="bg-blue-50/95 border-b border-blue-200 shrink-0 divide-y divide-blue-200/60 animate-in fade-in duration-100">
          {/* Row A: Selection Count & Deselect Button */}
          <div className="px-2.5 py-1.5 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="cursor-pointer text-blue-800 hover:text-blue-950 transition-colors flex items-center gap-1.5 font-black"
              title="Bấm để bỏ chọn tất cả"
            >
              <CheckSquare className="w-4 h-4 text-blue-600" />
              <span>Đã chọn {selectedIds.size}/{filteredStudents.length} học sinh</span>
            </button>

            <button
              type="button"
              onClick={() => setSelectedIds(new Set())}
              className="text-[11px] text-blue-600 hover:text-blue-800 underline font-bold cursor-pointer"
            >
              Bỏ chọn
            </button>
          </div>

          {/* Row B: 4 Action Buttons in a Clean 4-Column Grid */}
          <div className="p-1.5 grid grid-cols-4 gap-1">
            <button
              type="button"
              onClick={() => handleBulkToggle(true)}
              className="py-1 px-1 bg-white hover:bg-emerald-50 border border-slate-200 hover:border-emerald-300 text-emerald-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Bật tham gia quay cho các em đã chọn"
            >
              <Eye className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
              <span>Bật</span>
            </button>

            <button
              type="button"
              onClick={() => handleBulkToggle(false)}
              className="py-1 px-1 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Tạm loại các em đã chọn khỏi vòng quay"
            >
              <EyeOff className="w-3.5 h-3.5 text-slate-500 shrink-0" />
              <span>Loại</span>
            </button>

            <button
              type="button"
              onClick={() => onOpenGroupDivision?.(Array.from(selectedIds))}
              className="py-1 px-1 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-bold flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Chia nhóm ngẫu nhiên cho học sinh đã chọn"
            >
              <UsersRound className="w-3.5 h-3.5 shrink-0" />
              <span>Nhóm</span>
            </button>

            <button
              type="button"
              onClick={handleBulkDelete}
              className="py-1 px-1 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-black flex items-center justify-center gap-1 transition-all cursor-pointer shadow-2xs active:scale-95"
              title="Xóa các học sinh đã chọn"
            >
              <Trash2 className="w-3.5 h-3.5 shrink-0" />
              <span>Xóa ({selectedIds.size})</span>
            </button>
          </div>
        </div>
      ) : (
        /* Normal 2-Row Filter & Select Bar when 0 students selected */
        <div className="bg-white border-b border-slate-200/80 shrink-0 divide-y divide-slate-100">
          {/* Row A: 3 Equal Filter Tabs */}
          <div className="p-1 bg-slate-100/90 grid grid-cols-3 gap-1 text-[11px] font-bold text-slate-600">
            <button
              type="button"
              onClick={() => setFilterMode('all')}
              className={`py-1 rounded-md text-center transition-all cursor-pointer truncate px-0.5 ${
                filterMode === 'all' ? 'bg-white text-blue-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Tất cả ({students.length})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('active')}
              className={`py-1 rounded-md text-center transition-all cursor-pointer truncate px-0.5 ${
                filterMode === 'active' ? 'bg-white text-emerald-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Tham gia ({activeCount})
            </button>
            <button
              type="button"
              onClick={() => setFilterMode('inactive')}
              className={`py-1 rounded-md text-center transition-all cursor-pointer truncate px-0.5 ${
                filterMode === 'inactive' ? 'bg-white text-rose-600 shadow-2xs font-extrabold' : 'hover:text-slate-900'
              }`}
            >
              Tạm loại ({students.length - activeCount})
            </button>
          </div>

          {/* Row B: Select All Checkbox & Quick Reset/Delete Tools */}
          <div className="px-2.5 py-1.5 flex items-center justify-between text-xs">
            <button
              type="button"
              onClick={handleSelectAllFiltered}
              className="flex items-center gap-1 text-[11px] font-bold text-slate-700 hover:text-blue-600 transition-colors cursor-pointer"
              title="Chọn tất cả học sinh đang hiển thị"
            >
              <Square className="w-3.5 h-3.5 text-slate-400" />
              <span>Chọn tất cả ({filteredStudents.length})</span>
            </button>

            <div className="flex items-center gap-2 text-slate-500">
              <button
                type="button"
                onClick={handleBulkResetPicked}
                className="flex items-center gap-1 text-[11px] font-semibold text-slate-500 hover:text-blue-600 transition-colors cursor-pointer"
                title="Đặt lại số lượt gọi về 0"
              >
                <RotateCcw className="w-3 h-3" />
                <span className="hidden xs:inline">Reset lượt</span>
              </button>

              {students.length > 0 && (
                <button
                  type="button"
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
                  className="flex items-center gap-0.5 text-[11px] font-semibold text-rose-600 hover:text-rose-800 transition-colors cursor-pointer"
                  title="Xóa toàn bộ học sinh trong lớp"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Xóa hết</span>
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* 5. Student List Content with independent scrollbar */}
      <div className="flex-1 overflow-y-auto overscroll-contain student-scroll-container divide-y divide-slate-100 p-1 min-h-0 focus:outline-none">
        {filteredStudents.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 px-4 text-center">
            <div className="w-10 h-10 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mb-2">
              <Users className="w-5 h-5" />
            </div>
            <p className="text-xs font-bold text-slate-700 mb-1">
              {students.length === 0
                ? 'Chưa có học sinh nào trong lớp'
                : 'Không tìm thấy học sinh phù hợp'}
            </p>
            <p className="text-[11px] text-slate-400 max-w-xs mb-3">
              Thầy cô có thể thêm trực tiếp, dán danh sách hàng loạt hoặc nhập từ file Excel / Word.
            </p>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onOpenBulkAdd}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold hover:bg-blue-700 transition-colors shadow-2xs cursor-pointer"
              >
                + Thêm hàng loạt
              </button>
              <button
                type="button"
                onClick={onOpenImportExport}
                className="px-2.5 py-1 bg-emerald-600 text-white rounded-lg text-xs font-bold hover:bg-emerald-700 transition-colors shadow-2xs cursor-pointer"
              >
                Nhập Excel/Word
              </button>
            </div>
          </div>
        ) : (
          filteredStudents.map((student) => {
            const isSelected = selectedIds.has(student.id);
            const isEditing = editingId === student.id;

            return (
              <div
                key={student.id}
                className={`flex items-center justify-between py-1.5 px-2 rounded-xl transition-all group ${
                  isSelected ? 'bg-blue-50/80 border border-blue-200' : 'hover:bg-slate-50'
                }`}
              >
                {/* Left: Checkbox, Avatar, Name */}
                <div className="flex items-center gap-2 flex-1 min-w-0 pr-1.5">
                  <button
                    type="button"
                    onClick={() => toggleSelectStudent(student.id)}
                    className="cursor-pointer text-slate-400 hover:text-blue-600 transition-colors shrink-0"
                    title={isSelected ? "Bỏ chọn" : "Chọn học sinh này"}
                  >
                    {isSelected ? (
                      <CheckSquare className="w-3.5 h-3.5 text-blue-600" />
                    ) : (
                      <Square className="w-3.5 h-3.5" />
                    )}
                  </button>

                  {/* Initial Avatar */}
                  <div
                    className={`w-6 h-6 rounded-md text-white font-extrabold text-[10px] flex items-center justify-center shrink-0 shadow-2xs ${
                      student.active ? getAvatarColor(student.name) : 'bg-slate-400'
                    }`}
                  >
                    {student.name.trim().charAt(student.name.trim().lastIndexOf(' ') + 1) || student.name.charAt(0)}
                  </div>

                  {/* Name (View or Inline Edit) */}
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveEdit(student.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="px-2 py-0.5 border border-blue-500 rounded text-xs font-bold w-full outline-none text-slate-900 bg-white"
                      />
                      <button
                        type="button"
                        onClick={() => handleSaveEdit(student.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded cursor-pointer"
                        title="Lưu"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                      <button
                        type="button"
                        onClick={() => setEditingId(null)}
                        className="p-1 text-slate-400 hover:bg-slate-100 rounded cursor-pointer"
                        title="Hủy"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      className="flex-1 min-w-0 cursor-pointer"
                      onClick={() => handleStartEdit(student)}
                      title="Bấm để đổi tên học sinh"
                    >
                      <span
                        className={`text-xs truncate block font-bold ${
                          student.active ? 'text-slate-800' : 'text-slate-400 line-through'
                        }`}
                      >
                        {student.name}
                      </span>
                    </div>
                  )}
                </div>

                {/* Right: Picked badge & Action buttons */}
                <div className="flex items-center gap-1 shrink-0">
                  {student.pickedCount > 0 && (
                    <span
                      className="px-1.5 py-0.5 rounded-full bg-amber-100 text-amber-800 font-extrabold text-[9px] shrink-0"
                      title={`Đã gọi trúng ${student.pickedCount} lần`}
                    >
                      {student.pickedCount} lần
                    </span>
                  )}

                  {/* Active / Inactive switch */}
                  <button
                    type="button"
                    onClick={() => onUpdateStudent(student.id, { active: !student.active })}
                    className={`p-1 rounded-md transition-colors cursor-pointer ${
                      student.active
                        ? 'text-emerald-600 hover:bg-emerald-50'
                        : 'text-slate-300 hover:text-slate-600 hover:bg-slate-100'
                    }`}
                    title={student.active ? "Đang tham gia quay (Bấm để tạm loại)" : "Đang tạm loại (Bấm để bật lại)"}
                  >
                    {student.active ? <Eye className="w-3.5 h-3.5" /> : <EyeOff className="w-3.5 h-3.5" />}
                  </button>

                  {/* Quick Edit */}
                  <button
                    type="button"
                    onClick={() => handleStartEdit(student)}
                    className="p-1 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-md transition-colors cursor-pointer"
                    title="Đổi tên"
                  >
                    <Edit2 className="w-3 h-3" />
                  </button>

                  {/* Delete */}
                  <button
                    type="button"
                    onClick={() => onDeleteStudent(student.id)}
                    className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-md transition-colors cursor-pointer"
                    title="Xóa học sinh này"
                  >
                    <Trash2 className="w-3 h-3" />
                  </button>
                </div>
              </div>
            );
          })
        )}
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
