export interface Card {
    id: string;
    name: string;
    type: 'creature' | 'mana' // | 'spell';
    cost?: number;
    power?: number;
    toughness?: number;
    tapped: boolean;
    attacking?: boolean;
    defending?: string; // ID of the card it's defending against
}
