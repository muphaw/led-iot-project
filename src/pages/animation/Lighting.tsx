import { motion } from "framer-motion";

interface AdvancedLEDBulbProps {
  isOn: boolean;
  color: string;
  brightness: number;
}

export default function AdvancedLEDBulb({
  isOn,
  color,
  brightness,
}: AdvancedLEDBulbProps) {
  const glowStrength = isOn ? brightness : 0;

  const filterStyle = isOn
    ? `
      drop-shadow(0 0 ${glowStrength * 0.4}px ${color})
      drop-shadow(0 0 ${glowStrength * 0.8}px ${color})
      drop-shadow(0 0 ${glowStrength * 1.5}px ${color})
    `
    : "none";

  return (
    <div className="flex justify-center py-8 bg-slate-950 rounded-2xl overflow-hidden w-full">
      <motion.div
        className="relative flex flex-col items-center justify-center"
        animate={{
          y: isOn ? [0, -2, 0] : 0,
        }}
        transition={{
          duration: 4,
          repeat: Infinity,
          ease: "easeInOut",
        }}
      >
        {/* Static ambient glow */}
        <div
          className="absolute w-72 h-72 rounded-full blur-[120px] -z-10"
          style={{
            backgroundColor: color,
            opacity: isOn ? Math.min(brightness / 100, 1) * 0.8 : 0,
          }}
        />

        {/* Bulb */}
        <motion.div
          initial={false}
          animate={{
            opacity: isOn ? 1 : 0.6,
          }}
          transition={{ duration: 0.2 }}
          style={{
            filter: filterStyle,
          }}
          className="relative w-24 h-28 bg-white/[0.03] backdrop-blur-md rounded-t-[50px] rounded-b-[30px] border border-white/10 shadow-2xl flex flex-col items-center overflow-hidden"
        >
          {/* Internal light */}
          <div
            className="absolute inset-0 rounded-t-[50px] rounded-b-[30px]"
            style={{
              backgroundColor: color,
              opacity: isOn ? Math.min(brightness / 100, 1) * 1 : 0,
            }}
          />

          {/* Glass reflections */}
          <div className="absolute top-2 left-6 w-12 h-2 bg-white/20 rounded-full blur-[1px]" />
          <div className="absolute top-4 left-4 w-3 h-13 bg-white/10 rounded-full blur-[2px]" />

          {/* LED core */}
          <div className="relative flex-1 w-full flex items-center justify-center">
            <div
              className="w-2 h-14 rounded-full"
              style={{
                backgroundColor: isOn ? color : "#374151",
                boxShadow: isOn
                  ? `
                    0 0 ${brightness * 0.4}px ${color},
                    0 0 ${brightness * 1.2}px ${color},
                    0 0 ${brightness * 2.9}px ${color}
                  `
                  : "none",
              }}
            />
          </div>

          {/* Diffuser */}
          <div className="absolute bottom-4 w-4/5 h-3 bg-white/5 border-t border-white/10" />

          {/* Collar */}
          <div className="w-full h-3 bg-gradient-to-r from-slate-800 via-slate-700 to-slate-900" />
        </motion.div>

        {/* Screw base */}
        <div className="w-14 flex flex-col items-center -mt-[1px]">
          <div className="w-full h-3 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-b border-zinc-800" />
          <div className="w-[92%] h-3 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-b border-zinc-800 -mt-[1px]" />
          <div className="w-[84%] h-2.5 bg-gradient-to-r from-zinc-600 via-zinc-400 to-zinc-700 border-b border-zinc-900 -mt-[1px]" />
          <div className="w-[55%] h-2 bg-slate-900 rounded-b-md" />
        </div>
      </motion.div>
    </div>
  );
}
