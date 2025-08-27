// src/lib/logoCreditsHelper.ts
import { createClient } from '@supabase/supabase-js';

const supabaseAdmin = createClient(
    process.env.SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!,
    {
        auth: {
            autoRefreshToken: false,
            persistSession: false
        }
    }
);

export async function getInitialLogoCredits(subAppId: string): Promise<number> {
    try {
        const { data, error } = await supabaseAdmin
            .from('subapp_credits')
            .select('logo_credits')
            .eq('sub_app_id', subAppId)
            .single();

        if (error || !data) {
            console.log(`No credits found for subAppId: ${subAppId}, using fallback: 5`);
            return 5;
        }

        console.log(`Found ${data.logo_credits} credits for subAppId: ${subAppId}`);
        return data.logo_credits;
    } catch (error) {
        console.error('Error looking up credits:', error);
        return 5;
    }
}