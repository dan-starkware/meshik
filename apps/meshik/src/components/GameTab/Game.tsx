'use client'

import { useState, useEffect } from 'react';
import { GameBoard } from '../GameBoard/GameBoard';
import { PlayerStats } from '../PlayerStats/PlayerStats';
import { AttackPhase } from '../AttackPhase/AttackPhase';
import { DefensePhase } from '../DefensePhase/DefensePhase';
import { StartScreen } from '../StartScreen/StartScreen';
import { generateInitialDeck, generateId } from '../../lib/utils';
import { GameState } from '../../types/game_state';
import { Player } from '../../types/player';
import { Card as CardType} from '../../types/card';
import { CardInfo } from '../../types/card_info';
import { GameConfig } from '../../types/game_config';
import { Button } from "@/components/ui/button"

export function Game() {
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const generateGameAddress = () => {
    return `0x${Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('')}`;
  };

  const handleGameStart = async (gameConfig: GameConfig) => {
    const { cardLibrary, initialLife, initialHandSize } = gameConfig;
    const gameAddress = generateGameAddress();

    const player1: Player = {
      id: 'player1',
      name: 'Player 1',
      life: initialLife,
      hand: [],
      battlefield: [],
      deck: [],
      mana: 0,
      activeMana: 0,
      playedManaThisTurn: false,
    };

    const player2: Player = {
      id: 'player2',
      name: 'Player 2',
      life: initialLife,
      hand: [],
      battlefield: [],
      deck: [],
      mana: 0,
      activeMana: 0,
      playedManaThisTurn: false,
    };

    setIsLoading(true);

    initializeGame(player1, player2, cardLibrary, initialHandSize, gameAddress);
    setIsLoading(false);
  };

  const handleGameJoin = (address: string, cardLibrary: Record<string, CardInfo>) => {
    const initialLife = 20; // Default life total
    const initialHandSize = 7; // Default hand size
    const player1: Player = {
      id: 'player1',
      name: 'Player 1',
      life: initialLife,
      hand: [],
      battlefield: [],
      deck: [],
      mana: 0,
      activeMana: 0,
      playedManaThisTurn: false,
    };

    const player2: Player = {
      id: 'player2',
      name: 'Player 2',
      life: initialLife,
      hand: [],
      battlefield: [],
      deck: [],
      mana: 0,
      activeMana: 0,
      playedManaThisTurn: false,
    };

    initializeGame(player1, player2, cardLibrary, initialHandSize, address);
  };

  const initializeGame = (humanPlayer: Player, aiPlayer: Player, cardLibrary: Record<string, CardInfo>, initialHandSize: number, gameAddress: string) => {
    const initializePlayer = (player: Player) => {
      const deck = generateInitialDeck(cardLibrary);
      const [hand, remainingDeck] = drawInitialHand(deck, initialHandSize);
      return {
        ...player,
        hand,
        deck: remainingDeck,
      };
    };

    const initializedHumanPlayer = initializePlayer(humanPlayer);
    const initializedAIPlayer = initializePlayer(aiPlayer);

    const initialGameState: GameState = {
      players: [initializedHumanPlayer, initializedAIPlayer],
      activePlayer: 0, // Human player starts
      turn: 1,
      phase: 'main',
      attackingCards: [],
      defendingCards: [],
      gameAddress,
    };

    setGameState(initialGameState);
  };

  const drawInitialHand = (deck: CardType[], initialHandSize: number): [CardType[], CardType[]] => {
    const hand = deck.slice(0, initialHandSize);
    const remainingDeck = deck.slice(initialHandSize);
    return [hand, remainingDeck];
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
          player.battlefield.push({...card, id: generateId()});
          player.hand.splice(cardIndex, 1);
          player.mana += 1;
          player.activeMana += 1;
          player.playedManaThisTurn = true;
        } else {
          return prevState; // Can't play more than one mana per turn
        }
      } else if (card.type === 'creature' && card.cost && player.activeMana >= card.cost) {
        player.battlefield.push({...card, id: generateId()});
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

      const attackingPlayer = newState.players[newState.activePlayer];
      const defendingPlayer = newState.players[(newState.activePlayer + 1) % 2];

      const attackingCardsCopy = newState.attackingCards.map(card => ({...card, currentPower: card.attack, currentToughness: card.defense}));

      newState.defendingCards.forEach(defender => {
        const attacker = attackingCardsCopy.find(card => card.id === defender.defending);
        if (attacker) {
          if (defender.defense !== undefined && attacker.currentPower !== undefined) {
            defender.defense -= attacker.currentPower;
          }
          if (attacker.currentToughness !== undefined && defender.attack !== undefined) {
            attacker.currentToughness -= defender.attack;
          }
        }
      });

      const unblockedAttackers = attackingCardsCopy.filter(attacker =>
        !newState.defendingCards.some(defender => defender.defending === attacker.id)
      );
      unblockedAttackers.forEach(attacker => {
        defendingPlayer.life -= attacker.attack || 0;
      });

      const removeDestroyedCreatures = (battlefield: CardType[]) =>
        battlefield.filter(card =>
          card.type !== 'creature' || (card.defense !== undefined && card.defense > 0)
        );

      attackingPlayer.battlefield = removeDestroyedCreatures(attackingPlayer.battlefield);
      defendingPlayer.battlefield = removeDestroyedCreatures(defendingPlayer.battlefield);

      // Update the attacking cards on the battlefield
      attackingPlayer.battlefield = attackingPlayer.battlefield.map(card => {
        const updatedCard = attackingCardsCopy.find(c => c.id === card.id);
        return updatedCard || card;
      });

      const resetCreatures = (battlefield: CardType[]) =>
        battlefield.map(card => {
          if (card.type === 'creature') {
            return {
              ...card,
              attacking: false,
              defending: undefined,
              tapped: card.attacking || card.defending ? true : card.tapped,
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
      newState.turn += 1;

      // Reset active mana and playedManaThisTurn for the new active player
      const nextPlayer = newState.players[newState.activePlayer];
      if (nextPlayer) {
        nextPlayer.activeMana = nextPlayer.mana;
        nextPlayer.playedManaThisTurn = false;

        // Untap all cards for the new active player only
        nextPlayer.battlefield.forEach(card => card.tapped = false);

        // Draw a card for Player 1 at the start of their turn, including the first turn
        if (newState.activePlayer === 0 && nextPlayer.deck.length > 0) {
          const [drawnCard, ...remainingDeck] = nextPlayer.deck;
          nextPlayer.hand.push(drawnCard);
          nextPlayer.deck = remainingDeck;
        }
      }

      return newState;
    });
  };

  if (!gameState) {
    return <StartScreen onGameStart={handleGameStart} onGameJoin={handleGameJoin} />;
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-green-900 text-white flex items-center justify-center">
        <p className="text-2xl">Initializing game...</p>
      </div>
    );
  }

  const currentPlayer = gameState.players[gameState.activePlayer];
  const opponentPlayer = gameState.players[(gameState.activePlayer + 1) % 2];

  return (
    <div className="min-h-screen bg-green-900 text-white flex flex-col">
      <div className="p-4 bg-gray-800">
        <h1 className="text-3xl font-bold mb-2">Magic: The Gathering Arena Clone</h1>
        <p className="text-xl">Turn: {gameState.turn} | Active Player: {currentPlayer.name} | Phase: {gameState.phase}</p>
        <p className="text-sm">Game Address: {gameState.gameAddress}</p>
      </div>
      <div className="flex-grow flex flex-col">
        <div className="bg-gray-700 p-4">
          <PlayerStats player={opponentPlayer} />
        </div>
        <div className="flex-grow">
          <GameBoard
            players={gameState.players}
            onPlayCard={playCard}
            activePlayer={gameState.activePlayer}
          />
          {gameState.activePlayer === 0 && gameState.phase === 'attack' && (
            <AttackPhase
              cards={currentPlayer.battlefield.filter(card => card.type === 'creature' && !card.tapped)}
              onAttack={handleAttack}
              onEndAttack={endAttackPhase}
            />
          )}
          {gameState.activePlayer === 1 && gameState.phase === 'defense' && (
            <DefensePhase
              attackingCards={gameState.attackingCards}
              defendingCards={currentPlayer.battlefield.filter(card => card.type === 'creature')}
              onDefend={handleDefend}
              onEndDefense={endDefensePhase}
            />
          )}
        </div>
        <div className="bg-gray-700 p-4">
          <PlayerStats player={currentPlayer} />
          <div className="mt-4">
            {gameState.activePlayer === 0 && gameState.phase === 'main' && (
              <>
                <Button
                  onClick={startAttackPhase}
                  className="w-full mb-2"
                  disabled={!currentPlayer.battlefield.some(card => card.type === 'creature' && !card.tapped)}
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
            {gameState.activePlayer === 1 && gameState.phase === 'main' && (
              <Button
                onClick={endTurn}
                className="w-full"
              >
                End Opponent's Turn
              </Button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
