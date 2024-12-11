import { Player } from './player';

export interface GameState {
    players: [Player, Player];
    activePlayer: number;
    turn: number;
}
