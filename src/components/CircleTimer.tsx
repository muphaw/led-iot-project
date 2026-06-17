import { motion, useMotionValue, useSpring, useTransform } from "framer-motion";
import { useEffect } from "react";

export default function CircularTimer({
  showActive,
  showDone,
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
  const radius = 70;
  const circumference = 2 * Math.PI * radius;

  // raw progress motion value (0 → 100)
  const progressValue = useMotionValue(progress);

  // smooth spring animation
  const smoothProgress = useSpring(progressValue, {
    stiffness: 120,
    damping: 25,
  });

  // convert progress → stroke offset
  const strokeOffset = useTransform(
    smoothProgress,
    (p : any) => circumference * (1 - p / 100)
  );

  useEffect(() => {
    progressValue.set(progress);
  }, [progress]);

  return (
    <>
      {(showActive || showDone) && (
        <div className="flex flex-col items-center">
          <div className="relative w-40 h-40">

            <svg className="w-40 h-40 -rotate-90">
              {/* background circle */}
              <circle
                cx="80"
                cy="80"
                r={radius}
                stroke="#1f2937"
                strokeWidth="10"
                fill="none"
              />

              {/* animated circle */}
              <motion.circle
                cx="80"
                cy="80"
                r={radius}
                stroke={timerColor}
                strokeWidth="10"
                fill="none"
                strokeDasharray={circumference}
                strokeDashoffset={strokeOffset}
                strokeLinecap="round"
                style={{
                  filter: "drop-shadow(0 0 6px rgba(255,255,255,0.15))",
                }}
              />
            </svg>

            {/* CENTER TEXT */}
            <div className="absolute inset-0 flex items-center justify-center text-white text-xl font-semibold">
              {formatTime(countdown ?? 0)}
            </div>
          </div>

          {/* CONTROLS */}
          <div className="mt-4 flex gap-3">
            {timerState === "running" &&
              (!timerPaused ? (
                <button
                  onClick={pauseTimer}
                  className="px-4 py-2 bg-yellow-500/20 text-yellow-400 rounded-xl"
                >
                  Pause
                </button>
              ) : (
                <button
                  onClick={resumeTimer}
                  className="px-4 py-2 bg-green-500/20 text-green-400 rounded-xl"
                >
                  Resume
                </button>
              ))}

            <button
              onClick={cancelTimer}
              className="px-4 py-2 bg-red-500/20 text-red-400 rounded-xl"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </>
  );
}