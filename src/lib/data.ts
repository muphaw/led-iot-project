import type { AnimationOption } from "@/types/data.t";

export const animationOptions = [
  {
    value: "fade",
    label: "Fade On",
    icon: "",
    desc: "Smooth brightness increase",
  },
  {
    value: "blink",
    label: "Blink",
    icon: "",
    desc: "Quick flashing effect",
  },
  {
    value: "rainbow",
    label: "Rainbow",
    icon: "",
    desc: "Color cycling effect",
  },
  {
    value: "wave",
    label: "Wave",
    icon: "",
    desc: "Flowing light movement",
  },
] satisfies AnimationOption[];
