"use client";

import Sidebar from "@/components/layout/Sidebar";

import { 
    Search, 
    Menu, 
    Bell, 
} from "lucide-react"
import { 
    Sheet, 
    SheetContent, 
    SheetTrigger 
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import DynamicBreadcrumb from "@/components/custom-ui/dynamic-breadcrumb"
import { cn } from "@/lib/utils";
import {
  Dialog,
  DialogContent,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList,
} from "@/components/ui/command"
import { useState } from "react"
import { useRouter } from "next/navigation"

interface NavigationBarProps {
    className?: string;
}

export default function NavigationBar({ className }: NavigationBarProps) {
    const [open, setOpen] = useState(false)
    const router = useRouter()

    const navigationItems = [
        { href: "/Dashboard/Appointments/Appointment-Form", label: "Set an Appointment" },
        { href: "/Dashboard/Clinicians/Clinician-Form", label: "Add a Clinician" },
        { href: "/Dashboard/Patients/Patient-Form", label: "Add a Patient" }
    ]

    return (
        <header className={cn(
            "flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6 md:justify-between border-b bg-white",
            className
        )}>
            <Sheet>
                <SheetTrigger asChild>
                    <Button variant="outline" size="icon" className="md:hidden">
                        <Menu className="h-5 w-5" />
                        <span className="sr-only">Toggle navigation menu</span>
                    </Button>
                </SheetTrigger>
                <SheetContent side="left" className="w-[240px] sm:w-[280px]">
                    <Sidebar />
                </SheetContent>
            </Sheet>

            <DynamicBreadcrumb />

            <div className="ml-auto flex items-center gap-2">
                <Dialog open={open} onOpenChange={setOpen}>
                    <DialogTrigger asChild>
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Type a command or search..."
                                className="w-60 bg-background pl-8"
                                onClick={() => setOpen(true)}
                            />
                        </div>
                    </DialogTrigger>
                    <DialogContent className="p-0">
                        <Command>
                            <CommandInput placeholder="Type a command or search..." />
                            <CommandList>
                                <CommandEmpty>No results found.</CommandEmpty>
                                <CommandGroup heading="Quick Commands">
                                    {navigationItems.map((item) => (
                                        <CommandItem
                                            key={item.href}
                                            onSelect={() => {
                                                router.push(item.href)
                                                setOpen(false)
                                            }}
                                        >
                                            {item.label}
                                        </CommandItem>
                                    ))}
                                </CommandGroup>
                            </CommandList>
                        </Command>
                    </DialogContent>
                </Dialog>

                <Button variant="outline" size="icon">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                </Button>
            </div>
        </header>
    );
}