import { useCallback, useEffect, useState } from "react";

export interface UserPreferences {
  voiceEnabled: boolean;
  voiceVolume: number;
  voiceRate: number;
  voiceLang: string;
  lastFloor: number;
  debugMode: boolean;
  hasCompletedOnboarding: boolean;
  hasUnlockedVoice: boolean;
}

const STORAGE_KEY = "srix-prefs";

export const defaultPreferences: UserPreferences = {
  voiceEnabled: true,
  voiceVolume: 1,
  voiceRate: 0.92,
  voiceLang: "en-US",
  lastFloor: 0,
  debugMode: false,
  hasCompletedOnboarding: false,
  hasUnlockedVoice: false,
};

function loadPreferences(): UserPreferences {
  if (typeof window === "undefined") {
    return defaultPreferences;
  }

  try {
    const stored = window.localStorage.getItem(STORAGE_KEY);
    if (!stored) return defaultPreferences;
    const parsed = JSON.parse(stored) as Partial<UserPreferences>;
    return {
      ...defaultPreferences,
      ...parsed,
    };
  } catch {
    return defaultPreferences;
  }
}

export default function useUserPreferences() {
  const [prefs, setPrefs] = useState<UserPreferences>(defaultPreferences);
  const [isReady, setIsReady] = useState(false);

  useEffect(() => {
    setPrefs(loadPreferences());
    setIsReady(true);
  }, []);

  const savePreferences = useCallback((next: UserPreferences) => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
    setPrefs(next);
  }, []);

  const updatePref = useCallback<
    <K extends keyof UserPreferences>(key: K, value: UserPreferences[K]) => void
  >((key, value) => {
    setPrefs((previous) => {
      const next = {
        ...previous,
        [key]: value,
      };
      if (typeof window !== "undefined") {
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      }
      return next;
    });
  }, []);

  const resetPrefs = useCallback(() => {
    if (typeof window === "undefined") return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(defaultPreferences));
    setPrefs(defaultPreferences);
  }, []);

  return {
    prefs,
    updatePref,
    resetPrefs,
    isReady,
  };
}
