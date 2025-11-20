import { NextResponse } from 'next/server';


export async function GET(request: Request) {
    const { searchParams, origin } = new URL(request.url);
    const code = searchParams.get('code');
    // if "next" is in param, use it as the redirect URL
    const next = searchParams.get('next') ?? '/dashboard';

    if (code) {
        // We need to exchange the code for a session
        // However, since we are using @supabase/ssr in middleware and actions,
        // we should use the same pattern here.
        // But for now, let's just redirect to login if code exchange is needed
        // or implement the exchange if we were using the PKCE flow fully.
        // Given we are using simple email/password for MVP, this might not be hit often
        // unless we add email confirmation.

        // For MVP, we'll keep it simple.
    }

    // return the user to an error page with instructions
    return NextResponse.redirect(`${origin}/login?message=Could not authenticate user`);
}
