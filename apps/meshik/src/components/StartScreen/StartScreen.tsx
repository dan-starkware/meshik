import React, { useState, useRef } from 'react';
import { CardInfo } from '../../types/card_info';
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { StartScreenProps } from '../../types/start_screen_props'



export function StartScreen({ onGameStart, isFirstPlayer }: StartScreenProps) {
    const [address, setAddress] = useState('');
    const [fileName, setFileName] = useState('');
    const fileInputRef = useRef<HTMLInputElement>(null);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!fileInputRef.current?.files?.[0]) {
            alert('Please select a JSON file');
            return;
        }

        try {
            const fileContent = await fileInputRef.current.files[0].text();
            const cardLibrary: Record<string, CardInfo> = JSON.parse(fileContent);
            onGameStart(address, cardLibrary);
        } catch (error) {
            alert('Invalid JSON format for card info');
        }
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files?.[0]) {
            setFileName(e.target.files[0].name);
        }
    };

    return (
        <div className="min-h-screen bg-green-900 text-white flex items-center justify-center">
            <div className="bg-gray-800 p-8 rounded-lg shadow-lg w-full max-w-md">
                <h1 className="text-3xl font-bold mb-6 text-center">
                    {isFirstPlayer ? 'Start Game' : 'Join Game'}
                </h1>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div>
                        <label htmlFor="address" className="block text-sm font-medium mb-1">
                            Address (Hex Hash)
                        </label>
                        <Input
                            id="address"
                            type="text"
                            value={address}
                            onChange={(e) => setAddress(e.target.value)}
                            required
                            pattern="^0x[a-fA-F0-9]{1,64}$"
                            className="w-full text-gray-900"
                            placeholder="0x1234..."
                        />
                    </div>
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
                    <Button type="submit" className="w-full">
                        {isFirstPlayer ? 'Start Game' : 'Join Game'}
                    </Button>
                </form>
            </div>
        </div>
    );
}

