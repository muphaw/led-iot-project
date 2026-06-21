import React from "react";
import { motion } from "framer-motion";
import { Pipette } from "lucide-react";

interface ColorPickerPanelProps {
  color: string;
  setColor: (color: string) => void;
  defaultColors: string[];
}

const ColorPickerPanel: React.FC<ColorPickerPanelProps> = ({
  color,
  setColor,
  defaultColors,
}) => {
  return (
    <div className="w-1/4 flex items-center justify-center">
      <div className="flex flex-col gap-3">
        {defaultColors.map((c) => (
          <motion.button
            key={c}
            whileHover={{ scale: 1.1 }}
            whileTap={{ scale: 0.9 }}
            onClick={() => setColor(c)}
            className={`w-10 h-10 rounded-full transition-all ${
              color.toLowerCase() === c.toLowerCase()
                ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0f19]"
                : "border border-white/20"
            }`}
            style={{
              backgroundColor: c,
              boxShadow:
                color.toLowerCase() === c.toLowerCase()
                  ? `0 0 15px ${c}`
                  : "none",
            }}
          />
        ))}
        <div className="relative group w-full aspect-square rounded-full border border-white/20 bg-gradient-to-tr from-rose-500 via-green-500 to-blue-500 hover:scale-105 transition-transform flex items-center justify-center overflow-hidden cursor-pointer shadow-lg">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="absolute inset-0 w-[200%] h-[200%] translate-x-[-25%] translate-y-[-25%] cursor-pointer opacity-0 z-20"
          />
          <div className="w-[85%] h-[85%] rounded-full bg-neutral-900/90 backdrop-blur-sm flex items-center justify-center z-10 pointer-events-none group-hover:bg-neutral-900/50 transition-colors">
            <Pipette
              className="w-4 h-4 transition-transform group-hover:rotate-12 duration-300"
              style={{ color: color }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default ColorPickerPanel;
