"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils"; 
import {
    ClipboardList,
    LayoutDashboardIcon,
    LineChart,
    Settings,
    UsersRound,
} from "lucide-react";
import {
    SidebarGroupLabel,
} from "@/components/ui/sidebar"

type SidebarProps = {
    className?: string;
}

export default function Sidebar({ className } : SidebarProps) {
    const pathname = usePathname();

    const isRouteActive = (prefix: string) => pathname.startsWith(prefix);

    return (
        <div className={cn("hidden border-r bg-muted/40 md:block", className)}>
            <div className="flex h-full max-h-screen flex-col gap-2">
                <div className="flex h-14 items-center px-4 lg:h-[60px] lg:px-6">
                    <Link 
                        href="/"
                        className="flex items-center gapt-2 font-semibold"
                    >
                        {/* Insert St. Pio logo */}
                    </Link>
                </div>

                <div className="flex-1 overflow-y auto">
                    <nav className="grid items-start px-2 text-sm lg:px-4">
                    <SidebarGroupLabel>Management</SidebarGroupLabel>
                    <Link
                        href="/"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                            isRouteActive("/") && pathname === "/"
                            ? "bg-muted text-primary"
                            : "text-muted-foreground hover:text-primary"
                        )}
                        >
                        <LayoutDashboardIcon className="h-4 w-4" />
                        Dashboard
                    </Link>
                        
                    <Link
                        href="/appointments"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                            isRouteActive("/appointments")
                            ? "bg-muted text-primary"
                            : "text-muted-foreground hover:text-primary"
                        )}
                        >
                        <ClipboardList className="h-4 w-4" />
                        Appointments
                    </Link>

                    <Link
                        href="/Patients"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                            isRouteActive("/Patients")
                            ? "bg-muted text-primary"
                            : "text-muted-foreground hover:text-primary"
                        )}
                        >
                        <UsersRound className="h-4 w-4" />
                        Patients
                    </Link>
                    
                    <Link
                        href="/clinicians"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                            isRouteActive("/clinicians")
                            ? "bg-muted text-primary"
                            : "text-muted-foreground hover:text-primary"
                        )}
                        >
                        <UsersRound className="h-4 w-4" />
                        Clinicians
                    </Link>
                        
                    <Link
                        href="/analytics"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                            isRouteActive("/analytics")
                            ? "bg-muted text-primary"
                            : "text-muted-foreground hover:text-primary"
                        )}
                        >
                        <LineChart className="h-4 w-4" />
                        Analytics
                    </Link>

                    </nav>
                </div>

                <div className="flex h-14 items-center border-t">
                    <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
                        <Link
                        href="/settings"
                        className={cn(
                            "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                            isRouteActive("/settings")
                            ? "bg-muted text-primary"
                            : "text-muted-foreground hover:text-primary"
                        )}
                        >
                        <Settings className="h-4 w-4" />
                        Settings
                        </Link>
                    </nav>
                </div>

            </div>
        </div>
    );
}