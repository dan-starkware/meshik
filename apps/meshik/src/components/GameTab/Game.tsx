'use client'

import { useState, useEffect } from 'react';
import { GameBoard } from '../GameBoard/GameBoard';
import { PlayerStats } from '../PlayerStats/PlayerStats';
import { generateDeck, generateId } from '../../lib/utils';
import { GameState, } from '../../types/game_state';
import { Player } from '../../types/player';
import { Card as CardType } from '../../types/card';
import { Button } from "@/components/ui/button"

export function Game() {
  const [gameState, setGameState] = useState<GameState>({
    players: [
      { id: '1', name: 'Player 1', life: 20, hand: [], battlefield: [], library: [], mana: 0, activeMana: 0, playedManaThisTurn: false },
      { id: '2', name: 'Player 2', life: 20, hand: [], battlefield: [], library: [], mana: 0, activeMana: 0, playedManaThisTurn: false },
    ],
    activePlayer: 0,
    turn: 1,
  });

  useEffect(() => {
    // Initialize the game
    const player1Deck = generateDeck();
    const player2Deck = generateDeck();

    setGameState(prevState => ({
      ...prevState,
      players: [
        { ...prevState.players[0], library: player1Deck, hand: player1Deck.slice(0, 7) },
        { ...prevState.players[1], library: player2Deck, hand: player2Deck.slice(0, 7) },
      ],
    }));
  }, []);

  const drawCard = (playerId: string) => {
    setGameState(prevState => {
      const playerIndex = prevState.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1 || prevState.players[playerIndex].library.length === 0) return prevState;

      const newState = { ...prevState };
      const [drawnCard, ...remainingLibrary] = newState.players[playerIndex].library;
      newState.players[playerIndex].hand.push(drawnCard);
      newState.players[playerIndex].library = remainingLibrary;

      return newState;
    });
  };

  const playCard = (playerId: string, cardIndex: number) => {
    setGameState(prevState => {
      const playerIndex = prevState.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1 || playerIndex !== prevState.activePlayer) return prevState;

      const newState = { ...prevState };
      const player = newState.players[playerIndex];
      const card = player.hand[cardIndex];

      if (card.type === 'mana') {
        if (!player.playedManaThisTurn) {
          player.battlefield.push({ ...card, id: generateId() }); // Create a new object with a new ID
          player.hand.splice(cardIndex, 1);
          player.mana += 1;
          player.activeMana += 1;
          player.playedManaThisTurn = true;
        } else {
          return prevState; // Can't play more than one mana per turn
        }
      } else if (card.cost && player.activeMana >= card.cost) {
        player.battlefield.push({ ...card, id: generateId() }); // Create a new object with a new ID
        player.hand.splice(cardIndex, 1);
        player.activeMana -= card.cost;
      } else {
        return prevState; // Can't play the card
      }

      return newState;
    });
  };

  const endTurn = () => {
    setGameState(prevState => {
      const newState = { ...prevState };
      newState.activePlayer = (prevState.activePlayer + 1) % 2;
      newState.turn = prevState.activePlayer === 1 ? prevState.turn + 1 : prevState.turn;

      // Reset active mana, playedManaThisTurn, and untap all cards for the new active player
      newState.players[newState.activePlayer].activeMana = newState.players[newState.activePlayer].mana;
      newState.players[newState.activePlayer].playedManaThisTurn = false;
      newState.players[newState.activePlayer].battlefield.forEach(card => card.tapped = false);

      // Draw a card for the new active player
      const [drawnCard, ...remainingLibrary] = newState.players[newState.activePlayer].library;
      newState.players[newState.activePlayer].hand.push(drawnCard);
      newState.players[newState.activePlayer].library = remainingLibrary;

      return newState;
    });
  };

  const activePlayer = gameState.players[gameState.activePlayer];

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col">
      <div className="p-4 bg-gray-800">
        <h1 className="text-3xl font-bold mb-2">Magic: The Gathering Arena Clone</h1>
        <p className="text-xl">Turn: {gameState.turn} | Active Player: {activePlayer.name}</p>
      </div>
      <div className="flex-grow flex">
        <div className="w-1/5 bg-gray-700 p-4">
          <PlayerStats player={gameState.players[0]} />
        </div>
        <div className="w-3/5 flex-grow">
          <GameBoard
            players={gameState.players}
            onPlayCard={playCard}
            activePlayer={gameState.activePlayer}
          />
        </div>
        <div className="w-1/5 bg-gray-700 p-4">
          <PlayerStats player={gameState.players[1]} />
          <div className="mt-4">
            <Button
              onClick={endTurn}
              className="w-full"
            >
              End Turn
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}

