"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { audio, type AudioSettings, type Sfx } from "./engine";

interface AudioValue extends AudioSettings {
  unlock: () => void;
  play: (name: Sfx) => void;
  toggleMute: () => void;
  toggleMusic: () => void;
  setVolume: (volume: number) => void;
}

const AudioContextValue = createContext<AudioValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>({ muted: false, music: true, volume: 0.7 });

  useEffect(() => {
    setSettings(audio.load());
  }, []);

  const unlock = useCallback(() => audio.unlock(), []);
  const play = useCallback((name: Sfx) => audio.play(name), []);
  const toggleMute = useCallback(() => {
    audio.unlock();
    setSettings(audio.update({ muted: !audio.settings.muted }));
  }, []);
  const toggleMusic = useCallback(() => {
    audio.unlock();
    setSettings(audio.update({ music: !audio.settings.music }));
  }, []);
  const setVolume = useCallback((volume: number) => {
    setSettings(audio.update({ volume, muted: volume === 0 }));
  }, []);

  const value = useMemo<AudioValue>(() => ({ ...settings, unlock, play, toggleMute, toggleMusic, setVolume }), [settings, unlock, play, toggleMute, toggleMusic, setVolume]);

  return <AudioContextValue.Provider value={value}>{children}</AudioContextValue.Provider>;
}

export function useAudio(): AudioValue {
  const value = useContext(AudioContextValue);
  if (!value) throw new Error("AudioProvider is missing");
  return value;
}
