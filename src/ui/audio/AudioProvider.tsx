"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { audio, type AudioSettings, type AudioStatus, type Sfx } from "./engine";

interface AudioValue extends AudioSettings {
  status: AudioStatus;
  primed: boolean;
  unlock: () => void;
  play: (name: Sfx) => void;
  test: () => Promise<AudioStatus>;
  toggleMute: () => void;
  toggleMusic: () => void;
  setVolume: (volume: number) => void;
  setMusicVolume: (volume: number) => void;
  setSfxVolume: (volume: number) => void;
}

const AudioContextValue = createContext<AudioValue | null>(null);

export function AudioProvider({ children }: { children: ReactNode }) {
  const [settings, setSettings] = useState<AudioSettings>(audio.settings);
  const [status, setStatus] = useState<AudioStatus>("locked");
  const [primed, setPrimed] = useState(false);

  useEffect(() => {
    setSettings(audio.load());
    audio.listen();
    const refresh = () => {
      setStatus(audio.status());
      setPrimed(audio.hasPrimed());
      setSettings(audio.settings);
    };
    refresh();
    return audio.subscribe(refresh);
  }, []);

  const unlock = useCallback(() => audio.unlock(), []);
  const play = useCallback((name: Sfx) => audio.play(name), []);
  const test = useCallback(() => audio.test(), []);
  const toggleMute = useCallback(() => {
    const next = audio.update({ muted: !audio.settings.muted });
    audio.prime();
    setSettings(next);
  }, []);
  const toggleMusic = useCallback(() => {
    const next = audio.update({ music: !audio.settings.music });
    audio.prime();
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
    () => ({ ...settings, status, primed, unlock, play, test, toggleMute, toggleMusic, setVolume, setMusicVolume, setSfxVolume }),
    [settings, status, primed, unlock, play, test, toggleMute, toggleMusic, setVolume, setMusicVolume, setSfxVolume]
  );

  return <AudioContextValue.Provider value={value}>{children}</AudioContextValue.Provider>;
}

export function useAudio(): AudioValue {
  const value = useContext(AudioContextValue);
  if (!value) throw new Error("AudioProvider is missing");
  return value;
}
