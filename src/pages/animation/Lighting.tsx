import { memo, useMemo } from "react";
import { motion } from "framer-motion";

interface AdvancedLEDBulbProps {
  isOn: boolean;
  color: string;
  brightness: number;
}

function AdvancedLEDBulb({ isOn, color, brightness }: AdvancedLEDBulbProps) {
  const opacity = useMemo(
    () => (isOn ? Math.min(brightness / 100, 1) : 0),
    [isOn, brightness],
  );

  const filterStyle = useMemo(() => {
    if (!isOn) return "none";

    return `drop-shadow(0 0 ${brightness * 0.9}px ${color})`;
  }, [isOn, brightness, color]);

  const coreShadow = useMemo(() => {
    if (!isOn) return "none";

    return `0 0 ${brightness * 1.6}px ${color}`;
  }, [isOn, brightness, color]);

  return (
    <div className="flex justify-center py-8 bg-slate-950 rounded-2xl overflow-hidden w-full">
      <div
        className={`relative flex flex-col items-center justify-center transform-gpu ${
          isOn ? "animate-float" : ""
        }`}
        style={{ willChange: "transform" }}
      >
        <div
          className="absolute w-64 h-64 rounded-full blur-[48px] -z-10 pointer-events-none"
          style={{
            backgroundColor: color,
            opacity: opacity * 0.75,
          }}
        />

        <motion.div
          initial={false}
          animate={{
            opacity: isOn ? 1 : 0.65,
          }}
          transition={{
            duration: 0.2,
          }}
          style={{
            filter: filterStyle,
            willChange: "filter, opacity",
          }}
          className="relative w-24 h-28 rounded-t-[50px] rounded-b-[30px]
                     bg-white/[0.03]
                     border border-white/10
                     shadow-xl
                     flex flex-col
                     items-center
                     overflow-hidden"
        >
          <div
            className="absolute inset-0 rounded-t-[50px] rounded-b-[30px]"
            style={{
              backgroundColor: color,
              opacity,
            }}
          />

          <div className="absolute top-2 left-6 w-12 h-2 bg-white/20 rounded-full" />

          <div className="absolute top-4 left-4 w-3 h-14 bg-white/10 rounded-full" />
          <div className="relative flex-1 flex items-center justify-center w-full">
            <div
              className="w-2 h-14 rounded-full"
              style={{
                backgroundColor: isOn ? color : "#374151",
                boxShadow: coreShadow,
              }}
            />
          </div>
          <div className="absolute bottom-4 w-4/5 h-3 bg-white/5 border-t border-white/10" />

          <div className="w-full h-3 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900" />
        </motion.div>

        <div className="w-14 flex flex-col items-center -mt-px">
          <div className="w-full h-3 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-b border-zinc-800" />
          <div className="w-[92%] h-3 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-b border-zinc-800 -mt-px" />
          <div className="w-[84%] h-2.5 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-b border-zinc-900 -mt-px" />
          <div className="w-[55%] h-2 bg-slate-900 rounded-b-md" />
        </div>
      </div>
    </div>
  );
}

export default memo(AdvancedLEDBulb);
