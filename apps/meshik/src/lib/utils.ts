import { Card } from '../types/card';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

let idCounter = 0;
export const generateId = () => {
  idCounter += 1;
  return `card_${idCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

export function generateDeck(): Card[] {
  const deck: Card[] = [];

  // Generate 20 mana cards
  for (let i = 0; i < 20; i++) {
    deck.push({
      id: generateId(),
      name: 'Mana Crystal',
      type: 'mana',
      tapped: false,
    });
  }

  // Generate 20 creatures
  for (let i = 0; i < 20; i++) {
    deck.push({
      id: generateId(),
      name: 'Forest Creature',
      type: 'creature',
      cost: Math.floor(Math.random() * 5) + 1, // Random cost between 1 and 5
      power: Math.floor(Math.random() * 3) + 1, // Random power between 1 and 3
      toughness: Math.floor(Math.random() * 3) + 1, // Random toughness between 1 and 3
      tapped: false,
    });
  }

  // Shuffle the deck
  return deck.sort(() => Math.random() - 0.5);
}



export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}
