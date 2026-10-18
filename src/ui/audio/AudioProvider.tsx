"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { audio, type AudioSettings, type Sfx } from "./engine";

interface AudioValue extends AudioSettings {
  unlock: () => void;
  play: (name: Sfx) => void;
  toggleMute: () => void;
  toggleMusic: () => void;
  setVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
}

const AudioContextValue = createContext<AudioValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(audio.settings);

  useEffect(() => {
    setSettings(audio.load());
  }, []);

  const unlock = useCallback(() => audio.unlock(), []);
  const play = useCallback((name: Sfx) => audio.play(name), []);
  const toggleMute = useCallback(() => {
    const next = audio.update({ muted: !audio.settings.muted });
    audio.unlock();
    setSettings(next);
  }, []);
  const toggleMusic = useCallback(() => {
    const next = audio.update({ music: !audio.settings.music });
    audio.unlock();
    setSettings(next);
  }, []);
  const setVolume = useCallback((volume: number) => {
    setSettings(audio.update({ volume, muted: volume === 0 }));
  }, []);
  const setMusicVolume = useCallback((musicVolume: number) => {
    setSettings(audio.update({ musicVolume, music: musicVolume > 0 }));
  }, []);
  const setSfxVolume = useCallback((sfxVolume: number) => {
    setSettings(audio.update({ sfxVolume }));
  }, []);

  const value = useMemo<AudioValue>(
    () => ({ ...settings, unlock, play, toggleMute, toggleMusic, setVolume, setMusicVolume, setSfxVolume }),
    [settings, unlock, play, toggleMute, toggleMusic, setVolume, setMusicVolume, setSfxVolume]
  );

  return <AudioContextValue.Provider value={value}>{children}</AudioContextValue.Provider>;
}

export function useAudio(): AudioValue {
  const value = useContext(AudioContextValue);
  if (!value) throw new Error("AudioProvider is missing");
  return value;
}
