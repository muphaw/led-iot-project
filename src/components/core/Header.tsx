// Header.tsx
import React from "react";

export type HeaderProps = {
  activeMode: "Manual" |  "Sound";  // only these three allowed
  setActiveMode: (mode: "Manual" | "Sound") => void;
};

const Header: React.FC<HeaderProps> = ({ activeMode, setActiveMode }) => {
  const modes: HeaderProps["activeMode"][] = ["Manual",  "Sound"];

  return (
    <div className="flex justify-center gap-8  bg-gray-900">
      {modes.map((mode) => (
        <div
          key={mode}
          onClick={() => setActiveMode(mode)}
          className={`cursor-pointer px-4 py-3 relative text-white font-semibold ${
            activeMode === mode ? "" : "text-gray-400"
          }`}
        >
          {mode}
          {activeMode === mode && (
            <span className="absolute bottom-0 left-0 w-full h-1 bg-green-500 rounded-t-full"></span>
          )}
        </div>
      ))}
    </div>
  );
};

export default Header;