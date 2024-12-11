import { Card as CardType } from '../../types/card';

interface CardProps {
    card: CardType;
    onClick?: () => void;
    faceDown?: boolean;
    interactive?: boolean;
    isOnBattlefield?: boolean;
    isUsed?: boolean;
    isAttacking?: boolean;
    isDefending?: boolean;
    isSelected?: boolean;
}

export function Card({
    card,
    onClick,
    faceDown = false,
    interactive = false,
    isOnBattlefield = false,
    isUsed = false,
    isAttacking = false,
    isDefending = false,
    isSelected = false
}: CardProps) {
    const bgColor = faceDown
        ? 'bg-gray-400'
        : card.type === 'mana'
            ? 'bg-blue-500'
            : 'bg-red-500';

    const isSmall = isOnBattlefield && card.type === 'mana';

    const cardClasses = `
    ${isSmall ? 'w-16 h-16' : 'w-36 h-48'}
    ${bgColor}
    ${isUsed ? 'opacity-50' : ''}
    ${isAttacking ? 'border-4 border-red-600' : ''}
    ${isDefending ? 'border-4 border-blue-600' : ''}
    ${isSelected ? 'ring-4 ring-yellow-400' : ''}
    text-white
    border-2
    border-gray-200
    rounded-lg
    p-2
    text-xs
    flex
    flex-col
    justify-between
    ${card.tapped ? 'rotate-90' : ''}
    ${isUsed ? 'rotate-[15deg]' : ''}
    ${interactive ? 'cursor-pointer hover:scale-105 transition-transform' : ''}
    transition-all duration-300 ease-in-out
  `;

    return (
        <div
            className={cardClasses}
            onClick={interactive ? onClick : undefined}
        >
            {!faceDown ? (
                <>
                    <div className="font-bold truncate">{card.name}</div>
                    {!isSmall && (
                        <>
                            {card.type === 'creature' && (
                                <div className="flex-grow flex items-center justify-center">
                                    <img
                                        src={`/placeholder.svg?height=100&width=100`}
                                        alt={card.name}
                                        className="w-24 h-24 object-cover rounded"
                                    />
                                </div>
                            )}
                            <div>
                                {card.type === 'creature' && (
                                    <div className="flex justify-between items-center mt-2">
                                        <span>Cost: {card.cost}</span>
                                        <span>{card.power}/{card.toughness}</span>
                                    </div>
                                )}
                            </div>
                        </>
                    )}
                </>
            ) : (
                <div className="w-full h-full flex items-center justify-center">
                    <div className="transform -rotate-45 text-gray-600 font-bold">CARD</div>
                </div>
            )}
        </div>
    );
}

