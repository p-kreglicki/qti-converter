import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect, notFound } from "next/navigation";
import { getConversion, getConversionQuestions } from "@/lib/db/queries";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, Download, FileText, ShieldAlert, Sparkles } from "lucide-react";
import Link from "next/link";
import { QuestionList } from "@/components/questions/question-list";
import { ExportModal } from "@/components/export/export-modal";

export default async function ConversionPage({ params }: { params: { id: string } }) {
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
        return <div>Unauthorized</div>;
    }

    try {
        const conversion = await getConversion(params.id, supabase);

        if (conversion.user_id !== user.id) {
            redirect("/dashboard");
        }

        const questions = await getConversionQuestions(params.id, supabase);

        return (
            <div className="space-y-6 h-[calc(100vh-100px)] flex flex-col">
                {/* Header */}
                <div className="flex items-center justify-between flex-none">
                    <div className="flex items-center space-x-4">
                        <Link href="/dashboard">
                            <Button variant="ghost" size="icon">
                                <ArrowLeft className="h-4 w-4" />
                            </Button>
                        </Link>
                        <div>
                            <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
                                {conversion.title}
                                <Badge variant="outline" className="uppercase text-xs">
                                    {conversion.file_type}
                                </Badge>
                            </h2>
                            <p className="text-sm text-muted-foreground">
                                {questions.length} questions • Created {new Date(conversion.created_at).toLocaleDateString()}
                            </p>
                        </div>
                    </div>
                    <div className="flex items-center space-x-2">
                        <Button variant="outline">
                            <Sparkles className="mr-2 h-4 w-4" />
                            AI Enhance
                        </Button>
                        <ExportModal conversionId={params.id} />
                    </div>
                </div>

                {/* Main Content */}
                <div className="flex-1 min-h-0 border rounded-lg bg-white overflow-hidden flex flex-col">
                    <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
                        <div className="font-medium text-sm text-muted-foreground">
                            Questions
                        </div>
                        <div className="flex items-center space-x-2">
                            {/* Filters could go here */}
                        </div>
                    </div>

                    <div className="flex-1 overflow-auto p-0">
                        <QuestionList questions={questions} />
                    </div>
                </div>
            </div>
        );
    } catch (error) {
        console.error(error);
        notFound();
    }
}
