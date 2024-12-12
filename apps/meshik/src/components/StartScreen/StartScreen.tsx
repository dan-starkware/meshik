import React, { useState, useRef } from 'react';
import { CardInfo } from '../../types/card_info';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
// import { StartScreenProps } from '../../types/start_screen_props'
import { GameConfig } from '../../types/game_config';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ABI, ABI_UNIVERSAL_DEPLOYER, CLASS_HASH, CONTRACT_ADDRESS, UNIVERSAL_DEPLOYER_CONTRACT_ADDRESS } from '@/utils/consts_meshi';
import { useContract, useSendTransaction } from '@starknet-react/core';
import { TypedContractV2 } from 'starknet';


export interface StartScreenProps {
    onGameStart: (gameConfig: GameConfig) => void;
    onGameJoin: (address: string, cardLibrary: Record<string, CardInfo>) => void;
}

export function StartScreen({ onGameStart, onGameJoin }: StartScreenProps) {
    const [fileName, setFileName] = useState('');
    const [initialLife, setInitialLife] = useState(20);
    const [initialHandSize, setInitialHandSize] = useState(3);
    const [joinAddress, setJoinAddress] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);
    const joinFileInputRef = useRef<HTMLInputElement>(null);
    // hooks for universal deployer contract
    const { contract: universal_deployer_contract } = useContract({
        abi: ABI_UNIVERSAL_DEPLOYER,
        address: UNIVERSAL_DEPLOYER_CONTRACT_ADDRESS,
    }) as { contract?: TypedContractV2<typeof ABI> };

    // hooks for game contract
    const { contract } = useContract({
        abi: ABI,
        address: CONTRACT_ADDRESS,
    }) as { contract?: TypedContractV2<typeof ABI> };

    const { sendAsync } = useSendTransaction({
        calls: undefined,
    });
    const { sendAsync: sendAsync_deploy } = useSendTransaction({
        calls: undefined,
    });


    const handleStartSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileInputRef.current?.files?.[0]) {
            alert('Please select a JSON file');
            return;
        }

        try {
            const fileContent = await fileInputRef.current.files[0].text();
            const cardLibrary = JSON.parse(fileContent);
            const gameConfig: GameConfig = {
                cardLibrary,
                initialLife,
                initialHandSize,
            };
            onGameStart(gameConfig);

            let salt = Math.floor(Math.random() * 2 ** 250).toString();
            // let unique = false;
            let cardInfo: CardInfo[] = Object.values(cardLibrary);

            let calldata: string[] = [];
            // this should be the address of the other player
            let other_player_address = "0x07C8538127f5917f95b64f6EA6ad73E1A05D1f0d6b693F434368544F3B73a909";
            calldata.push(other_player_address);
            calldata.push(initialLife.toString());
            calldata.push(initialHandSize.toString());
            let SEED_COMMIT = "100";
            calldata.push(SEED_COMMIT);
            let num_cards = cardInfo.length;
            calldata.push(num_cards.toString());
            let cards = cardInfo.map(card => [card.cost.toString(), card.resources.toString(), card.attack.toString(), card.defense.toString()]).flat();
            calldata.push(...cards);
            console.log("calldata: " + calldata);
            const calls =
                universal_deployer_contract
                    ? [universal_deployer_contract.populate("deploy", [CLASS_HASH, salt, calldata])]
                    // ? [universal_deployer_contract.populate("deployContract", [CLASS_HASH, salt, unique, calldata_len, calldata])]
                    : undefined;
            console.log("calls: " + calls);
            const { transaction_hash } = await sendAsync_deploy(calls);
            // const transaction_hash = "0x327cebe6fbe21791ae1e8171b80f9f1aedab5c74d4d79b9d18d5b1e12846fdc";
            console.log("transaction_hash: " + transaction_hash);
            await universal_deployer_contract?.providerOrAccount?.waitForTransaction(transaction_hash, {
                retryInterval: 2e3,
            });
            const receipt = await universal_deployer_contract?.providerOrAccount?.getTransactionReceipt(transaction_hash) as any;

            // we can be const at the other player, should be used by the first player
            let contract_address = receipt.events[0].from_address;
            console.log(receipt);
            console.log("contract_address: " + contract_address);

        } catch (error) {
            alert('Error starting game');
            console.error('Error starting game', error);
        }
    };

    const handleJoinSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!joinFileInputRef.current?.files?.[0]) {
            alert('Please select a JSON file');
            return;
        }
        if (!joinAddress.match(/^0x[a-fA-F0-9]{1,64}$/)) {
            alert('Invalid game address format');
            return;
        }

        try {
            const fileContent = await joinFileInputRef.current.files[0].text();
            const cardLibrary = JSON.parse(fileContent);
            onGameJoin(joinAddress, cardLibrary);

            // call join here
            let cardInfo = Object.values(cardLibrary);
            const calls =
                contract
                    ? [contract.populate("join", [100, cardInfo])]
                    : undefined;
            const { transaction_hash } = await sendAsync(calls);
            await contract?.providerOrAccount?.waitForTransaction(transaction_hash, {
                retryInterval: 2e3,
            });
        } catch (error) {
            alert('Error joining game');
            console.error('Error joining game', error);
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    return (
        <div className="min-h-screen bg-green-900 text-white flex items-center justify-center">
            <Card className="w-[400px]">
                <CardHeader>
                    <CardTitle>Magic: The Gathering Arena Clone</CardTitle>
                    <CardDescription>Start a new game or join an existing one</CardDescription>
                </CardHeader>
                <CardContent>
                    <Tabs defaultValue="start" className="w-full">
                        <TabsList className="grid w-full grid-cols-2">
                            <TabsTrigger value="start">Start Game</TabsTrigger>
                            <TabsTrigger value="join">Join Game</TabsTrigger>
                        </TabsList>
                        <TabsContent value="start">
                            <form onSubmit={handleStartSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="cardInfo" className="block text-sm font-medium mb-1">
                                        Card Info (JSON File)
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="file"
                                            id="cardInfo"
                                            ref={fileInputRef}
                                            accept=".json"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => fileInputRef.current?.click()}
                                            className="w-full"
                                        >
                                            Choose File
                                        </Button>
                                        <span className="text-sm truncate">{fileName || 'No file chosen'}</span>
                                    </div>
                                </div>
                                <div>
                                    <label htmlFor="initialLife" className="block text-sm font-medium mb-1">
                                        Initial Life
                                    </label>
                                    <Input
                                        id="initialLife"
                                        type="number"
                                        value={initialLife}
                                        onChange={(e) => setInitialLife(Number(e.target.value))}
                                        min={1}
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="initialHandSize" className="block text-sm font-medium mb-1">
                                        Initial Hand Size
                                    </label>
                                    <Input
                                        id="initialHandSize"
                                        type="number"
                                        value={initialHandSize}
                                        onChange={(e) => setInitialHandSize(Number(e.target.value))}
                                        min={1}
                                        max={10}
                                        required
                                    />
                                </div>
                                <Button type="submit" className="w-full">
                                    Start New Game
                                </Button>
                            </form>
                        </TabsContent>
                        <TabsContent value="join">
                            <form onSubmit={handleJoinSubmit} className="space-y-4">
                                <div>
                                    <label htmlFor="gameAddress" className="block text-sm font-medium mb-1">
                                        Game Address
                                    </label>
                                    <Input
                                        id="gameAddress"
                                        type="text"
                                        value={joinAddress}
                                        onChange={(e) => setJoinAddress(e.target.value)}
                                        placeholder="0x1234..."
                                        pattern="^0x[a-fA-F0-9]{1,64}$"
                                        required
                                    />
                                </div>
                                <div>
                                    <label htmlFor="joinCardInfo" className="block text-sm font-medium mb-1">
                                        Card Info (JSON File)
                                    </label>
                                    <div className="flex items-center space-x-2">
                                        <Input
                                            type="file"
                                            id="joinCardInfo"
                                            ref={joinFileInputRef}
                                            accept=".json"
                                            onChange={handleFileChange}
                                            className="hidden"
                                        />
                                        <Button
                                            type="button"
                                            onClick={() => joinFileInputRef.current?.click()}
                                            className="w-full"
                                        >
                                            Choose File
                                        </Button>
                                        <span className="text-sm truncate">{fileName || 'No file chosen'}</span>
                                    </div>
                                </div>
                                <Button type="submit" className="w-full">
                                    Join Existing Game
                                </Button>
                            </form>
                        </TabsContent>
                    </Tabs>
                </CardContent>
            </Card>
        </div>
    );
}