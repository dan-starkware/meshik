import { Card } from "./card";
export interface Player {
    id: string;
    name: string;
    address: string;
    life: number;
    hand: Card[];
    battlefield: Card[];
    deck: Card[]; // Changed from library to deck
    mana: number;
    activeMana: number;
    playedManaThisTurn: boolean;
}
