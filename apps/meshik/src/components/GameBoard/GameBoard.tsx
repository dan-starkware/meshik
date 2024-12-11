import { Card } from "../Card/Card";
import { Player as PlayerType } from '../../types/player'

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
        {player.hand.map((card, cardIndex) => (
          <div key={card.id} className="w-36 h-48"> {/* Updated size */}
            <Card
              card={isActivePlayer ? card : { ...card, name: 'Hidden' }}
              onClick={() => isActivePlayer && onPlayCard(player.id, cardIndex)}
              interactive={isActivePlayer}
              faceDown={!isActivePlayer}
              isOnBattlefield={false}
            />
          </div>
        ))}
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

  return (
    <div className="flex flex-col h-full">
      {renderHand(player1, activePlayer === 0)}
      <div className="flex-grow flex flex-col">
        {renderBattlefield(player1, activePlayer === 0)}
        {renderBattlefield(player2, activePlayer === 1)}
      </div>
      {renderHand(player2, activePlayer === 1)}
    </div>
  );
}

