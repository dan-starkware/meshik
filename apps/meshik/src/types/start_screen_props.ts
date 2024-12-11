import { CardInfo } from './card_info';

export interface StartScreenProps {
  onGameStart: (address: string, cardLibrary: Record<string, CardInfo>) => void;
  isFirstPlayer: boolean;
}

