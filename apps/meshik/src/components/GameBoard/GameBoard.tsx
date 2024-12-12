import { Card } from '../Card/Card';
import { Player as PlayerType } from '../../types/player';

interface GameBoardProps {
  players: [PlayerType, PlayerType];
  onPlayCard: (playerId: string, cardIndex: number) => void;
  activePlayer: number;
}

export function GameBoard({ players, onPlayCard, activePlayer }: GameBoardProps) {
  const [player1, player2] = players;

  const renderHand = (player: PlayerType, isActivePlayer: boolean) => (
    <div className="p-4 bg-gray-800 bg-opacity-50">
      <h3 className="text-lg font-semibold mb-2 text-white">
        {isActivePlayer ? "Your Hand" : "Opponent's Hand"}
      </h3>
      <div className="flex flex-wrap gap-2 justify-start">
        {isActivePlayer ? (
          player.hand.map((card, cardIndex) => (
            <div key={card.id} className="w-36 h-48">
              <Card
                card={card}
                onClick={() => onPlayCard(player.id, cardIndex)}
                interactive={true}
                isOnBattlefield={false}
              />
            </div>
          ))
        ) : (
          Array(player.hand.length).fill(null).map((_, index) => (
            <div key={index} className="w-36 h-48">
              <Card
                card={{ id: `opponent-card-${index}`, type: 'unknown' } as any}
                faceDown={true}
                isOnBattlefield={false}
              />
            </div>
          ))
        )}
      </div>
    </div>
  );

  const renderBattlefield = (player: PlayerType, isActivePlayer: boolean) => {
    const creatures = player.battlefield.filter(card => card.type === 'creature');
    const lands = player.battlefield.filter(card => card.type === 'mana');
    const usedMana = player.mana - player.activeMana;
    const unusedLands = lands.slice(0, lands.length - usedMana);
    const usedLands = lands.slice(lands.length - usedMana);

    return (
      <div className="flex-1 p-4 bg-green-800 bg-opacity-30">
        <h3 className="text-lg font-semibold mb-2 text-white">
          {isActivePlayer ? "Your Battlefield" : "Opponent's Battlefield"}
        </h3>
        <div className="flex">
          <div className="flex-grow">
            <h4 className="text-md font-semibold mb-2 text-white">Creatures</h4>
            <div className="flex flex-wrap gap-2">
              {creatures.map(card => (
                <Card key={card.id} card={card} isOnBattlefield={true} />
              ))}
            </div>
          </div>
          <div className="w-1/4 ml-4">
            <h4 className="text-md font-semibold mb-2 text-white">Lands</h4>
            <div className="flex">
              <div className="relative h-32">
                {unusedLands.map((card, index) => (
                  <Card
                    key={card.id}
                    card={card}
                    isOnBattlefield={true}
                    isUsed={false}
                  />
                ))}
              </div>
              <div className="relative h-32 ml-2">
                {usedLands.map((card, index) => (
                  <Card
                    key={card.id}
                    card={card}
                    isOnBattlefield={true}
                    isUsed={true}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  const renderDeck = (player: PlayerType, isActivePlayer: boolean) => (
    <div className="p-4 bg-gray-800 bg-opacity-50">
      <h3 className="text-lg font-semibold mb-2 text-white">
        {isActivePlayer ? "Your Deck" : "Opponent's Deck"}
      </h3>
      <div className="flex items-center justify-center h-48 w-36 bg-gray-700 rounded-lg">
        <span className="text-2xl font-bold">{player.deck.length}</span>
      </div>
    </div>
  );

  return (
    <div className="flex flex-col h-full">
      {renderHand(player2, false)}
      {renderDeck(player2, false)}
      <div className="flex-grow flex flex-col">
        {renderBattlefield(player2, false)}
        {renderBattlefield(player1, true)}
      </div>
      {renderHand(player1, true)}
      {renderDeck(player1, true)}
    </div>
  );
}
