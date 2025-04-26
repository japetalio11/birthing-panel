import Sidebar from "@/components/layout/Sidebar";

import { 
    LogOut,
    Search, 
    Menu, 
    Bell, 
    CircleUser 
} from "lucide-react"
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { 
    Sheet, 
    SheetContent, 
    SheetTrigger 
} from "@/components/ui/sheet"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import DynamicBreadcrumb from "@/components/custom-ui/dynamic-breadcrumb"

export default function NavigationBar() {
    return (
        <header className="flex h-14 items-center gap-4 px-4 lg:h-[60px] lg:px-6 md:justify-between">
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
                <form>
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search..."
                            className="w-60 bg-background pl-8"
                        />
                    </div>
                </form>

                <Button variant="outline" size="icon">
                    <Bell className="h-4 w-4" />
                    <span className="sr-only">Notifications</span>
                </Button>
            
                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="secondary" size="icon" className="rounded-full">
                            <CircleUser className="h-5 w-5" />
                            <span className="sr-only">Toggle user menu</span>
                        </Button>
                    </DropdownMenuTrigger>

                    <DropdownMenuContent align="end">
                        <DropdownMenuLabel>My Account</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem>
                                <LogOut className="h-3.5 w-3.5" style={{ color: 'black' }}/>
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Logout
                                </span>
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>
        </header>
    );
}