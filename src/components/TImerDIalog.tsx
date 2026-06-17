import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";

import Picker from "react-mobile-picker";
import type { AlarmAnimation } from "@/types/data.t";

type Props = {
  open: boolean;
  onOpenChange: (v: boolean) => void;

  timerHour: string;
  timerMinute: string;
  timerSecond: string;

  timerColor: string;
  timerAnimation: AlarmAnimation;

  setTimerHour: (v: string) => void;
  setTimerMinute: (v: string) => void;
  setTimerSecond: (v: string) => void;

  setTimerColor: (v: string) => void;
  setTimerAnimation: (v: AlarmAnimation) => void;

  onStart: () => void;

  hours: string[];
  minutes: string[];
  seconds: string[];

  animationOptions: any[];
};

export default function TimerDialog({
  open,
  onOpenChange,

  timerHour,
  timerMinute,
  timerSecond,

  timerColor,
  timerAnimation,

  setTimerHour,
  setTimerMinute,
  setTimerSecond,

  setTimerColor,
  setTimerAnimation,

  onStart,

  hours,
  minutes,
  seconds,

  animationOptions,
}: Props) {
  const isMobile =
    typeof window !== "undefined" && window.innerWidth < 640;

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
        {/* HEADER */}
        <DialogHeader className="">
          <DialogTitle className="text-lg sm:text-xl font-semibold">
            Set Timer
          </DialogTitle>

          <DialogDescription className="text-xs sm:text-sm text-gray-400">
            Configure countdown, color and animation
          </DialogDescription>
        </DialogHeader>

        {/* ================= PICKER ================= */}
        <div className=" relative rounded-2xl bg-black/30 border border-white/10 overflow-hidden">
          {/* Labels */}
          <div className="pointer-events-none absolute inset-x-0 top-1/2 -translate-y-1/2 z-10 flex">
            <div className="w-1/3 flex justify-end pr-4">
              <span className="text-[10px] sm:text-sm text-white/60">
                hr
              </span>
            </div>

            <div className="w-1/3 flex justify-end pr-4">
              <span className="text-[10px] sm:text-sm text-white/60">
                min
              </span>
            </div>

            <div className="w-1/3 flex justify-end pr-4">
              <span className="text-[10px] sm:text-sm text-white/60">
                sec
              </span>
            </div>
          </div>

          <Picker
            value={{
              hour: timerHour,
              minute: timerMinute,
              second: timerSecond,
            }}
            onChange={(value) => {
              setTimerHour(String(value.hour));
              setTimerMinute(String(value.minute));
              setTimerSecond(String(value.second));
            }}
            height={isMobile ? 160 : 200}
            itemHeight={isMobile ? 40 : 52}
          >
            {/* HOURS */}
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

            {/* MINUTES */}
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

            {/* SECONDS */}
            <Picker.Column name="second">
              {seconds.map((s) => (
                <Picker.Item key={s} value={s}>
                  {({ selected }) => (
                    <div
                      className={`transition-all ${
                        selected
                          ? "text-white text-xl sm:text-2xl font-semibold"
                          : "text-gray-600 text-base sm:text-lg"
                      }`}
                    >
                      {s}
                    </div>
                  )}
                </Picker.Item>
              ))}
            </Picker.Column>
          </Picker>
        </div>

        {/* ================= COLOR ================= */}
        <div className="mt-2 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] sm:text-xs uppercase text-gray-400">
              Timer Color
            </span>

            <span className="text-[10px] sm:text-xs font-mono">
              {timerColor}
            </span>
          </div>

          {/* COLOR PICKER */}
          <label className="relative block w-full h-9 sm:h-10 rounded-xl border border-white/10 bg-black/20 overflow-hidden">
            <input
              type="color"
              value={timerColor}
              onChange={(e) => setTimerColor(e.target.value)}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />

            <div className="absolute inset-0 flex items-center justify-center gap-2">
              <div
                className="w-6 h-5 rounded-full border border-white/30"
                style={{ backgroundColor: timerColor }}
              />
              <span className="text-xs sm:text-sm text-white">
                Pick Color
              </span>
            </div>
          </label>

          {/* PRESETS */}
          <div className="flex gap-2 flex-wrap justify-center sm:justify-start">
            {[
              "#ff0000",
              "#ffff00",
              "#00ff00",
              "#0000ff",
              "#ffffff",
            ].map((c) => (
              <button
                key={c}
                type="button"
                onClick={() => setTimerColor(c)}
                className={`w-8 h-8 sm:w-9 sm:h-9 rounded-full border transition-all ${
                  timerColor === c
                    ? "ring-2 ring-white scale-110"
                    : "border-white/10"
                }`}
                style={{ backgroundColor: c }}
              />
            ))}
          </div>
        </div>

        {/* ================= ANIMATION ================= */}
        <div className="mt-2 grid grid-cols-2 md:grid-cols-3 gap-2">
          {animationOptions.map((a) => (
            <button
              key={a.value}
              type="button"
              onClick={() => setTimerAnimation(a.value)}
              className={`p-3 sm:p-4 rounded-xl border text-left transition-all ${
                timerAnimation === a.value
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

        {/* ================= FOOTER ================= */}
        <DialogFooter className="mt-2 flex flex-col-reverse sm:flex-row gap-2">
          <DialogClose asChild>
            <button
              className="w-full sm:w-auto px-3 py-2 rounded-xl bg-white/10 text-sm"
            >
              Cancel
            </button>
          </DialogClose>

          <button
            onClick={() => {
              onStart();
              onOpenChange(false);
            }}
            className="w-full sm:w-auto px-3 py-2 rounded-xl bg-emerald-500 text-black font-semibold text-sm"
          >
            Start Timer
          </button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}