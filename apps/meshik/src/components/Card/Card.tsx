import { Card as CardType } from '../../types/card';

interface CardProps {
    card: CardType;
    onClick?: () => void;
    faceDown?: boolean;
    interactive?: boolean;
}

export function Card({ card, onClick, faceDown = false, interactive = false }: CardProps) {
    const bgColor = faceDown
        ? 'bg-gray-400'
        : card.type === 'mana'
            ? 'bg-blue-500'
            : card.type === 'creature'
                ? 'bg-red-500'
                : 'bg-purple-500';

    return (
        <div
            className={`w-24 h-32 ${bgColor} text-white border-2 border-gray-200 rounded-lg p-2 text-xs flex flex-col justify-between ${card.tapped ? 'rotate-90' : ''
                } ${interactive ? 'cursor-pointer hover:scale-105 transition-transform' : ''}`}
            onClick={interactive ? onClick : undefined}
        >
            {!faceDown ? (
                <>
                    <div className="font-bold">{card.name}</div>
                    <div>
                        {card.type === 'creature' && (
                            <div className="text-right">
                                Cost: {card.cost} | {card.power}/{card.toughness}
                            </div>
                        )}
                        {card.type === 'spell' && <div className="text-right">Cost: {card.cost}</div>}
                    </div>
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="transform -rotate-45 text-gray-600 font-bold">CARD</div>
                </div>
            )}
        </div>
    );
}

