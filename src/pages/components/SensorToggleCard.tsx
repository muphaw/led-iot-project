import React from "react";
import type { LucideIcon } from "lucide-react";

interface SensorToggleCardProps {
  icon: LucideIcon;
  iconColorClass: string;
  title: string;
  enabled: boolean;
  onToggle: () => void;
  disabled: boolean;
  activeText: string;
  inactiveText: string;
  themeColorClass?: "green" | "blue";
}

const SensorToggleCard: React.FC<SensorToggleCardProps> = ({
  icon: Icon,
  iconColorClass,
  title,
  enabled,
  onToggle,
  disabled,
  activeText,
  inactiveText,
  themeColorClass = "green",
}) => {
  const activeBg = themeColorClass === "green" ? "bg-green-500" : "bg-blue-500";
  const activeTranslate = enabled ? "translate-x-5" : "translate-x-0";

  return (
    <div
      className={`bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-2 transition-opacity ${
        disabled ? "opacity-40 pointer-events-none" : ""
      }`}
    >
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
          <Icon className={`w-4 h-4 ${iconColorClass}`} /> {title}
        </div>

        <button
          onClick={onToggle}
          disabled={disabled}
          className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${
            enabled ? activeBg : "bg-white/10"
          }`}
        >
          <div
            className={`bg-white w-4 h-4 rounded-full shadow transform duration-200 ${activeTranslate}`}
          />
        </button>
      </div>

      <div className="h-4 flex items-center">
        <p
          className={`text-[10px] leading-relaxed ${
            enabled && themeColorClass === "green"
              ? "text-green-300"
              : enabled && themeColorClass === "blue"
                ? "text-blue-400"
                : "text-gray-400"
          }`}
        >
          {enabled ? activeText : inactiveText}
        </p>
      </div>
    </div>
  );
};

export default SensorToggleCard;
