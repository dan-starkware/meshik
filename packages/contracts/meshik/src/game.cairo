#[starknet::interface]
trait IGame<T> {
    fn join(ref self: T, seed_commit: felt252, deck: Span<Card>);
    fn deploy_and_attack(ref self: T, deploy_cards: Span<usize>, attack_cards: Span<usize>);
    fn defend(ref self: T, deploy_cards: Span<Span<usize>>);
    fn finalize(ref self: T, redeploy: Span<usize>, next_seed: felt252);
}

#[derive(Copy, Drop, Serde, starknet::Store)]
struct Card {
    cost: usize,
    resources: usize,
    attack: usize,
    defense: usize,
}

#[starknet::contract]
mod game {
    use starknet::ContractAddress;
    use starknet::storage::{
        Map, StoragePointerWriteAccess, StoragePointerReadAccess, StorageMapWriteAccess,
    };
    use super::{Card, IGame};

    #[starknet::storage_node]
    struct Player {
        id: ContractAddress,
        seed_commit: felt252,
        deck: Map<usize, Card>,
        arena: Map<usize, bool>,
        order: Map<usize, usize>,
    }

    #[derive(Copy, Drop, Serde, starknet::Store)]
    enum TurnState {
        #[default]
        AwaitingPlayer,
        AwaitDeployAndAttack,
        AwaitDefense,
        AwaitRedeploy,
        Done,
    }

    #[storage]
    struct Storage {
        card_count: usize,
        player1: Player,
        player2: Player,
        next_actor: ContractAddress,
        state: TurnState,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState, other: ContractAddress, seed_commit: felt252, deck: Span<Card>,
    ) {
        self.player1.id.write(starknet::get_caller_address());
        self.card_count.write(deck.len());
        let mut i = 0;
        let deck_var = self.player1.deck;
        for card in deck {
            deck_var.write(i, *card);
            i += 1;
        };
        self.player2.id.write(other);
    }

    #[abi(embed_v0)]
    impl ABIImpl of IGame<ContractState> {
        fn join(ref self: ContractState, seed_commit: felt252, deck: Span<Card>) {
            assert!(self.next_actor.read() == starknet::contract_address_const::<0>());
            assert!(self.player2.id.read() == starknet::get_caller_address());
            let mut i = 0;
            let deck_var = self.player2.deck;
            for card in deck {
                deck_var.write(i, *card);
                i += 1;
            };

            self.next_actor.write(self.player1.id.read());
        }
        fn deploy_and_attack(
            ref self: ContractState, deploy_cards: Span<usize>, attack_cards: Span<usize>,
        ) {
            let caller = starknet::get_caller_address();
            assert!(self.next_actor.read() == caller);

            self.switch(caller);
        }
        fn defend(ref self: ContractState, deploy_cards: Span<Span<usize>>) {
            let caller = starknet::get_caller_address();
            assert!(self.next_actor.read() == caller);

            self.switch(caller);
        }
        fn finalize(ref self: ContractState, redeploy: Span<usize>, next_seed: felt252) {
            let caller = starknet::get_caller_address();
            assert!(self.next_actor.read() == caller);

            self.switch(caller);
        }
    }

    #[generate_trait]
    impl Helper of HelperTrait {
        fn switch(ref self: ContractState, caller: ContractAddress) {
            let player1_id = self.player1.id.read();
            self
                .next_actor
                .write(if caller == player1_id {
                    self.player2.id.read()
                } else {
                    player1_id
                });
        }
    }
}
