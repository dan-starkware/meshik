#[starknet::interface]
trait IGame<T> {
    fn join(ref self: T, seed_commit: felt252, deck: Span<Card>);
    fn deploy_and_attack(
        ref self: T, deploy_cards: Span<(usize, usize)>, attack_cards: Span<usize>,
    );
    fn defend(ref self: T, defenders: Span<Span<usize>>);
    fn finalize(ref self: T, redeploy: Span<(usize, usize)>, next_seed: felt252);
    fn win(ref self: T, seed: felt252);

    fn validate_and_get_order(self: @T, seed: felt252, actor: usize) -> Array<usize>;
    fn full_state(self: @T) -> FullState;
}

#[derive(Drop, Serde, Debug)]
struct FullState {
    player1: PlayerState,
    player2: PlayerState,
    next_actor: usize,
    turn_state: TurnState,
    attackers: Array<usize>,
}

#[derive(Drop, Serde, Debug)]
struct PlayerState {
    cards: Array<Card>,
    arena: Array<usize>,
    hand_size: usize,
    life: usize,
}


#[derive(Copy, Drop, PartialEq, Serde, starknet::Store, Debug)]
enum TurnState {
    #[default]
    Setup,
    AwaitDeployAndAttack,
    AwaitDefend,
    AwaitFinalize,
    Done,
}

