
'use client';

import { useData } from '@/contexts/data-context';
import { Button } from './ui/button';
import { User, X } from 'lucide-react';

export function ImpersonationBanner() {
    const { impersonatedUser, endImpersonation } = useData();

    if (!impersonatedUser) {
        return null;
    }

    return (
        <div className="bg-yellow-400 text-yellow-900 px-4 py-2 text-sm text-center font-semibold flex items-center justify-center gap-4 relative z-[100]">
            <User className="h-5 w-5" />
            <span>
                You are viewing the dashboard as <span className="font-bold">{impersonatedUser.username}</span>.
            </span>
             <Button
                variant="ghost"
                size="sm"
                onClick={endImpersonation}
                className="text-yellow-900 hover:bg-yellow-500/50 hover:text-yellow-900"
            >
                <X className="mr-2 h-4 w-4" />
                Exit Impersonation
            </Button>
        </div>
    );
}
