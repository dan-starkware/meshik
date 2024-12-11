import { Player } from '../../types/player';


interface PlayerStatsProps {
    player: Player;
}

export function PlayerStats({ player }: PlayerStatsProps) {
    return (
        <div className="bg-gray-800 p-4 rounded-lg text-white">
            <h2 className="text-xl font-bold mb-2">{player.name}</h2>
            <div className="grid grid-cols-2 gap-2">
                <div className="col-span-2 text-center text-2xl font-bold mb-2">
                    Life: {player.life}
                </div>
                <div>Mana: {player.activeMana}/{player.mana}</div>
                <div>Hand: {player.hand.length}</div>
                <div>Deck: {player.deck.length}</div>
                <div>Battlefield: {player.battlefield.length}</div>
            </div>
        </div>
    );
}

