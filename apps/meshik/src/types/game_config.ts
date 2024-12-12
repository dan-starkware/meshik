import { CardInfo } from './card_info';
export interface GameConfig {
    cardLibrary: Record<string, CardInfo>;
    initialLife: number;
    initialHandSize: number;
  }