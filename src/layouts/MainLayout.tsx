// App.jsx
import Header from "@/components/core/Header";
import Home from "@/pages/Home";
import Sound from "@/pages/Sound";
import  { useState } from "react";

type Mode = "Manual" | "Sound";

const MainLayout = () => {
  const [activeMode, setActiveMode] = useState<Mode>("Manual");

  return (
    <div className="bg-gray-900">
      <Header activeMode={activeMode} setActiveMode={setActiveMode} />

      {activeMode === "Manual" && <Home />}       
      {activeMode === "Sound" && <Sound />} 
    </div>
  );
};

export default MainLayout