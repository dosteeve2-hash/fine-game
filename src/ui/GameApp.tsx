"use client";

import { useRef } from "react";
import type { GameConfig } from "../engine";
import { AudioProvider } from "./audio/AudioProvider";
import { GameScreen } from "./components/GameScreen";
import { ResultScreen } from "./components/ResultScreen";
import { SetupScreen } from "./components/SetupScreen";
import { I18nProvider } from "./i18n";
import { ProfileProvider } from "./profile";
import { useGame, type Seat } from "./useGame";

function Screens() {
  const game = useGame();
  const last = useRef<{ config: GameConfig; seats: Seat[] } | null>(null);

  const start = (config: GameConfig, seats: Seat[]) => {
    last.current = { config, seats };
    game.start(config, seats);
  };

  const screen = !game.view || !game.truth ? "setup" : game.view.phase === "finished" ? "result" : "game";

  return (
    <div key={screen} className="screen-in">
        {screen === "setup" && <SetupScreen hasSave={game.hasSave} onStart={start} onResume={game.resume} />}
        {screen === "result" && game.view && (
          <ResultScreen
            state={game.view}
            names={game.names}
            pawns={game.pawns}
            gameId={game.gameId}
            onHome={game.discard}
            onReplay={() => {
              if (last.current) game.start(last.current.config, last.current.seats);
              else game.discard();
            }}
          />
        )}
        {screen === "game" && game.view && game.truth && (
          <GameScreen
            truth={game.truth}
            view={game.view}
            stage={game.stage}
            names={game.names}
            pawns={game.pawns}
            log={game.log}
            ledger={game.ledger}
            statements={game.statements}
            busy={game.busy}
            thinking={game.thinking}
            onAct={action => void game.act(action)}
            onLeave={game.leave}
            onDismissCard={game.dismissCard}
            onDismissScene={game.dismissScene}
            onDismissStatement={game.dismissStatement}
            onDismissNotice={game.dismissNotice}
            onCoinsDone={game.removeCoins}
          />
        )}
    </div>
  );
}

export function GameApp() {
  return (
    <I18nProvider>
      <AudioProvider>
        <ProfileProvider>
          <Screens />
        </ProfileProvider>
      </AudioProvider>
    </I18nProvider>
  );
}
