set -e

# Assuming a starkli account configuration file is present in $STARKNET_ACCOUNT.
ACCOUNT_ADDRESS=$(cat $STARKNET_ACCOUNT | jq -r .deployment.address)

scarb build
CONTRACT_PATH=~/workspace/meshik/packages/contracts/event_manager/target/dev/event_manager_registration.contract_class.json
starkli declare $CONTRACT_PATH
CLASS_HASH=$(starkli class-hash $CONTRACT_PATH)
# Prevent "contract not declared" error when deploying.
sleep 10
# Deploy the contract. The $ACCOUNT_ADDRESS is the input to the contract constructor.
starkli deploy $CLASS_HASH $ACCOUNT_ADDRESS
