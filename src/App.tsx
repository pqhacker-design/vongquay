/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Student, ClassGroup, SpinHistoryItem, WheelConfig } from './types';
import { LuckyWheel } from './components/LuckyWheel';
import { StudentManager } from './components/StudentManager';
import { ClassSelector } from './components/ClassSelector';
import { BulkAddModal } from './components/BulkAddModal';
import { ImportExportModal } from './components/ImportExportModal';
import { WinnerModal } from './components/WinnerModal';
import { SettingsModal } from './components/SettingsModal';
import { SpinHistoryModal } from './components/SpinHistoryModal';
import { GroupDivisionModal } from './components/GroupDivisionModal';
import { soundEngine } from './utils/audio';
import { detectGender } from './utils/gender';
import {
  Sparkles,
  Settings as SettingsIcon,
  Volume2,
  VolumeX,
  History,
  Maximize2,
  Minimize2,
  GraduationCap,
  Play,
  UsersRound,
  Users
} from 'lucide-react';

const STORAGE_KEYS = {
  CLASSES: 'lucky_wheel_classes_v1',
  ACTIVE_CLASS: 'lucky_wheel_active_class_v1',
  CONFIG: 'lucky_wheel_config_v1',
  HISTORY: 'lucky_wheel_history_v1'
};

const DEFAULT_CONFIG: WheelConfig = {
  spinDuration: 6,
  soundEnabled: true,
  volume: 0.85,
  removeAfterPick: false,
  wheelTheme: 'rainbow',
  confettiEnabled: true
};