#[derive(Copy, Drop, Serde, starknet::Store, Debug)]
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
        Map, Vec, StoragePathEntry, StorageMapReadAccess, StoragePointerWriteAccess,
        StoragePointerReadAccess, StorageMapWriteAccess, MutableVecTrait, VecTrait,
    };

    use core::num::traits::SaturatingSub;
    use core::dict::{Felt252DictEntryTrait, Felt252Dict};

    use super::{Card, IGame, FullState, PlayerState, TurnState};

    #[starknet::storage_node]
    struct ShortUsizeVec {
        length: usize,
        values: Map<usize, usize>,
    }

    #[starknet::storage_node]
    struct Player {
        id: ContractAddress,
        life: usize,
        deck: Map<usize, Card>,
        arena: ShortUsizeVec,
        seed_commit: felt252,
        deck_pulled_cards: usize,
        discarded: usize,
        card_to_order: Map<usize, usize>,
        order_to_card: Map<usize, usize>,
        seeds: Vec<felt252>,
    }

    #[storage]
    struct Storage {
        card_count: usize,
        initial_cards: usize,
        player1: Player,
        player2: Player,
        next_actor: usize,
        turn_state: TurnState,
        attack: ShortUsizeVec,
        remaining_resources: usize,
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
        pub deploy_cards: Span<(usize, usize)>,
        pub attack_cards: Span<usize>,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Defend {
        pub player_id: usize,
        pub defenders: Span<Span<usize>>,
    }

    #[derive(Drop, starknet::Event)]
    pub struct Finalize {
        pub player_id: usize,
        pub redeploy: Span<(usize, usize)>,
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
        player1: ContractAddress,
        player2: ContractAddress,
        life: usize,
        initial_cards: usize,
        seed_commit: felt252,
        deck: Span<Card>,
    ) {
        assert!(initial_cards <= deck.len());
        self.card_count.write(deck.len());
        self.initial_cards.write(initial_cards);
        self.player1.id.write(player1);
        self.player2.id.write(player2);
        self.player1.life.write(life);
        self.player2.life.write(life);
        self.player1.seed_commit.write(seed_commit);
        self.player1.deck_pulled_cards.write(initial_cards);
        self.player2.deck_pulled_cards.write(initial_cards);
        let mut i = 0;
        let deck_var = self.player1.deck;
        for card in deck {
            deck_var.write(i, *card);
            i += 1;
        };

        self.emit(JoinedSeedAndDeck { player_id: 1, deck: deck, seed_commit: seed_commit });
    }

    #[abi(embed_v0)]
    impl ABIImpl of IGame<ContractState> {
        fn join(ref self: ContractState, seed_commit: felt252, deck: Span<Card>) {
            assert!(self.turn_state.read() == TurnState::Setup);
            assert!(
                self.player2.id.read() == starknet::get_caller_address(),
                "Only configured second player can join",
            );
            assert!(self.card_count.read() == deck.len());
            let mut i = 0;
            let deck_var = self.player2.deck;
            for card in deck {
                deck_var.write(i, *card);
                i += 1;
            };

            self.turn_state.write(TurnState::AwaitDeployAndAttack);
            self.next_actor.write(1);
            self.player2.seed_commit.write(seed_commit);
            self.player1.seeds.append().write(seed_commit);

            self.emit(JoinedSeedAndDeck { player_id: 2, deck: deck, seed_commit: seed_commit });
        }

        fn deploy_and_attack(
            ref self: ContractState, deploy_cards: Span<(usize, usize)>, attack_cards: Span<usize>,
        ) {
            assert!(self.turn_state.read() == TurnState::AwaitDeployAndAttack);
            let attacker = if self.next_actor.read() == 1 {
                self.player1
            } else {
                self.player2
            };
            assert!(attacker.id.read() == starknet::get_caller_address());
            let arena_size = attacker.arena.length.read();
            let mut resources = 0;
            for i in 0..arena_size {
                resources += attacker.arena.values.read(i);
            };
            let mut cost = 0;
            let mut found_resource_card = false;
            let card_count = self.card_count.read();
            let mut deck_pulled_cards = attacker.deck_pulled_cards.read();
            if deck_pulled_cards < card_count {
                deck_pulled_cards += 1;
                attacker.deck_pulled_cards.write(deck_pulled_cards);
            }
            for (card, order) in deploy_cards {
                assert!(*card < card_count);
                assert!(*order < deck_pulled_cards);
                assert!(attacker.card_to_order.read(*card) == 0);
                assert!(attacker.order_to_card.read(*order) == 0);
                attacker.card_to_order.write(*card, *order + 1);
                attacker.order_to_card.write(*order, *card + 1);
                let e = attacker.deck.entry(*card);
                let card_resources = e.resources.read();
                if card_resources != 0 {
                    assert!(!found_resource_card, "Activated 2 resource cards.");
                    found_resource_card = true;
                    resources += card_resources;
                }
                cost += e.cost.read();
            };
            assert!(cost <= resources);
            self.remaining_resources.write(resources - cost);
            let mut attack_length = 0;
            let mut used_attackers: Felt252Dict<bool> = Default::default();
            for card_in_arena in attack_cards {
                assert!(*card_in_arena < arena_size);
                self.attack.values.write(attack_length, *card_in_arena);
                attack_length += 1;

                let (e, is_used) = used_attackers.entry((*card_in_arena).into());
                assert!(!is_used, "Attacker used twice");
                used_attackers = e.finalize(true);
            };
            self.attack.length.write(attack_length);
            let mut new_arena_size = arena_size;
            for (card, _) in deploy_cards {
                attacker.arena.values.write(new_arena_size, *card);
                new_arena_size += 1;
            };
            attacker.arena.length.write(new_arena_size);

            self.turn_state.write(TurnState::AwaitDefend);

            self
                .emit(
                    DeployAndAttack {
                        player_id: self.next_actor.read(), deploy_cards, attack_cards,
                    },
                );

            self.switch();
        }
        fn defend(ref self: ContractState, defenders: Span<Span<usize>>) {
            assert!(self.turn_state.read() == TurnState::AwaitDefend);
            let (defender, attacker) = if self.next_actor.read() == 1 {
                (self.player1, self.player2)
            } else {
                (self.player2, self.player1)
            };
            assert!(defender.id.read() == starknet::get_caller_address());
            assert!(defenders.len() == self.attack.length.read());
            let mut damage: usize = 0;
            let mut dead_attackers: Felt252Dict<bool> = Default::default();
            let mut dead_defenders: Felt252Dict<bool> = Default::default();
            let mut used_defenders: Felt252Dict<bool> = Default::default();
            for i in 0..defenders.len() {
                let specific_defenders = *defenders[i];
                let attacker_in_arena = self.attack.values.read(i);
                let attacker_in_deck = attacker.arena.values.read(attacker_in_arena);
                let specific_attacker = attacker.deck.entry(attacker_in_deck);
                if specific_defenders.is_empty() {
                    damage += specific_attacker.attack.read();
                    continue;
                }
                let mut attacker_attack = specific_attacker.attack.read();
                let mut attacker_defense = specific_attacker.defense.read();
                for defender_in_arena in specific_defenders {
                    let (e, is_used) = used_defenders.entry((*defender_in_arena).into());
                    assert!(!is_used, "Defender used twice");
                    used_defenders = e.finalize(true);
                    let defender_in_deck = defender.arena.values.read(*defender_in_arena);
                    let specific_defender = defender.deck.entry(defender_in_deck);
                    let defender_attack = specific_defender.attack.read();
                    let defender_defense = specific_defender.defense.read();
                    let defender_life = defender_defense.saturating_sub(attacker_attack);
                    attacker_defense = attacker_defense.saturating_sub(defender_attack);
                    if defender_life == 0 {
                        dead_defenders.insert((*defender_in_arena).into(), true);
                    }
                    if attacker_defense == 0 {
                        dead_attackers.insert(attacker_in_arena.into(), true);
                        break;
                    }
                    if defender_life != 0 {
                        break;
                    }
                    attacker_attack -= defender_defense;
                }
            };
            let mut writer = 0;
            for reader in 0..attacker.arena.length.read() {
                if !dead_attackers.get(reader.into()) {
                    attacker.arena.values.write(writer, attacker.arena.values.read(reader));
                    writer += 1;
                }
            };
            attacker.arena.length.write(writer);
            let mut writer = 0;
            for reader in 0..defender.arena.length.read() {
                if !dead_defenders.get(reader.into()) {
                    defender.arena.values.write(writer, defender.arena.values.read(reader));
                    writer += 1;
                }
            };
            defender.arena.length.write(writer);
            defender.life.write(defender.life.read().saturating_sub(damage));

            self.turn_state.write(TurnState::AwaitFinalize);

            self.emit(Defend { player_id: self.next_actor.read(), defenders });

            self.switch();
        }

        fn finalize(ref self: ContractState, redeploy: Span<(usize, usize)>, next_seed: felt252) {
            assert!(self.turn_state.read() == TurnState::AwaitFinalize);
            let (attacker, defender) = if self.next_actor.read() == 1 {
                (self.player1, self.player2)
            } else {
                (self.player2, self.player1)
            };
            assert!(attacker.id.read() == starknet::get_caller_address());
            assert!(defender.life.read() != 0);
            defender.seeds.append().write(next_seed);

            let card_count = self.card_count.read();
            let deck_pulled_cards = attacker.deck_pulled_cards.read();
            let mut cost = 0;
            let mut new_arena_size = attacker.arena.length.read();
            for (card, order) in redeploy {
                assert!(*card < card_count);
                assert!(*order < deck_pulled_cards);
                assert!(attacker.card_to_order.read(*card) == 0);
                assert!(attacker.order_to_card.read(*order) == 0);
                attacker.card_to_order.write(*card, *order + 1);
                attacker.order_to_card.write(*order, *card + 1);
                cost += attacker.deck.entry(*card).cost.read();
                attacker.arena.values.write(new_arena_size, *card);
            };
            attacker.arena.length.write(new_arena_size);
            assert!(cost <= self.remaining_resources.read());

            self.turn_state.write(TurnState::AwaitDeployAndAttack);

            self.emit(Finalize { player_id: self.next_actor.read(), redeploy, next_seed });

            self.switch();
        }

        fn win(ref self: ContractState, seed: felt252) {
            assert!(self.turn_state.read() == TurnState::AwaitFinalize);
            let (attacker, defender) = if self.next_actor.read() == 1 {
                (self.player1, self.player2)
            } else {
                (self.player2, self.player1)
            };
            assert!(attacker.id.read() == starknet::get_caller_address());
            assert!(defender.life.read() == 0);
            self.validate_and_get_order(seed, self.next_actor.read());

            self.turn_state.write(TurnState::Done);

            self.emit(Win { player_id: self.next_actor.read(), seed: seed });

            self.switch();
        }

        fn validate_and_get_order(
            self: @ContractState, seed: felt252, actor: usize,
        ) -> Array<usize> {
            let actor = if actor == 1 {
                self.player1
            } else {
                self.player2
            };
            let mut order = array![];
            let actor = actor.deref();
            assert!(core::pedersen::pedersen(seed, seed) == actor.seed_commit.read());
            let mut allocated: Felt252Dict<bool> = Default::default();
            let initial_cards = self.initial_cards.read();
            let mut initial_cards_seed = core::pedersen::pedersen(seed, actor.seeds.at(0).read());
            let card_count = self.card_count.read();
            let card_count_as_u256: u256 = card_count.into();
            for i in 0..initial_cards {
                let card_idx = seed_to_idx(
                    ref allocated, ref initial_cards_seed, card_count_as_u256,
                );
                let expected_card_index = actor.order_to_card.read(i);
                assert!(expected_card_index == 0 || expected_card_index == card_idx + 1);
                order.append(card_idx);
            };
            let mut seed_idx = 1;
            while let Option::Some(seed_ptr) = actor.seeds.get(seed_idx) {
                seed_idx += 1;
                let mut card_seed = core::pedersen::pedersen(seed, seed_ptr.read());
                let card_idx = seed_to_idx(ref allocated, ref card_seed, card_count_as_u256);
                let expected_card_index = actor.order_to_card.read(order.len());
                assert!(expected_card_index == 0 || expected_card_index == card_idx + 1);
                order.append(card_idx);
                if order.len() == card_count {
                    break;
                }
            };
            order
        }

        fn full_state(self: @ContractState) -> FullState {
            let card_count = self.card_count.read();
            let mut cards = array![];
            for i in 0..card_count {
                cards.append(self.player1.deck.entry(i).read());
            };
            let arena_length = self.player1.arena.length.read();
            let mut arena = array![];
            for i in 0..arena_length {
                arena.append(self.player1.arena.values.read(i));
            };

            let player1 = PlayerState {
                cards,
                arena,
                hand_size: self.player1.deck_pulled_cards.read() - self.player1.discarded.read() - arena_length,
                life: self.player1.life.read(),
            };

            let mut cards = array![];
            for i in 0..card_count {
                cards.append(self.player2.deck.entry(i).read());
            };
            let arena_length = self.player2.arena.length.read();
            let mut arena = array![];
            for i in 0..arena_length {
                arena.append(self.player2.arena.values.read(i));
            };
            let player2 = PlayerState {
                cards,
                arena,
                hand_size: self.player2.deck_pulled_cards.read() - self.player2.discarded.read() - arena_length,
                life: self.player2.life.read(),
            };
            let mut attackers = array![];
            let turn_state = self.turn_state.read();
            if turn_state == TurnState::AwaitDefend {
                let attackers_length = self.attack.length.read();
                for i in 0..attackers_length {
                    attackers.append(self.attack.values.read(i));
                }
            }
            FullState {
                player1, player2, next_actor: self.next_actor.read(), turn_state, attackers,
            }
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
    fn seed_to_idx(ref allocated: Felt252Dict<bool>, ref seed: felt252, count: u256) -> usize {
        loop {
            let v: u256 = seed.into() % count;
            let idx: usize = v.try_into().unwrap();
            seed = core::pedersen::pedersen(seed, seed);
            let (e, existing) = allocated.entry(idx.into());
            allocated = e.finalize(true);
            if !existing {
                break idx;
            }
        }
    }
}

#[cfg(test)]
mod test {
    use starknet::syscalls::deploy_syscall;
    use starknet::SyscallResultTrait;
    use super::{game, IGameSafeDispatcher, IGameSafeDispatcherTrait, Card};

    #[test]
    fn test_game() {
        let seed0 = 0;
        let seed1 = 1;
        let (contract_address, _) = deploy_syscall(
            game::TEST_CLASS_HASH.try_into().unwrap(),
            0,
            [
                0, // player1.
                0, // player2.
                5, // life.
                2, // initial_cards.
                core::pedersen::pedersen(seed0, seed0), // seed_commit.
                7, // card count.
                0, // cost0.
                1, // resources0.
                0, // attack0.
                0, // defense0.
                0, // cost1.
                1, // resources1.
                0, // attack1.
                0, // defense1.
                0, // cost2.
                1, // resources2.
                0, // attack2.
                0, // defense2.
                1, // cost3.
                0, // resources3.
                1, // attack3.
                2, // defense3.
                1, // cost4.
                0, // resources4.
                2, // attack4.
                1, // defense4.
                2, // cost5.
                0, // resources5.
                2, // attack5.
                3, // defense5.
                2, // cost6.
                0, // resources6.
                3, // attack6.
                2 // defense6.
            ]
                .span(),
            false,
        )
            .unwrap_syscall();
        let game = IGameSafeDispatcher { contract_address };
        game
            .join(
                core::pedersen::pedersen(seed1, seed1),
                [
                    Card { cost: 0, resources: 1, attack: 0, defense: 0 },
                    Card { cost: 0, resources: 1, attack: 0, defense: 0 },
                    Card { cost: 0, resources: 1, attack: 0, defense: 0 },
                    Card { cost: 1, resources: 0, attack: 2, defense: 1 },
                    Card { cost: 1, resources: 0, attack: 1, defense: 2 },
                    Card { cost: 2, resources: 0, attack: 3, defense: 1 },
                    Card { cost: 2, resources: 0, attack: 1, defense: 3 },
                ]
                    .span(),
            )
            .unwrap_syscall();
        let order = game.validate_and_get_order(seed0, 1).unwrap_syscall();
        game.deploy_and_attack([(*order[1], 1)].span(), [].span()).unwrap_syscall();
        game.defend([].span()).unwrap_syscall();
        game.finalize([].span(), 2).unwrap_syscall();
        game.deploy_and_attack([].span(), [].span()).unwrap_syscall();
        game.defend([].span()).unwrap_syscall();
        game.finalize([].span(), 3).unwrap_syscall();
        let order = game.validate_and_get_order(seed0, 1).unwrap_syscall();
        game.deploy_and_attack([(*order[2], 2), (*order[0], 0)].span(), [].span()).unwrap_syscall();
        game.defend([].span()).unwrap_syscall();
        game.finalize([].span(), 4).unwrap_syscall();
        println!("{:?}", game.full_state());
    }
}
