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
const ESP32_BASE_URL = "http://192.168.1.16";

const Manual = () => {
  const [color, setColor] = useState("#FF0000");
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(50);

  // const [enableTimer, setEnableTimer] = useState(false);
  // const [scheduleTime, setScheduleTime] = useState("");
  const [scheduledColor, setScheduledColor] = useState("#FF0000");

  const [totalDuration, setTotalDuration] = useState<number>(0);

  const [period, setPeriod] = useState("AM");
  const [timerState, setTimerState] = useState<TimerState>("idle");

  const [hour, setHour] = useState("01");
  const [minute, setMinute] = useState("00");

  const [countdown, setCountdown] = useState<number | null>(null);

  const [timerColor, setTimerColor] = useState("#00FF00");
  const [timerLedAction, setTimerLedAction] = useState(true);

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

  // Sensors
  const [motionEnabled, setMotionEnabled] = useState(false);
  const [musicEnabled, setMusicEnabled] = useState(false);

  // Timers
  const [timerHour, setTimerHour] = useState("00");
  const [timerMinute, setTimerMinute] = useState("00");
  const [timerSecond, setTimerSecond] = useState("00");
  const [timerPaused, setTimerPaused] = useState(false);

  const [timerDialogOpen, setTimerDialogOpen] = useState(false);
  const [timerAnimation, setTimerAnimation] = useState<AlarmAnimation>("fade");

  const showIdle = timerState === "idle";
  const showActive = timerState === "running";
  const showDone = timerState === "done";

  // Chronometer Trigger Engine
  // useEffect(() => {
  //   if (!enableTimer) return;

  //   const interval = setInterval(() => {
  //     const now = new Date();
  //     const hh = now.getHours().toString().padStart(2, "0");
  //     const mm = now.getMinutes().toString().padStart(2, "0");
  //     const ss = now.getSeconds().toString().padStart(2, "0");

  //     if (scheduleTime) {
  //       const parts = scheduleTime.split(":");
  //       const compareTime =
  //         parts.length === 2 ? `${hh}:${mm}` : `${hh}:${mm}:${ss}`;

  //       if (compareTime === scheduleTime) {
  //         setColor(scheduledColor);
  //         setIsOn(true);
  //       }
  //     }
  //   }, 1000);

  //   return () => clearInterval(interval);
  // }, [enableTimer, scheduleTime, scheduledColor]);

  // Sync Color Outwards
  useEffect(() => {
    if (!isOn) return;

    const { r, g, b } = hexToRgb(color);
    const timeout = setTimeout(() => {
      fetch(`${ESP32_BASE_URL}/color?r=${r}&g=${g}&b=${b}`).catch((err) =>
        console.error("Color sync error:", err),
      );
    }, 80);

    return () => clearTimeout(timeout);
  }, [color, isOn]);

  // Timer Countdown Logic
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

  // Hardware Interactions
  const toggleLED = () => {
    const newState = !isOn;
    setIsOn(newState); // Instant UI feedback

    // Fire network request in the background immediately
    const url = newState ? "/on" : "/off";
    fetch(`${ESP32_BASE_URL}${url}`).catch((error) => {
      // If it fails, revert the UI state gracefully
      setIsOn(!newState);
      console.error("Hardware link latency timeout:", error);
    });
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

  const togglemusicSensor = async () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    try {
      await fetch(`${ESP32_BASE_URL}${newState ? "/music/on" : "/music/off"}`);
    } catch (err) {
      console.error("Music mode error:", err);
    }
  };

  const updateBrightness = async (value: number) => {
    try {
      await fetch(`${ESP32_BASE_URL}/brightness?value=${value}`);
    } catch (err) {
      console.log("Brightness update failed", err);
    }
  };

  const [alarmAnimation, setAlarmAnimation] = useState<AlarmAnimation>("fade");
  const [alarmDialogOpen, setAlarmDialogOpen] = useState(false);
  const [alarmLedAction, setAlarmLedAction] = useState(true);
  const [savedAlarm, setSavedAlarm] = useState<SavedAlarm | null>(null);

  const startAlarm = async () => {
    const time = formatAlarm(hour, minute, period);
    const r = parseInt(scheduledColor.slice(1, 3), 16);
    const g = parseInt(scheduledColor.slice(3, 5), 16);
    const b = parseInt(scheduledColor.slice(5, 7), 16);

    const url = `${ESP32_BASE_URL}/alarm?time=${time}&r=${r}&g=${g}&b=${b}${
      alarmAnimation ? `&animation=${alarmAnimation}` : ""
    }`;

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

  const offAlarm = async () => {
    setSavedAlarm(null);
    try {
      await fetch(`${ESP32_BASE_URL}/alarm/off`);
    } catch (err) {
      console.error("Alarm kill failed:", err);
    }
  };

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

    const url = `${ESP32_BASE_URL}/timer?hour=${h}&min=${m}&second=${s}&led=${
      timerLedAction ? 1 : 0
    }&r=${r}&g=${g}&b=${b}${timerAnimation ? `&animation=${timerAnimation}` : ""}`;

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
    try {
      await fetch(`${ESP32_BASE_URL}/timer/resume?remaining=${countdown}`);
    } catch (err) {
      console.error("Hardware resume sync failed:", err);
    }
  };

  const cancelTimer = async () => {
    setTimerState("idle");
    setCountdown(null);
    setTotalDuration(0);
    setTimerPaused(false);
    await fetch(`${ESP32_BASE_URL}/timer/cancel`);
  };

  const progress =
    totalDuration > 0 && countdown !== null
      ? ((totalDuration - countdown) / totalDuration) * 100
      : 0;
  // const isLocked = enableTimer;
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
