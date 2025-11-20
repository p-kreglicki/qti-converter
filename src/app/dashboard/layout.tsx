import { logout } from "@/lib/auth/actions";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { LayoutDashboard, PlusCircle, LogOut, Settings } from "lucide-react";

export default function DashboardLayout({
    children,
}: {
    children: React.ReactNode;
}) {
    return (
        <div className="min-h-screen bg-gray-50 flex">
            {/* Sidebar */}
            <aside className="w-64 bg-white border-r hidden md:flex flex-col">
                <div className="p-6 border-b">
                    <h1 className="text-xl font-bold text-primary">QTI Converter</h1>
                </div>
                <nav className="flex-1 p-4 space-y-2">
                    <Link href="/dashboard">
                        <Button variant="ghost" className="w-full justify-start">
                            <LayoutDashboard className="mr-2 h-4 w-4" />
                            Dashboard
                        </Button>
                    </Link>
                    <Link href="/dashboard/new">
                        <Button variant="ghost" className="w-full justify-start">
                            <PlusCircle className="mr-2 h-4 w-4" />
                            New Conversion
                        </Button>
                    </Link>
                    <Link href="/dashboard/settings">
                        <Button variant="ghost" className="w-full justify-start">
                            <Settings className="mr-2 h-4 w-4" />
                            Settings
                        </Button>
                    </Link>
                </nav>
                <div className="p-4 border-t">
                    <form action={logout}>
                        <Button variant="outline" className="w-full justify-start text-destructive hover:text-destructive">
                            <LogOut className="mr-2 h-4 w-4" />
                            Logout
                        </Button>
                    </form>
                </div>
            </aside>

            {/* Main Content */}
            <main className="flex-1 flex flex-col">
                <header className="bg-white border-b h-16 flex items-center px-6 md:hidden">
                    <h1 className="text-lg font-bold">QTI Converter</h1>
                </header>
                <div className="flex-1 p-6 overflow-auto">
                    {children}
                </div>
            </main>
        </div>
    );
}
