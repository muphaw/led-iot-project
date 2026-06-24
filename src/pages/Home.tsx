import { useState, useEffect, useRef } from "react";
import { Power, Volume2, Activity } from "lucide-react";
import mqtt from "mqtt"; // Imported MQTT library
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

// ================= HIVEMQ CONFIGURATION =================
// ⚠️ PASTE YOUR HIVEMQ DETAILS HERE (Must start with wss:// and end with :8884/mqtt)
const MQTT_HOST =
  "wss://2994cdeb69fe41b5962ac977c7ccb5cc.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_OPTIONS = {
  username: "smartled", // Created in Authentication tab
  password: "12345Abcde", // Created in Authentication tab
  clientId: "react_lumen_os_" + Math.random().toString(16).substring(2, 8),
};
const TOPIC = "home/led/control";

const Manual = () => {
  const [color, setColor] = useState("#FF0000");
  const [isOn, setIsOn] = useState(false);
  const [brightness, setBrightness] = useState(50);
  const [mqttConnected, setMqttConnected] = useState(false);

  // MQTT client persistent state reference
  const mqttClientRef = useRef<mqtt.MqttClient | null>(null);

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

  // ================= LIFE CYCLE: INITIALIZE MQTT =================
  useEffect(() => {
    const client = mqtt.connect(MQTT_HOST, MQTT_OPTIONS);

    client.on("connect", () => {
      console.log("🟢 Connected safely to HiveMQ Cloud via WebSockets!");
      setMqttConnected(true);
    });

    client.on("error", (err) => {
      console.error("MQTT Connection Error: ", err);
    });

    mqttClientRef.current = client;

    return () => {
      if (mqttClientRef.current) {
        mqttClientRef.current.end();
      }
    };
  }, []);

  // Sync Color Outwards via MQTT
  useEffect(() => {
    if (!isOn || !mqttConnected || !mqttClientRef.current) return;

    const { r, g, b } = hexToRgb(color);
    const timeout = setTimeout(() => {
      // Formats matching backend layout "color:r,g,b"
      mqttClientRef.current?.publish(TOPIC, `color:${r},${g},${b}`, { qos: 1 });
    }, 80);

    return () => clearTimeout(timeout);
  }, [color, isOn, mqttConnected]);

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

  // Helper safety abstraction wrapper for publishing
  const publishMessage = (payload: string) => {
    if (mqttClientRef.current && mqttConnected) {
      mqttClientRef.current.publish(TOPIC, payload, { qos: 1 });
    } else {
      console.warn("MQTT drop payload intercept: Client not connected.");
    }
  };

  // ================= HARDWARE ROUTING CONVERSIONS =================
  const toggleLED = () => {
    const newState = !isOn;
    setIsOn(newState);
    publishMessage(newState ? "on" : "off");
  };

  const toggleMotionSensor = () => {
    const newState = !motionEnabled;
    setMotionEnabled(newState);
    publishMessage(newState ? "motion/on" : "motion/off");
  };

  const togglemusicSensor = () => {
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    publishMessage(newState ? "music/on" : "music/off");
  };

  const updateBrightness = (value: number) => {
    // Formats payload mapping string matching backend "brightness:value"
    publishMessage(`brightness:${value}`);
  };

  const [alarmAnimation, setAlarmAnimation] = useState<AlarmAnimation>("fade");
  const [alarmDialogOpen, setAlarmDialogOpen] = useState(false);
  const [alarmLedAction, setAlarmLedAction] = useState(true);
  const [savedAlarm, setSavedAlarm] = useState<SavedAlarm | null>(null);

  const startAlarm = () => {
    const time = formatAlarm(hour, minute, period);
    const actionParam = alarmLedAction ? "on" : "off";

    // Build payload structure matching: "alarm:set|HH:MM|action"
    publishMessage(`alarm:set|${time}|${actionParam}`);

    setSavedAlarm({
      hour,
      minute,
      period,
      color: scheduledColor,
      animation: alarmAnimation,
    });
    setAlarmDialogOpen(false);
  };

  const offAlarm = () => {
    setSavedAlarm(null);
    setIsOn(true);
    publishMessage("alarm/cancel");
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

  const startTimer = () => {
    const h = Number(timerHour);
    const m = Number(timerMinute);
    const s = Number(timerSecond);
    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds <= 0) return;

    const actionParam = timerLedAction ? "off" : "on";

    // Formats payload structure matching backend string loop hook layout:
    // "timer:start|durationSeconds|action"
    publishMessage(`timer:start|${totalSeconds}|${actionParam}`);

    setTimerState("running");
    setTotalDuration(totalSeconds);
    setCountdown(totalSeconds);
    setTimerDialogOpen(false);
  };

  const pauseTimer = () => {
    setTimerPaused(true);
    publishMessage("timer/pause");
  };

  const resumeTimer = () => {
    setTimerPaused(false);
    publishMessage("timer/resume");
  };

  const cancelTimer = () => {
    setTimerState("idle");
    setCountdown(null);
    setTotalDuration(0);
    setTimerPaused(false);
    publishMessage("timer/cancel");
  };

  const progress =
    totalDuration > 0 && countdown !== null
      ? ((totalDuration - countdown) / totalDuration) * 100
      : 0;
  const isTimerActive = showActive || timerState === "done";
  const isAlarmActive = !!savedAlarm;
  const showButtons = !isTimerActive && !isAlarmActive;

  return (
    <div className="w-full bg-[#0b0f19] text-slate-100 flex items-center justify-center">
      <div className="w-full min-h-screen max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-4">
        {/* Connection Status Monitor Widget */}
        <div className="flex justify-end">
          <span
            className={`text-[10px] uppercase tracking-wider font-bold px-2 py-0.5 rounded-full ${mqttConnected ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border border-amber-500/20"}`}
          >
            {mqttConnected ? "Cloud Stream Live" : "Broker Offline"}
          </span>
        </div>

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
                disabled={musicEnabled || motionEnabled || !mqttConnected}
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
                disabled={!mqttConnected}
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
            showDone={timerState === "done"}
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
            disabled={musicEnabled || isOn || !mqttConnected}
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
            disabled={motionEnabled || isOn || !mqttConnected}
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
                disabled={!mqttConnected}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black disabled:opacity-50"
              >
                Set Timer
              </button>
            )}
            {showButtons && (
              <button
                onClick={openAlarmDialog}
                disabled={!mqttConnected}
                className="px-4 py-2 rounded-xl bg-emerald-500 text-black disabled:opacity-50"
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
            onStart={startTimer}
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
