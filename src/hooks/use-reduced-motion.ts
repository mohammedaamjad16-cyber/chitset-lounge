import { useEffect, useState } from "react";
import { useSettings } from "@/lib/settings/settings-store";

/**
 * True when the OS asks for reduced motion, or the player turned animations off
 * in Settings. Gameplay feedback stays visible — only movement is trimmed.
 */
export function useReducedMotionPref(): boolean {
  const settings = useSettings();
  const [systemPref, setSystemPref] = useState(false);

  useEffect(() => {
    const mql = window.matchMedia("(prefers-reduced-motion: reduce)");
    const onChange = () => setSystemPref(mql.matches);
    onChange();
    mql.addEventListener("change", onChange);
    return () => mql.removeEventListener("change", onChange);
  }, []);

  return systemPref || settings.reducedMotion || !settings.animationsEnabled;
}
