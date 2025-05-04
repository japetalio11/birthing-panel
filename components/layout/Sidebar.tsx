"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"
import NavUser from "@/components/layout/NavUser"
import { cn } from "@/lib/utils"
import {
  ClipboardList,
  LayoutDashboardIcon,
  FilePenLine,
  Settings,
  UsersRound,
} from "lucide-react"
import {
  SidebarGroupLabel,
  SidebarProvider,
} from "@/components/ui/sidebar"

type SidebarProps = {
  className?: string
  user?: {
    name?: string
    email?: string
    avatar?: string
  }
}

export default function Sidebar({ className, user }: SidebarProps) {
  const pathname = usePathname()

  const isRouteActive = (prefix: string) => pathname.startsWith(prefix)

  return (
    <SidebarProvider>
      <div className={cn("hidden border-r bg-muted/40 md:block w-[300px]", className)}>
        <div className="flex h-full max-h-screen flex-col gap-2">
          <div className="flex h-14 items-center px-1 lg:h-[60px] border-b">
            <NavUser user={user} />
          </div>

          <div className="flex-1 overflow-y-auto">
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
                href="/Appointments"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  isRouteActive("/Appointments")
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
                href="/Clinicians"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  isRouteActive("/Clinicians")
                    ? "bg-muted text-primary"
                    : "text-muted-foreground hover:text-primary"
                )}
              >
                <UsersRound className="h-4 w-4" />
                Clinicians
              </Link>
            </nav>
          </div>

          <div className="flex h-14 items-center border-t">
            <nav className="grid items-start px-2 text-sm font-medium lg:px-4">
              <Link
                href="/Settings"
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 transition-all",
                  isRouteActive("/Settings")
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
    </SidebarProvider>
  )
}