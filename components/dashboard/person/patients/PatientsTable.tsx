"use client";

import { useRouter } from "next/navigation";
import React, { useState } from "react";
import {
    Eye,
    Download,
    ListFilter,
    MoreHorizontal,
    Search,
    Trash2,
    UserRoundPlus,
    ChevronDownIcon,
    TextSearch,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    DropdownMenuRadioGroup,
    DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
    AlertDialog,
    AlertDialogContent,
    AlertDialogHeader,
    AlertDialogTitle,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogCancel,
    AlertDialogAction,
} from "@/components/ui/alert-dialog";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";

export default function PatientsTable() {
    const router = useRouter();
    const [openDialog, setOpenDialog] = useState(false);

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <Tabs defaultValue="all">
            <div className="flex items-center">
            <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="active">Active</TabsTrigger>
                <TabsTrigger value="inactive">Inactive</TabsTrigger>
            </TabsList>

            <div className="ml-auto flex items-center gap-2">
                <div className="relative">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search..."
                        className="w-full pl-8 rounded-lg bg-background"
                    />
                </div>

                 <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm">
                        <TextSearch />
                        <span className="hidden lg:inline">Advanced Search</span>
                        <span className="lg:hidden">Columns</span>
                        <ChevronDownIcon />
                    </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                            <DropdownMenuSeparator />

                    </DropdownMenuContent>
                </DropdownMenu>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <Button variant="outline" size="sm">
                            <ListFilter />
                            <span className="hidden lg:inline">Sort</span>
                            <ChevronDownIcon />
                        </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-48">
                        <DropdownMenuRadioGroup defaultValue="name-asc">
                            <DropdownMenuRadioItem value="name-asc">Name (A-Z)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="name-desc">Name (Z-A)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="date-asc">Date (Oldest)</DropdownMenuRadioItem>
                            <DropdownMenuRadioItem value="date-desc">Date (Newest)</DropdownMenuRadioItem>
                        </DropdownMenuRadioGroup>
                    </DropdownMenuContent>
                </DropdownMenu>

                <Dialog>
                    <DialogTrigger asChild>
                        <Button size="sm" variant="outline" className="h-8 gap-1">
                            <Download />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Export
                            </span>
                        </Button>
                    </DialogTrigger>
                    <DialogContent>
                        <DialogHeader>
                            <DialogTitle>Export Data</DialogTitle>
                            <DialogDescription>
                                Choose your export options below.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            {/* Add your export options here */}
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => {}}>Cancel</Button>
                            <Button onClick={() => {}}>Export</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
                
            </div>

            <TabsContent value="all">
            <Card x-chunk="dashboard-06-chunk-0">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <CardTitle>Patients</CardTitle>
                    <CardDescription>
                    Manage your patients and view their records.
                    </CardDescription>
                </div>

                <div className="relative flex items-center w-full max-w-sm md:w-auto">
                    <Button
                        size="sm"
                        className="h-8 ml-2 flex items-center gap-1"
                        onClick={() => router.push("/Patients/Patient-Form")}
                        >
                        <UserRoundPlus />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                            Add Patient
                        </span>
                    </Button>
                </div>
                </CardHeader>

                <CardContent>
                <Table>
                    <TableHeader>
                    <TableRow>
                        <TableCell>
                        <Checkbox id="terms" />
                        </TableCell>

                        <TableHead>Name</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead className="hidden sm:table-cell">
                        Last Appointment
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                        Phone Number
                        </TableHead>
                        <TableHead className="hidden md:table-cell">
                        Home Address
                        </TableHead>
                        <TableHead>
                        <span className="sr-only">Actions</span>
                        </TableHead>
                    </TableRow>
                    </TableHeader>

                    <TableBody>
                    <TableRow>
                        <TableCell>
                        <Checkbox id="terms" />
                        </TableCell>
                        <TableCell className="font-medium">
                        Jelly P. Aureus
                        </TableCell>
                        <TableCell>
                        <Badge
                            variant="outline"
                            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
                        >
                            <div className="w-2 h-2 bg-green-400 rounded-full" />
                            <span className="hidden sm:inline">Active</span>
                        </Badge>
                        </TableCell>
                        <TableCell className="hidden sm:table-cell">
                        April 19, 2025 at 03:00 PM
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                        +63 939467889
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                        Diyosa Village, Camaligan, Naga City
                        </TableCell>
                        <TableCell>
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                            <Button
                                aria-haspopup="true"
                                size="icon"
                                variant="ghost"
                            >
                                <MoreHorizontal className="h-4 w-4" />
                                <span className="sr-only">Toggle menu</span>
                            </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                onSelect={() =>
                                router.push("/Patients/Patient-View")}
                            >
                                <Eye
                                style={{ color: "black" }}
                                />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                View
                                </span>
                            </DropdownMenuItem>
                            <DropdownMenuItem
                                style={{ color: "red" }}
                                onSelect={(e) => {
                                e.preventDefault(); // prevent menu close
                                setOpenDialog(true);
                                }}
                            >
                                <Trash2
                                style={{ color: "red" }}
                                />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                Delete
                                </span>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>

                        <AlertDialog
                            open={openDialog}
                            onOpenChange={setOpenDialog}
                        >
                            <AlertDialogContent>
                            <AlertDialogHeader>
                                <AlertDialogTitle>
                                Are you absolutely sure?
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                This action cannot be undone. This will
                                permanently delete this record and remove it from
                                the system.
                                </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                                <AlertDialogCancel>Cancel</AlertDialogCancel>
                                <AlertDialogAction className="bg-red-600 hover:bg-red-700">
                                Delete
                                </AlertDialogAction>
                            </AlertDialogFooter>
                            </AlertDialogContent>
                        </AlertDialog>
                        </TableCell>
                    </TableRow>
                    </TableBody>
                </Table>
                </CardContent>
                <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>1-1</strong> of <strong>1</strong> patients
                </div>
                </CardFooter>
            </Card>
            </TabsContent>
        </Tabs>
        </main>
    );
}
