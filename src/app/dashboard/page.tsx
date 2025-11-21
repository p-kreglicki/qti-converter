import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, FileText, Calendar, ArrowRight } from "lucide-react";
import { getUserConversions } from "@/lib/db/queries";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { formatDistanceToNow } from "date-fns";

export default async function DashboardPage() {
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
                    } catch {
                        // The `setAll` method was called from a Server Component.
                        // This can be ignored if you have middleware refreshing
                        // user sessions.
                    }
                },
            },
        }
    );

    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        // This should be handled by middleware, but just in case
        return <div>Unauthorized</div>;
    }

    const conversions = await getUserConversions(user.id, supabase);

    const totalQuestions = conversions.reduce((acc, curr) => acc + (curr.total_questions || 0), 0);

    return (
        <div className="space-y-6">
            <div className="flex items-center justify-between">
                <h2 className="text-3xl font-bold tracking-tight">Dashboard</h2>
                <Link href="/dashboard/new">
                    <Button>
                        <Plus className="mr-2 h-4 w-4" /> New Conversion
                    </Button>
                </Link>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Total Conversions</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{conversions.length}</div>
                    </CardContent>
                </Card>
                <Card>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <CardTitle className="text-sm font-medium">Questions Processed</CardTitle>
                        <FileText className="h-4 w-4 text-muted-foreground" />
                    </CardHeader>
                    <CardContent>
                        <div className="text-2xl font-bold">{totalQuestions}</div>
                    </CardContent>
                </Card>
            </div>

            <Card className="mt-6">
                <CardHeader>
                    <CardTitle>Recent Conversions</CardTitle>
                </CardHeader>
                <CardContent>
                    {conversions.length === 0 ? (
                        <div className="text-sm text-muted-foreground text-center py-10">
                            No conversions yet. Start by creating one!
                        </div>
                    ) : (
                        <div className="space-y-4">
                            {conversions.map((conversion) => (
                                <div key={conversion.id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors">
                                    <div className="flex items-center space-x-4">
                                        <div className="bg-primary/10 p-2 rounded-full">
                                            <FileText className="h-5 w-5 text-primary" />
                                        </div>
                                        <div>
                                            <p className="font-medium">{conversion.title}</p>
                                            <div className="flex items-center text-sm text-muted-foreground space-x-2">
                                                <span className="flex items-center">
                                                    <Calendar className="mr-1 h-3 w-3" />
                                                    {formatDistanceToNow(new Date(conversion.created_at), { addSuffix: true })}
                                                </span>
                                                <span>•</span>
                                                <span>{conversion.total_questions} questions</span>
                                                <span>•</span>
                                                <span className="uppercase text-xs bg-gray-100 px-2 py-0.5 rounded">{conversion.file_type}</span>
                                            </div>
                                        </div>
                                    </div>
                                    <Link href={`/dashboard/conversions/${conversion.id}`}>
                                        <Button variant="ghost" size="sm">
                                            View <ArrowRight className="ml-2 h-4 w-4" />
                                        </Button>
                                    </Link>
                                </div>
                            ))}
                        </div>
                    )}
                </CardContent>
            </Card>
        </div>
    );
}
