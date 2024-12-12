import { CardInfo } from './card_info';

export interface Card extends CardInfo {
    id: string;
    tapped: boolean;
    attacking?: boolean;
    defending?: string;
    type: 'mana' | 'creature';
  }
