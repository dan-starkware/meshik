import { Card } from "./card";

export interface Player {
    id: string;
    name: string;
    life: number;
    hand: Card[];
    battlefield: Card[];
    library: Card[]
    mana: number;
    activeMana: number;
    playedManaThisTurn: boolean;
}
