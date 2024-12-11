#!/bin/bash

# cards file
json_file=~/workspaces/meshik/cards.json

# Check if the file exists
if [[ ! -f $json_file ]]; then
    echo "Error: File '$json_file' not found!"
    exit 1
fi

num_cards=$(jq 'keys | length' "$json_file")
cards=$(jq -r 'keys[] as $key | [($key|tonumber), ($key|tonumber), ($key|tonumber), ($key|tonumber)] | join(" ")' "$json_file" | tr '\n' ' ' | sed 's/ $//')
echo "num_cards=$num_cards"
echo "cards=\"$cards\""

# Get the the other player contract address and seed as a command line arguments
OTHER_PLAYER_CONTRACT_ADDRESS=$1
SEED=$2
# Assuming a starkli account configuration file is present in $STARKNET_ACCOUNT.
ACCOUNT_ADDRESS=$(cat $STARKNET_ACCOUNT | jq -r .deployment.address)
scarb build
CONTRACT_PATH=~/workspaces/meshik/packages/contracts/meshik/target/dev/meshik_game.contract_class.json
echo "Contract path: $CONTRACT_PATH"
echo "Declaring contract..."
starkli declare $CONTRACT_PATH
CLASS_HASH=$(starkli class-hash $CONTRACT_PATH)
echo "Contact declared, Class hash: $CLASS_HASH"
# Prevent "contract not declared" error when deploying.
sleep 10
echo "Deploying contract..."
starkli deploy $CLASS_HASH $OTHER_PLAYER_CONTRACT_ADDRESS $SEED $num_cards $cards
