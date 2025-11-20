'use client';

import { useActionState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { signup } from "@/lib/auth/actions";
import { Alert, AlertDescription } from "@/components/ui/alert";

const initialState = {
    error: '',
};

export function SignupForm() {
    const [state, formAction, isPending] = useActionState(signup, initialState);

    return (
        <form action={formAction} className="grid gap-4">
            {state?.error && (
                <Alert variant="destructive">
                    <AlertDescription>{state.error}</AlertDescription>
                </Alert>
            )}
            <div className="grid gap-2">
                <Label htmlFor="fullName">Full Name</Label>
                <Input id="fullName" name="fullName" placeholder="Max Robinson" required />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="organization">Organization</Label>
                <Input id="organization" name="organization" placeholder="Acme University" />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="email">Email</Label>
                <Input
                    id="email"
                    name="email"
                    type="email"
                    placeholder="m@example.com"
                    required
                />
            </div>
            <div className="grid gap-2">
                <Label htmlFor="password">Password</Label>
                <Input id="password" name="password" type="password" required />
            </div>
            <Button type="submit" className="w-full" disabled={isPending}>
                {isPending ? 'Creating account...' : 'Create an account'}
            </Button>
            <Button variant="outline" className="w-full" type="button">
                Sign up with GitHub
            </Button>
        </form>
    );
}
