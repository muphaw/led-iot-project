import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function CircularTimer({
  timerColor,
  progress,
  countdown,
  formatTime,
  timerState,
  timerPaused,
  pauseTimer,
  resumeTimer,
  cancelTimer,
}: any) {
  const size = 205; 
  const center = size / 2;
  const radius = 90; 

  const circumference = 2 * Math.PI * radius;

  const progressValue = useMotionValue(progress);

  const smoothProgress = useSpring(progressValue, {
    stiffness: 120,
    damping: 25,
  });

  const strokeOffset = useTransform(
    smoothProgress,
    (p: any) => circumference * (1 - p / 100),
  );

  useEffect(() => {
    progressValue.set(progress);
  }, [progress]);

  return (
    <>
      <div className="p-6 rounded-3xl bg-black/30 border border-white/10 shadow-xl space-y-6 transition-all">
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2">
            <div
              className="w-2.5 h-2.5 rounded-full animate-pulse"
              style={{ backgroundColor: timerColor }}
            />
            <span className="text-xs text-gray-400 uppercase tracking-wider">
              Timer
            </span>
          </div>
        </div>
        <div className="flex items-center justify-center">
          <div className="relative" style={{ width: size, height: size }}>
            <div
              className="absolute inset-0 rounded-full blur-3xl opacity-30"
              style={{ backgroundColor: timerColor }}
            />

            <svg
              width={size}
              height={size}
              className="-rotate-90 relative z-10"
            >
              <circle
                cx={center}
                cy={center}
                r={radius}
                stroke="#1f2937"
                strokeWidth="10"
                fill="none"
              />

              <motion.circle
                cx={center}
                cy={center}
                r={radius}
                stroke={timerColor}
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{
                  filter: "drop-shadow(0 0 10px rgba(255,255,255,0.2))",
                }}
              />
            </svg>

            <div className="absolute inset-0 flex flex-col items-center justify-center text-center z-20">
              <div className="text-3xl font-bold text-white tracking-tight">
                {formatTime(countdown ?? 0)}
              </div>
              <div className="text-xs text-gray-400 mt-1">remaining</div>
            </div>
          </div>
        </div>

        <div className="flex items-center justify-between text-xs text-gray-400">
          <span>Animation: none</span>
          <span>{timerPaused ? "Paused" : "Running"}</span>
        </div>

        <div className="flex gap-2 ">
          {timerState === "running" && !timerPaused ? (
            <button
              onClick={pauseTimer}
              className="flex-1 py-3 rounded-2xl bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20 transition"
            >
              Pause
            </button>
          ) : (
            <button
              onClick={resumeTimer}
              className="flex-1 py-3 rounded-2xl bg-green-500/10 text-green-400 hover:bg-green-500/20 transition"
            >
              Resume
            </button>
          )}

          <button
            onClick={cancelTimer}
            className="flex-1 py-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500/20 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </>
  );
}
