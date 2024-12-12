import { GameConfig } from './game_config';
import { CardInfo } from './card_info';

export interface StartScreenProps {
  onGameStart: (gameConfig: GameConfig) => void;
  onGameJoin: (address: string, cardLibrary: Record<string, CardInfo>) => void;
}
