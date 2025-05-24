"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
    Eye,
    Download,
    ListFilter,
    Search,
    Trash2,
    UserRoundPlus,
    ChevronDownIcon,
    TextSearch,
    ArrowUpDown,
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
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import {
    ColumnDef,
    SortingState,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    flexRender
} from "@tanstack/react-table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Clinician {
    id: number;
    name: string;
    role: string;
    password: string;
    specialization: string;
    status: string;
    birth_date: string | null;
    age: string | null;
    last_appointment: string | null;
    contact_number: string | null;
    address: string | null;
}

const columns: ColumnDef<Clinician>[] = [
    {
        id: "select",
        header: ({ table }) => (
            <Checkbox
                checked={
                    table.getIsAllPageRowsSelected() ||
                    (table.getIsSomePageRowsSelected() && "indeterminate")
                }
                onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
                aria-label="Select all"
            />
        ),
        cell: ({ row }) => (
            <Checkbox
                checked={row.getIsSelected()}
                onCheckedChange={(value) => row.toggleSelected(!!value)}
                aria-label="Select row"
            />
        ),
        enableSorting: false,
    },
    {
        accessorKey: "name",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
            >
                Name
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="font-medium">{row.getValue("name")}</div>,
    },
    {
        accessorKey: "role",
        header: "Role",
        cell: ({ row }) => {
            const role = row.getValue("role") as string;
            return (
                <div className="font-medium">
                    {role.charAt(0).toUpperCase() + role.slice(1)}
                </div>
            );
        },
        enableSorting: false,
    },
    {
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const clinician = row.original;
            const updateClinicianStatus = async (newStatus: "Active" | "Inactive") => {
                try {
                    console.log(`Updating status for clinician ID ${clinician.id} to ${newStatus}`);
                    const { error } = await supabase
                        .from("person")
                        .update({ status: newStatus })
                        .eq("id", clinician.id);

                    if (error) {
                        console.error("Clinician status update error:", error);
                        toast.error(`Failed to update clinician status: ${error.message}`);
                        return false;
                    }

                    return true;
                } catch (err) {
                    console.error("Unexpected error updating status:", err);
                    toast.error("An unexpected error occurred while updating the status.");
                    return false;
                }
            };

            return (
                <Select
                    value={clinician.status || "Unknown"}
                    onValueChange={async (value) => {
                        const newStatus = value as "Active" | "Inactive";
                        const success = await updateClinicianStatus(newStatus);
                        if (success) {
                            (window as any).updateCliniciansState(clinician.id, newStatus);
                            toast.success("Status Updated", {
                                description: `Clinician status changed to ${newStatus}.`,
                            });
                        }
                    }}
                >
                    <SelectTrigger className="w-[120px]">
                        <SelectValue placeholder="Select status" />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="Active" className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-green-400" />
                            Active
                        </SelectItem>
                        <SelectItem value="Inactive" className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-red-400" />
                            Inactive
                        </SelectItem>
                    </SelectContent>
                </Select>
            );
        },
        enableSorting: false,
    },
    {
        accessorKey: "last_appointment",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="hidden sm:flex"
            >
                Last Appointment
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="hidden sm:block">{row.getValue("last_appointment") || "-"}</div>
        ),
    },
    {
        accessorKey: "age",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="hidden md:flex"
            >
                Age
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => <div className="hidden md:block">{row.getValue("age") || "-"}</div>,
    },
    {
        accessorKey: "contact_number",
        header: () => <div className="hidden md:block">Contact Number</div>,
        cell: ({ row }) => (
            <div className="hidden md:block">{row.getValue("contact_number") || "-"}</div>
        ),
        enableSorting: false,
    },
    {
        accessorKey: "address",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="hidden md:flex"
            >
                Home Address
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="hidden md:block">{row.getValue("address") || "-"}</div>
        ),
    },
];

