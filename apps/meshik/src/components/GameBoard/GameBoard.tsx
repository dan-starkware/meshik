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
      <div className="flex flex-wrap gap-2 justify-center">
        {player.hand.map((card, cardIndex) => (
          <Card
            key={card.id}
            card={isActivePlayer ? card : { ...card, name: 'Hidden' }}
            onClick={() => isActivePlayer && onPlayCard(player.id, cardIndex)}
            interactive={isActivePlayer}
            faceDown={!isActivePlayer}
          />
        ))}
      </div>
    </div>
  );

  const renderBattlefield = (player: PlayerType, isActivePlayer: boolean) => (
    <div className="flex-1 p-4 bg-green-800 bg-opacity-30">
      <h3 className="text-lg font-semibold mb-2 text-white">
        {isActivePlayer ? "Your Battlefield" : "Opponent's Battlefield"}
      </h3>
      <div className="flex flex-wrap gap-2">
        {player.battlefield.map(card => (
          <Card key={card.id} card={card} />
        ))}
      </div>
    </div>
  );

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


// import { Meal } from '../../types/meal';
// import { MealCard } from '../MealCard/MealCard';
// import { MealCardSkeleton } from '../MealCardSkeleton/MealCardSkeleton';

// export const UpcomingMealsTab = ({
//   isAllowedUser,
//   onConnectWallet,
//   updateMeal,
//   futureMeals,
//   pastMeals,
//   loadingAllEvents,
//   isSuccessFetchingUserEvents,
//   isWalletConnected,
// }: {
//   address?: string;
//   futureMeals: Meal[];
//   pastMeals: Meal[];
//   isAllowedUser?: boolean;
//   loadingAllEvents: boolean;
//   isSuccessFetchingUserEvents: boolean;
//   updateMeal: (mealId: string) => void;
//   onConnectWallet: () => void;
//   isWalletConnected: boolean;
// }) => {
//   if (!loadingAllEvents && !futureMeals[0]) {
//     return <div>No upcoming futureMeals to display</div>;
//   }

//   return (
//     <>
//       {loadingAllEvents ? (
//         <MealCardSkeleton />
//       ) : (
//         <MealCard
//           isSuccessFetchingUserEvents={isSuccessFetchingUserEvents}
//           updateMeal={updateMeal}
//           onConnectWallet={onConnectWallet}
//           isAllowedUser={isAllowedUser}
//           meal={futureMeals[0]}
//           isWalletConnected={isWalletConnected}
//           isNextMeal
//         />
//       )}
//       <div>
//         <h2 className="text-2xl font-bold mb-6">Future Meals</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {loadingAllEvents
//             ? Array(6)
//               .fill(null)
//               .map((_, index) => <MealCardSkeleton key={index} />)
//             : futureMeals
//               .slice(1, 7)
//               .map((meal, index) => (
//                 <MealCard
//                   isSuccessFetchingUserEvents={isSuccessFetchingUserEvents}
//                   updateMeal={updateMeal}
//                   onConnectWallet={onConnectWallet}
//                   isAllowedUser={isAllowedUser}
//                   key={meal.id ?? index}
//                   meal={meal}
//                   isWalletConnected={isWalletConnected}
//                 />
//               ))}
//         </div>
//         <h2 className="text-2xl font-bold mb-6 mt-12">Past Meals</h2>
//         <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
//           {loadingAllEvents
//             ? Array(6)
//               .fill(null)
//               .map((_, index) => <MealCardSkeleton key={index} />)
//             : pastMeals
//               .reverse()
//               .slice(0, 6)
//               .map((meal, index) => (
//                 <MealCard
//                   isSuccessFetchingUserEvents={isSuccessFetchingUserEvents}
//                   isPastMeal
//                   updateMeal={updateMeal}
//                   onConnectWallet={onConnectWallet}
//                   isAllowedUser={isAllowedUser}
//                   key={meal.id ?? index}
//                   meal={meal}
//                   isWalletConnected={isWalletConnected}
//                 />
//               ))}
//         </div>
//       </div>
//     </>
//   );
// };
