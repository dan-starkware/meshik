import { Card as CardType } from '../../types/card';
import { Card } from '../Card/Card';

interface AttackPhaseProps {
    cards: CardType[];
    onAttack: (cardId: string) => void;
    onEndAttack: () => void;
}

export function AttackPhase({ cards, onAttack, onEndAttack }: AttackPhaseProps) {
    return (
        <div className="p-4 bg-red-800 bg-opacity-50">
            <h3 className="text-lg font-semibold mb-2 text-white">Select Attackers</h3>
            <div className="flex flex-wrap gap-2 mb-4">
                {cards.map(card => (
                    <Card
                        key={card.id}
                        card={card}
                        onClick={() => onAttack(card.id)}
                        interactive={true}
                        isAttacking={card.attacking}
                    />
                ))}
            </div>
            <button
                className="bg-red-500 hover:bg-red-700 text-white font-bold py-2 px-4 rounded"
                onClick={onEndAttack}
            >
                End Attack Phase
            </button>
        </div>
    );
}