export default function CliniciansTable() {
    const router = useRouter();
    const [clinicians, setClinicians] = React.useState<Clinician[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [advancedSearch, setAdvancedSearch] = React.useState({
        last_appointment: "",
        age: "",
        contact: "",
        address: "",
    });
    const [tab, setTab] = React.useState("all");
    const [roleFilter, setRoleFilter] = React.useState("all");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [userData, setUserData] = React.useState<any>(null);

    // Expose update function to window for column access
    React.useEffect(() => {
        (window as any).updateCliniciansState = (clinicianId: number, newStatus: "Active" | "Inactive") => {
            setClinicians((prev) =>
                prev.map((c) =>
                    c.id === clinicianId ? { ...c, status: newStatus } : c
                )
            );
        };

        return () => {
            delete (window as any).updateCliniciansState;
        };
    }, []);

    // Get user data from session storage
    React.useEffect(() => {
        const storedUser = sessionStorage.getItem('user');
        if (storedUser) {
            setUserData(JSON.parse(storedUser));
        }
    }, []);

    // Fetch clinicians from Supabase
    React.useEffect(() => {
        async function fetchClinicians() {
            try {
                const { data: cliniciansData, error: cliniciansError } = await supabase
                    .from("clinicians")
                    .select(`
                        id,
                        role,
                        password,
                        specialization,
                        person (
                            id,
                            first_name,
                            middle_name,
                            last_name,
                            birth_date,
                            age,
                            status,
                            contact_number,
                            address
                        )
                    `);

                if (cliniciansError) {
                    toast.error(`Failed to fetch clinicians: ${cliniciansError.message}`);
                    return;
                }

                if (!cliniciansData || cliniciansData.length === 0) {
                    toast.info("No clinicians found.");
                    setClinicians([]);
                    return;
                }

                const clinicianIds = cliniciansData.map((p: any) => p.id);
                const { data: appointmentsData, error: appointmentsError } = await supabase
                    .from("appointments")
                    .select("clinician_id, date")
                    .in("clinician_id", clinicianIds);

                if (appointmentsError) {
                    toast.warning(`Failed to fetch appointments: ${appointmentsError.message}`);
                }

                const formattedClinicians: Clinician[] = cliniciansData.map((clinician: any) => {
                    const person = clinician.person || {};
                    const appointments = appointmentsData
                        ?.filter((a: any) => a.clinician_id === clinician.id)
                        .sort(
                            (a: any, b: any) =>
                                new Date(b.date).getTime() - new Date(a.date).getTime()
                        );

                    const lastAppointment = appointments?.[0]?.date;

                    return {
                        id: clinician.id,
                        name: person.first_name
                            ? `${person.first_name} ${person.middle_name || ""} ${person.last_name || ""}`
                            : "Unknown",
                        role: clinician.role || "doctor",
                        password: clinician.password || "",
                        specialization: clinician.specialization || "",
                        status: person.status || "Unknown",
                        birth_date: person.birth_date
                            ? new Date(person.birth_date).toLocaleDateString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                              })
                            : null,
                        age: person.age || null,
                        last_appointment: lastAppointment
                            ? new Date(lastAppointment).toLocaleString("en-US", {
                                  month: "long",
                                  day: "numeric",
                                  year: "numeric",
                                  hour: "2-digit",
                                  minute: "2-digit",
                              })
                            : null,
                        contact_number: person.contact_number || null,
                        address: person.address || null,
                    };
                });

                setClinicians(formattedClinicians);
                toast.success("Clinicians fetched successfully.");
            } catch (err: any) {
                toast.error(`Error fetching clinicians: ${err.message}`);
            }
        }

        fetchClinicians();
    }, []);

    // Handle search and filtering
    const filteredClinicians = React.useMemo(() => {
        let result = [...clinicians];

        // Apply search term
        if (searchTerm) {
            result = result.filter((clinician) =>
                clinician.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply advanced search
        if (advancedSearch.age) {
            result = result.filter((clinician) =>
                clinician.age?.toLowerCase().includes(advancedSearch.age.toLowerCase())
            );
        }
        if (advancedSearch.contact) {
            result = result.filter((clinician) =>
                clinician.contact_number?.toLowerCase().includes(advancedSearch.contact.toLowerCase())
            );
        }
        if (advancedSearch.address) {
            result = result.filter((clinician) =>
                clinician.address?.toLowerCase().includes(advancedSearch.address.toLowerCase())
            );
        }

        // Apply tab filter
        if (tab === "active") {
            result = result.filter((clinician) => clinician.status.toLowerCase() === "active");
        } else if (tab === "inactive") {
            result = result.filter((clinician) => clinician.status.toLowerCase() === "inactive");
        }

        // Apply role filter
        if (roleFilter === "doctor") {
            result = result.filter((clinician) => clinician.role.toLowerCase() === "doctor");
        } else if (roleFilter === "midwife") {
            result = result.filter((clinician) => clinician.role.toLowerCase() === "midwife");
        }

        return result;
    }, [searchTerm, advancedSearch, tab, roleFilter, clinicians]);

    // Initialize table
    const table = useReactTable({
        data: filteredClinicians,
        columns,
        onSortingChange: setSorting,
        getCoreRowModel: getCoreRowModel(),
        getSortedRowModel: getSortedRowModel(),
        onRowSelectionChange: setRowSelection,
        state: {
            sorting,
            rowSelection,
        },
    });

    // Handle export
    const handleExport = () => {
        const headers = [
            "Name",
            "Role",
            "Status",
            "Last Appointment",
            "Age",
            "Contact Number",
            "Home Address",
        ];
        const rows = filteredClinicians.map((clinician) => [
            clinician.name,
            clinician.role,
            clinician.status,
            clinician.last_appointment || "",
            clinician.age || "",
            clinician.contact_number || "",
            clinician.address || "",
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "clinicians_export.csv";
        link.click();
        toast.success("Data exported successfully.");
    };

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={tab} onValueChange={setTab}>
                <div className="flex items-center">
                    <div className="flex items-center gap-2">
                        <TabsList>
                            <TabsTrigger value="all">All</TabsTrigger>
                            <TabsTrigger value="active">Active</TabsTrigger>
                            <TabsTrigger value="inactive">Inactive</TabsTrigger>
                        </TabsList>

                        <Tabs value={roleFilter} onValueChange={setRoleFilter}>
                            <TabsList>
                                <TabsTrigger value="all">All</TabsTrigger>
                                <TabsTrigger value="doctor">Doctor</TabsTrigger>
                                <TabsTrigger value="midwife">Midwife</TabsTrigger>
                            </TabsList>
                        </Tabs>
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <div className="relative">
                            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                            <Input
                                type="search"
                                placeholder="Search by name..."
                                className="w-full pl-8 rounded-lg bg-background"
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
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
                                <div className="p-2">
                                    <Input
                                        placeholder="Last appointment..."
                                        value={advancedSearch.last_appointment}
                                        onChange={(e) =>
                                            setAdvancedSearch({
                                                ...advancedSearch,
                                                last_appointment: e.target.value,
                                            })
                                        }
                                        className="mb-2"
                                    />
                                    <Input
                                        placeholder="Age..."
                                        value={advancedSearch.age}
                                        onChange={(e) =>
                                            setAdvancedSearch({
                                                ...advancedSearch,
                                                age: e.target.value,
                                            })
                                        }
                                        className="mb-2"
                                    />
                                    <Input
                                        placeholder="Phone number..."
                                        value={advancedSearch.contact}
                                        onChange={(e) =>
                                            setAdvancedSearch({
                                                ...advancedSearch,
                                                contact: e.target.value,
                                            })
                                        }
                                        className="mb-2"
                                    />
                                    <Input
                                        placeholder="Address..."
                                        value={advancedSearch.address}
                                        onChange={(e) =>
                                            setAdvancedSearch({
                                                ...advancedSearch,
                                                address: e.target.value,
                                            })
                                        }
                                    />
                                </div>
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
                                        Export the current clinician list as a CSV file.
                                    </DialogDescription>
                                </DialogHeader>
                                <DialogFooter>
                                    <Button variant="outline" onClick={() => {}}>
                                        Cancel
                                    </Button>
                                    <Button onClick={handleExport}>Export</Button>
                                </DialogFooter>
                            </DialogContent>
                        </Dialog>
                    </div>
                </div>

                <TabsContent value={tab}>
                    <Card x-chunk="dashboard-06-chunk-0">
                        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                            <div className="space-y-1">
                                <CardTitle>Clinicians</CardTitle>
                                <CardDescription>
                                    Manage your clinicians and view their records.
                                </CardDescription>
                            </div>

                            <div className="relative flex items-center w-full max-w-sm md:w-auto">
                                {userData?.isAdmin && (
                                    <Button
                                        size="sm"
                                        className="h-8 ml-2 flex items-center gap-1"
                                        onClick={() => router.push("/Dashboard/Clinicians/Clinician-Form")}
                                    >
                                        <UserRoundPlus />
                                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                            Add Clinician
                                        </span>
                                    </Button>
                                )}
                            </div>
                        </CardHeader>

                        <CardContent>
                            {filteredClinicians.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No clinicians found.
                                </p>
                            ) : (
                                <Table>
                                    <TableHeader>
                                        {table.getHeaderGroups().map((headerGroup) => (
                                            <TableRow key={headerGroup.id}>
                                                {headerGroup.headers.map((header) => (
                                                    <TableHead key={header.id}>
                                                        {header.isPlaceholder
                                                            ? null
                                                            : flexRender(
                                                                  header.column.columnDef.header,
                                                                  header.getContext()
                                                              )}
                                                    </TableHead>
                                                ))}
                                            </TableRow>
                                        ))}
                                    </TableHeader>
                                    <TableBody>
                                        {table.getRowModel().rows?.length ? (
                                            table.getRowModel().rows.map((row) => (
                                                <TableRow
                                                    key={row.id}
                                                    data-state={row.getIsSelected() && "selected"}
                                                    onClick={() => router.push(`/Dashboard/Clinicians/Clinician-View?id=${row.original.id}`)}
                                                    className="cursor-pointer hover:bg-zinc-100"
                                                >
                                                    {row.getVisibleCells().map((cell) => (
                                                        <TableCell key={cell.id} className="py-4">
                                                            {flexRender(
                                                                cell.column.columnDef.cell,
                                                                cell.getContext()
                                                            )}
                                                        </TableCell>
                                                    ))}
                                                </TableRow>
                                            ))
                                        ) : (
                                            <TableRow>
                                                <TableCell colSpan={columns.length} className="h-24 text-center">
                                                    No results.
                                                </TableCell>
                                            </TableRow>
                                        )}
                                    </TableBody>
                                </Table>
                            )}
                        </CardContent>
                        <CardFooter>
                            <div className="text-xs text-muted-foreground">
                                Showing <strong>1-{filteredClinicians.length}</strong> of{" "}
                                <strong>{clinicians.length}</strong> clinicians
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}