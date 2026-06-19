import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Power,
  Volume2,
  Activity,
  Pipette,
} from "lucide-react";
import { hexToRgb } from "@/util/hex";
import AlarmDialog from "@/components/AlarmDialog";
import type { AlarmAnimation, SavedAlarm, TimerState } from "@/types/data.t";
import TimerDialog from "@/components/TImerDIalog";
import { formatAlarm } from "@/lib/utils";
import CircularTimer from "@/components/CircleTimer";
import AdvancedLEDBulb from "./animation/Lighting";

const defaultColors = ["#FF0000", "#0000FF", "#FFFFFF"];
const ESP32_BASE_URL = "http://192.168.1.16";

const Manual = () => {
  const [color, setColor] = useState("#FF0000");
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(50);

  // useEffect(() => {
  //   console.log("Firebase write running");
  //   set(ref(db, "led"), {
  //     power: false,
  //     brightness: 80,
  //     animation: "rainbow",
  //     color: {
  //       r: 255,
  //       g: 0,
  //       b: 255,
  //     },
  //   });
  // }, []);

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
const [timerLedAction,setTimerLedAction] = useState(true)

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
const [alarmLedAction,setAlarmLedAction]= useState(true)

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
  `&led=${timerLedAction ? 1 : 0}` +
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

  const isTimerActive = showActive || showDone;
  const isAlarmActive = !!savedAlarm;

  // ONLY show buttons when NOTHING is active
  const showButtons = !isTimerActive && !isAlarmActive;

  return (
    <div className=" w-full  bg-[#0b0f19] text-slate-100 flex items-center justify-center ">
      {/* Main Glassmorphic Panel Layout Container */}
      <div className="w-full min-h-screen max-w-lg bg-white/5 backdrop-blur-xl border border-white/10  p-5 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-4 ">
        {savedAlarm ? (
          <div className="p-6 rounded-3xl bg-black/30 border border-white/10 shadow-xl space-y-6 transition-all">
            {/* TOP: Time */}
            <div className="flex items-start justify-between">
              {/* LEFT: Dot + label (generic only) */}
              <div className="flex items-center gap-2">
                <div
                  className="w-2.5 h-2.5 rounded-full animate-pulse"
                  style={{ backgroundColor: savedAlarm.color }}
                />
                <span className="text-xs text-gray-400 uppercase tracking-wider">
                  Alarm
                </span>
              </div>

              {/* RIGHT: TIME */}
              <div className="text-right">
                <div className="text-5xl font-extrabold text-white leading-none">
                  {savedAlarm.hour}:{savedAlarm.minute}
                </div>
                <div className="text-xs text-gray-400 mt-1 pr-2">
                  {savedAlarm.period}
                </div>
              </div>
            </div>

            {/* CENTER VISUAL */}
            <div className="flex items-center justify-center py-5">
              <div className="relative">
                {/* glow */}
                <div
                  className="absolute w-24 h-24 rounded-full blur-2xl opacity-40"
                  style={{ backgroundColor: savedAlarm.color }}
                />

                {/* core */}
                <div
                  className="w-16 h-16 rounded-full flex items-center justify-center animate-pulse"
                  style={{ backgroundColor: savedAlarm.color }}
                >
                  <div className="w-6 h-6 rounded-full bg-black/40" />
                </div>
              </div>
            </div>

            {/* INFO (neutral, no mode/state language) */}
            <div className="flex items-center justify-between text-xs text-gray-400">
              <span>Animation: {savedAlarm.animation}</span>

              {/* <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: savedAlarm.color }}
              /> */}
            </div>

            {/* ACTIONS */}
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
        ) : showIdle ? (
          <>
            <div className="flex  w-full h-full items-stretch">
              {/* Bulb - 2/3 */}
              <div className="w-3/4 flex items-center justify-center ">
                <AdvancedLEDBulb
                  isOn={isOn}
                  brightness={brightness}
                  color={color}
                />
              </div>

              {/* Colors - 1/3 */}
              <div className="w-1/4 flex items-center justify-center ">
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
            </div>

            {/* Master Power Toggle Button Row */}
            <div
              className={`flex justify-center ${clapEnabled || motionEnabled ? "pointer-events-none opacity-50" : ""}`}
            >
              <button
                onClick={toggleLED}
                disabled={clapEnabled || motionEnabled}
                className={`w-full py-2 rounded-2xl font-bold text-sm uppercase flex items-center justify-center gap-3 transition-all duration-300 shadow-lg border ${
                  isOn
                    ? "bg-gradient-to-r from-emerald-500 to-teal-500 text-neutral-950 border-transparent shadow-emerald-500/20"
                    : "bg-white/5 border-white/10 text-rose-400 hover:bg-rose-500/10 hover:border-rose-500/20 shadow-none"
                }`}
              >
                <Power className="w-4 h-4" />
                {isOn ? "Turn Off" : "Turn On"}
              </button>
            </div>
            {/* Hardware Intensity Dimmer */}
            <div className=" bg-white/5 border border-white/5 py-2 px-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold text-gray-400 ">
                <span className="flex items-center gap-2"> Brightness</span>
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
                className="w-full accent-cyan-400 h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer"
              />
            </div>
          </>
        ) : (
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
        )}

        {/* Automation Hub Controls Grid Layout */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${
            isOn ? "pointer-events-none opacity-50" : ""
          }`}
        >
          {/* Motion Sensor Toggle Control Card */}
          <div
            className={`bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-2 ${clapEnabled || isOn ? "pointer-events-none opacity-50" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Activity className="w-4 h-4 text-green-400" /> Motion Sensor
              </div>

              <button
                onClick={toggleMotionSensor}
                disabled={clapEnabled || isOn}
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

            <div className={`h-4 flex items-center `}>
              {motionEnabled ? (
                <p className="text-[10px] text-green-300 leading-relaxed">
                  Motion sensor active: LED will respond to movement
                  automatically.
                </p>
              ) : (
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Enable motion detection to allow automatic lighting control.
                </p>
              )}
            </div>
          </div>

          {/* Clap Toggle Control Card */}
          <div
            className={`bg-white/5 border border-white/5 rounded-2xl p-4 flex flex-col justify-between space-y-2 transition-opacity ${motionEnabled || isOn ? "opacity-40 pointer-events-none" : ""}`}
          >
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-xs font-bold text-gray-400 uppercase tracking-wider">
                <Volume2 className="w-4 h-4 text-blue-400" /> Acoustic Sensor
              </div>
              <button
                disabled={motionEnabled || isOn}
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

            <p className="text-[10px] text-blue-400 h-4 flex items-center leading-relaxed">
              {clapEnabled ? (
                "Active: Device state flips on physical acoustic spikes."
              ) : (
                <p className="text-[10px] text-gray-400 leading-relaxed">
                  Toggle matrix power loop via audio spikes.
                </p>
              )}
            </p>
          </div>
        </div>
        <div>
          <div className="flex gap-2">
            {/* SET TIMER */}
            {showButtons && (
              <button
                onClick={() => setTimerDialogOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black"
              >
                Set Timer
              </button>
            )}

            {/* SET ALARM */}
            {showButtons && (
              <button
                onClick={openAlarmDialog}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black"
              >
                Set Alarm
              </button>
            )}
          </div>

          {/* ================= DIALOG ================= */}
          <TimerDialog
            open={timerDialogOpen}
            onOpenChange={setTimerDialogOpen}
            isLedOn={isOn}
            timerHour={timerHour}
            timerMinute={timerMinute}
            timerSecond={timerSecond}
            timerColor={timerColor}
            timerAnimation={timerAnimation}
            timerLedAction={timerLedAction}
            setTimerHour={setTimerHour}
            setTimerMinute={setTimerMinute}
            setTimerSecond={setTimerSecond}
            setTimerColor={setTimerColor}
            setTimerAnimation={setTimerAnimation}
            setTimerLedAction={setTimerLedAction}
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

        <AlarmDialog
          open={alarmDialogOpen}
          onOpenChange={setAlarmDialogOpen}
          isLedOn={isOn}
          isLocked={isLocked}
          hour={hour}
          minute={minute}
          period={period}
          scheduledColor={scheduledColor}
          alarmAnimation={alarmAnimation}
          alarmLedAction={alarmLedAction}
          setHour={setHour}
          setMinute={setMinute}
          setPeriod={setPeriod}
          setScheduledColor={setScheduledColor}
          setAlarmAnimation={setAlarmAnimation}
          setAlarmLedAction={setAlarmLedAction}
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
