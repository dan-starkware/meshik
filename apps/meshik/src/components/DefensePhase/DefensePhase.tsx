import React, { useState } from 'react';
import { Card as CardType } from '../../types/card';
import { Card } from '../Card/Card';
import { Button } from "@/components/ui/button"

interface DefensePhaseProps {
    attackingCards: CardType[];
    defendingCards: CardType[];
    onDefend: (defenderId: string, attackerId: string) => void;
    onEndDefense: () => void;
}

export function DefensePhase({ attackingCards, defendingCards, onDefend, onEndDefense }: DefensePhaseProps) {
    const [selectedDefender, setSelectedDefender] = useState<string | null>(null);
    const [defendersByAttacker, setDefendersByAttacker] = useState<{ [key: string]: string[] }>({});

    const handleDefenderClick = (defenderId: string) => {
        const defender = defendingCards.find(card => card.id === defenderId);
        if (defender && !defender.tapped) {
            setSelectedDefender(prevDefender => prevDefender === defenderId ? null : defenderId);
        }
    };

    const handleAttackerClick = (attackerId: string) => {
        if (selectedDefender) {
            setDefendersByAttacker(prev => ({
                ...prev,
                [attackerId]: [...(prev[attackerId] || []), selectedDefender]
            }));
            onDefend(selectedDefender, attackerId);
            setSelectedDefender(null);
        }
    };

    const availableDefenders = defendingCards.filter(card =>
        !card.tapped && !Object.values(defendersByAttacker).flat().includes(card.id)
    );
    const availableAttackers = attackingCards.filter(card => !defendersByAttacker[card.id] || defendersByAttacker[card.id].length < availableDefenders.length);

    return (
        <div className="p-4 bg-blue-800 bg-opacity-50">
            <h3 className="text-lg font-semibold mb-2 text-white">Select Defenders</h3>
            <div className="flex flex-wrap gap-2 mb-4">
                <div className="w-full">
                    <h4 className="text-md font-semibold mb-2 text-white">Your Creatures</h4>
                    {defendingCards.map(card => (
                        <Card
                            key={card.id}
                            card={card}
                            onClick={() => handleDefenderClick(card.id)}
                            interactive={!card.tapped}
                            isSelected={selectedDefender === card.id}
                        />
                    ))}
                </div>
                <div className="w-full mt-4">
                    <h4 className="text-md font-semibold mb-2 text-white">Attacking Creatures</h4>
                    {attackingCards.map(card => (
                        <div key={card.id} className="mb-2">
                            <Card
                                card={card}
                                onClick={() => handleAttackerClick(card.id)}
                                interactive={!!selectedDefender}
                                isAttacking={true}
                            />
                            {defendersByAttacker[card.id] && defendersByAttacker[card.id].length > 0 && (
                                <div className="ml-4 mt-1">
                                    <span className="text-sm text-white">Blocked by:</span>
                                    {defendersByAttacker[card.id].map(defenderId => {
                                        const defender = defendingCards.find(c => c.id === defenderId);
                                        return defender ? (
                                            <Card
                                                key={defenderId}
                                                card={defender}
                                                isDefending={true}
                                                className="inline-block ml-2 transform scale-75"
                                            />
                                        ) : null;
                                    })}
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>
            <Button
                onClick={onEndDefense}
                className="w-full"
            >
                End Defense Phase
            </Button>
        </div>
    );
}

