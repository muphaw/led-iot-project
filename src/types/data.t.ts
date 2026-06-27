export type AlarmAnimation = "fade" | "blink" | "pulse" | "rainbow" | "wave";

export type SavedAlarm = {
  hour: string;
  minute: string;
  period: string;
  color: string;
  animation: AlarmAnimation;
};

export type TimerState = "idle" | "running" | "done";

export type SaveTimer = {
  total: number;
  color: string;
  animation: AlarmAnimation;
};

export type AnimationOption = {
  value: AlarmAnimation;
  label: string;
  icon: string;
  desc: string;
};
