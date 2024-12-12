
# Assuming a starkli account configuration file is present in $STARKNET_ACCOUNT.
ACCOUNT_ADDRESS=$(cat $STARKNET_ACCOUNT | jq -r .deployment.address)
scarb build
CONTRACT_PATH=~/workspaces/meshik/packages/contracts/meshik/target/dev/meshik_deployer.contract_class.json
echo "Contract path: $CONTRACT_PATH"
echo "Declaring contract..."
starkli declare $CONTRACT_PATH
CLASS_HASH=$(starkli class-hash $CONTRACT_PATH)
echo "Contact declared, Class hash: $CLASS_HASH"
# Prevent "contract not declared" error when deploying.
sleep 10
echo "Deploying contract..."
echo "running starkli deploy $CLASS_HASH"
starkli deploy $CLASS_HASH
