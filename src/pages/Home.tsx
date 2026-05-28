// Manual.tsx
import { useState, useEffect } from "react";

const defaultColors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FFFFFF"];

const Manual = () => {
  const [color, setColor] = useState("#FF0000");
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(100);

  // Timer / Schedule
  const [enableTimer, setEnableTimer] = useState(false);
  const [scheduleTime, setScheduleTime] = useState(""); // HH:MM
  const [scheduledColor, setScheduledColor] = useState("#FF0000");
  const [currentTime, setCurrentTime] = useState("");

  // Clap / Sound control
  const [clapEnabled, setClapEnabled] = useState(false);

  // Sound Mode
  const [soundMode, setSoundMode] = useState(false);

  // Check schedule
  useEffect(() => {
    if (!enableTimer || soundMode) return;
    const interval = setInterval(() => {
      const now = new Date();
      const formatted =
        now.getHours().toString().padStart(2, "0") +
        ":" +
        now.getMinutes().toString().padStart(2, "0");
      setCurrentTime(formatted);

      if (scheduleTime && formatted === scheduleTime) {
        setColor(scheduledColor);
        setIsOn(true);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enableTimer, scheduleTime, scheduledColor, soundMode]);
  const toggleLED = async () => {
  const newState = !isOn;
  setIsOn(newState);

  const url = newState ? "/on" : "/off";

  await fetch(`http://10.87.162.252${url}`);
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-900 text-white p-6">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md space-y-6">

        <h1 className="text-2xl font-bold text-center">Manual / Smart Control</h1>

        {/* Bulb Preview */}
        <div className="flex justify-center my-4">
          <div
            className="w-24 h-36 rounded-full relative"
            style={{
              background: isOn ? color : "#222",
              filter: `brightness(${brightness}%)`,
              boxShadow: isOn ? `0 0 30px 10px ${color}` : "none",
              transition: "all 0.3s ease",
            }}
          >
            <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-10 h-4 bg-gray-600 rounded-t" />
          </div>
        </div>

        {/* Color Picker */}
        <div className="flex flex-col items-center gap-3">
          <input
            type="color"
            value={color}
            onChange={(e) => setColor(e.target.value)}
            className="w-24 h-14 cursor-pointer"
          />
          <p>{color}</p>
        </div>

        {/* Default Colors */}
        <div className="flex justify-between">
          {defaultColors.map((c) => (
            <button
              key={c}
              onClick={toggleLED}
              className="w-10 h-10 rounded-full border-2 border-white"
              style={{ backgroundColor: c }}
            />
          ))}
        </div>

        {/* ON / OFF */}
        <div className="flex justify-center gap-4">
          <button
            onClick={() => setIsOn(!isOn)}
            className={`px-6 py-2 rounded-xl font-semibold ${
              isOn ? "bg-green-500" : "bg-red-500"
            }`}
          >
            {isOn ? "ON" : "OFF"}
          </button>
        </div>

        {/* Brightness */}
        <div>
          <label>Brightness: {brightness}%</label>
          <input
            type="range"
            min={0}
            max={100}
            value={brightness}
            onChange={(e) => setBrightness(Number(e.target.value))}
            className="w-full"
          />
        </div>

        {/* Sound Mode */}
        <div className="mt-4 border-t border-gray-600 pt-4 space-y-4">
          <button
            onClick={() => setSoundMode(!soundMode)}
            className={`px-4 py-2 rounded-xl font-semibold ${
              soundMode ? "bg-green-500" : "bg-gray-600"
            }`}
          >
            {soundMode ? "Sound Mode Enabled" : "Enable Sound Mode"}
          </button>
          {soundMode && (
            <p className="text-sm text-gray-400 mt-1">
              Light will toggle on each clap. Schedule & Clap buttons are disabled.
            </p>
          )}
        </div>

        {/* Timer / Schedule */}
        <div className="mt-4 border-t border-gray-600 pt-4 space-y-4">
          <button
            onClick={() => setEnableTimer(!enableTimer)}
            className={`px-4 py-2 rounded-xl font-semibold ${
              enableTimer && !soundMode ? "bg-green-500" : "bg-gray-600"
            }`}
            disabled={soundMode}
          >
            {enableTimer ? "Schedule Enabled" : "Enable Schedule / Timer"}
          </button>

          {enableTimer && !soundMode && (
            <div className="mt-2 space-y-2">
              <label className="text-sm text-gray-300">Set Time (HH:MM)</label>
              <input
                type="time"
                value={scheduleTime}
                onChange={(e) => setScheduleTime(e.target.value)}
                className="w-full p-2 rounded-lg bg-gray-700 border border-gray-600"
              />

              <label className="text-sm text-gray-300">Set Color for Scheduled Time</label>
              <input
                type="color"
                value={scheduledColor}
                onChange={(e) => setScheduledColor(e.target.value)}
                className="w-10 h-10 cursor-pointer"
              />

              <p className="text-sm text-gray-400">Current Time: {currentTime}</p>
            </div>
          )}
        </div>

        {/* Clap Button */}
        <div className="mt-4 border-t border-gray-600 pt-4 space-y-2">
          <button
            onClick={() => setClapEnabled(!clapEnabled)}
            className={`px-4 py-2 rounded-xl font-semibold ${
              clapEnabled && !soundMode ? "bg-green-500" : "bg-gray-600"
            }`}
            disabled={soundMode}
          >
            {clapEnabled ? "Clap Enabled" : "Enable Clap / Sound"}
          </button>
          {!soundMode && clapEnabled && (
            <p className="text-sm text-gray-400 mt-1">
              Light will toggle on each clap.
            </p>
          )}
        </div>

      </div>
    </div>
  );
};

export default Manual;