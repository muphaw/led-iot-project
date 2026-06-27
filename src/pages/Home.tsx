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

// MQTT Client Configuration
import mqtt from "mqtt";

const MQTT_HOST = "wss://2994cdeb69fe41b5962ac977c7ccb5cc.s1.eu.hivemq.cloud:8884/mqtt";
const MQTT_OPTIONS = {
  username: "smartled",
  password: "12345Abcde",
  clientId: "react_dashboard_" + Math.random().toString(16).substring(2, 8),
};

const TOPIC = "home/led/control";
const defaultColors = ["#FF0000", "#0000FF", "#FFFFFF"];

const Manual = () => {
  // MQTT Client instance state
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [connected, setConnected] = useState<boolean>(false);

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

  const hours = Array.from({ length: 12 }, (_, i) => String(i).padStart(2, "0"));
  const alarmHours = Array.from({ length: 12 }, (_, i) => String(i + 1).padStart(2, "0"));
  const minutes = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));
  const seconds = Array.from({ length: 60 }, (_, i) => String(i).padStart(2, "0"));

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

  const [alarmAnimation, setAlarmAnimation] = useState<AlarmAnimation>("fade");
  const [alarmDialogOpen, setAlarmDialogOpen] = useState(false);
  const [alarmLedAction, setAlarmLedAction] = useState(true);
  const [savedAlarm, setSavedAlarm] = useState<SavedAlarm | null>(null);

  const [audioLevels, setAudioLevels] = useState<number[]>([]);

  const showIdle = timerState === "idle";
  const showActive = timerState === "running";
  const showDone = timerState === "done";

  // 1. Core Lifecycle Engine: Initialize MQTT broker listener infrastructure
  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_HOST, MQTT_OPTIONS);

    mqttClient.on("connect", () => {
      console.log("🟢 Connected to HiveMQ Cloud!");
      setConnected(true);
      mqttClient.subscribe(TOPIC);
    });

    mqttClient.on("message", (topic, msg) => {
      if (topic !== TOPIC) return;
      const message = msg.toString();

      // State Feedback Matrix Sync
      if (message === "on") {
        setIsOn(true);
      } else if (message === "off") {
        setIsOn(false);
      } else if (message.startsWith("brightness:")) {
        const value = parseInt(message.substring(11), 10);
        if (!isNaN(value)) setBrightness(value);
      }
      // Backwards Evaluation Sync for State Restoration Updates
      else if (message === "status:on") {
        setIsOn(true);
        setMotionEnabled(false);
        setMusicEnabled(false);
        setTimerState("idle");
        setCountdown(null);
      }
      else if (message === "status:music") {
        setMusicEnabled(true);
        setMotionEnabled(false);
        setIsOn(false);
        setTimerState("idle");
        setCountdown(null);
      }
      else if (message === "status:motion") {
        setMotionEnabled(true);
        setMusicEnabled(false);
        setIsOn(false);
        setTimerState("idle");
        setCountdown(null);
      }
      else if (message === "status:idle") {
        setMotionEnabled(false);
        setMusicEnabled(false);
        setIsOn(false);
        setTimerState("idle");
        setCountdown(null);
      }
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT Connection Exception:", err);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  const startVisualizer = async () => {
  const stream = await navigator.mediaDevices.getUserMedia({
    audio: true,
  });

  const audioContext = new AudioContext();

  const analyser = audioContext.createAnalyser();
  analyser.fftSize = 64;

  const source = audioContext.createMediaStreamSource(stream);
  source.connect(analyser);

  const bufferLength = analyser.frequencyBinCount;
  const dataArray = new Uint8Array(bufferLength);

  const update = () => {
  analyser.getByteFrequencyData(dataArray);

  const bars = 10;
  const step = Math.floor(dataArray.length / bars);

  const max = Math.max(...dataArray, 1);

  const newLevels = Array.from({ length: bars }, (_, i) => {
    let sum = 0;

    for (let j = 0; j < step; j++) {
      sum += dataArray[i * step + j];
    }

    const avg = sum / step;

    // 🔥 fixes “stuck middle”
    return (avg / max) * 255;
  });

  setAudioLevels(newLevels);

  requestAnimationFrame(update);
};

  update();
};

useEffect(() => {
  if (musicEnabled) {
    startVisualizer();
  }
}, [musicEnabled]);

  // 2. Sync Color Pipeline via MQTT Payloads
  useEffect(() => {
    if (!isOn || !client || !connected) return;

    const { r, g, b } = hexToRgb(color);
    const timeout = setTimeout(() => {
      client.publish(TOPIC, `color:${r},${g},${b}`, { qos: 1, retain: true });
    }, 80);

    return () => clearTimeout(timeout);
  }, [color, isOn, client, connected]);

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

  // 3. Refactored Hardware Link Actions (Optimized for MQTT)
  const toggleLED = () => {
    if (!client || !connected) return;
    const nextState = !isOn;
    setIsOn(nextState);

    // Turn off complementary peripheral operations if forcing manual overrides
    if (nextState) {
      setMotionEnabled(false);
      setMusicEnabled(false);
    }

    const payload = nextState ? "on" : "off";
    client.publish(TOPIC, payload, { qos: 1, retain: true });
  };

  const updateBrightness = (value: number) => {
    if (!client || !connected) return;
    setBrightness(value);
    client.publish(TOPIC, `brightness:${value}`, { qos: 1, retain: true });
  };

  const toggleMotionSensor = () => {
    if (!client || !connected) return;
    const newState = !motionEnabled;
    setMotionEnabled(newState);
    if (newState) {
      setMusicEnabled(false);
      setIsOn(false);
    }
    client.publish(TOPIC, `motion:${newState ? "on" : "off"}`, { qos: 1 });
  };

  const toggleMusicSensor = () => {
    if (!client || !connected) return;
    const newState = !musicEnabled;
    setMusicEnabled(newState);
    if (newState) {
      setMotionEnabled(false);
      setIsOn(false);
    }
    client.publish(TOPIC, newState ? "music:on" : "music:off", { qos: 1 });
  };

  const startAlarm = () => {
    if (!client || !connected) return;
    const time = formatAlarm(hour, minute, period);
    const { r, g, b } = hexToRgb(scheduledColor);
    const actionParam = isOn
  ? (alarmLedAction ? "on" : "off")
  : "on";

    const payload = `alarm:set,time:${time},action:${actionParam},r:${r},g:${g},b:${b},anim:${alarmAnimation}`;
    client.publish(TOPIC, payload, { qos: 1 });

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
    if (!client || !connected) return;
    setSavedAlarm(null);
    client.publish(TOPIC, "alarm:off", { qos: 1 });
  };

  const startTimer = () => {
    if (!client || !connected) return;
    const h = Number(timerHour);
    const m = Number(timerMinute);
    const s = Number(timerSecond);
    const totalSeconds = h * 3600 + m * 60 + s;
    if (totalSeconds <= 0) return;

    const { r, g, b } = hexToRgb(timerColor);
    const actionParam = isOn
  ? (timerLedAction ? "on" : "off")
  : "on";

    const payload = `timer:start,s:${totalSeconds},action:${actionParam},r:${r},g:${g},b:${b},anim:${timerAnimation}`;
    client.publish(TOPIC, payload, { qos: 1 });

    setTimerState("running");
    setTotalDuration(totalSeconds);
    setCountdown(totalSeconds);
    setTimerDialogOpen(false);
  };

  const pauseTimer = () => {
    if (!client || !connected) return;
    setTimerPaused(true);
    client.publish(TOPIC, "timer:pause", { qos: 1 });
  };

  const resumeTimer = () => {
    if (!client || !connected) return;
    setTimerPaused(false);
    client.publish(TOPIC, `timer:resume,rem:${countdown}`, { qos: 1 });
  };

  const cancelTimer = () => {
    if (!client || !connected) return;
    setTimerState("idle");
    setCountdown(null);
    setTotalDuration(0);
    setTimerPaused(false);
    client.publish(TOPIC, "timer:cancel", { qos: 1 });
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

  const progress = totalDuration > 0 && countdown !== null ? ((totalDuration - countdown) / totalDuration) * 100 : 0;
  const isTimerActive = showActive || showDone;
  const isAlarmActive = !!savedAlarm;

  // Modernized System Validation Constraints (LED on OR Motion on OR Music on)
  const showButtons = !isTimerActive && !isAlarmActive ;

  return (
    <div className="w-full bg-[#0b0f19] text-slate-100 flex items-center justify-center">
      <div className="w-full min-h-screen max-w-lg bg-white/5 backdrop-blur-xl border border-white/10 p-5 md:p-8 shadow-[0_20px_50px_rgba(0,0,0,0.4)] space-y-4">
        
        <div className="flex justify-end">
          <span className={`text-[10px] font-bold tracking-wider uppercase px-2 py-0.5 rounded-md border ${
            connected ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"
          }`}>
            {connected ? "Connected" : "Linking..."}
          </span>
        </div>

        {savedAlarm ? (
          <ActiveAlarmCard savedAlarm={savedAlarm} setAlarmDialogOpen={setAlarmDialogOpen} offAlarm={offAlarm} />
        ) : showIdle ? (
          <>
  {musicEnabled ? (
    <div className="w-full h-[320px] rounded-3xl bg-gradient-to-b from-cyan-500/10 to-blue-500/5 border border-cyan-400/10 flex items-center justify-center overflow-hidden">
      
      <div className="flex items-end justify-center gap-1 h-48 w-full px-6">
        {audioLevels.map((level, i) => (
          <div
            key={i}
            className="w-9 rounded-full bg-cyan-400 transition-all duration-75 shadow-[0_0_12px_rgba(34,211,238,0.8)]"
            style={{
  height: `${Math.max(Math.pow(level / 255, 1.6) * 100, 6)}%`,
}}
          />
        ))}
      </div>

    </div>
  ) : (
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

      <div className={`flex justify-center ${!connected || motionEnabled ? "pointer-events-none opacity-50" : ""}`}>
        <button
          onClick={toggleLED}
          disabled={!connected || motionEnabled}
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

      <div className={`bg-white/5 border border-white/5 py-2 px-4 rounded-2xl ${(!connected || (!isOn && !motionEnabled)) && "opacity-40 pointer-events-none"}`}>
        <div className="flex justify-between text-xs font-bold text-gray-400">
          <span>Brightness</span>
          <span className="text-white">{brightness}%</span>
        </div>

        <input
          type="range"
          min={0}
          max={100}
          value={brightness}
          onChange={(e) => updateBrightness(Number(e.target.value))}
          className="w-full accent-cyan-400 h-1 bg-neutral-900 rounded-lg appearance-none cursor-pointer"
        />
      </div>
    </>
  )}
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

        {/* Updated Grid Selection Layout Guardrails */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-2 ${!connected ? "pointer-events-none opacity-50" : ""}`}>
          <SensorToggleCard
            icon={Activity}
            iconColorClass="text-green-400"
            title="Motion Sensor"
            enabled={motionEnabled}
            onToggle={toggleMotionSensor}
            disabled={!connected || musicEnabled || isTimerActive || isAlarmActive || isOn}
            activeText="Motion sensor active: LED will respond to movement automatically."
            inactiveText="Enable motion detection to allow automatic lighting control."
            themeColorClass="green"
          />

          <SensorToggleCard
            icon={Volume2}
            iconColorClass="text-blue-400"
            title="Acoustic Sensor"
            enabled={musicEnabled}
            onToggle={toggleMusicSensor}
            disabled={!connected || motionEnabled || isTimerActive || isAlarmActive || isOn}
            activeText="Active: Device state flips on physical acoustic spikes."
            inactiveText="Toggle matrix power loop via audio spikes."
            themeColorClass="blue"
          />
        </div>

        {/* Automated Task Trigger Configuration Blocks */}
        <div className="w-full flex justify-center pt-2">
          {showButtons ? (
            <div className="flex gap-4 w-full">
              <button 
                onClick={() => setTimerDialogOpen(true)} 
                disabled={!connected } 
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black disabled:opacity-40 transition-all shadow-md shadow-emerald-500/10"
              >
                Set Timer
              </button>
              <button 
                onClick={openAlarmDialog} 
                disabled={!connected} 
                className="flex-1 py-3 px-4 rounded-xl font-bold bg-emerald-500 hover:bg-emerald-600 active:scale-95 text-black disabled:opacity-40 transition-all shadow-md shadow-emerald-500/10"
              >
                Set Alarm
              </button>
            </div>
          ) : (
            !isTimerActive && !isAlarmActive && (
              <p className="text-xs text-center text-slate-400/70 border border-white/5 bg-white/[0.02] p-3 rounded-xl w-full">
                💡 Turn on the LED or enable a sensor context to configure scheduled Timers and Alarms.
              </p>
            )
          )}

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