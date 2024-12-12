import { Player } from './player';
import { Card } from './card';

export interface GameState {
    players: [Player, Player];
    activePlayer: number;
    turn: number;
    phase: 'main' | 'attack' | 'defense' | 'resolution';
    attackingCards: Card[];
    defendingCards: Card[];
    gameAddress: string;
  }
