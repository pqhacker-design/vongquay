import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { Student, GroupResult } from '../types';
import { soundEngine } from '../utils/audio';
import confetti from 'canvas-confetti';
import * as XLSX from 'xlsx';
import {
  X,
  UsersRound,
  Shuffle,
  Copy,
  Check,
  FileSpreadsheet,
  Printer,
  Maximize2,
  Minimize2,
  Star,
  Sparkles,
  ArrowRightLeft,
  ChevronRight,
  SlidersHorizontal,
  Edit2,
  Share2
} from 'lucide-react';

interface GroupDivisionModalProps {
  isOpen: boolean;
  onClose: () => void;
  students: Student[];
  className: string;
  initialSelectedIds?: string[];
}

type DivisionType = 'byGroupCount' | 'byMemberCount';
type NamingScheme = 'number' | 'team' | 'color' | 'animal';

const COLOR_PALETTES = [
  { name: 'Xanh dương', bg: 'bg-blue-500/10 border-blue-500/30 text-blue-400', badge: 'bg-blue-500 text-white', header: 'bg-blue-600' },
  { name: 'Hồng sen', bg: 'bg-rose-500/10 border-rose-500/30 text-rose-400', badge: 'bg-rose-500 text-white', header: 'bg-rose-600' },
  { name: 'Xanh lục bảo', bg: 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400', badge: 'bg-emerald-500 text-white', header: 'bg-emerald-600' },
  { name: 'Hổ phách vàng', bg: 'bg-amber-500/10 border-amber-500/30 text-amber-400', badge: 'bg-amber-500 text-white', header: 'bg-amber-600' },
  { name: 'Tím mộng mơ', bg: 'bg-purple-500/10 border-purple-500/30 text-purple-400', badge: 'bg-purple-500 text-white', header: 'bg-purple-600' },
  { name: 'Lam ngọc', bg: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-400', badge: 'bg-cyan-500 text-white', header: 'bg-cyan-600' },
  { name: 'Cam rực rỡ', bg: 'bg-orange-500/10 border-orange-500/30 text-orange-400', badge: 'bg-orange-500 text-white', header: 'bg-orange-600' },
  { name: 'Chàm bí ẩn', bg: 'bg-indigo-500/10 border-indigo-500/30 text-indigo-400', badge: 'bg-indigo-500 text-white', header: 'bg-indigo-600' },
  { name: 'Đỏ ruby', bg: 'bg-red-500/10 border-red-500/30 text-red-400', badge: 'bg-red-500 text-white', header: 'bg-red-600' },
  { name: 'Xanh mạ non', bg: 'bg-lime-500/10 border-lime-500/30 text-lime-400', badge: 'bg-lime-600 text-white', header: 'bg-lime-600' },
  { name: 'Tím hoa cà', bg: 'bg-fuchsia-500/10 border-fuchsia-500/30 text-fuchsia-400', badge: 'bg-fuchsia-500 text-white', header: 'bg-fuchsia-600' },
  { name: 'Xanh mòng két', bg: 'bg-teal-500/10 border-teal-500/30 text-teal-400', badge: 'bg-teal-500 text-white', header: 'bg-teal-600' }
];

const ANIMAL_NAMES = [
  'Đại Bàng', 'Sư Tử', 'Rồng Lửa', 'Hổ Dũng Mãnh',
  'Cá Heo', 'Sói Xám', 'Gấu Bắc Cực', 'Báo Đốm',
  'Chim Ưng', 'Kỳ Lân', 'Hạc Trắng', 'Phượng Hoàng'
];

const COLOR_NAMES = [
  'Đội Đỏ', 'Đội Xanh Lam', 'Đội Vàng', 'Đội Xanh Lá',
  'Đội Tím', 'Đội Cam', 'Đội Lam Ngọc', 'Đội Hồng',
  'Đội Chàm', 'Đội Bạch Kim', 'Đội Mạ Non', 'Đội Cầu Vồng'
];

export const GroupDivisionModal: React.FC<GroupDivisionModalProps> = ({
  isOpen,
  onClose,
  students,
  className,
  initialSelectedIds = []
}) => {
  // Source filtering
  const [studentSource, setStudentSource] = useState<'all' | 'active' | 'selected'>(() => {
    return initialSelectedIds.length > 1 ? 'selected' : 'active';
  });

  // Division parameters
  const [divisionType, setDivisionType] = useState<DivisionType>('byGroupCount');
  const [groupCountInput, setGroupCountInput] = useState<number>(4);
  const [memberCountInput, setMemberCountInput] = useState<number>(4);
  const [namingScheme, setNamingScheme] = useState<NamingScheme>('number');
  const [assignLeader, setAssignLeader] = useState<boolean>(true);

  // Group division result state
  const [groups, setGroups] = useState<GroupResult[]>([]);
  const [isShuffling, setIsShuffling] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const [isPresentationMode, setIsPresentationMode] = useState<boolean>(false);
  const [movingStudent, setMovingStudent] = useState<{ student: Student; fromGroupId: string } | null>(null);
  const [editingGroupId, setEditingGroupId] = useState<string | null>(null);
  const [editingGroupName, setEditingGroupName] = useState<string>('');

  // Filter pool of students according to selected source
  const poolStudents = useMemo(() => {
    if (studentSource === 'selected' && initialSelectedIds.length > 0) {
      const selectedSet = new Set(initialSelectedIds);
      return students.filter(s => selectedSet.has(s.id));
    }
    if (studentSource === 'active') {
      return students.filter(s => s.active);
    }
    return students;
  }, [students, studentSource, initialSelectedIds]);

  // Generate Group Name helper
  const getGroupName = useCallback((index: number, scheme: NamingScheme): string => {
    switch (scheme) {
      case 'team':
        return `Tổ ${index + 1}`;
      case 'color':
        return COLOR_NAMES[index % COLOR_NAMES.length] || `Đội ${index + 1}`;
      case 'animal':
        return `Đội ${ANIMAL_NAMES[index % ANIMAL_NAMES.length] || `Biệt đội ${index + 1}`}`;
      case 'number':
      default:
        return `Nhóm ${index + 1}`;
    }
  }, []);

  // Main Random Grouping Algorithm (Fisher-Yates Shuffle + Balanced Partition)
  const performDivision = useCallback(() => {
    if (poolStudents.length === 0) {
      setGroups([]);
      return;
    }

    setIsShuffling(true);

    // Sound effect
    try {
      soundEngine.playTick(0.8);
    } catch {
      // ignore
    }

    setTimeout(() => {
      // 1. Shuffle students copy using Fisher-Yates
      const shuffled = [...poolStudents];
      for (let i = shuffled.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
      }

      // 2. Determine number of groups
      let numGroups = 1;
      const total = shuffled.length;

      if (divisionType === 'byGroupCount') {
        numGroups = Math.max(1, Math.min(total, groupCountInput));
      } else {
        const membersPerGroup = Math.max(1, memberCountInput);
        numGroups = Math.max(1, Math.ceil(total / membersPerGroup));
      }

      // 3. Distribute students evenly across groups (remainder distributed 1 by 1)
      const newGroups: GroupResult[] = [];
      for (let g = 0; g < numGroups; g++) {
        newGroups.push({
          id: `group-${g + 1}-${Date.now()}`,
          name: getGroupName(g, namingScheme),
          color: COLOR_PALETTES[g % COLOR_PALETTES.length].header,
          members: []
        });
      }

      shuffled.forEach((student, index) => {
        const targetGroupIndex = index % numGroups;
        newGroups[targetGroupIndex].members.push(student);
      });

      // 4. Assign leader if option checked
      if (assignLeader) {
        newGroups.forEach(group => {
          if (group.members.length > 0) {
            // Pick a random member as leader
            const randomLeaderIndex = Math.floor(Math.random() * group.members.length);
            group.leaderId = group.members[randomLeaderIndex].id;
          }
        });
      }

      setGroups(newGroups);
      setIsShuffling(false);

      // Mild celebration confetti
      try {
        confetti({
          particleCount: 40,
          spread: 60,
          origin: { y: 0.5 }
        });
      } catch {
        // ignore
      }
    }, 250);
  }, [poolStudents, divisionType, groupCountInput, memberCountInput, namingScheme, assignLeader, getGroupName]);

  // Initial division on open or when pool changes
  useEffect(() => {
    if (isOpen && groups.length === 0 && poolStudents.length > 0) {
      performDivision();
    }
  }, [isOpen, poolStudents.length, performDivision, groups.length]);

  if (!isOpen) return null;

  // Toggle leader for a member
  const handleToggleLeader = (groupId: string, studentId: string) => {
    setGroups(prev =>
      prev.map(g => {
        if (g.id === groupId) {
          return {
            ...g,
            leaderId: g.leaderId === studentId ? undefined : studentId
          };
        }
        return g;
      })
    );
  };

  // Move a student between groups
  const handleMoveStudentTo = (targetGroupId: string) => {
    if (!movingStudent || movingStudent.fromGroupId === targetGroupId) {
      setMovingStudent(null);
      return;
    }

    setGroups(prev => {
      return prev.map(g => {
        if (g.id === movingStudent.fromGroupId) {
          return {
            ...g,
            members: g.members.filter(m => m.id !== movingStudent.student.id),
            leaderId: g.leaderId === movingStudent.student.id ? undefined : g.leaderId
          };
        }
        if (g.id === targetGroupId) {
          return {
            ...g,
            members: [...g.members, movingStudent.student]
          };
        }
        return g;
      });
    });

    setMovingStudent(null);
  };

  // Rename group
  const handleSaveGroupName = (groupId: string) => {
    if (editingGroupName.trim()) {
      setGroups(prev =>
        prev.map(g => (g.id === groupId ? { ...g, name: editingGroupName.trim() } : g))
      );
    }
    setEditingGroupId(null);
  };

  // Copy formatted text to clipboard
  const handleCopyGroups = () => {
    if (groups.length === 0) return;

    let text = `📋 KẾT QUẢ CHIA NHÓM - ${className.toUpperCase()}\n`;
    text += `Tổng số: ${poolStudents.length} học sinh • Gồm ${groups.length} nhóm\n`;
    text += `Thời gian: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}\n`;
    text += `-------------------------------------------\n\n`;

    groups.forEach((group, idx) => {
      const leader = group.members.find(m => m.id === group.leaderId);
      text += `📌 ${group.name.toUpperCase()} (${group.members.length} thành viên)${leader ? ` - Nhóm trưởng: ${leader.name} ⭐` : ''}\n`;
      group.members.forEach((member, mIdx) => {
        const isLead = member.id === group.leaderId;
        text += `   ${mIdx + 1}. ${member.name}${isLead ? ' (Nhóm trưởng ⭐)' : ''}\n`;
      });
      text += '\n';
    });

    text += `-------------------------------------------\n`;
    text += `Phát triển bởi Thầy Ngô Thanh Hùng - THCS Bình San`;

    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2200);
  };

  // Export to Excel
  const handleExportExcel = () => {
    if (groups.length === 0) return;

    try {
      const maxRows = Math.max(...groups.map(g => g.members.length));
      const excelRows: Record<string, string>[] = [];

      for (let r = 0; r < maxRows; r++) {
        const rowObj: Record<string, string> = { 'STT': `${r + 1}` };
        groups.forEach(g => {
          const member = g.members[r];
          if (member) {
            const isLead = member.id === g.leaderId;
            rowObj[g.name] = `${member.name}${isLead ? ' (Nhóm trưởng)' : ''}`;
          } else {
            rowObj[g.name] = '';
          }
        });
        excelRows.push(rowObj);
      }

      const worksheet = XLSX.utils.json_to_sheet(excelRows);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'Danh Sách Chia Nhóm');

      const safeClassName = className.replace(/[^a-zA-Z0-9_\u00C0-\u1EF9]/g, '_');
      const dateStr = new Date().toISOString().slice(0, 10);
      XLSX.writeFile(workbook, `Chia_Nhom_${safeClassName}_${dateStr}.xlsx`);
    } catch {
      // fallback
    }
  };

  // Print view
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className={`fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4 bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-200 ${isPresentationMode ? 'p-0' : ''}`}>
      <div className={`print-clean bg-white rounded-2xl sm:rounded-3xl shadow-2xl w-full flex flex-col overflow-hidden border border-slate-200 transition-all ${
        isPresentationMode
          ? 'h-full w-full rounded-none max-w-none border-none'
          : 'max-w-5xl max-h-[92vh]'
      }`}>
        {/* Header Bar */}
        <div className="px-4 sm:px-6 py-3.5 bg-slate-900 text-white flex items-center justify-between shrink-0 border-b border-slate-800">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl text-white shadow-md shadow-blue-500/20">
              <UsersRound className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-base sm:text-lg leading-tight">Chia Nhóm Ngẫu Nhiên</h3>
                <span className="hidden sm:inline-block px-2 py-0.5 rounded-full text-[11px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30">
                  {className}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                Phân chia học sinh công bằng, ngẫu nhiên cho thảo luận & làm việc nhóm
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Presentation Mode Toggle */}
            <button
              onClick={() => setIsPresentationMode(!isPresentationMode)}
              className={`p-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                isPresentationMode
                  ? 'bg-amber-500 text-slate-950 font-bold hover:bg-amber-400'
                  : 'bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700'
              }`}
              title={isPresentationMode ? 'Thoát chế độ trình chiếu' : 'Trình chiếu toàn màn hình cho lớp học'}
            >
              {isPresentationMode ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
              <span className="hidden md:inline">{isPresentationMode ? 'Thu nhỏ' : 'Trình chiếu'}</span>
            </button>

            {/* Print */}
            <button
              onClick={handlePrint}
              className="p-2 rounded-xl bg-slate-800 text-slate-300 hover:text-white hover:bg-slate-700 transition-colors cursor-pointer hidden sm:flex"
              title="In danh sách nhóm"
            >
              <Printer className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Configuration Toolbar (Collapsible / Compact in presentation mode) */}
        {!isPresentationMode && (
          <div className="p-3 sm:p-4 bg-slate-50 border-b border-slate-200 shrink-0 space-y-3">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-3 items-center">
              {/* Student Source Selector */}
              <div className="md:col-span-4 flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center gap-1">
                  <SlidersHorizontal className="w-3 h-3 text-blue-600" />
                  Nguồn danh sách:
                </label>
                <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs">
                  <button
                    type="button"
                    onClick={() => setStudentSource('active')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studentSource === 'active'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tham gia ({students.filter(s => s.active).length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setStudentSource('all')}
                    className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                      studentSource === 'all'
                        ? 'bg-blue-600 text-white shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    Tất cả ({students.length})
                  </button>
                  {initialSelectedIds.length > 0 && (
                    <button
                      type="button"
                      onClick={() => setStudentSource('selected')}
                      className={`flex-1 py-1.5 px-2 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        studentSource === 'selected'
                          ? 'bg-blue-600 text-white shadow-xs'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Đã chọn ({initialSelectedIds.length})
                    </button>
                  )}
                </div>
              </div>

              {/* Division Mode & Inputs */}
              <div className="md:col-span-5 flex flex-col gap-1">
                <label className="text-[11px] font-bold text-slate-500 uppercase tracking-wider flex items-center justify-between">
                  <span>Quy tắc chia:</span>
                  <span className="text-slate-400 font-normal">
                    {poolStudents.length} học sinh
                  </span>
                </label>
                <div className="flex items-center gap-2">
                  {/* Mode switch */}
                  <div className="flex bg-white p-1 rounded-xl border border-slate-200 shadow-2xs shrink-0">
                    <button
                      type="button"
                      onClick={() => setDivisionType('byGroupCount')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        divisionType === 'byGroupCount'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      Số nhóm
                    </button>
                    <button
                      type="button"
                      onClick={() => setDivisionType('byMemberCount')}
                      className={`py-1.5 px-2.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        divisionType === 'byMemberCount'
                          ? 'bg-slate-900 text-white'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      HS / nhóm
                    </button>
                  </div>

                  {/* Input value */}
                  <div className="flex items-center gap-1.5 bg-white border border-slate-200 rounded-xl px-2.5 py-1 shadow-2xs flex-1">
                    <span className="text-xs text-slate-500 font-medium">Số lượng:</span>
                    <input
                      type="number"
                      min={1}
                      max={poolStudents.length || 50}
                      value={divisionType === 'byGroupCount' ? groupCountInput : memberCountInput}
                      onChange={(e) => {
                        const val = Math.max(1, parseInt(e.target.value) || 1);
                        if (divisionType === 'byGroupCount') {
                          setGroupCountInput(val);
                        } else {
                          setMemberCountInput(val);
                        }
                      }}
                      className="w-14 text-center text-sm font-extrabold text-blue-600 focus:outline-none"
                    />
                    {/* Quick increment / decrement presets */}
                    <div className="flex gap-1">
                      {[2, 3, 4, 5, 6].map(num => (
                        <button
                          key={num}
                          type="button"
                          onClick={() => {
                            if (divisionType === 'byGroupCount') {
                              setGroupCountInput(num);
                            } else {
                              setMemberCountInput(num);
                            }
                          }}
                          className={`w-6 h-6 rounded-md text-[11px] font-bold flex items-center justify-center transition-all cursor-pointer ${
                            (divisionType === 'byGroupCount' ? groupCountInput : memberCountInput) === num
                              ? 'bg-blue-100 text-blue-700 border border-blue-300'
                              : 'bg-slate-100 hover:bg-slate-200 text-slate-600'
                          }`}
                        >
                          {num}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Naming Scheme & Trigger Button */}
              <div className="md:col-span-3 flex items-center gap-2 pt-1 md:pt-4">
                <select
                  value={namingScheme}
                  onChange={(e) => setNamingScheme(e.target.value as NamingScheme)}
                  className="bg-white border border-slate-200 rounded-xl px-2.5 py-2 text-xs font-bold text-slate-700 shadow-2xs focus:outline-none focus:ring-2 focus:ring-blue-500 cursor-pointer flex-1"
                >
                  <option value="number">Nhóm 1, 2, 3...</option>
                  <option value="team">Tổ 1, 2, 3...</option>
                  <option value="color">Màu sắc (Đội Đỏ, Lam...)</option>
                  <option value="animal">Linh vật (Đại Bàng, Sư Tử...)</option>
                </select>

                <button
                  type="button"
                  onClick={performDivision}
                  disabled={isShuffling || poolStudents.length === 0}
                  className="px-4 py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 text-white rounded-xl text-xs font-black flex items-center gap-1.5 shadow-md shadow-blue-500/20 active:scale-95 transition-all cursor-pointer shrink-0"
                >
                  <Shuffle className={`w-3.5 h-3.5 ${isShuffling ? 'animate-spin' : ''}`} />
                  <span>Xáo trộn</span>
                </button>
              </div>
            </div>

            {/* Quick check options bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
              <label className="flex items-center gap-2 cursor-pointer select-none text-slate-700 font-medium">
                <input
                  type="checkbox"
                  checked={assignLeader}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAssignLeader(checked);
                    if (checked) {
                      setGroups(prev =>
                        prev.map(g => {
                          if (g.members.length > 0 && !g.leaderId) {
                            const rIdx = Math.floor(Math.random() * g.members.length);
                            return { ...g, leaderId: g.members[rIdx].id };
                          }
                          return g;
                        })
                      );
                    } else {
                      setGroups(prev => prev.map(g => ({ ...g, leaderId: undefined })));
                    }
                  }}
                  className="w-4 h-4 rounded text-blue-600 focus:ring-blue-500 cursor-pointer"
                />
                <span className="flex items-center gap-1">
                  <Star className="w-3.5 h-3.5 text-amber-500 fill-amber-500" />
                  Chỉ định ngẫu nhiên 1 nhóm trưởng cho mỗi nhóm
                </span>
              </label>

              {/* Action buttons: Copy & Excel */}
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleCopyGroups}
                  className={`px-3 py-1.5 rounded-xl border text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                    copied
                      ? 'bg-emerald-50 border-emerald-300 text-emerald-700'
                      : 'bg-white border-slate-200 hover:bg-slate-100 text-slate-700'
                  }`}
                  title="Sao chép toàn bộ danh sách chia nhóm để dán vào Zalo / Word"
                >
                  {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
                  <span>{copied ? 'Đã sao chép!' : 'Sao chép kết quả'}</span>
                </button>

                <button
                  type="button"
                  onClick={handleExportExcel}
                  className="px-3 py-1.5 rounded-xl bg-white border border-slate-200 hover:bg-slate-100 text-slate-700 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
                  title="Xuất kết quả chia nhóm ra file Excel (.xlsx)"
                >
                  <FileSpreadsheet className="w-3.5 h-3.5 text-emerald-600" />
                  <span>Xuất Excel</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Presentation Header (When in presentation mode) */}
        {isPresentationMode && (
          <div className="px-6 py-3 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-white">
            <div className="flex items-center gap-3">
              <span className="text-xl font-black text-amber-400">KẾT QUẢ CHIA NHÓM: {className}</span>
              <span className="text-xs text-slate-400">
                ({poolStudents.length} học sinh • {groups.length} nhóm)
              </span>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={performDivision}
                className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                <Shuffle className="w-3.5 h-3.5" />
                <span>Chia lại</span>
              </button>
              <button
                type="button"
                onClick={handleCopyGroups}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer"
              >
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Đã chép' : 'Sao chép'}</span>
              </button>
            </div>
          </div>
        )}

        {/* Groups Results Workspace (Card Grid) */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 bg-slate-100/70 min-h-0">
          {poolStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full py-12 text-center">
              <div className="w-16 h-16 rounded-3xl bg-slate-200 flex items-center justify-center text-slate-400 mb-3">
                <UsersRound className="w-8 h-8" />
              </div>
              <h4 className="font-bold text-slate-700 text-base">Chưa có học sinh nào trong nguồn chọn</h4>
              <p className="text-xs text-slate-400 mt-1 max-w-sm">
                Vui lòng kiểm tra lại trạng thái học sinh tham gia hoặc thêm học sinh vào lớp.
              </p>
            </div>
          ) : (
            <div className={`grid gap-4 sm:gap-5 ${
              groups.length === 1
                ? 'grid-cols-1 max-w-md mx-auto'
                : groups.length === 2
                ? 'grid-cols-1 md:grid-cols-2'
                : groups.length === 3
                ? 'grid-cols-1 md:grid-cols-3'
                : groups.length === 4
                ? 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-4'
                : 'grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4'
            }`}>
              {groups.map((group, groupIndex) => {
                const palette = COLOR_PALETTES[groupIndex % COLOR_PALETTES.length];
                const isEditingThis = editingGroupId === group.id;

                return (
                  <div
                    key={group.id}
                    className={`bg-white rounded-2xl border border-slate-200/90 shadow-sm hover:shadow-md transition-all flex flex-col overflow-hidden relative ${
                      movingStudent && movingStudent.fromGroupId !== group.id
                        ? 'ring-2 ring-blue-400 ring-offset-2'
                        : ''
                    }`}
                  >
                    {/* Group Header Card */}
                    <div className={`${palette.header} px-4 py-3 text-white flex items-center justify-between shrink-0`}>
                      <div className="flex items-center gap-2 flex-1 min-w-0 mr-2">
                        {isEditingThis ? (
                          <div className="flex items-center gap-1 w-full">
                            <input
                              type="text"
                              value={editingGroupName}
                              onChange={(e) => setEditingGroupName(e.target.value)}
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') handleSaveGroupName(group.id);
                                if (e.key === 'Escape') setEditingGroupId(null);
                              }}
                              autoFocus
                              className="px-2 py-0.5 rounded text-xs font-black text-slate-900 bg-white w-full outline-none"
                            />
                            <button
                              onClick={() => handleSaveGroupName(group.id)}
                              className="p-1 bg-white/20 hover:bg-white/30 rounded text-white"
                            >
                              <Check className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        ) : (
                          <div
                            onClick={() => {
                              setEditingGroupId(group.id);
                              setEditingGroupName(group.name);
                            }}
                            className="flex items-center gap-1.5 cursor-pointer group/title flex-1 min-w-0"
                            title="Bấm để chỉnh sửa tên nhóm"
                          >
                            <h4 className="font-black text-sm sm:text-base tracking-wide truncate">
                              {group.name}
                            </h4>
                            <Edit2 className="w-3 h-3 opacity-0 group-hover/title:opacity-100 transition-opacity shrink-0" />
                          </div>
                        )}
                      </div>

                      <div className="flex items-center gap-1.5 shrink-0">
                        <span className="px-2 py-0.5 rounded-full text-[11px] font-extrabold bg-black/20 text-white backdrop-blur-xs">
                          {group.members.length} HS
                        </span>

                        {/* Move student target button */}
                        {movingStudent && movingStudent.fromGroupId !== group.id && (
                          <button
                            type="button"
                            onClick={() => handleMoveStudentTo(group.id)}
                            className="px-2 py-0.5 bg-white text-slate-900 rounded-md text-[10px] font-black hover:bg-amber-100 transition-colors shadow-xs animate-pulse cursor-pointer"
                          >
                            Chuyển vào đây
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Members List */}
                    <div className="p-3 divide-y divide-slate-100 flex-1 min-h-[140px] max-h-[360px] overflow-y-auto">
                      {group.members.length === 0 ? (
                        <div className="h-full flex items-center justify-center text-slate-400 text-xs italic py-6">
                          Chưa có thành viên
                        </div>
                      ) : (
                        group.members.map((member, mIdx) => {
                          const isLeader = group.leaderId === member.id;
                          const isBeingMoved = movingStudent?.student.id === member.id;

                          return (
                            <div
                              key={member.id}
                              className={`py-2 px-2 rounded-xl flex items-center justify-between gap-2 group transition-all ${
                                isBeingMoved
                                  ? 'bg-amber-100/80 ring-1 ring-amber-400'
                                  : isLeader
                                  ? 'bg-amber-50/80'
                                  : 'hover:bg-slate-50'
                              }`}
                            >
                              <div className="flex items-center gap-2 flex-1 min-w-0">
                                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-extrabold shrink-0 ${
                                  isLeader
                                    ? 'bg-amber-500 text-slate-950 font-black'
                                    : 'bg-slate-100 text-slate-500 group-hover:bg-blue-100 group-hover:text-blue-700'
                                }`}>
                                  {mIdx + 1}
                                </span>

                                <span className={`text-xs truncate ${
                                  isLeader ? 'font-black text-slate-900' : 'font-medium text-slate-700'
                                }`}>
                                  {member.name}
                                </span>

                                {isLeader && (
                                  <span className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-md text-[9px] font-black bg-amber-400 text-slate-950 shadow-2xs shrink-0">
                                    <Star className="w-2.5 h-2.5 fill-slate-950" />
                                    Trưởng
                                  </span>
                                )}
                              </div>

                              {/* Member Quick Actions */}
                              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 focus-within:opacity-100 transition-opacity">
                                {/* Toggle Leader button */}
                                <button
                                  type="button"
                                  onClick={() => handleToggleLeader(group.id, member.id)}
                                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                                    isLeader
                                      ? 'text-amber-600 bg-amber-100 hover:bg-amber-200'
                                      : 'text-slate-400 hover:text-amber-500 hover:bg-amber-50'
                                  }`}
                                  title={isLeader ? 'Hủy nhóm trưởng' : 'Chọn làm nhóm trưởng'}
                                >
                                  <Star className={`w-3.5 h-3.5 ${isLeader ? 'fill-amber-500 text-amber-500' : ''}`} />
                                </button>

                                {/* Move student to another group button */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    if (movingStudent?.student.id === member.id) {
                                      setMovingStudent(null);
                                    } else {
                                      setMovingStudent({ student: member, fromGroupId: group.id });
                                    }
                                  }}
                                  className={`p-1 rounded-md transition-colors cursor-pointer ${
                                    isBeingMoved
                                      ? 'bg-blue-600 text-white'
                                      : 'text-slate-400 hover:text-blue-600 hover:bg-blue-50'
                                  }`}
                                  title="Chuyển học sinh này sang nhóm khác"
                                >
                                  <ArrowRightLeft className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>

                    {/* Group Card Footer Stats */}
                    <div className="px-3 py-2 bg-slate-50 border-t border-slate-100 flex items-center justify-between text-[11px] text-slate-500 shrink-0">
                      <span>Tỷ lệ: {poolStudents.length > 0 ? Math.round((group.members.length / poolStudents.length) * 100) : 0}%</span>
                      {group.leaderId && (
                        <span className="text-amber-600 font-bold flex items-center gap-1">
                          <Star className="w-3 h-3 fill-amber-500" />
                          {group.members.find(m => m.id === group.leaderId)?.name}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Modal Bottom Footer */}
        <div className="px-4 sm:px-6 py-3 bg-white border-t border-slate-200 flex flex-wrap items-center justify-between gap-3 shrink-0">
          <div className="flex items-center gap-3 text-xs text-slate-500">
            <span>
              Tổng số học sinh: <strong className="text-slate-900">{poolStudents.length}</strong>
            </span>
            <span>•</span>
            <span>
              Số nhóm: <strong className="text-blue-600">{groups.length} nhóm</strong>
            </span>
            {movingStudent && (
              <span className="px-2 py-0.5 rounded-lg bg-amber-100 text-amber-800 font-bold animate-pulse flex items-center gap-1">
                Đang chọn nhóm mới cho {movingStudent.student.name}...
                <button
                  type="button"
                  onClick={() => setMovingStudent(null)}
                  className="underline text-[10px] ml-1"
                >
                  Hủy
                </button>
              </span>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={performDivision}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
            >
              <Shuffle className="w-3.5 h-3.5" />
              <span>Xáo trộn lại</span>
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              Hoàn tất
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
