import { supabase } from '../utils/supabaseClient';

const getRedirectUrl = () => {
    if (typeof window !== 'undefined') {
        return window.location.origin;
    }
    return 'https://rawytime.com';
};

export const authService = {
    /** Google OAuth — redirects back to app after login */
    async signInWithGoogle(): Promise<void> {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'google',
            options: { redirectTo: getRedirectUrl() },
        });
        if (error) throw error;
    },

    /** Apple OAuth — redirects back to app after login */
    async signInWithApple(): Promise<void> {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'apple',
            options: { redirectTo: getRedirectUrl() },
        });
        if (error) throw error;
    },

    /** Facebook OAuth — redirects back to app after login */
    async signInWithFacebook(): Promise<void> {
        const { error } = await supabase.auth.signInWithOAuth({
            provider: 'facebook',
            options: { redirectTo: getRedirectUrl() },
        });
        if (error) throw error;
    },

    /** Magic link OTP — sends email, user clicks link to sign in */
    async signInWithOtp(email: string): Promise<void> {
        const { error } = await supabase.auth.signInWithOtp({
            email,
            options: { emailRedirectTo: getRedirectUrl() },
        });
        if (error) throw error;
    },

    /** Get current session user (null if not logged in) */
    async getUser() {
        const { data: { user } } = await supabase.auth.getUser();
        return user;
    },

    /** Sign out */
    async signOut(): Promise<void> {
        const { error } = await supabase.auth.signOut();
        if (error) throw error;
    },

    /** Expose the raw client if needed elsewhere */
    client: supabase,
};
