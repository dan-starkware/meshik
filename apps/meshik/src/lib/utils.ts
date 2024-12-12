import { Card } from '../types/card';
import { CardInfo } from '../types/card_info';
import { clsx, type ClassValue } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

let idCounter = 0;
export const generateId = () => {
  idCounter += 1;
  return `card_${idCounter}_${Math.random().toString(36).substr(2, 9)}`;
};

export function generateInitialDeck(cardLibrary: Record<string, CardInfo>): Card[] {
  const deck: Card[] = [];

  // Convert the cardLibrary object into an array of entries
  const cardEntries = Object.entries(cardLibrary);

  // Shuffle the card entries
  const shuffledEntries = cardEntries.sort(() => Math.random() - 0.5);

  // Create the deck
  shuffledEntries.forEach(([id, cardInfo]) => {
    const card: Card = {
      ...cardInfo,
      id: generateId(),
      tapped: false,
      type: cardInfo.resources === 1 && cardInfo.cost === 0 && cardInfo.attack === 0 && cardInfo.defense === 0 ? 'mana' : 'creature'
    };
    deck.push(card);
  });

  return deck;
}
