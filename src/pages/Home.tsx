import React, { useEffect, useState } from "react";
import mqtt from "mqtt";

// ⚠️ PASTE YOUR HIVEMQ CLUSTER URL AND CREDENTIALS HERE
const MQTT_HOST =
  "wss://2994cdeb69fe41b5962ac977c7ccb5cc.s1.eu.hivemq.cloud:8884/mqtt"; // Must start with wss:// and end with :8884/mqtt
const MQTT_OPTIONS = {
  username: "smartled", // The username you created in Authentication
  password: "12345Abcde", // The password you created in Authentication
  clientId: "react_frontend_" + Math.random().toString(16).substring(2, 8),
};

const TOPIC = "home/led/control";
const LedController: React.FC = () => {
  const [client, setClient] = useState<mqtt.MqttClient | null>(null);
  const [isOn, setIsOn] = useState<boolean>(false);
  const [connected, setConnected] = useState<boolean>(false);

  useEffect(() => {
    const mqttClient = mqtt.connect(MQTT_HOST, MQTT_OPTIONS);

    mqttClient.on("connect", () => {
      console.log("🟢 React successfully connected to HiveMQ Cloud!");
      setConnected(true);
      mqttClient.subscribe(TOPIC);
    });

    mqttClient.on("message", (topic, message) => {
      if (topic === TOPIC) {
        setIsOn(message.toString() === "1");
      }
    });

    mqttClient.on("error", (err) => {
      console.error("MQTT Connection Error: ", err);
    });

    setClient(mqttClient);

    return () => {
      mqttClient.end();
    };
  }, []);

  const handleToggle = () => {
    if (!client || !connected) return;

    const nextState = !isOn;
    setIsOn(nextState);

    const payload = nextState ? "1" : "0";
    client.publish(TOPIC, payload, { qos: 1, retain: true });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
      <div className="flex w-72 flex-col items-center rounded-3xl bg-white p-10 shadow-xl">
        <div
          className={`h-4 w-4 rounded-full mb-4 transition-all duration-500 ${isOn ? "bg-red-500 shadow-[0_0_14px_rgba(239,68,68,0.7)]" : "bg-slate-300"}`}
        />
        <h2 className="text-xl font-semibold text-slate-800">
          MQTT LED Control
        </h2>
        <p className="mt-1 mb-8 text-xs font-bold text-slate-400">
          STATUS: {connected ? (isOn ? "ON" : "OFF") : "CONNECTING..."}
        </p>
        <button
          onClick={handleToggle}
          disabled={!connected}
          className={`relative h-9 w-16 rounded-full p-1 transition-colors ${isOn ? "bg-red-500" : "bg-slate-200"} ${!connected && "opacity-50"}`}
        >
          <div
            className={`h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-300 ${isOn ? "translate-x-7" : "translate-x-0"}`}
          />
        </button>
      </div>
    </div>
  );
};

export default LedController;
