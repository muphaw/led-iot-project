import { create } from 'zustand';

export interface Schedule {
  id: string;
  time: string;
  color: string;
  repeat: boolean;
}

interface LEDState {
  isOn: boolean;
  isConnected: boolean;
  color: string;
  soundMode: boolean;
  motionMode: boolean;
  motionDetected: boolean;
  schedules: Schedule[];
  activeTab: 'Dashboard' | 'LED Control' | 'Automation' | 'Settings';
  togglePower: () => void;
  setColor: (color: string) => void;
  toggleSoundMode: () => void;
  toggleMotionMode: () => void;
  setMotionDetected: (detected: boolean) => void;
  addSchedule: (schedule: Omit<Schedule, 'id'>) => void;
  deleteSchedule: (id: string) => void;
  setActiveTab: (tab: 'Dashboard' | 'LED Control' | 'Automation' | 'Settings') => void;
}

// Mock ESP32 API Log Helper
const logToESP32 = (endpoint: string, payload: object) => {
  console.log(`%c[ESP32 API POST] /api/${endpoint}`, 'color: #00ffcc; font-weight: bold;', payload);
};

export const useLEDStore = create<LEDState>((set) => ({
  isOn: true,
  isConnected: true,
  color: '#3b82f6', // Default Blue
  soundMode: false,
  motionMode: false,
  motionDetected: false,
  schedules: [
    { id: '1', time: '07:00', color: '#ef4444', repeat: true },
    { id: '2', time: '22:00', color: '#a855f7', repeat: false },
  ],
  activeTab: 'Dashboard',

  togglePower: () => set((state) => {
    const nextState = !state.isOn;
    logToESP32('power', { status: nextState ? 'ON' : 'OFF' });
    return { isOn: nextState };
  }),

  setColor: (color) => set(() => {
    logToESP32('color', { hex: color });
    return { color };
  }),

  toggleSoundMode: () => set((state) => {
    const nextState = !state.soundMode;
    logToESP32('sound-mode', { enabled: nextState });
    return { soundMode: nextState };
  }),

  toggleMotionMode: () => set((state) => {
    const nextState = !state.motionMode;
    logToESP32('motion-mode', { enabled: nextState });
    return { motionMode: nextState, motionDetected: false };
  }),

  setMotionDetected: (detected) => set(() => ({ motionDetected: detected })),

  addSchedule: (schedule) => set((state) => {
    const newSchedule = { ...schedule, id: Math.random().toString(36).substr(2, 9) };
    logToESP32('schedule/add', newSchedule);
    return { schedules: [...state.schedules, newSchedule] };
  }),

  deleteSchedule: (id) => set((state) => {
    logToESP32('schedule/delete', { id });
    return { schedules: state.schedules.filter((s) => s.id !== id) };
  }),

  setActiveTab: (tab) => set({ activeTab: tab }),
}));