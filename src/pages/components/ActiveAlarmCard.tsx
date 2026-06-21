import React from "react";
import type { SavedAlarm } from "@/types/data.t";

interface ActiveAlarmCardProps {
  savedAlarm: SavedAlarm;
  setAlarmDialogOpen: (open: boolean) => void;
  offAlarm: () => Promise<void>;
}

const ActiveAlarmCard: React.FC<ActiveAlarmCardProps> = ({
  savedAlarm,
  setAlarmDialogOpen,
  offAlarm,
}) => {
  return (
    <div className="p-6 rounded-3xl bg-black/30 border border-white/10 shadow-xl space-y-6 transition-all">
      <div className="flex items-start justify-between">
        <div className="flex items-center gap-2">
          <div
            className="w-2.5 h-2.5 rounded-full animate-pulse"
            style={{ backgroundColor: savedAlarm.color }}
          />
          <span className="text-xs text-gray-400 uppercase tracking-wider">
            Alarm
          </span>
        </div>
        <div className="text-right">
          <div className="text-5xl font-extrabold text-white leading-none">
            {savedAlarm.hour}:{savedAlarm.minute}
          </div>
          <div className="text-xs text-gray-400 mt-1 pr-2">
            {savedAlarm.period}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-center py-5">
        <div className="relative">
          <div
            className="absolute w-24 h-24 rounded-full blur-2xl opacity-40"
            style={{ backgroundColor: savedAlarm.color }}
          />
          <div
            className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
            style={{ backgroundColor: savedAlarm.color }}
          >
            <div className="w-6 h-6 rounded-full bg-black/40" />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between text-xs text-gray-400">
        <span>Animation: {savedAlarm.animation}</span>
      </div>

      <div className="flex gap-2 pt-2">
        <button
          onClick={() => setAlarmDialogOpen(true)}
          className="flex-1 py-3 rounded-2xl bg-white/10 text-white font-medium hover:bg-white/15 transition"
        >
          Edit
        </button>
        <button
          onClick={offAlarm}
          className="flex-1 py-3 rounded-2xl bg-red-500/10 text-red-400 font-medium hover:bg-red-500/20 transition"
        >
          Remove
        </button>
      </div>
    </div>
  );
};

export default ActiveAlarmCard;
