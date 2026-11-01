export interface Student {
  id: string;
  name: string;
  active: boolean; // whether included in the active wheel
  pickedCount: number; // how many times picked
  note?: string;
}

export interface ClassGroup {
  id: string;
  name: string;
  students: Student[];
  createdAt: number;
}

export interface SpinHistoryItem {
  id: string;
  studentId: string;
  studentName: string;
  className: string;
  timestamp: number;
}

export interface WheelConfig {
  spinDuration: number; // seconds (default 6)
  soundEnabled: boolean;
  volume: number; // 0 to 1
  removeAfterPick: boolean; // auto disable student after winning
  wheelTheme: 'rainbow' | 'ocean' | 'sunset' | 'emerald' | 'galaxy';
  confettiEnabled: boolean;
}
