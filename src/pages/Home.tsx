import { useState, useEffect } from "react";
import { Power, Volume2, Activity } from "lucide-react";
import { hexToRgb } from "@/util/hex";
import AlarmDialog from "@/components/AlarmDialog";
import type { AlarmAnimation, SavedAlarm, TimerState } from "@/types/data.t";
import TimerDialog from "@/components/TImerDIalog";
import { formatAlarm, formatTime } from "@/lib/utils";
import CircularTimer from "@/components/CircleTimer";
import AdvancedLEDBulb from "./animation/Lighting";
import { animationOptions } from "@/lib/data";
import ActiveAlarmCard from "./components/ActiveAlarmCard";
import ColorPickerPanel from "./components/ColorPickerPanel";
import SensorToggleCard from "./components/SensorToggleCard";

const defaultColors = ["#FF0000", "#0000FF", "#FFFFFF"];
import { ref, set, update, onValue } from "firebase/database";
import {db} from "@/lib/firebase";
const Manual = () => {
  const [color, setColor] = useState("#FF0000");
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(50);

  const [scheduledColor, setScheduledColor] = useState("#FF0000");
  const [totalDuration, setTotalDuration] = useState<number>(0);

  const [period, setPeriod] = useState("AM");
  const [timerState, setTimerState] = useState<TimerState>("idle");

  const [hour, setHour] = useState("01");
  const [minute, setMinute] = useState("00");

  const [countdown, setCountdown] = useState<number | null>(null);

  const [timerColor, setTimerColor] = useState("#00FF00");
  const [timerLedAction, setTimerLedAction] = useState(true);

  const [motionEnabled, setMotionEnabled] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);

  const [timerHour, setTimerHour] = useState("00");
  const [timerMinute, setTimerMinute] = useState("00");
  const [timerSecond, setTimerSecond] = useState("00");
  const [timerPaused, setTimerPaused] = useState(false);

  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [timerAnimation, setTimerAnimation] = useState<AlarmAnimation>("fade");

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


  const showIdle = timerState === "idle";
  const showActive = timerState === "running";
  const showDone = timerState === "done";

  // ================= 1. LIVE EVENT DATABASE LISTENER =================
  useEffect(() => {
    const rootRef = ref(db, "led");
    const unsubscribe = onValue(rootRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        // Sync hardware metrics back upstream into React UI inputs natively
        if (data.device_state) {
          setIsOn(data.device_state.isOn);
          setBrightness(data.device_state.brightness);
          if (data.device_state.sensors) {
            setMotionEnabled(data.device_state.sensors.motionEnabled);
            setMusicEnabled(data.device_state.sensors.musicEnabled);
          }
        }
        if (data.timer) {
          setTimerState(data.timer.state);
          setCountdown(data.timer.remainingSeconds);
        }
      }
    });
    return () => unsubscribe();
  }, []);

  // ================= 2. LIVE MANUAL COLOR WRITES =================
  useEffect(() => {
    if (!isOn) return;
    const { r, g, b } = hexToRgb(color);
    const timeout = setTimeout(() => {
      update(ref(db, "led/device_state/color"), { r, g, b });
    }, 100);
    return () => clearTimeout(timeout);
  }, [color, isOn]);

  // Local React Interval to keep ticking UI smooth while database syncs
  useEffect(() => {
    if (timerState !== "running" || countdown === null || timerPaused) return;

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
  }, [timerState, timerPaused]);

  // ================= 2. LIVE MANUAL COLOR WRITES =================
  useEffect(() => {
    if (!isOn) return;
    const { r, g, b } = hexToRgb(color);
    const timeout = setTimeout(() => {
      // Use set directly on the absolute endpoint so it stays a flat {r, g, b} object
      set(ref(db, "led/device_state/color"), { r, g, b });
    }, 100);
    return () => clearTimeout(timeout);
  }, [color, isOn]);

  // ================= 3. CORE TRIGGER ACTIONS =================
  const toggleLED = async () => {
  const nextState = !isOn;
  setIsOn(nextState);
  
  try {
    // Direct path write
    await set(ref(db, "led/device_state/isOn"), nextState);
    alert("Success! Sent to Firebase: " + nextState);
  } catch (error: any) {
    // If permission or configuration fails, this will show you why
    alert("Firebase Error: " + error.message);
  }
};

  const toggleMotionSensor = async () => {
    const nextState = !motionEnabled;
    setMotionEnabled(nextState);
    set(ref(db, "led/device_state/sensors/motionEnabled"), nextState);
  };

  const togglemusicSensor = async () => {
    const nextState = !musicEnabled;
    setMusicEnabled(nextState);
    set(ref(db, "led/device_state/sensors/musicEnabled"), nextState);
  };

  const updateBrightness = async (value: number) => {
    set(ref(db, "led/device_state/brightness"), value);
  };

  const [alarmAnimation, setAlarmAnimation] = useState<AlarmAnimation>("fade");
  const [alarmDialogOpen, setAlarmDialogOpen] = useState(false);
  const [alarmLedAction, setAlarmLedAction] = useState(true);
  const [savedAlarm, setSavedAlarm] = useState<SavedAlarm | null>(null);

  const startAlarm = async () => {
    const rawTime = formatAlarm(hour, minute, period);
    const cleanTime = decodeURIComponent(rawTime); // 🔥 Removes the %3A bug!

    const r = parseInt(scheduledColor.slice(1, 3), 16);
    const g = parseInt(scheduledColor.slice(3, 5), 16);
    const b = parseInt(scheduledColor.slice(5, 7), 16);
    const actionParam = alarmLedAction ? "on" : "off";

    await set(ref(db, "led/alarm"), {
      enabled: true,
      time: cleanTime,
      action: actionParam,
      animation: alarmAnimation,
      alarmColor: { r, g, b }
    });

    setSavedAlarm({
      hour,
      minute,
      period,
      color: scheduledColor,
      animation: alarmAnimation,
    });
    setAlarmDialogOpen(false);
  };

  const offAlarm = async () => {
    setSavedAlarm(null);
    setIsOn(true);
    await update(ref(db, "led/alarm"), { enabled: false });
  };

  const openAlarmDialog = () => {
    if (savedAlarm) {
      setHour(savedAlarm.hour); setMinute(savedAlarm.minute); setPeriod(savedAlarm.period);
      setScheduledColor(savedAlarm.color); setAlarmAnimation(savedAlarm.animation);
    }
    setAlarmDialogOpen(true);
  };

  const startTimer = async () => {
    const totalSeconds = Number(timerHour) * 3600 + Number(timerMinute) * 60 + Number(timerSecond);
    if (totalSeconds <= 0) return;

    const r = parseInt(timerColor.slice(1, 3), 16);
    const g = parseInt(timerColor.slice(3, 5), 16);
    const b = parseInt(timerColor.slice(5, 7), 16);
    const actionParam = timerLedAction ? "on" : "off";

    setTimerState("running");
    setTotalDuration(totalSeconds);
    setCountdown(totalSeconds);
    setTimerDialogOpen(false);

    await set(ref(db, "led/timer"), {
      state: "running",
      remainingSeconds: totalSeconds,
      action: actionParam,
      animation: timerAnimation,
      timerColor: { r, g, b }
    });
  };

  const pauseTimer = async () => {
    setTimerPaused(true);
    await update(ref(db, "led/timer"), { state: "paused" });
  };

  const resumeTimer = async () => {
    setTimerPaused(false);
    await update(ref(db, "led/timer"), { state: "running", remainingSeconds: countdown });
  };

  const cancelTimer = async () => {
    setTimerState("idle"); setCountdown(null); setTotalDuration(0); setTimerPaused(false);
    await set(ref(db, "led/timer"), { state: "idle", remainingSeconds: 0, action: "on", animation: "blink" });
  };

  const progress = totalDuration > 0 && countdown !== null ? ((totalDuration - countdown) / totalDuration) * 100 : 0;
  const isTimerActive = showActive || showDone;
  const isAlarmActive = !!savedAlarm;
  const showButtons = !isTimerActive && !isAlarmActive;

  return (
    <div className="w-full bg-[#0b0f19] text-slate-100 flex items-center justify-center">
      <div className="w-full min-h-screen max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-4">
        {savedAlarm ? (
          <ActiveAlarmCard
            savedAlarm={savedAlarm}
            setAlarmDialogOpen={setAlarmDialogOpen}
            offAlarm={offAlarm}
          />
        ) : showIdle ? (
          <>
            <div className="flex w-full h-full items-stretch">
              <div className="w-3/4 flex items-center justify-center">
                <AdvancedLEDBulb
                  isOn={isOn}
                  brightness={brightness}
                  color={color}
                />
              </div>
              <ColorPickerPanel
                color={color}
                setColor={setColor}
                defaultColors={defaultColors}
              />
            </div>

            <div
              className={`flex justify-center ${musicEnabled || motionEnabled ? "pointer-events-none opacity-50" : ""}`}
            >
              <button
                onClick={toggleLED}
                disabled={musicEnabled || motionEnabled}
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

            <div className="bg-white/5 border border-white/5 py-2 px-4 rounded-2xl">
              <div className="flex justify-between text-xs font-bold text-gray-400">
                <span className="flex items-center gap-2">Brightness</span>
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

        {/* Automation Grid */}
        <div
          className={`grid grid-cols-1 sm:grid-cols-3 gap-2 ${isOn ? "pointer-events-none opacity-50" : ""}`}
        >
          <SensorToggleCard
            icon={Activity}
            iconColorClass="text-green-400"
            title="Motion Sensor"
            enabled={motionEnabled}
            onToggle={toggleMotionSensor}
            disabled={musicEnabled || isOn}
            activeText="Motion sensor active: LED will respond to movement automatically."
            inactiveText="Enable motion detection to allow automatic lighting control."
            themeColorClass="green"
          />

          <SensorToggleCard
            icon={Volume2}
            iconColorClass="text-blue-400"
            title="Acoustic Sensor"
            enabled={musicEnabled}
            onToggle={togglemusicSensor}
            disabled={motionEnabled || isOn}
            activeText="Active: Device state flips on physical acoustic spikes."
            inactiveText="Toggle matrix power loop via audio spikes."
            themeColorClass="blue"
          />
        </div>

        {/* Action Triggers & Dialogs */}
        <div>
          <div className="flex gap-2">
            {showButtons && (
              <button
                onClick={() => setTimerDialogOpen(true)}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black"
              >
                Set Timer
              </button>
            )}
            {showButtons && (
              <button
                onClick={openAlarmDialog}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black"
              >
                Set Alarm
              </button>
            )}
          </div>

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
          // isLocked={isLocked}
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
          saveAlarm={startAlarm}
          hours={alarmHours}
          minutes={minutes}
          defaultColors={defaultColors}
          animationOptions={animationOptions}
        />
      </div>
    </div>
  );
};

export default Manual;
