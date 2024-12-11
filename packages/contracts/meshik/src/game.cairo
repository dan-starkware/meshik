#[starknet::interface]
trait IGame<T> {
    fn join(ref self: T, seed_commit: felt252, deck: Span<Card>);
    fn deploy_and_attack(ref self: T, deploy_cards: Span<usize>, attack_cards: Span<usize>);
    fn defend(ref self: T, deploy_cards: Span<Span<usize>>);
    fn finalize(ref self: T, redeploy: Span<usize>, next_seed: felt252);
    fn win(ref self: T, seed: felt252);
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
        Vec, Map, StoragePointerWriteAccess, StoragePointerReadAccess, StorageMapWriteAccess,
    };
    use super::{Card, IGame};

    #[starknet::storage_node]
    struct Player {
        id: ContractAddress,
        life: usize,
        seed_commit: felt252,
        deck: Map<usize, Card>,
        arena: Map<usize, bool>,
        order: Map<usize, usize>,
        seeds: Vec<felt252>,
    }

    #[derive(Copy, Drop, PartialEq, Serde, starknet::Store)]
    enum TurnState {
        #[default]
        Setup,
        AwaitDeployAndAttack,
        AwaitDefend,
        AwaitFinalize,
        Done,
    }

    #[storage]
    struct Storage {
        card_count: usize,
        initial_cards: usize,
        player1: Player,
        player2: Player,
        next_actor: usize,
        turn_state: TurnState,
    }

    #[event]
    #[derive(Drop, starknet::Event)]
    pub enum Event {
        JoinedSeedAndDeck: JoinedSeedAndDeck,
        DeployAndAttack: DeployAndAttack,
        Defend: Defend,
        Finalize: Finalize,
        Win: Win,
    }

    #[derive(Drop, starknet::Event)]
    pub struct JoinedSeedAndDeck {
        pub player_id: usize,
        pub deck: Span<Card>,
        pub seed_commit: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct DeployAndAttack {
        pub player_id: usize,
        pub deploy_cards: Span<usize>,
        pub attack_cards: Span<usize>,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Defend {
        pub player_id: usize,
        pub deploy_cards: Span<Span<usize>>,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Finalize {
        pub player_id: usize,
        pub redeploy: Span<usize>,
        pub next_seed: felt252,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Win {
        pub player_id: usize,
        pub seed: felt252,
    }

    #[constructor]
    fn constructor(
        ref self: ContractState,
        other: ContractAddress,
        life: usize,
        initial_cards: usize,
        seed_commit: felt252,
        deck: Span<Card>,
    ) {
        self.card_count.write(deck.len());
        self.initial_cards.write(initial_cards);
        self.player1.id.write(starknet::get_caller_address());
        self.player2.id.write(other);
        self.player1.life.write(life);
        self.player2.life.write(life);
        self.player1.seed_commit.write(seed_commit);
        let mut i = 0;
        let deck_var = self.player1.deck;
        for card in deck {
            deck_var.write(i, *card);
            i += 1;
        };

        self.emit(JoinedSeedAndDeck {
            player_id: 1,
            deck: deck,
            seed_commit: seed_commit,
        });

    }

    #[abi(embed_v0)]
    impl ABIImpl of IGame<ContractState> {

        fn join(ref self: ContractState, seed_commit: felt252, deck: Span<Card>) {
            assert!(self.turn_state.read() == TurnState::Setup);
            assert!(
                self.player2.id.read() == starknet::get_caller_address(),
                "Only configured second player can join",
            );
            let mut i = 0;
            let deck_var = self.player2.deck;
            for card in deck {
                deck_var.write(i, *card);
                i += 1;
            };

            self.player2.seed_commit.write(seed_commit);
            self.next_actor.write(1);

            self.emit(JoinedSeedAndDeck {
                player_id: 2,
                deck: deck,
                seed_commit: seed_commit,
            });
        }

        fn deploy_and_attack(
            ref self: ContractState, deploy_cards: Span<usize>, attack_cards: Span<usize>,
        ) {
            assert!(self.turn_state.read() == TurnState::AwaitDeployAndAttack);
            let attacker = if self.next_actor.read() == 1 {
                self.player1
            } else {
                self.player2
            };
            assert!(attacker.id.read() == starknet::get_caller_address());

            self.turn_state.write(TurnState::AwaitDefend);

            self.emit(DeployAndAttack {
                player_id: self.next_actor.read(),
                deploy_cards: deploy_cards,
                attack_cards: attack_cards,
            });

            self.switch();
        }

        fn defend(ref self: ContractState, deploy_cards: Span<Span<usize>>) {
            assert!(self.turn_state.read() == TurnState::AwaitDefend);
            let defender = if self.next_actor.read() == 1 {
                self.player1
            } else {
                self.player2
            };
            assert!(defender.id.read() == starknet::get_caller_address());

            self.turn_state.write(TurnState::AwaitFinalize);

            self.emit(Defend {
                player_id: self.next_actor.read(),
                deploy_cards: deploy_cards,
            });

            self.switch();
        }

        fn finalize(ref self: ContractState, redeploy: Span<usize>, next_seed: felt252) {
            assert!(self.turn_state.read() == TurnState::AwaitFinalize);
            let attacker = if self.next_actor.read() == 1 {
                self.player1
            } else {
                self.player2
            };
            assert!(attacker.id.read() == starknet::get_caller_address());

            self.turn_state.write(TurnState::AwaitDeployAndAttack);

            self.emit(Finalize {
                player_id: self.next_actor.read(),
                redeploy: redeploy,
                next_seed: next_seed,
            });

            self.switch();
        }

        fn win(ref self: ContractState, seed: felt252) {
            assert!(self.turn_state.read() == TurnState::AwaitFinalize);
            let attacker = if self.next_actor.read() == 1 {
                self.player1
            } else {
                self.player2
            };
            assert!(attacker.id.read() == starknet::get_caller_address());

            self.turn_state.write(TurnState::AwaitDeployAndAttack);

            self.emit(Win {
                player_id: self.next_actor.read(),
                seed: seed,
            });

            self.switch();
        }

    }

    #[generate_trait]
    impl Helper of HelperTrait {
        fn switch(ref self: ContractState) {
            self.next_actor.write(if self.next_actor.read() == 1 {
                2
            } else {
                1
            });
        }
    }
}