const INITIAL_CLASSES: ClassGroup[] = [
  {
    id: 'class-1',
    name: 'Lớp 12A1',
    createdAt: Date.now(),
    students: [
      { id: 's-1', name: 'Nguyễn Hoàng Long', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-2', name: 'Trần Thảo My', active: true, pickedCount: 0, gender: 'female' },
      { id: 's-3', name: 'Lê Minh Triết', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-4', name: 'Phạm Quỳnh Như', active: true, pickedCount: 0, gender: 'female' },
      { id: 's-5', name: 'Đặng Tuấn Kiệt', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-6', name: 'Bùi Lan Hương', active: true, pickedCount: 0, gender: 'female' },
      { id: 's-7', name: 'Võ Quốc Huy', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-8', name: 'Đỗ Thu Thảo', active: true, pickedCount: 0, gender: 'female' },
      { id: 's-9', name: 'Vũ Đức Anh', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-10', name: 'Mai Phương Linh', active: true, pickedCount: 0, gender: 'female' },
      { id: 's-11', name: 'Ngô Gia Hưng', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-12', name: 'Trịnh Bảo Ngọc', active: true, pickedCount: 0, gender: 'female' },
      { id: 's-13', name: 'Dương Hải Đăng', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-14', name: 'Phan Thanh Trúc', active: true, pickedCount: 0, gender: 'female' }
    ]
  },
  {
    id: 'class-2',
    name: 'Nhóm Thuyết Trình',
    createdAt: Date.now() - 10000,
    students: [
      { id: 's-201', name: 'Nguyễn Văn An', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-202', name: 'Trần Thị Bình', active: true, pickedCount: 0, gender: 'female' },
      { id: 's-203', name: 'Lê Hoàng Cường', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-204', name: 'Phạm Quỳnh Duyên', active: true, pickedCount: 0, gender: 'female' },
      { id: 's-205', name: 'Hoàng Minh Đức', active: true, pickedCount: 0, gender: 'male' },
      { id: 's-206', name: 'Vũ Hải Yến', active: true, pickedCount: 0, gender: 'female' }
    ]
  }
];

export default function App() {
  // Load state from localStorage
  const [classes, setClasses] = useState<ClassGroup[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CLASSES);
      if (stored) {
        const parsed: ClassGroup[] = JSON.parse(stored);
        // Normalize students to ensure gender exists
        return parsed.map(cls => ({
          ...cls,
          students: (cls.students || []).map(s => ({
            ...s,
            gender: s.gender || detectGender(s.name)
          }))
        }));
      }
    } catch {
      // fallback
    }
    return INITIAL_CLASSES;
  });

  const [activeClassId, setActiveClassId] = useState<string>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.ACTIVE_CLASS);
      if (stored && classes.some(c => c.id === stored)) return stored;
    } catch {
      // fallback
    }
    return classes[0]?.id || 'class-1';
  });

  const [config, setConfig] = useState<WheelConfig>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.CONFIG);
      if (stored) return { ...DEFAULT_CONFIG, ...JSON.parse(stored) };
    } catch {
      // fallback
    }
    return DEFAULT_CONFIG;
  });

  const [history, setHistory] = useState<SpinHistoryItem[]>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEYS.HISTORY);
      if (stored) return JSON.parse(stored);
    } catch {
      // fallback
    }
    return [];
  });

  // Current active class
  const currentClass = useMemo(() => {
    return classes.find(c => c.id === activeClassId) || classes[0];
  }, [classes, activeClassId]);

  // Current students list
  const students = useMemo(() => {
    return currentClass ? currentClass.students : [];
  }, [currentClass]);

  // Modals state
  const [isBulkAddOpen, setIsBulkAddOpen] = useState(false);
  const [isImportExportOpen, setIsImportExportOpen] = useState(false);
  const [isGroupDivisionOpen, setIsGroupDivisionOpen] = useState(false);
  const [groupDivisionSelectedIds, setGroupDivisionSelectedIds] = useState<string[]>([]);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isHistoryOpen, setIsHistoryOpen] = useState(false);
  const [winner, setWinner] = useState<Student | null>(null);

  // Spin & fullscreen states
  const [isSpinning, setIsSpinning] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [mobileTab, setMobileTab] = useState<'wheel' | 'students'>('wheel');

  // Sync to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CLASSES, JSON.stringify(classes));
    } catch {
      // storage error
    }
  }, [classes]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_CLASS, activeClassId);
    } catch {
      // storage error
    }
  }, [activeClassId]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.CONFIG, JSON.stringify(config));
    } catch {
      // storage error
    }
    soundEngine.setVolume(config.volume);
    soundEngine.setEnabled(config.soundEnabled);
  }, [config]);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(history));
    } catch {
      // storage error
    }
  }, [history]);

  // Helper to update current class's students
  const updateCurrentClassStudents = useCallback((updater: (prevStudents: Student[]) => Student[]) => {
    setClasses(prev =>
      prev.map(c => {
        if (c.id === activeClassId) {
          return {
            ...c,
            students: updater(c.students)
          };
        }
        return c;
      })
    );
  }, [activeClassId]);

  // 1. Add single student
  const handleAddStudent = useCallback((name: string) => {
    const trimmed = name.trim();
    const newStudent: Student = {
      id: `s-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      name: trimmed,
      active: true,
      pickedCount: 0,
      gender: detectGender(trimmed)
    };
    updateCurrentClassStudents(prev => [...prev, newStudent]);
  }, [updateCurrentClassStudents]);

  // 2. Update student
  const handleUpdateStudent = useCallback((id: string, updates: Partial<Student>) => {
    updateCurrentClassStudents(prev =>
      prev.map(s => (s.id === id ? { ...s, ...updates } : s))
    );
  }, [updateCurrentClassStudents]);

  // 3. Delete single student
  const handleDeleteStudent = useCallback((id: string) => {
    updateCurrentClassStudents(prev => prev.filter(s => s.id !== id));
  }, [updateCurrentClassStudents]);

  // 4. Bulk delete students
  const handleBulkDeleteStudents = useCallback((ids: string[]) => {
    const idSet = new Set(ids);
    updateCurrentClassStudents(prev => prev.filter(s => !idSet.has(s.id)));
  }, [updateCurrentClassStudents]);

  // 5. Bulk toggle active
  const handleBulkToggleActive = useCallback((ids: string[], active: boolean) => {
    const idSet = new Set(ids);
    updateCurrentClassStudents(prev =>
      prev.map(s => (idSet.has(s.id) ? { ...s, active } : s))
    );
  }, [updateCurrentClassStudents]);

  // 6. Bulk set gender
  const handleBulkSetGender = useCallback((ids: string[], gender: 'male' | 'female') => {
    const idSet = new Set(ids);
    updateCurrentClassStudents(prev =>
      prev.map(s => (idSet.has(s.id) ? { ...s, gender } : s))
    );
  }, [updateCurrentClassStudents]);

  // 7. Reset picked counts
  const handleResetPickedCounts = useCallback((ids?: string[]) => {
    const idSet = ids ? new Set(ids) : null;
    updateCurrentClassStudents(prev =>
      prev.map(s => (!idSet || idSet.has(s.id) ? { ...s, pickedCount: 0 } : s))
    );
  }, [updateCurrentClassStudents]);

  // 8. Bulk add from text
  const handleBulkAddStudents = useCallback((names: string[]) => {
    const newStudents: Student[] = names.map((name, idx) => ({
      id: `s-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      active: true,
      pickedCount: 0,
      gender: detectGender(name)
    }));
    updateCurrentClassStudents(prev => [...prev, ...newStudents]);
  }, [updateCurrentClassStudents]);

  // 9. Import students from Excel/Word
  const handleImportStudents = useCallback((names: string[], overwrite: boolean) => {
    const newStudents: Student[] = names.map((name, idx) => ({
      id: `s-${Date.now()}-${idx}-${Math.random().toString(36).substring(2, 6)}`,
      name,
      active: true,
      pickedCount: 0,
      gender: detectGender(name)
    }));
    updateCurrentClassStudents(prev => (overwrite ? newStudents : [...prev, ...newStudents]));
  }, [updateCurrentClassStudents]);

  // Class management
  const handleCreateClass = (name: string) => {
    const newClass: ClassGroup = {
      id: `class-${Date.now()}`,
      name: name.trim(),
      createdAt: Date.now(),
      students: []
    };
    setClasses(prev => [...prev, newClass]);
    setActiveClassId(newClass.id);
  };

  const handleRenameClass = (id: string, newName: string) => {
    setClasses(prev =>
      prev.map(c => (c.id === id ? { ...c, name: newName.trim() } : c))
    );
  };

  const handleDeleteClass = (id: string) => {
    if (classes.length <= 1) return;
    const remaining = classes.filter(c => c.id !== id);
    setClasses(remaining);
    if (activeClassId === id) {
      setActiveClassId(remaining[0].id);
    }
  };

  // Wheel Spin Completed
  const handleSpinEnd = (pickedStudent: Student) => {
    // 1. Increment pickedCount for student
    updateCurrentClassStudents(prev =>
      prev.map(s => (s.id === pickedStudent.id ? { ...s, pickedCount: s.pickedCount + 1 } : s))
    );

    // 2. Add to history
    const historyItem: SpinHistoryItem = {
      id: `h-${Date.now()}`,
      studentId: pickedStudent.id,
      studentName: pickedStudent.name,
      className: currentClass?.name || '',
      timestamp: Date.now()
    };
    setHistory(prev => [historyItem, ...prev]);

    // 3. Open Winner celebration
    setWinner({ ...pickedStudent, pickedCount: pickedStudent.pickedCount + 1 });
  };

  // Remove winner from wheel (set active = false)
  const handleRemoveWinner = (studentId: string) => {
    updateCurrentClassStudents(prev =>
      prev.map(s => (s.id === studentId ? { ...s, active: false } : s))
    );
  };

  // Fullscreen toggle
  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch(() => {});
      setIsFullscreen(true);
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen().catch(() => {});
      }
      setIsFullscreen(false);
    }
  };

  // Fullscreen change listener
  useEffect(() => {
    const handleFsChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFsChange);
    return () => document.removeEventListener('fullscreenchange', handleFsChange);
  }, []);

  return (
    <div className="h-screen w-screen max-h-screen overflow-hidden bg-gradient-to-br from-slate-900 via-indigo-950 to-slate-900 text-slate-100 flex flex-col font-sans selection:bg-rose-500 selection:text-white">
      {/* Top Header Navbar */}
      <header className="border-b border-slate-800 bg-slate-900/95 backdrop-blur-md shrink-0 px-2.5 py-1.5 sm:px-4 z-30">
        <div className="max-w-7xl mx-auto flex items-center justify-between gap-2">
          {/* Brand Logo & Title */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-tr from-amber-500 via-rose-500 to-indigo-500 flex items-center justify-center shadow-md shadow-rose-500/20 shrink-0">
              <Sparkles className="w-4.5 h-4.5 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="font-black text-xs sm:text-sm tracking-tight text-white flex items-center gap-1.5 leading-none">
                <span className="truncate">VÒNG QUAY MAY MẮN</span>
                <span className="hidden sm:inline-block px-1.5 py-0.5 rounded-md text-[9px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30 shrink-0">
                  LỚP HỌC
                </span>
              </h1>
              <p className="text-[10px] text-slate-400 hidden xl:block mt-0.5">
                Gọi tên học sinh ngẫu nhiên • Âm thanh sống động • Hỗ trợ Excel & Word
              </p>
            </div>
          </div>

          {/* Center/Right Nav Controls */}
          <div className="flex items-center gap-1.5 shrink-0">
            {/* Class Selector Dropdown */}
            <ClassSelector
              classes={classes}
              activeClassId={activeClassId}
              onSelectClass={setActiveClassId}
              onCreateClass={handleCreateClass}
              onRenameClass={handleRenameClass}
              onDeleteClass={handleDeleteClass}
            />

            {/* Random Group Division Trigger */}
            <button
              onClick={() => {
                setGroupDivisionSelectedIds([]);
                setIsGroupDivisionOpen(true);
              }}
              className="h-9 px-2 sm:px-2.5 rounded-xl bg-indigo-600/30 hover:bg-indigo-600/50 border border-indigo-500/50 text-indigo-200 hover:text-white transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold shadow-2xs active:scale-95"
              title="Chia nhóm ngẫu nhiên cho lớp học"
            >
              <UsersRound className="w-4 h-4 text-indigo-400 shrink-0" />
              <span className="hidden md:inline">Chia nhóm</span>
            </button>

            {/* Quick Sound Toggle */}
            <button
              onClick={() => setConfig(c => ({ ...c, soundEnabled: !c.soundEnabled }))}
              className={`w-9 h-9 rounded-xl border transition-all cursor-pointer flex items-center justify-center ${
                config.soundEnabled
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-400 hover:bg-emerald-500/30'
                  : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
              }`}
              title={config.soundEnabled ? 'Đang bật âm thanh (Bấm để tắt)' : 'Đang tắt âm thanh (Bấm để bật)'}
            >
              {config.soundEnabled ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4" />}
            </button>

            {/* Spin History Modal Trigger */}
            <button
              onClick={() => setIsHistoryOpen(true)}
              className="relative w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Lịch sử các lượt quay"
            >
              <History className="w-4 h-4" />
              {history.length > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-amber-500 text-slate-900 font-extrabold text-[9px] rounded-full flex items-center justify-center">
                  {history.length > 99 ? '99+' : history.length}
                </span>
              )}
            </button>

            {/* Settings Modal Trigger */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              className="w-9 h-9 rounded-xl bg-slate-800/80 hover:bg-slate-700 border border-slate-700 text-slate-300 hover:text-white transition-all cursor-pointer flex items-center justify-center"
              title="Cài đặt vòng quay"
            >
              <SettingsIcon className="w-4 h-4" />
            </button>

            {/* Fullscreen Button */}
            <button
              onClick={toggleFullscreen}
              className="h-9 px-2.5 rounded-xl bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all shadow-md cursor-pointer hidden md:flex items-center gap-1.5 text-xs"
              title="Toàn màn hình chiếu cho lớp học"
            >
              {isFullscreen ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden lg:inline">{isFullscreen ? 'Thu nhỏ' : 'Toàn màn hình'}</span>
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Tab Switcher (Visible only on small viewports < 768px) */}
      <div className="md:hidden px-2 pt-1.5 shrink-0">
        <div className="flex bg-slate-800/90 p-1 rounded-xl border border-slate-700/80 max-w-md mx-auto">
          <button
            type="button"
            onClick={() => setMobileTab('wheel')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'wheel' ? 'bg-gradient-to-r from-rose-600 to-amber-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Vòng quay</span>
          </button>
          <button
            type="button"
            onClick={() => setMobileTab('students')}
            className={`flex-1 py-1.5 px-3 rounded-lg text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
              mobileTab === 'students' ? 'bg-blue-600 text-white shadow-xs' : 'text-slate-400 hover:text-white'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Danh sách HS ({students.length})</span>
          </button>
        </div>
      </div>

      {/* Main Workspace Body */}
      <main className="flex-1 min-h-0 w-full max-w-[1600px] mx-auto p-2 sm:p-3 flex flex-col overflow-hidden">
        <div className="grid grid-cols-1 md:grid-cols-12 gap-2.5 sm:gap-3.5 flex-1 min-h-0 items-stretch overflow-hidden">
          {/* Left Column: Lucky Wheel Stage (Enlarged to 8/12 on desktop) */}
          <div className={`md:col-span-7 lg:col-span-8 xl:col-span-8 2xl:col-span-9 flex flex-col justify-center items-center bg-slate-800/40 backdrop-blur-sm border border-slate-800/80 rounded-2xl sm:rounded-3xl p-1.5 sm:p-3 relative shadow-2xl h-full min-h-0 overflow-hidden ${
            mobileTab === 'wheel' ? 'flex' : 'hidden md:flex'
          }`}>
            {/* Ambient Background Glow Effect */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

            {/* Lucky Wheel Canvas Component */}
            <LuckyWheel
              students={students}
              config={config}
              onSpinEnd={handleSpinEnd}
              isSpinning={isSpinning}
              setIsSpinning={setIsSpinning}
              isFullscreen={isFullscreen}
              onToggleFullscreen={toggleFullscreen}
            />
          </div>

          {/* Right Column: Student Management Panel (Narrowed & compact to 4/12) */}
          <div className={`md:col-span-5 lg:col-span-4 xl:col-span-4 2xl:col-span-3 flex flex-col h-full min-h-0 overflow-hidden ${
            mobileTab === 'students' ? 'flex' : 'hidden md:flex'
          }`}>
            <StudentManager
              students={students}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onBulkDeleteStudents={handleBulkDeleteStudents}
              onBulkToggleActive={handleBulkToggleActive}
              onBulkSetGender={handleBulkSetGender}
              onResetPickedCounts={handleResetPickedCounts}
              onOpenBulkAdd={() => setIsBulkAddOpen(true)}
              onOpenImportExport={() => setIsImportExportOpen(true)}
              onOpenGroupDivision={(selectedIds) => {
                setGroupDivisionSelectedIds(selectedIds || []);
                setIsGroupDivisionOpen(true);
              }}
            />
          </div>
        </div>
      </main>

      {/* Modals */}
      <BulkAddModal
        isOpen={isBulkAddOpen}
        onClose={() => setIsBulkAddOpen(false)}
        onAddStudents={handleBulkAddStudents}
      />

      <ImportExportModal
        isOpen={isImportExportOpen}
        onClose={() => setIsImportExportOpen(false)}
        className={currentClass?.name || 'Lớp học'}
        students={students}
        onImportStudents={handleImportStudents}
      />

      <GroupDivisionModal
        isOpen={isGroupDivisionOpen}
        onClose={() => setIsGroupDivisionOpen(false)}
        students={students}
        className={currentClass?.name || 'Lớp học'}
        initialSelectedIds={groupDivisionSelectedIds}
      />

      <WinnerModal
        winner={winner}
        onClose={() => setWinner(null)}
        onSpinAgain={() => {
          setWinner(null);
          // Small delay then trigger spin
          setTimeout(() => {
            const spinBtn = document.querySelector('button[title="Bấm để quay"]') as HTMLCanvasElement;
            if (spinBtn) spinBtn.click();
          }, 300);
        }}
        onRemoveWinner={handleRemoveWinner}
        autoRemoveEnabled={config.removeAfterPick}
      />

      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        config={config}
        onUpdateConfig={(updates) => setConfig(prev => ({ ...prev, ...updates }))}
      />

      <SpinHistoryModal
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        history={history}
        onClearHistory={() => setHistory([])}
      />
    </div>
  );
}
