"use client";

import { useRef } from "react";
import type { GameConfig } from "../engine";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { SetupScreen } from "./components/SetupScreen";
import { I18nProvider } from "./i18n";
import { useGame, type Seat } from "./useGame";

function Screens() {
  const game = useGame();
  const last = useRef<{ config: GameConfig; seats: Seat[] } | null>(null);

  const start = (config: GameConfig, seats: Seat[]) => {
    last.current = { config, seats };
    game.start(config, seats);
  };

  if (!game.state) return <SetupScreen hasSave={game.hasSave} onStart={start} onResume={game.resume} />;

  if (game.state.phase === "finished") {
    return (
      <ResultScreen
        state={game.state}
        names={game.names}
        onHome={game.discard}
        onReplay={() => {
          if (last.current) game.start(last.current.config, last.current.seats);
          else game.discard();
        }}
      />
    );
  }

  return <GameScreen state={game.state} names={game.names} log={game.log} botTurn={game.botTurn} onAct={game.act} onLeave={game.leave} />;
}

export function GameApp() {
  return (
    <I18nProvider>
      <Screens />
    </I18nProvider>
  );
}
