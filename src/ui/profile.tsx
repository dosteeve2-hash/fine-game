"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from "react";

/** Chapters of the "book": the interface reveals one money idea per finished game. */
export const chapterCount = 8;
export type Chapter = 1 | 2 | 3 | 4 | 5 | 6 | 7 | 8;
export const chapters: Chapter[] = [1, 2, 3, 4, 5, 6, 7, 8];

export const chapterOf = {
  loans: 4,
  insurance: 5,
  circle: 6
} as const;

export interface Profile {
  gamesPlayed: number;
  expert: boolean;
  seenIntros: number[];
  seenScenes: string[];
  soundHint: boolean;
  iosInstallHint: boolean;
  lastFinished: number | null;
}

export interface Features {
  chapter: Chapter;
  loans: boolean;
  insurance: boolean;
  circle: boolean;
}

export interface Finished {
  completed: Chapter;
  unlocked: Chapter;
  fresh: boolean;
}

const storageKey = "fine.profile.v1";
const blank: Profile = { gamesPlayed: 0, expert: false, seenIntros: [], seenScenes: [], soundHint: false, iosInstallHint: false, lastFinished: null };

function readProfile(): Profile {
  try {
    const raw = window.localStorage.getItem(storageKey);
    if (!raw) return blank;
    const parsed = JSON.parse(raw) as Partial<Profile>;
    const numbers = (value: unknown): number[] => (Array.isArray(value) ? value.filter((item): item is number => typeof item === "number") : []);
    const strings = (value: unknown): string[] => (Array.isArray(value) ? value.filter((item): item is string => typeof item === "string") : []);
    return {
      gamesPlayed: typeof parsed.gamesPlayed === "number" && parsed.gamesPlayed >= 0 ? Math.floor(parsed.gamesPlayed) : 0,
      expert: parsed.expert === true,
      seenIntros: numbers(parsed.seenIntros),
      seenScenes: strings(parsed.seenScenes),
      soundHint: parsed.soundHint === true,
      iosInstallHint: parsed.iosInstallHint === true,
      lastFinished: typeof parsed.lastFinished === "number" ? parsed.lastFinished : null
    };
  } catch {
    return blank;
  }
}

function writeProfile(profile: Profile) {
  try {
    window.localStorage.setItem(storageKey, JSON.stringify(profile));
  } catch {
    return;
  }
}

export function unlockedChapter(profile: Profile): Chapter {
  if (profile.expert) return 8;
  return Math.min(chapterCount, 2 + profile.gamesPlayed) as Chapter;
}

export function featuresFor(chapter: Chapter): Features {
  return { chapter, loans: chapter >= chapterOf.loans, insurance: chapter >= chapterOf.insurance, circle: chapter >= chapterOf.circle };
}

interface ProfileValue {
  profile: Profile;
  ready: boolean;
  features: Features;
  setExpert: (expert: boolean) => void;
  seeIntro: (chapter: number) => void;
  /** Returns true the first time a scene kind is shown, then remembers it. */
  firstScene: (kind: string) => boolean;
  seeHint: (hint: "soundHint" | "iosInstallHint") => void;
  finishGame: (gameKey: number) => Finished;
}

const ProfileContext = createContext<ProfileValue | null>(null);

export function ProfileProvider({ children }: { children: ReactNode }) {
  const [profile, setProfile] = useState<Profile>(blank);
  const [ready, setReady] = useState(false);
  const current = useRef<Profile>(blank);

  useEffect(() => {
    const loaded = readProfile();
    current.current = loaded;
    setProfile(loaded);
    setReady(true);
  }, []);

  const commit = useCallback((next: Profile) => {
    current.current = next;
    writeProfile(next);
    setProfile(next);
  }, []);

  const setExpert = useCallback((expert: boolean) => commit({ ...current.current, expert }), [commit]);

  const seeIntro = useCallback((chapter: number) => {
    const now = current.current;
    if (now.seenIntros.includes(chapter)) return;
    commit({ ...now, seenIntros: [...now.seenIntros, chapter] });
  }, [commit]);

  const firstScene = useCallback((kind: string) => {
    const now = current.current;
    if (now.seenScenes.includes(kind)) return false;
    commit({ ...now, seenScenes: [...now.seenScenes, kind] });
    return true;
  }, [commit]);

  const seeHint = useCallback((hint: "soundHint" | "iosInstallHint") => {
    const now = current.current;
    if (now[hint]) return;
    commit({ ...now, [hint]: true });
  }, [commit]);

  const finishGame = useCallback((gameKey: number): Finished => {
    const now = current.current;
    const before = unlockedChapter(now);
    if (now.lastFinished === gameKey) {
      const shown = Math.max(1, before - 1) as Chapter;
      return { completed: shown, unlocked: before, fresh: false };
    }
    const next = { ...now, gamesPlayed: now.gamesPlayed + 1, lastFinished: gameKey };
    commit(next);
    return { completed: before, unlocked: unlockedChapter(next), fresh: true };
  }, [commit]);

  const features = useMemo(() => featuresFor(unlockedChapter(profile)), [profile]);

  const value = useMemo<ProfileValue>(
    () => ({ profile, ready, features, setExpert, seeIntro, firstScene, seeHint, finishGame }),
    [profile, ready, features, setExpert, seeIntro, firstScene, seeHint, finishGame]
  );

  return <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>;
}

export function useProfile(): ProfileValue {
  const value = useContext(ProfileContext);
  if (!value) throw new Error("ProfileProvider is missing");
  return value;
}
