'use client';

import { useEffect, useState } from 'react';
import { Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ExpirationTimerProps {
    expiresAt: string;
}

export function ExpirationTimer({ expiresAt }: ExpirationTimerProps) {
    const [timeRemaining, setTimeRemaining] = useState('');
    const [isExpired, setIsExpired] = useState(false);
    const [isWarning, setIsWarning] = useState(false);

    useEffect(() => {
        const updateTimer = () => {
            const now = new Date().getTime();
            const expiry = new Date(expiresAt).getTime();
            const diff = expiry - now;

            if (diff <= 0) {
                setTimeRemaining('Expired');
                setIsExpired(true);
                return;
            }

            // Calculate time remaining
            const hours = Math.floor(diff / (1000 * 60 * 60));
            const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

            // Set warning if less than 2 hours remaining
            setIsWarning(hours < 2);

            if (hours > 0) {
                setTimeRemaining(`${hours}h ${minutes}m remaining`);
            } else {
                setTimeRemaining(`${minutes}m remaining`);
            }
        };

        // Update immediately
        updateTimer();

        // Update every minute
        const interval = setInterval(updateTimer, 60000);

        return () => clearInterval(interval);
    }, [expiresAt]);

    return (
        <Badge
            variant={isExpired ? 'destructive' : isWarning ? 'outline' : 'secondary'}
            className="flex items-center gap-1"
        >
            <Clock className="h-3 w-3" />
            {timeRemaining}
        </Badge>
    );
}
