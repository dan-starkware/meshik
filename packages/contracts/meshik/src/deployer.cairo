#[starknet::interface]
trait IDeployer<T> {
    fn deploy(
        ref self: T, class_hash: starknet::ClassHash, salt: felt252, payload: Span<felt252>,
    ) -> (starknet::ContractAddress, Span<felt252>);
}

#[starknet::contract]
mod deployer {
    use starknet::ContractAddress;


    use super::{IDeployer};


    #[storage]
    struct Storage {}

    #[abi(embed_v0)]
    impl ABIImpl of IDeployer<ContractState> {
        fn deploy(
            ref self: ContractState,
            class_hash: starknet::ClassHash,
            salt: felt252,
            payload: Span<felt252>,
        ) -> (ContractAddress, Span<felt252>) {
            starknet::syscalls::deploy_syscall(class_hash, salt, payload, false).unwrap()
        }
    }
}
