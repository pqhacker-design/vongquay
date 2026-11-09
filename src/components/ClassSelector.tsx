import React, { useState } from 'react';
import { ClassGroup } from '../types';
import { ConfirmModal } from './ConfirmModal';
import { GraduationCap, Plus, ChevronDown, Check, Trash2, Edit3, X } from 'lucide-react';

interface ClassSelectorProps {
  classes: ClassGroup[];
  activeClassId: string;
  onSelectClass: (id: string) => void;
  onCreateClass: (name: string) => void;
  onRenameClass: (id: string, newName: string) => void;
  onDeleteClass: (id: string) => void;
}

export const ClassSelector: React.FC<ClassSelectorProps> = ({
  classes,
  activeClassId,
  onSelectClass,
  onCreateClass,
  onRenameClass,
  onDeleteClass
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [newClassName, setNewClassName] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editingName, setEditingName] = useState('');
  const [confirmDeleteClass, setConfirmDeleteClass] = useState<ClassGroup | null>(null);

  const currentClass = classes.find(c => c.id === activeClassId) || classes[0];

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (newClassName.trim()) {
      onCreateClass(newClassName.trim());
      setNewClassName('');
      setIsCreating(false);
    }
  };

  const handleSaveRename = (id: string) => {
    if (editingName.trim()) {
      onRenameClass(id, editingName.trim());
    }
    setEditingId(null);
  };

  return (
    <div className="relative">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md border border-slate-200/90 shadow-2xs hover:border-blue-400 hover:bg-white text-slate-800 transition-all cursor-pointer h-9"
        title="Chọn lớp học"
      >
        <div className="w-5 h-5 rounded-md bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs shrink-0">
          <GraduationCap className="w-3.5 h-3.5" />
        </div>
        <span className="text-xs font-extrabold text-slate-800 truncate max-w-[90px] sm:max-w-[130px]">
          {currentClass ? currentClass.name : 'Chưa chọn'}
        </span>
        <ChevronDown className="w-3.5 h-3.5 text-slate-400 shrink-0" />
      </button>

      {/* Dropdown Menu */}
      {isOpen && (
        <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl z-40 p-2 animate-in fade-in zoom-in-95 duration-150">
          <div className="px-2 py-1.5 text-[11px] font-bold text-slate-400 uppercase tracking-wider flex items-center justify-between">
            <span>Danh sách các lớp ({classes.length})</span>
            <button
              onClick={() => setIsCreating(true)}
              className="text-blue-600 hover:text-blue-800 flex items-center gap-1 text-[11px] font-bold"
            >
              <Plus className="w-3.5 h-3.5" /> Thêm lớp
            </button>
          </div>

          {/* New class inline input */}
          {isCreating && (
            <form onSubmit={handleCreate} className="p-2 bg-blue-50 rounded-xl my-1 flex gap-1.5">
              <input
                type="text"
                autoFocus
                placeholder="Tên lớp mới (VD: 10A2)..."
                value={newClassName}
                onChange={(e) => setNewClassName(e.target.value)}
                className="px-2.5 py-1 text-xs border border-blue-300 rounded-lg w-full bg-white text-slate-900 placeholder:text-slate-400 outline-none font-medium"
              />
              <button
                type="submit"
                disabled={!newClassName.trim()}
                className="px-2.5 py-1 bg-blue-600 text-white rounded-lg text-xs font-bold"
              >
                Lưu
              </button>
              <button
                type="button"
                onClick={() => setIsCreating(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </form>
          )}

          {/* Class list */}
          <div className="max-h-56 overflow-y-auto space-y-1 mt-1">
            {classes.map((cls) => {
              const isSelected = cls.id === activeClassId;
              const isEditing = editingId === cls.id;

              return (
                <div
                  key={cls.id}
                  className={`flex items-center justify-between px-2.5 py-2 rounded-xl text-xs transition-colors group ${
                    isSelected ? 'bg-blue-50 text-blue-900 font-bold' : 'hover:bg-slate-50 text-slate-700 font-medium'
                  }`}
                >
                  {isEditing ? (
                    <div className="flex items-center gap-1 flex-1 mr-1">
                      <input
                        type="text"
                        value={editingName}
                        onChange={(e) => setEditingName(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') handleSaveRename(cls.id);
                          if (e.key === 'Escape') setEditingId(null);
                        }}
                        autoFocus
                        className="px-2 py-0.5 border border-blue-400 rounded text-xs w-full bg-white text-slate-900 outline-none"
                      />
                      <button
                        onClick={() => handleSaveRename(cls.id)}
                        className="p-1 text-emerald-600 hover:bg-emerald-50 rounded"
                      >
                        <Check className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ) : (
                    <div
                      onClick={() => {
                        onSelectClass(cls.id);
                        setIsOpen(false);
                      }}
                      className="flex items-center gap-2 flex-1 cursor-pointer min-w-0"
                    >
                      {isSelected ? (
                        <Check className="w-4 h-4 text-blue-600 shrink-0" />
                      ) : (
                        <div className="w-4 h-4 rounded-full border border-slate-300 shrink-0" />
                      )}
                      <span className="truncate">{cls.name}</span>
                      <span className="text-[10px] text-slate-400 font-normal">
                        ({cls.students.length} hs)
                      </span>
                    </div>
                  )}

                  {/* Actions: Rename / Delete */}
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingId(cls.id);
                        setEditingName(cls.name);
                      }}
                      className="p-1 text-slate-400 hover:text-blue-600 rounded"
                      title="Đổi tên lớp"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                    {classes.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          setConfirmDeleteClass(cls);
                        }}
                        className="p-1 text-slate-400 hover:text-rose-600 rounded cursor-pointer"
                        title="Xóa lớp"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Class Deletion Confirmation Modal */}
      <ConfirmModal
        isOpen={!!confirmDeleteClass}
        title="Xóa lớp học"
        message={`Bạn có chắc chắn muốn xóa lớp "${confirmDeleteClass?.name}" và toàn bộ học sinh trong lớp này?`}
        confirmText="Xác nhận xóa"
        cancelText="Hủy bỏ"
        onConfirm={() => {
          if (confirmDeleteClass) {
            onDeleteClass(confirmDeleteClass.id);
            setConfirmDeleteClass(null);
          }
        }}
        onCancel={() => setConfirmDeleteClass(null)}
      />
    </div>
  );
};
