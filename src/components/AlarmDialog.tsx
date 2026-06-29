import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from "@/components/ui/dialog";

import type { AlarmAnimation, AnimationOption } from "@/types/data.t";
import Picker from "react-mobile-picker";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  isLedOn: boolean;

  hour: string;
  minute: string;
  period: string;

  scheduledColor: string;
  alarmAnimation: AlarmAnimation;
  alarmLedAction: boolean;

  setHour: (v: string) => void;
  setMinute: (v: string) => void;
  setPeriod: (v: string) => void;

  setScheduledColor: (v: string) => void;
  setAlarmAnimation: (v: AlarmAnimation) => void;
  setAlarmLedAction: (v: boolean) => void;

  saveAlarm: () => void;

  hours: string[];
  minutes: string[];

  defaultColors: string[];
  animationOptions: AnimationOption[];
};

export default function AlarmDialog({
  open,
  onOpenChange,

  isLedOn,

  hour,
  minute,
  period,

  scheduledColor,
  alarmAnimation,
  alarmLedAction,

  setHour,
  setMinute,
  setPeriod,

  setScheduledColor,
  setAlarmAnimation,
  setAlarmLedAction,

  saveAlarm,

  hours,
  minutes,

  animationOptions,
}: Props) {
  const isMobile = typeof window !== "undefined" && window.innerWidth < 640;

  const showColorAndAnimation = !(isLedOn && !alarmLedAction);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent
        className="
          w-[95vw]
          max-w-md
          max-h-[90dvh]
          p-4 sm:p-6
          bg-[#0b0f19]
          text-white
          border-white/10
          overflow-y-auto
          rounded-2xl
        "
      >
        <DialogHeader>
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Set Alarm
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-gray-400">
            Configure time, color and animation
          </DialogDescription>
        </DialogHeader>

        <div className="relative rounded-2xl bg-black/30 border border-white/10 overflow-hidden ">
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex">
            <div className="w-1/3 flex justify-end pr-4">
              <span className="text-[10px] sm:text-sm text-white/60">hr</span>
            </div>

            <div className="w-1/3 flex justify-end pr-4">
              <span className="text-[10px] sm:text-sm text-white/60">min</span>
            </div>
          </div>

          <Picker
            value={{ hour, minute, period }}
            onChange={(value) => {
              setHour(String(value.hour));
              setMinute(String(value.minute));
              setPeriod(String(value.period));
            }}
            height={isMobile ? 160 : 200}
            itemHeight={isMobile ? 40 : 52}
          >
            <Picker.Column name="hour">
              {hours.map((h) => (
                <Picker.Item key={h} value={h}>
                  {({ selected }) => (
                    <div
                      className={`transition-all ${
                        selected
                          ? "text-white text-xl sm:text-2xl font-semibold"
                          : "text-gray-600 text-base sm:text-lg"
                      }`}
                    >
                      {h}
                    </div>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>

            <Picker.Column name="minute">
              {minutes.map((m) => (
                <Picker.Item key={m} value={m}>
                  {({ selected }) => (
                    <div
                      className={`transition-all ${
                        selected
                          ? "text-white text-xl sm:text-2xl font-semibold"
                          : "text-gray-600 text-base sm:text-lg"
                      }`}
                    >
                      {m}
                    </div>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>

            <Picker.Column name="period">
              {["AM", "PM"].map((p) => (
                <Picker.Item key={p} value={p}>
                  {({ selected }) => (
                    <div
                      className={`transition-all ${
                        selected
                          ? "text-emerald-400 text-md sm:text-lg font-semibold"
                          : "text-gray-600 text-sm sm:text-md"
                      }`}
                    >
                      {p}
                    </div>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>
          </Picker>
        </div>

        {isLedOn && (
          <>
            <div className="flex items-center gap-4">
              <span>To make led:</span>

              <button
                onClick={() => setAlarmLedAction(!alarmLedAction)}
                className={`px-4 py-2 rounded-xl ${
                  alarmLedAction ? "bg-green-500" : "bg-white/10"
                }`}
              >
                {alarmLedAction ? "ON" : "OFF"}
              </button>
            </div>
          </>
        )}
        {showColorAndAnimation && (
          <>
            <div className="mt-2 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[10px] sm:text-xs uppercase text-gray-400">
                  Alarm Color
                </span>

                <span className="text-[10px] sm:text-xs font-mono">
                  {scheduledColor.toUpperCase()}
                </span>
              </div>

              <label className="relative block w-full h-9 sm:h-10 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
                <input
                  type="color"
                  value={scheduledColor}
                  onChange={(e) => setScheduledColor(e.target.value)}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                />

                <div className="absolute inset-0 flex items-center justify-center gap-2">
                  <div
                    className="w-6 h-5 rounded-full border border-white/30"
                    style={{ backgroundColor: scheduledColor }}
                  />
                  <span className="text-xs sm:text-sm text-white">
                    Pick Color
                  </span>
                </div>
              </label>

              <div className="flex gap-2 flex-wrap justify-center">
                {["#ff0000", "#ffff00", "#00ff00", "#0000ff", "#ffffff"].map(
                  (c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setScheduledColor(c)}
                      className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all ${
                        scheduledColor === c
                          ? "ring-2 ring-white scale-110"
                          : "border-white/10"
                      }`}
                      style={{ backgroundColor: c }}
                    />
                  ),
                )}
              </div>
            </div>

            {/* ANIMATION */}
            <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
              {animationOptions.map((a) => (
                <button
                  key={a.value}
                  type="button"
                  onClick={() => setAlarmAnimation(a.value)}
                  className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                    alarmAnimation === a.value
                      ? "border-emerald-500 bg-emerald-500/10"
                      : "border-white/10"
                  }`}
                >
                  <div className="text-xs sm:text-sm font-medium">
                    {a.label}
                  </div>

                  <div className="text-[8px] sm:text-xs text-gray-400 mt-1">
                    {a.desc}
                  </div>
                </button>
              ))}
            </div>
          </>
        )}
        <DialogFooter className="mt-2 flex flex-col-reverse sm:flex-row gap-2">
          <DialogClose asChild>
            <button className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white/10 text-sm">
              Cancel
            </button>
          </DialogClose>

          <button
            onClick={async () => {
              await saveAlarm();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-sm"
          >
            Save Alarm
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
