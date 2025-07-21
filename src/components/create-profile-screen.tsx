
"use client";

import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';

export default function CreateProfileScreen({ onProfileCreate }: { onProfileCreate: (name: string) => void }) {
    const [name, setName] = useState('');
    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (name.trim()) onProfileCreate(name.trim());
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background p-4">
            <Card className="w-full max-w-sm">
                <CardHeader className="text-center">
                    <CardTitle className="text-2xl">Welcome to TrackAcademic!</CardTitle>
                    <CardDescription>Create a profile to get started.</CardDescription>
                </CardHeader>
                <CardContent>
                    <form onSubmit={handleSubmit} className="grid gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="profile-name">Profile Name</Label>
                            <Input id="profile-name" type="text" placeholder="e.g., JEE Prep" required value={name} onChange={(e) => setName(e.target.value)} />
                        </div>
                        <Button type="submit" className="w-full">Create Profile</Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
}
