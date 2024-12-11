'use client'

import { useState, useEffect } from 'react';
import { GameBoard } from '../GameBoard/GameBoard';
import { PlayerStats } from '../PlayerStats/PlayerStats';
import { AttackPhase } from '../AttackPhase/AttackPhase';
import { DefensePhase } from '../DefensePhase/DefensePhase';
import { StartScreen } from '../StartScreen/StartScreen';
import { GameState, } from '../../types/game_state';
import { Player } from '../../types/player';
import { generateInitialDeck, generateId } from '../../lib/utils';
import { Card as CardType } from '../../types/card';
import { CardInfo } from '../../types/card_info';
import { Button } from "@/components/ui/button"

export function Game() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [players, setPlayers] = useState<[Player | null, Player | null]>([null, null]);

  const handleGameStart = (playerIndex: number, address: string, cardLibrary: Record<string, CardInfo>) => {
    const newPlayer: Player = {
      id: `player_${playerIndex + 1}`,
      name: `Player ${playerIndex + 1}`,
      address,
      life: 20,
      hand: [],
      battlefield: [],
      deck: [], // Changed from library to deck
      mana: 0,
      activeMana: 0,
      playedManaThisTurn: false,
    };

    setPlayers(prevPlayers => {
      const newPlayers = [...prevPlayers] as [Player | null, Player | null];
      newPlayers[playerIndex] = newPlayer;
      return newPlayers;
    });

    if (playerIndex === 1) {
      initializeGame(players[0]!, newPlayer, cardLibrary);
    }
  };

  const initializeGame = (player1: Player, player2: Player, cardLibrary: Record<string, CardInfo>) => {
    const player1Deck = generateInitialDeck(cardLibrary);
    const player2Deck = generateInitialDeck(cardLibrary);

    const drawInitialHand = (deck: CardType[]): [CardType[], CardType[]] => {
      const hand = deck.slice(0, 7);
      const remainingDeck = deck.slice(7);
      return [hand, remainingDeck];
    };

    const [player1Hand, player1RemainingDeck] = drawInitialHand(player1Deck);
    const [player2Hand, player2RemainingDeck] = drawInitialHand(player2Deck);

    const initialGameState: GameState = {
      players: [
        { ...player1, deck: player1RemainingDeck, hand: player1Hand },
        { ...player2, deck: player2RemainingDeck, hand: player2Hand },
      ],
      activePlayer: 0,
      turn: 1,
      phase: 'main',
      attackingCards: [],
      defendingCards: [],
    };

    setGameState(initialGameState);
  };

  if (!gameState) {
    if (!players[0]) {
      return <StartScreen onGameStart={(address, cardInfo) => handleGameStart(0, address, cardInfo)} isFirstPlayer={true} />;
    } else if (!players[1]) {
      return <StartScreen onGameStart={(address, cardInfo) => handleGameStart(1, address, cardInfo)} isFirstPlayer={false} />;
    }
    return <div>Loading...</div>;
  }

  const drawCard = (playerId: string) => {
    setGameState(prevState => {
      if (!prevState) return null;
      const playerIndex = prevState.players.findIndex(p => p.id === playerId);
      if (playerIndex === -1 || prevState.players[playerIndex].deck.length === 0) return prevState;

      const newState = { ...prevState };
      const [drawnCard, ...remainingDeck] = newState.players[playerIndex].deck;
      if (drawnCard) {
        newState.players[playerIndex].hand.push(drawnCard);
        newState.players[playerIndex].deck = remainingDeck;
      }
      // call contract with drawnCard

      return newState;
    });
  };

  const playCard = (playerId: string, cardIndex: number) => {
    setGameState(prevState => {
      if (!prevState) return null;
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
      } else if (card.type === 'creature' && card.cost && player.activeMana >= card.cost) {
        player.battlefield.push({ ...card, id: generateId() }); // Create a new object with a new ID
        player.hand.splice(cardIndex, 1);
        player.activeMana -= card.cost;
      } else {
        return prevState; // Can't play the card
      }

      return newState;
    });
  };

  const startAttackPhase = () => {
    setGameState(prevState => {
      if (!prevState) return null;
      const activePlayer = prevState.players[prevState.activePlayer];
      const creaturesAvailableToAttack = activePlayer.battlefield.some(card => card.type === 'creature' && !card.tapped);

      if (!creaturesAvailableToAttack) {
        // If no creatures are available to attack, skip to end turn
        return {
          ...prevState,
          phase: 'main',
        };
      }

      return {
        ...prevState,
        phase: 'attack',
      };
    });
  };

  const handleAttack = (cardId: string) => {
    setGameState(prevState => {
      if (!prevState) return null;
      const newState = { ...prevState };
      const activePlayer = newState.players[newState.activePlayer];
      const attackingCard = activePlayer.battlefield.find(card => card.id === cardId);

      if (attackingCard) {
        attackingCard.attacking = !attackingCard.attacking;
        newState.attackingCards = activePlayer.battlefield.filter(card => card.attacking);
      }

      return newState;
    });
  };

  const endAttackPhase = () => {
    setGameState(prevState => {
      if (!prevState) return null;
      return {
        ...prevState,
        phase: 'defense',
      };
    });
  };

  const handleDefend = (defenderId: string, attackerId: string) => {
    setGameState(prevState => {
      if (!prevState) return null;
      const newState = { ...prevState };
      const defendingPlayer = newState.players[(newState.activePlayer + 1) % 2];
      const defendingCard = defendingPlayer.battlefield.find(card => card.id === defenderId);

      if (defendingCard && !defendingCard.tapped) {
        defendingCard.defending = attackerId;
        defendingCard.tapped = true;
        newState.defendingCards = defendingPlayer.battlefield.filter(card => card.defending);
      }

      return newState;
    });
  };

  const endDefensePhase = () => {
    setGameState(prevState => {
      if (!prevState) return null;
      const newState = { ...prevState };

      // Resolve combat
      const attackingPlayer = newState.players[newState.activePlayer];
      const defendingPlayer = newState.players[(newState.activePlayer + 1) % 2];

      // Create a copy of attacking cards to modify during combat
      const attackingCardsCopy = newState.attackingCards.map(card => ({ ...card, currentPower: card.attack, currentToughness: card.defense }));

      // Process defenders
      newState.defendingCards.forEach(defender => {
        const attacker = attackingCardsCopy.find(card => card.id === defender.defending);
        if (attacker && attacker.currentPower && attacker.currentPower > 0) {
          // Combat between attacker and defender
          if (defender.defense !== undefined && attacker.currentPower !== undefined) {
            defender.defense -= attacker.currentPower;
          }
          if (attacker.currentToughness !== undefined && defender.attack !== undefined) {
            attacker.currentToughness -= defender.attack;
          }
          // Reduce attacker's power for subsequent combats
          attacker.currentPower = 0; // Attacker's power is fully used in single combat
        }
      });

      // Deal damage to defending player from unblocked attackers
      const unblockedAttackers = attackingCardsCopy.filter(attacker =>
        !newState.defendingCards.some(defender => defender.defending === attacker.id)
      );
      unblockedAttackers.forEach(attacker => {
        defendingPlayer.life -= attacker.currentPower || 0;
      });

      // Remove destroyed creatures immediately
      const removeDestroyedCreatures = (battlefield: CardType[]) =>
        battlefield.filter(card =>
          card.type !== 'creature' || (card.defense !== undefined && card.defense > 0)
        );

      attackingPlayer.battlefield = removeDestroyedCreatures(attackingPlayer.battlefield);
      defendingPlayer.battlefield = removeDestroyedCreatures(defendingPlayer.battlefield);

      // Reset all creatures, including their stats
      const resetCreatures = (battlefield: CardType[]) =>
        battlefield.map(card => {
          if (card.type === 'creature') {
            return {
              ...card,
              attacking: false,
              defending: undefined,
              tapped: card.attacking || card.defending ? true : card.tapped,
              attack: card.attack, // Reset attack to original value
              defense: card.defense, // Reset defense to original value
            };
          }
          return card;
        });

      attackingPlayer.battlefield = resetCreatures(attackingPlayer.battlefield);
      defendingPlayer.battlefield = resetCreatures(defendingPlayer.battlefield);

      return {
        ...newState,
        phase: 'main',
        attackingCards: [],
        defendingCards: [],
      };
    });

    endTurn();
  };

  const endTurn = () => {
    setGameState(prevState => {
      if (!prevState) return null;
      const newState = { ...prevState };
      newState.activePlayer = (prevState.activePlayer + 1) % 2;
      newState.turn = prevState.activePlayer === 1 ? prevState.turn + 1 : prevState.turn;

      // Reset active mana and playedManaThisTurn for the new active player
      newState.players[newState.activePlayer].activeMana = newState.players[newState.activePlayer].mana;
      newState.players[newState.activePlayer].playedManaThisTurn = false;

      // Untap all cards for the new active player only
      newState.players[newState.activePlayer].battlefield.forEach(card => card.tapped = false);

      // Draw a card for the new active player
      const [drawnCard, ...remainingDeck] = newState.players[newState.activePlayer].deck;
      if (drawnCard) {
        newState.players[newState.activePlayer].hand.push(drawnCard);
        newState.players[newState.activePlayer].deck = remainingDeck;
      }

      return newState;
    });
  };

  const activePlayer = gameState.players[gameState.activePlayer];

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col">
      <div className="p-4 bg-gray-800">
        <h1 className="text-3xl font-bold mb-2">Magic: The Gathering Arena Clone</h1>
        <p className="text-xl">Turn: {gameState.turn} | Active Player: {activePlayer.name} | Phase: {gameState.phase}</p>
      </div>
      <div className="flex-grow flex">
        <div className="w-1/5 bg-gray-700 p-4">
          <PlayerStats player={gameState.players[0]} />
        </div>
        <div className="w-3/5 flex-grow">
          {gameState.phase === 'main' && (
            <GameBoard
              players={gameState.players}
              onPlayCard={playCard}
              activePlayer={gameState.activePlayer}
            />
          )}
          {gameState.phase === 'attack' && (
            <AttackPhase
              cards={activePlayer.battlefield.filter(card => card.type === 'creature' && !card.tapped)}
              onAttack={handleAttack}
              onEndAttack={endAttackPhase}
            />
          )}
          {gameState.phase === 'defense' && (
            <DefensePhase
              attackingCards={gameState.attackingCards}
              defendingCards={gameState.players[(gameState.activePlayer + 1) % 2].battlefield.filter(card => card.type === 'creature')}
              onDefend={handleDefend}
              onEndDefense={endDefensePhase}
            />
          )}
        </div>
        <div className="w-1/5 bg-gray-700 p-4">
          <PlayerStats player={gameState.players[1]} />
          <div className="mt-4">
            {gameState.phase === 'main' && (
              <>
                <Button
                  onClick={startAttackPhase}
                  className="w-full mb-2"
                  disabled={!activePlayer.battlefield.some(card => card.type === 'creature' && !card.tapped)}
                >
                  Start Attack Phase
                </Button>
                <Button
                  onClick={endTurn}
                  className="w-full"
                >
                  End Turn
                </Button>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

