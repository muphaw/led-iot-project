import React, { useEffect, useState } from "react";
import { initializeApp } from "firebase/app";
import { getDatabase, ref, onValue, set } from "firebase/database";

// Firebase configuration from your Firebase Console
const firebaseConfig = {
  apiKey: "AIzaSyAo6MH0bU54zHZ3G6F8L6pyBIMs5C7ulrg",
  authDomain: "smart-led-91252.firebaseapp.com",
  databaseURL:
    "https://smart-led-91252-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "smart-led-91252",
  storageBucket: "smart-led-91252.firebasestorage.app",
  messagingSenderId: "794792339401",
  appId: "1:794792339401:web:593d5968ec069b91d52a18",
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const database = getDatabase(app);

const LedController = () => {
  const [isOn, setIsOn] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const controlRef = ref(database, "iot_device/control_led");

    // Sync state with Firebase automatically in real-time
    const unsubscribe = onValue(controlRef, (snapshot) => {
      const data = snapshot.val();
      setIsOn(data === 1);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleToggle = () => {
    const nextState = !isOn;
    setIsOn(nextState); // Optimistic UI update

    const controlRef = ref(database, "iot_device/control_led");
    set(controlRef, nextState ? 1 : 0).catch((error) => {
      console.error("Firebase write failed: ", error);
      setIsOn(isOn); // Revert on failure
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
        <p className="text-sm font-medium text-slate-400 animate-pulse">
          Connecting to device...
        </p>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-50 font-sans">
      <div className="flex w-72 flex-col items-center rounded-3xl bg-white p-10 shadow-xl shadow-slate-100 transition-all duration-300">
        {/* LED Status Indicator Dot */}
        <div
          className={`h-4 w-4 rounded-full mb-4 transition-all duration-500 ${
            isOn
              ? "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)] animate-pulse"
              : "bg-slate-300 shadow-sm"
          }`}
        />

        <h2 className="text-xl font-semibold text-slate-800 tracking-tight">
          Red LED Control
        </h2>

        <p className="mt-1 mb-8 text-xs font-bold uppercase tracking-widest text-slate-400">
          Device is {isOn ? "ON" : "OFF"}
        </p>

        {/* Toggle Switch Track */}
        <button
          onClick={handleToggle}
          className={`relative h-9 w-16 cursor-pointer rounded-full p-1 transition-colors duration-300 ease-in-out focus:outline-none ${
            isOn ? "bg-red-500" : "bg-slate-200"
          }`}
          aria-label="Toggle LED"
        >
          {/* Toggle Switch Thumb */}
          <div
            className={`h-7 w-7 rounded-full bg-white shadow-md transition-transform duration-300 ease-[cubic-bezier(0.4,0,0.2,1)] ${
              isOn ? "translate-x-7" : "translate-x-0"
            }`}
          />
        </button>
      </div>
    </div>
  );
};

export default LedController;
