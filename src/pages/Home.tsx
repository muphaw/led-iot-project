import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Power,
  Sun,
  Volume2,
  Clock,
  Activity,
  Wifi,
  Sliders,
  Pipette,
} from "lucide-react";
import { hexToRgb } from "@/util/hex";
import Picker from "react-mobile-picker";
import AlarmDialog from "@/components/AlarmDialog";
import type {AlarmAnimation, SavedAlarm, TimerState} from "@/types/data.t";
import TimerDialog from "@/components/TImerDIalog"; 
import {formatAlarm} from "@/lib/utils";
import CircularTimer from "@/components/CircleTimer";

const defaultColors = ["#FF0000", "#00FF00", "#0000FF", "#FFFF00", "#FFFFFF"];
const ESP32_BASE_URL = "http://192.168.1.2";

const Manual = () => {
  const [color, setColor] = useState("#FF0000");
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(50);

  // Timer / Schedule States
  const [enableTimer, setEnableTimer] = useState(false);
  const [scheduleTime, setScheduleTime] = useState("");
  const [scheduledColor, setScheduledColor] = useState("#FF0000");

  const [currentTime, setCurrentTime] = useState("");
  const [totalDuration, setTotalDuration] = useState<number>(0);

  const [period, setPeriod] = useState("AM");
  const [timerState, setTimerState] = useState<TimerState>("idle");

const [hour, setHour] = useState("01");
const [minute, setMinute] = useState("00");

const [countdown, setCountdown] = useState<number | null>(null);

const [timerColor, setTimerColor] = useState("#00FF00");

  const hours = Array.from({ length: 12 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const alarmHours = Array.from({ length: 12 }, (_, i) =>
    String(i + 1).padStart(2, "0"),
  );

  const minutes = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  const seconds = Array.from({ length: 60 }, (_, i) =>
    String(i).padStart(2, "0"),
  );

  //motion sensor
  const [motionEnabled, setMotionEnabled] = useState(false);

  // Sound / Clap Mode States
  const [clapEnabled, setClapEnabled] = useState(false);
  const [soundMode] = useState(false);

  const [timerHour, setTimerHour] = useState("00");
  const [timerMinute, setTimerMinute] = useState("00");
    const [timerSecond, setTimerSecond] = useState("00");
const [timerPaused, setTimerPaused] = useState(false);

  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
const [timerAnimation, setTimerAnimation] = useState<AlarmAnimation>("fade");

const showIdle = timerState === "idle";
const showActive = timerState === "running";
const showDone = timerState === "done";


  const formatTime = (seconds: number) => {
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = seconds % 60;

    return `${String(h).padStart(2, "0")}:${String(m).padStart(
      2,
      "0",
    )}:${String(s).padStart(2, "0")}`;
  };



  // Chronometer Trigger Engine
  useEffect(() => {
    if (!enableTimer || soundMode) return;

    const interval = setInterval(() => {
      const now = new Date();

      const hh = now.getHours().toString().padStart(2, "0");
      const mm = now.getMinutes().toString().padStart(2, "0");
      const ss = now.getSeconds().toString().padStart(2, "0");

      const fullTime = `${hh}:${mm}:${ss}`;
      setCurrentTime(fullTime);

      if (scheduleTime) {
        const parts = scheduleTime.split(":");

        const compareTime =
          parts.length === 2 ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`;

        if (compareTime === scheduleTime) {
          setColor(scheduledColor);
          setIsOn(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [enableTimer, scheduleTime, scheduledColor, soundMode]);

  useEffect(() => {
    if (!isOn) return; // only send when LED is ON

    const { r, g, b } = hexToRgb(color);

    const timeout = setTimeout(() => {
      fetch(`${ESP32_BASE_URL}/color?r=${r}&g=${g}&b=${b}`).catch((err) =>
        console.error("Color sync error:", err),
      );
    }, 80); // small debounce to avoid spam requests

    return () => clearTimeout(timeout);
  }, [color, isOn]);

  // Integrated Hardware Controller Endpoint Trigger
  const toggleLED = async () => {
    const newState = !isOn;
    setIsOn(newState);
    const url = newState ? "/on" : "/off";
    try {
      await fetch(`${ESP32_BASE_URL}${url}`);
    } catch (error) {
      console.error("Hardware link latency timeout:", error);
    }
  };
  const toggleMotionSensor = async () => {
    const newState = !motionEnabled;
    setMotionEnabled(newState);

    try {
      await fetch(`${ESP32_BASE_URL}/motion/${newState ? "on" : "off"}`);
    } catch (err) {
      console.error("Motion toggle failed:", err);
    }
  };

  const updateBrightness = async (value: number) => {
    try {
      await fetch(`${ESP32_BASE_URL}/brightness?value=${value}`);
    } catch (err) {
      console.log("Brightness update failed", err);
    }
  };
  const isLocked = enableTimer;

  const [alarmAnimation, setAlarmAnimation] =
  useState<AlarmAnimation>("fade");
const [alarmDialogOpen, setAlarmDialogOpen] = useState(false);

const animationOptions = [
  {
    value: "fade",
    label: "Fade On",
    icon: "✨",
    desc: "Smooth brightness increase",
  },
  {
    value: "blink",
    label: "Blink",
    icon: "⚡",
    desc: "Quick flashing effect",
  },
  {
    value: "rainbow",
    label: "Rainbow",
    icon: "🌈",
    desc: "Color cycling effect",
  },
  {
    value: "wave",
    label: "Wave",
    icon: "🌊",
    desc: "Flowing light movement",
  },
] ;

const [savedAlarm, setSavedAlarm] = useState<SavedAlarm | null>(null);
const setAlarm = async () => {
  const time = formatAlarm(hour, minute, period);

  const r = parseInt(scheduledColor.slice(1, 3), 16);
  const g = parseInt(scheduledColor.slice(3, 5), 16);
  const b = parseInt(scheduledColor.slice(5, 7), 16);

  const url =
    `${ESP32_BASE_URL}/alarm?time=${time}` +
    `&r=${r}&g=${g}&b=${b}` +
    (alarmAnimation ? `&animation=${alarmAnimation}` : "");

  // ✅ update UI FIRST (optimistic UI)
  setSavedAlarm({
    hour,
    minute,
    period,
    color: scheduledColor,
    animation: alarmAnimation,
  });

  setAlarmDialogOpen(false);

  try {
    await fetch(url);
  } catch (err) {
    console.error("Alarm set failed:", err);
  }
};

const offAlarm =async ()=>{

     setSavedAlarm(null)
 try {
      await fetch(`${ESP32_BASE_URL}/alarm/off`);
    } catch (err) {
      console.error("Motion toggle failed:", err);
    }

}
const openAlarmDialog = () => {
  if (savedAlarm) {
    setHour(savedAlarm.hour);
    setMinute(savedAlarm.minute);
    setPeriod(savedAlarm.period);
    setScheduledColor(savedAlarm.color);
    setAlarmAnimation(savedAlarm.animation);
  }

  setAlarmDialogOpen(true);
};
const startTimer = async () => {

  const h = Number(timerHour);
  const m = Number(timerMinute);
  const s = Number(timerSecond);

  const totalSeconds = h * 3600 + m * 60 + s;
  if (totalSeconds <= 0) return;

  const r = parseInt(timerColor.slice(1, 3), 16);
  const g = parseInt(timerColor.slice(3, 5), 16);
  const b = parseInt(timerColor.slice(5, 7), 16);

  const url =
    `${ESP32_BASE_URL}/timer?hour=${h}&min=${m}&second=${s}` +
    `&r=${r}&g=${g}&b=${b}` +
    (timerAnimation ? `&animation=${timerAnimation}` : "");

  // ✅ OPTIMISTIC UI UPDATE
  setTimerState("running");
  setTotalDuration(totalSeconds);
  setCountdown(totalSeconds);

  setTimerDialogOpen(false);

  try {
    await fetch(url);
  } catch (err) {
    console.error("Timer set failed:", err);
  }
};

const pauseTimer = async () => {
  setTimerPaused(true);
  
  try {
    const response = await fetch(`${ESP32_BASE_URL}/timer/pause`);
    
    if (response.ok) {
      const data = await response.json();
      
      // If the ESP32 sent back a real remaining time, snap our UI to it!
      if (data && typeof data.remainingSeconds === "number") {
        setCountdown(data.remainingSeconds);
      }
    }
  } catch (err) {
    console.error("Hardware pause sync failed:", err);
  }
};

const resumeTimer = async () => {
  setTimerPaused(false);
  
  // 1. Debug log to verify what number React is trying to send
  console.log("Sending remaining seconds to ESP32:", countdown);

  try {
    // 2. Make sure the template literal syntax matches exactly with the `countdown` variable
    await fetch(`${ESP32_BASE_URL}/timer/resume?remaining=${countdown}`);
  } catch (err) {
    console.error("Hardware resume sync failed:", err);
  }
};

const cancelTimer = async () => {

  setTimerState("idle");
  setCountdown(null);
  setTotalDuration(0)
  setTimerPaused(false);
   await fetch(`${ESP32_BASE_URL}/timer/cancel`);
   
};
useEffect(() => {
  if (timerState !== "running" || countdown === null) return;

    if (timerPaused) return;
  const interval = setInterval(() => {
    setCountdown((prev) => {
      if (prev === null) return null;

      if (prev <= 1) {
        clearInterval(interval);
        setTimerState("done");
        return 0;
      }

      return prev - 1;
    });
  }, 1000);

  return () => clearInterval(interval);
}, [timerState,timerPaused]);

const progress =
  totalDuration > 0 && countdown !== null
    ? ((totalDuration - countdown) / totalDuration) * 100
    : 0;

  return (
    <div className="min-h-screen w-full bg-[#0b0f19] text-slate-100 flex items-center justify-center p-4 md:p-8 relative overflow-hidden">
      {/* Background Ambient Plasma Glows */}
      <div className="absolute top-[-20%] left-[-10%] w-[500px] h-[500px] bg-blue-500/10 rounded-full blur-[120px] pointer-events-none" />
      <div className="absolute bottom-[-20%] right-[-10%] w-[500px] h-[500px] bg-purple-500/10 rounded-full blur-[120px] pointer-events-none" />

      {/* Main Glassmorphic Panel Layout Container */}
      <div className="w-full max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 rounded-3xl p-6 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-8 relative z-10">
        {/* Hardware Status Header Banner */}
        <div className="flex justify-between items-center border-b border-white/10 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-cyan-500/10 rounded-xl border border-cyan-500/20">
              <Sliders className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold tracking-wide text-white">
                LUMEN OS
              </h1>
              <p className="text-[11px] text-gray-400">
                Smart Local Controller Panel
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 px-3 py-1 rounded-full">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-[10px] text-emerald-400 font-mono font-bold tracking-wider">
              10.87.162.252
            </span>
            <Wifi className="w-3 h-3 text-emerald-400" />
          </div>
        </div>
        {/* 3D Smart Bulb Visualization Core */}
        <div className="flex justify-center py-4">
          <div className="relative flex items-center justify-center">
            {/* Ambient Wall Light Diffusion Glow */}
            <motion.div
              animate={{
                boxShadow: isOn
                  ? `0 0 60px 20px ${color}`
                  : "0 0 0px 0px rgba(0,0,0,0)",
              }}
              transition={{ duration: 0.4 }}
              className="absolute w-24 h-24 rounded-full -z-10 opacity-60"
            />
            {/* The Bulb Frame */}
            <motion.div
              animate={{
                backgroundColor: isOn ? color : "#1e293b",
                borderColor: isOn
                  ? "rgba(255,255,255,0.4)"
                  : "rgba(255,255,255,0.1)",
              }}
              style={{ filter: `brightness(${isOn ? brightness : 100}%)` }}
              className="w-24 h-32 rounded-t-full rounded-b-2xl border-2 transition-all relative flex flex-col justify-end overflow-hidden shadow-inner"
            >
              {/* Internal Filament Simulation */}
              <div
                className={`w-1 h-12 bg-white/40 mx-auto rounded-full mb-6 ${isOn ? "animate-pulse" : ""}`}
              />
              {/* Metallic Base Contact Cap */}
              <div className="w-full h-6 bg-gradient-to-r from-gray-600 via-gray-500 to-gray-700 border-t border-white/20 flex flex-col justify-between p-0.5">
                <div className="w-4/5 h-[2px] bg-gray-800 mx-auto opacity-40" />
                <div className="w-3/5 h-[2px] bg-gray-800 mx-auto opacity-40" />
                <div className="w-2/5 h-[2px] bg-gray-800 mx-auto opacity-40" />
              </div>
            </motion.div>
          </div>
        </div>
        {/* Infinite Custom Color Spectrum Matrix Controls */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <span className="text-xs font-bold uppercase tracking-wider text-gray-400 block">
                Color Spectrum Matrix
              </span>
              <span className="text-[10px] text-gray-500">
                Tap the wheel to choose any color or select a preset
              </span>
            </div>
            <motion.span
              animate={{ borderColor: color, color: color }}
              className="text-xs font-mono bg-neutral-950 border px-2.5 py-1 rounded-xl font-bold tracking-wider shadow-inner"
            >
              {color.toUpperCase()}
            </motion.span>
          </div>

          <div className="grid grid-cols-6 gap-3 items-center">
            {/* Custom Infinite Palette Input Button Wrapper */}
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

            {/* Quick Presets Hardware Controls */}
            {defaultColors.map((c) => (
              <motion.button
                key={c}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.9 }}
                onClick={() => setColor(c)}
                className={`w-full aspect-square rounded-full transition-all relative ${
                  color.toLowerCase() === c.toLowerCase()
                    ? "ring-2 ring-white ring-offset-2 ring-offset-[#0b0f19] z-10"
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
          </div>
        </div>
        {/* Master Power Toggle Button Row */}
        <div className="flex justify-center">
          <motion.button
            whileHover={{ scale: 1.04 }}
            whileTap={{ scale: 0.96 }}
            onClick={toggleLED}
            className={`w-full py-4 rounded-2xl font-bold tracking-wider text-sm uppercase flex items-center justify-center gap-3 transition-all duration-300 shadow-lg ${
              isOn
                ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 shadow-emerald-500/20"
                : "bg-white/5 border border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 shadow-none"
            }`}
          >
            <Power className="w-5 h-5" />
            {isOn ? "Turn Off" : "Turn On"}
          </motion.button>
        </div>
        {/* Hardware Intensity Dimmer */}
        <div className="space-y-2 bg-white/5 border border-white/5 p-4 rounded-2xl">
          <div className="flex justify-between text-xs font-bold text-gray-400 uppercase tracking-wider">
            <span className="flex items-center gap-2">
              <Sun className="w-4 h-4 text-amber-400" /> Pulse Brightness
            </span>
            <span className="text-white">{brightness}%</span>
          </div>
          <input
            type="range"
            min={0}
            max={100}
            value={brightness}
            onChange={(e) => {
              const value = Number(e.target.value);
              setBrightness(value);
              updateBrightness(value);
            }}
            className="w-full accent-cyan-400 h-1.5 bg-neutral-900 rounded-lg appearance-none cursor-pointer"
          />
        </div>
        {/* Automation Hub Controls Grid Layout */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-2">
          {/* Motion Sensor Toggle Control Card */}
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-green-400" /> Motion Sensor
              </div>

              <button
                onClick={toggleMotionSensor}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${
                  motionEnabled ? "bg-green-500" : "bg-white/10"
                }`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform duration-200 ${
                    motionEnabled ? "translate-x-5" : "translate-x-0"
                  }`}
                />
              </button>
            </div>

            <div className="h-10 flex items-center">
              {motionEnabled ? (
                <p className="text-[11px] text-green-300 leading-relaxed">
                  Motion sensor active: LED will respond to movement
                  automatically.
                </p>
              ) : (
                <p className="text-[11px] text-gray-400 leading-relaxed">
                  Enable motion detection to allow automatic lighting control.
                </p>
              )}
            </div>
          </div>

          {/* Clap Toggle Control Card */}
          <div
            className={`bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-4 transition-opacity ${soundMode ? "opacity-40 pointer-events-none" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-blue-400" /> Acoustic Sensor
              </div>
              <button
                disabled={soundMode}
                onClick={async () => {
                  const newState = !clapEnabled;
                  setClapEnabled(newState);

                  try {
                    await fetch(
                      `${ESP32_BASE_URL}${newState ? "/music/on" : "/music/off"}`,
                    );
                  } catch (err) {
                    console.error("Music mode error:", err);
                  }
                }}
                className={`w-10 h-5 rounded-full p-0.5 transition-colors duration-200 ${clapEnabled ? "bg-blue-500" : "bg-white/10"}`}
              >
                <div
                  className={`bg-white w-4 h-4 rounded-full shadow transform duration-200 ${clapEnabled ? "translate-x-5" : "translate-x-0"}`}
                />
              </button>
            </div>
            <p className="text-[11px] text-gray-400 h-10 flex items-center leading-relaxed">
              {clapEnabled
                ? "Active: Device state flips on physical acoustic spikes."
                : "Toggle matrix power loop via audio spikes."}
            </p>
          </div>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-3xl p-5 space-y-5">
  
  <div>
    <h2 className="text-lg font-semibold text-white">Sleep Timer</h2>
    <p className="text-xs text-gray-400">Automatically turn off LED</p>
  </div>

  {showIdle && (
  <button
    onClick={() => setTimerDialogOpen(true)}
    className="px-4 py-2 rounded-xl bg-emerald-500 text-black"
  >
    Set Timer
  </button>
)}


       <CircularTimer
        showActive={showActive}
        showDone={showDone}
        timerColor={timerColor}
        progress={progress}
        countdown={countdown}
        formatTime={formatTime}
        timerState={timerState}
        timerPaused={timerPaused}
        pauseTimer={pauseTimer}
        resumeTimer={resumeTimer}
        cancelTimer={cancelTimer}
      />


  {/* ================= DIALOG ================= */}
  <TimerDialog
    open={timerDialogOpen}
    onOpenChange={setTimerDialogOpen}

    timerHour={timerHour}
    timerMinute={timerMinute}
    timerSecond={timerSecond}
    timerColor={timerColor}
    timerAnimation={timerAnimation}

    setTimerHour={setTimerHour}
    setTimerMinute={setTimerMinute}
    setTimerSecond={setTimerSecond}
    setTimerColor={setTimerColor}
    setTimerAnimation={setTimerAnimation}

    onStart={() => {
      startTimer();
      setTimerDialogOpen(false);
    }}

    hours={hours}
    minutes={minutes}
    seconds={seconds}
    animationOptions={animationOptions}
  />

</div>



       {savedAlarm ? (
  <div className="p-4 rounded-2xl bg-white/5 border border-white/10 space-y-3">
    
    <div className="flex items-center justify-between">
      <div>
        <div className="text-sm font-semibold text-white">
          Alarm Set
        </div>
        <div className="text-xs text-gray-400">
          {savedAlarm.hour}:{savedAlarm.minute} {savedAlarm.period}
        </div>
      </div>

      {/* color preview dot */}
      <div
        className="w-5 h-5 rounded-full"
        style={{ backgroundColor: savedAlarm.color }}
      />
    </div>

    {/* animation preview */}
    <div className="text-xs text-gray-400">
      Animation: <span className="text-white">{savedAlarm.animation}</span>
    </div>

    {/* actions */}
    <div className="flex gap-2">
      <button
        onClick={() => setAlarmDialogOpen(true)}
        className="flex-1 py-2 rounded-xl bg-white/10"
      >
        Edit
      </button>

      <button
        onClick={offAlarm}
        className="flex-1 py-2 rounded-xl bg-red-500/10 text-red-400"
      >
        Remove
      </button>
    </div>
  </div>
) : (

  <button
  onClick={openAlarmDialog}
  className="h-12 px-5 rounded-2xl bg-emerald-500 text-white"
>
  {savedAlarm ? "Edit Alarm" : "Set Alarm"}
</button>
)}
<AlarmDialog
  open={alarmDialogOpen}
  onOpenChange={setAlarmDialogOpen}
  isLocked={isLocked}

  hour={hour}
  minute={minute}
  period={period}
  scheduledColor={scheduledColor}
  alarmAnimation={alarmAnimation}

  setHour={setHour}
  setMinute={setMinute}
  setPeriod={setPeriod}
  setScheduledColor={setScheduledColor}
  setAlarmAnimation={setAlarmAnimation}

  // enableTimer={enableTimer}
  // setEnableTimer={setEnableTimer}
  // setScheduleTime={setScheduleTime}

  saveAlarm={setAlarm}
  hours={alarmHours}
  minutes={minutes}
  defaultColors={defaultColors}
  animationOptions={animationOptions}
/>
        {/* Global Fallback Overlay Mode Alert Info Banner */}
        <AnimatePresence>
          {soundMode && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              className="p-3 bg-purple-500/10 border border-purple-500/20 rounded-xl text-center"
            >
              <p className="text-[11px] text-purple-300 font-medium">
                🔒 Audio Wave Sync Active: Sub-automation routines and manual
                claps are safely bypassed.
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Manual;
