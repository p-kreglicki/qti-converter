'use server';

import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { QuestionUpdate } from "@/lib/db/types";
import { updateQuestion } from "@/lib/db/queries";
import { revalidatePath } from "next/cache";

export async function updateQuestionAction(questionId: string, updates: QuestionUpdate) {
    const cookieStore = await cookies();

    const supabase = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
            cookies: {
                getAll() {
                    return cookieStore.getAll()
                },
                setAll(cookiesToSet) {
                    try {
                        cookiesToSet.forEach(({ name, value, options }) =>
                            cookieStore.set(name, value, options)
                        )
                    } catch { }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) {
        throw new Error("Unauthorized");
    }

    // We should ideally verify ownership here too, but RLS handles it at the DB level.
    // However, for good measure and to avoid DB hits if unauthorized:
    // The query function will throw if RLS fails or record not found.

    try {
        const updatedQuestion = await updateQuestion(questionId, updates, supabase);
        revalidatePath('/dashboard/conversions/[id]', 'page'); // Revalidate the conversion page
        return { success: true, data: updatedQuestion };
    } catch (error: any) {
        console.error("Failed to update question:", error);
        console.error("Error details:", JSON.stringify(error, null, 2));
        return { success: false, error: error.message || "Unknown error" };
    }
}
