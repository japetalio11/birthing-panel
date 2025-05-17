"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
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
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import {
    ColumnDef,
    SortingState,
    getCoreRowModel,
    getSortedRowModel,
    useReactTable,
    flexRender
} from "@tanstack/react-table";
import { DatePicker } from "@/components/ui/date-picker";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface Patient {
    id: number;
    name: string;
    status: string;
    birth_date: string | null;
    age: string | null;
    last_appointment: string | null;
    contact_number: string | null;
    address: string | null;
}

const columns: ColumnDef<Patient>[] = [
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
        accessorKey: "status",
        header: "Status",
        cell: ({ row }) => {
            const status = row.getValue("status") as string;
            return (
                <Badge
                    variant="outline"
                    className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
                >
                    <div
                        className={`w-2 h-2 rounded-full ${
                            status.toLowerCase() === "active" ? "bg-green-400" : "bg-red-400"
                        }`}
                    />
                    <span className="hidden sm:inline">{status}</span>
                </Badge>
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
        accessorKey: "birth_date",
        header: ({ column }) => (
            <Button
                variant="ghost"
                onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
                className="hidden md:flex"
            >
                Birth Date
                <ArrowUpDown className="ml-2 h-4 w-4" />
            </Button>
        ),
        cell: ({ row }) => (
            <div className="hidden md:block">{row.getValue("birth_date") || "-"}</div>
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

export default function PatientsTable() {
    const router = useRouter();
    const [patients, setPatients] = React.useState<Patient[]>([]);
    const [searchTerm, setSearchTerm] = React.useState("");
    const [advancedSearch, setAdvancedSearch] = React.useState({
        last_appointment: "",
        birth_date: "",
        age: "",
        contact: "",
        address: "",
    });
    const [tab, setTab] = React.useState("all");
    const [sorting, setSorting] = React.useState<SortingState>([]);
    const [rowSelection, setRowSelection] = React.useState({});
    const [exportFilters, setExportFilters] = React.useState({
        startDate: undefined as Date | undefined,
        endDate: undefined as Date | undefined,
        minAge: "",
        maxAge: "",
        status: "all" as "all" | "active" | "inactive",
        sort: "none" as "none" | "asc" | "desc",
        limit: "",
    });

    React.useEffect(() => {
        async function fetchPatients() {
            try {
                const { data: patientsData, error: patientsError } = await supabase
                    .from("patients")
                    .select(`
                        id,
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

                if (patientsError) {
                    toast.error(`Failed to fetch patients: ${patientsError.message}`);
                    return;
                }

                if (!patientsData || patientsData.length === 0) {
                    toast.info("No patients found.");
                    setPatients([]);
                    return;
                }

                const patientIds = patientsData.map((p: any) => p.id);
                const { data: appointmentsData, error: appointmentsError } = await supabase
                    .from("appointments")
                    .select("patient_id, date")
                    .in("patient_id", patientIds);

                if (appointmentsError) {
                    toast.warning(`Failed to fetch appointments: ${appointmentsError.message}`);
                }

                const formattedPatients: Patient[] = patientsData.map((patient: any) => {
                    const person = patient.person || {};
                    const appointments = appointmentsData
                        ?.filter((a: any) => a.patient_id === patient.id)
                        .sort(
                            (a: any, b: any) =>
                                new Date(b.date).getTime() - new Date(a.date).getTime()
                        );

                    const lastAppointment = appointments?.[0]?.date;

                    return {
                        id: patient.id,
                        name: person.first_name
                            ? `${person.first_name} ${person.middle_name} ${person.last_name || ""}`
                            : "Unknown",
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

                setPatients(formattedPatients);
                toast.success("Patients fetched successfully.");
            } catch (err: any) {
                toast.error(`Error fetching patients: ${err.message}`);
            }
        }

        fetchPatients();
    }, []);

    const filteredPatients = React.useMemo(() => {
        let result = [...patients];

        if (searchTerm) {
            result = result.filter((patient) =>
                patient.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        if (advancedSearch.birth_date) {
            result = result.filter((patient) =>
                patient.birth_date?.toLowerCase().includes(advancedSearch.birth_date.toLowerCase())
            );
        }
        if (advancedSearch.age) {
            result = result.filter((patient) =>
                patient.age?.toLowerCase().includes(advancedSearch.age.toLowerCase())
            );
        }
        if (advancedSearch.contact) {
            result = result.filter((patient) =>
                patient.contact_number?.toLowerCase().includes(advancedSearch.contact.toLowerCase())
            );
        }
        if (advancedSearch.address) {
            result = result.filter((patient) =>
                patient.address?.toLowerCase().includes(advancedSearch.address.toLowerCase())
            );
        }

        if (tab === "active") {
            result = result.filter((patient) => patient.status.toLowerCase() === "active");
        } else if (tab === "inactive") {
            result = result.filter((patient) => patient.status.toLowerCase() === "inactive");
        }

        return result;
    }, [searchTerm, advancedSearch, tab, patients]);

    const getExportPatients = () => {
        let result = [...filteredPatients];

        if (exportFilters.startDate || exportFilters.endDate) {
            result = result.filter((patient) => {
                if (!patient.last_appointment) return false;
                const apptDate = new Date(patient.last_appointment);
                const start = exportFilters.startDate
                    ? new Date(exportFilters.startDate).setHours(0, 0, 0, 0)
                    : -Infinity;
                const end = exportFilters.endDate
                    ? new Date(exportFilters.endDate).setHours(23, 59, 59, 999)
                    : Infinity;
                return apptDate.getTime() >= start && apptDate.getTime() <= end;
            });
        }

        if (exportFilters.minAge || exportFilters.maxAge) {
            result = result.filter((patient) => {
                if (!patient.age) return false;
                const age = parseInt(patient.age);
                const min = exportFilters.minAge ? parseInt(exportFilters.minAge) : -Infinity;
                const max = exportFilters.maxAge ? parseInt(exportFilters.maxAge) : Infinity;
                return age >= min && age <= max;
            });
        }

        if (exportFilters.status !== "all") {
            result = result.filter((patient) =>
                patient.status.toLowerCase() === exportFilters.status
            );
        }

        if (exportFilters.sort !== "none") {
            result.sort((a, b) => {
                const comparison = a.name.localeCompare(b.name);
                return exportFilters.sort === "asc" ? comparison : -comparison;
            });
        }

        if (exportFilters.limit) {
            const limit = parseInt(exportFilters.limit);
            if (!isNaN(limit) && limit > 0) {
                result = result.slice(0, limit);
            }
        }

        return result;
    };

    const handleExport = () => {
        const patientsToExport = getExportPatients();
        const headers = [
            "Name",
            "Status",
            "Last Appointment",
            "Birth Date",
            "Age",
            "Contact Number",
            "Home Address",
        ];
        const rows = patientsToExport.map((patient) => [
            patient.name,
            patient.status,
            patient.last_appointment || "",
            patient.birth_date || "",
            patient.age || "",
            patient.contact_number || "",
            patient.address || "",
        ]);

        const csvContent = [
            headers.join(","),
            ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = "patients_export.csv";
        link.click();
        toast.success("Data exported successfully.");
    };

    const table = useReactTable({
        data: filteredPatients,
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

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Tabs value={tab} onValueChange={setTab}>
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
                                        placeholder="Birth Date..."
                                        value={advancedSearch.birth_date}
                                        onChange={(e) =>
                                            setAdvancedSearch({
                                                ...advancedSearch,
                                                birth_date: e.target.value,
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
                            <DialogContent className="sm:max-w-[600px]">
                                <DialogHeader>
                                    <DialogTitle>Export Patients</DialogTitle>
                                    <DialogDescription>
                                        Customize your export by applying filters and sorting options.
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Last Appointment Start Date</Label>
                                            <DatePicker
                                                value={exportFilters.startDate}
                                                onChange={(date) =>
                                                    setExportFilters({
                                                        ...exportFilters,
                                                        startDate: date,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Last Appointment End Date</Label>
                                            <DatePicker
                                                value={exportFilters.endDate}
                                                onChange={(date) =>
                                                    setExportFilters({
                                                        ...exportFilters,
                                                        endDate: date,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        <div className="space-y-2">
                                            <Label>Minimum Age</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 18"
                                                value={exportFilters.minAge}
                                                onChange={(e) =>
                                                    setExportFilters({
                                                        ...exportFilters,
                                                        minAge: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Maximum Age</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 65"
                                                value={exportFilters.maxAge}
                                                onChange={(e) =>
                                                    setExportFilters({
                                                        ...exportFilters,
                                                        maxAge: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                                        <div className="space-y-2">
                                            <Label>Status</Label>
                                            <Select
                                                value={exportFilters.status}
                                                onValueChange={(value) =>
                                                    setExportFilters({
                                                        ...exportFilters,
                                                        status: value as "all" | "active" | "inactive",
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select status" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="all">All</SelectItem>
                                                    <SelectItem value="active">Active</SelectItem>
                                                    <SelectItem value="inactive">Inactive</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Sort by Name</Label>
                                            <Select
                                                value={exportFilters.sort}
                                                onValueChange={(value) =>
                                                    setExportFilters({
                                                        ...exportFilters,
                                                        sort: value as "none" | "asc" | "desc",
                                                    })
                                                }
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Select sorting" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">None</SelectItem>
                                                    <SelectItem value="asc">A-Z</SelectItem>
                                                    <SelectItem value="desc">Z-A</SelectItem>
                                                </SelectContent>
                                            </Select>
                                        </div>
                                        <div className="space-y-2">
                                            <Label>Export Limit</Label>
                                            <Input
                                                type="number"
                                                placeholder="e.g., 3"
                                                value={exportFilters.limit}
                                                onChange={(e) =>
                                                    setExportFilters({
                                                        ...exportFilters,
                                                        limit: e.target.value,
                                                    })
                                                }
                                            />
                                        </div>
                                    </div>
                                </div>
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
                    <Card x-chunk="dashboard-06-chunk-alda">
                        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md: justify-between">
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
                            {filteredPatients.length === 0 ? (
                                <p className="text-sm text-muted-foreground">
                                    No patients found.
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
                                                    onClick={() => router.push(`/Dashboard/Patients/Patient-View?id=${row.original.id}`)}
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
                                                <TableCell
                                                    colSpan={columns.length}
                                                    className="h-24 text-center"
                                                >
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
                                Showing <strong>1-{filteredPatients.length}</strong> of{" "}
                                <strong>{patients.length}</strong> patients
                            </div>
                        </CardFooter>
                    </Card>
                </TabsContent>
            </Tabs>
        </main>
    );
}