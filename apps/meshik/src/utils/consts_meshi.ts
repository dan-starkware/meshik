import { Abi } from '@starknet-react/core';

/// A prefix to be added to the src path of resources (images, etc.) in order to correctly load them.
/// Production mode is when deploying the app to a server, github pages in our case.
export const SrcPrefix =
  import.meta.env.MODE === 'production' ? '/meshik-app' : '';


/// The class hash of the game contract.
export const CLASS_HASH =
  '0x07ab6114dcf085b74554be1b673d85253e584aaf1782cc8820297e3f03bf2e7c';

/// The address of the deployed contract.
export const CONTRACT_ADDRESS =
  '0x3c750f8e92ffda68beb7ec7655739bd03cc81493294a4ff027f270517fbc7e9';

/// Universal deployer contract address
export const UNIVERSAL_DEPLOYER_CONTRACT_ADDRESS =
  '0x0684f06d5582efe407c70da50854f33e39c07b5009523330bdcfbbb4b99330b0';

/// The ABI of the deployed contract. Can be found on starkscan.
/// For the above contract, the ABI can be found at:
/// https://sepolia.starkscan.co/contract/0x049c75609bb077a9427bc26a9935472ec75e5508ed216ef7f7ad2693397deebc
/// And the ABI is accessible under the 'Class Code/History' tab -> 'Copy ABI Code' button.
export const ABI_UNIVERSAL_DEPLOYER = [
  {
    "name": "ABIImpl",
    "type": "impl",
    "interface_name": "meshik::deployer::IDeployer"
  },
  {
    "name": "core::array::Span::<core::felt252>",
    "type": "struct",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::felt252>"
      }
    ]
  },
  {
    "name": "meshik::deployer::IDeployer",
    "type": "interface",
    "items": [
      {
        "name": "deploy",
        "type": "function",
        "inputs": [
          {
            "name": "class_hash",
            "type": "core::starknet::class_hash::ClassHash"
          },
          {
            "name": "salt",
            "type": "core::felt252"
          },
          {
            "name": "payload",
            "type": "core::array::Span::<core::felt252>"
          }
        ],
        "outputs": [
          {
            "type": "(core::starknet::contract_address::ContractAddress, core::array::Span::<core::felt252>)"
          }
        ],
        "state_mutability": "external"
      }
    ]
  },
  {
    "kind": "enum",
    "name": "meshik::deployer::deployer::Event",
    "type": "event",
    "variants": []
  }
] as const satisfies Abi;

export const ABI = [
  {
    "type": "impl",
    "name": "ABIImpl",
    "interface_name": "meshik::game::IGame"
  },
  {
    "type": "struct",
    "name": "meshik::game::Card",
    "members": [
      {
        "name": "cost",
        "type": "core::integer::u32"
      },
      {
        "name": "resources",
        "type": "core::integer::u32"
      },
      {
        "name": "attack",
        "type": "core::integer::u32"
      },
      {
        "name": "defense",
        "type": "core::integer::u32"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::array::Span::<meshik::game::Card>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<meshik::game::Card>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::integer::u32>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::integer::u32>"
      }
    ]
  },
  {
    "type": "struct",
    "name": "core::array::Span::<core::array::Span::<core::integer::u32>>",
    "members": [
      {
        "name": "snapshot",
        "type": "@core::array::Array::<core::array::Span::<core::integer::u32>>"
      }
    ]
  },
  {
    "type": "interface",
    "name": "meshik::game::IGame",
    "items": [
      {
        "type": "function",
        "name": "join",
        "inputs": [
          {
            "name": "seed_commit",
            "type": "core::felt252"
          },
          {
            "name": "deck",
            "type": "core::array::Span::<meshik::game::Card>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "deploy_and_attack",
        "inputs": [
          {
            "name": "deploy_cards",
            "type": "core::array::Span::<core::integer::u32>"
          },
          {
            "name": "attack_cards",
            "type": "core::array::Span::<core::integer::u32>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "defend",
        "inputs": [
          {
            "name": "defenders",
            "type": "core::array::Span::<core::array::Span::<core::integer::u32>>"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "finalize",
        "inputs": [
          {
            "name": "redeploy",
            "type": "core::array::Span::<core::integer::u32>"
          },
          {
            "name": "next_seed",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      },
      {
        "type": "function",
        "name": "win",
        "inputs": [
          {
            "name": "seed",
            "type": "core::felt252"
          }
        ],
        "outputs": [],
        "state_mutability": "external"
      }
    ]
  },
  {
    "type": "constructor",
    "name": "constructor",
    "inputs": [
      {
        "name": "other",
        "type": "core::starknet::contract_address::ContractAddress"
      },
      {
        "name": "life",
        "type": "core::integer::u32"
      },
      {
        "name": "initial_cards",
        "type": "core::integer::u32"
      },
      {
        "name": "seed_commit",
        "type": "core::felt252"
      },
      {
        "name": "deck",
        "type": "core::array::Span::<meshik::game::Card>"
      }
    ]
  },
  {
    "type": "event",
    "name": "meshik::game::game::JoinedSeedAndDeck",
    "kind": "struct",
    "members": [
      {
        "name": "player_id",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "deck",
        "type": "core::array::Span::<meshik::game::Card>",
        "kind": "data"
      },
      {
        "name": "seed_commit",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "meshik::game::game::DeployAndAttack",
    "kind": "struct",
    "members": [
      {
        "name": "player_id",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "deploy_cards",
        "type": "core::array::Span::<core::integer::u32>",
        "kind": "data"
      },
      {
        "name": "attack_cards",
        "type": "core::array::Span::<core::integer::u32>",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "meshik::game::game::Defend",
    "kind": "struct",
    "members": [
      {
        "name": "player_id",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "defenders",
        "type": "core::array::Span::<core::array::Span::<core::integer::u32>>",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "meshik::game::game::Finalize",
    "kind": "struct",
    "members": [
      {
        "name": "player_id",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "redeploy",
        "type": "core::array::Span::<core::integer::u32>",
        "kind": "data"
      },
      {
        "name": "next_seed",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "meshik::game::game::Win",
    "kind": "struct",
    "members": [
      {
        "name": "player_id",
        "type": "core::integer::u32",
        "kind": "data"
      },
      {
        "name": "seed",
        "type": "core::felt252",
        "kind": "data"
      }
    ]
  },
  {
    "type": "event",
    "name": "meshik::game::game::Event",
    "kind": "enum",
    "variants": [
      {
        "name": "JoinedSeedAndDeck",
        "type": "meshik::game::game::JoinedSeedAndDeck",
        "kind": "nested"
      },
      {
        "name": "DeployAndAttack",
        "type": "meshik::game::game::DeployAndAttack",
        "kind": "nested"
      },
      {
        "name": "Defend",
        "type": "meshik::game::game::Defend",
        "kind": "nested"
      },
      {
        "name": "Finalize",
        "type": "meshik::game::game::Finalize",
        "kind": "nested"
      },
      {
        "name": "Win",
        "type": "meshik::game::game::Win",
        "kind": "nested"
      }
    ]
  }
] as const satisfies Abi;
