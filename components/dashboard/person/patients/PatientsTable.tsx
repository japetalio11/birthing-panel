"use client";

import { useRouter } from "next/navigation";
import { createSearchParams, useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
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
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";

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

export default function PatientsTable() {
    const router = useRouter();
    const [openDialog, setOpenDialog] = useState(false);
    const [patients, setPatients] = useState<Patient[]>([]);
    const [filteredPatients, setFilteredPatients] = useState<Patient[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [advancedSearch, setAdvancedSearch] = useState({
        last_appointment: "",
        birth_date: "",
        age: "",
        contact: "",
        address: "",
    });
    const [sortOption, setSortOption] = useState("name-asc");
    const [tab, setTab] = useState("all");
    const [selectedPatients, setSelectedPatients] = useState<number[]>([]);

    // Fetch patients from Supabase
    useEffect(() => {
        async function fetchPatients() {
            try {
                // Fetch patients with related person data
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
                    setFilteredPatients([]);
                    return;
                }

                // Fetch appointments separately to get the latest appointment
                const patientIds = patientsData.map((p: any) => p.id);
                const { data: appointmentsData, error: appointmentsError } = await supabase
                    .from("appointment")
                    .select("patient_id, date")
                    .in("patient_id", patientIds);

                if (appointmentsError) {
                    toast.warning(`Failed to fetch appointments: ${appointmentsError.message}`);
                    // Continue without appointments if error occurs
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
                setFilteredPatients(formattedPatients);
                toast.success("Patients fetched successfully.");
            } catch (err: unknown) {
                toast.error(`Error fetching patients: ${err.message}`);
            }
        }

        fetchPatients();
    }, []);

    // Handle search and filtering
    useEffect(() => {
        let result = [...patients];

        // Apply search term
        if (searchTerm) {
            result = result.filter((patient) =>
                patient.name.toLowerCase().includes(searchTerm.toLowerCase())
            );
        }

        // Apply advanced search
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

        // Apply tab filter
        if (tab === "active") {
            result = result.filter((patient) => patient.status.toLowerCase() === "active");
        } else if (tab === "inactive") {
            result = result.filter((patient) => patient.status.toLowerCase() === "inactive");
        }

        // Apply sorting
        result.sort((a, b) => {
            if (sortOption === "name-asc") {
                return a.name.localeCompare(b.name);
            } else if (sortOption === "name-desc") {
                return b.name.localeCompare(a.name);
            } else if (sortOption === "date-asc") {
                return (
                    (a.last_appointment ? new Date(a.last_appointment).getTime() : Infinity) -
                    (b.last_appointment ? new Date(b.last_appointment).getTime() : Infinity)
                );
            } else if (sortOption === "date-desc") {
                return (
                    (b.last_appointment ? new Date(b.last_appointment).getTime() : -Infinity) -
                    (a.last_appointment ? new Date(a.last_appointment).getTime() : -Infinity)
                );
            }
            return 0;
        });

        setFilteredPatients(result);
    }, [searchTerm, advancedSearch, tab, sortOption, patients]);

    // Handle checkbox selection
    const handleSelectPatient = (id: number) => {
        setSelectedPatients((prev) =>
            prev.includes(id) ? prev.filter((pid) => pid !== id) : [...prev, id]
        );
    };

    // Handle export
    const handleExport = () => {
        const headers = ["Name", "Status", "Last Appointment", "Birth Date", "Age", "Contact Number", "Home Address"];
        const rows = filteredPatients.map((patient) => [
            patient.name,
            patient.status,
            patient.birth_date || "",
            patient.age || "",
            patient.last_appointment || "",
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

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button variant="outline" size="sm">
                                    <ListFilter />
                                    <span className="hidden lg:inline">Sort</span>
                                    <ChevronDownIcon />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuRadioGroup
                                    value={sortOption}
                                    onValueChange={setSortOption}
                                >
                                    <DropdownMenuRadioItem value="name-asc">
                                        Name (A-Z)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="name-desc">
                                        Name (Z-A)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="date-asc">
                                        Date (Oldest)
                                    </DropdownMenuRadioItem>
                                    <DropdownMenuRadioItem value="date-desc">
                                        Date (Newest)
                                    </DropdownMenuRadioItem>
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
                                        Export the current patient list as a CSV file.
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
                                        <TableRow>
                                            <TableCell>
                                                <Checkbox
                                                    checked={
                                                        filteredPatients.length > 0 &&
                                                        selectedPatients.length === filteredPatients.length
                                                    }
                                                    onCheckedChange={(checked) =>
                                                        setSelectedPatients(
                                                            checked
                                                                ? filteredPatients.map((p) => p.id)
                                                                : []
                                                        )
                                                    }
                                                />
                                            </TableCell>
                                            <TableHead>Name</TableHead>
                                            <TableHead>Status</TableHead>
                                            <TableHead className="hidden sm:table-cell">
                                                Last Appointment
                                            </TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                Birth Date
                                            </TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                Age
                                            </TableHead>
                                            <TableHead className="hidden md:table-cell">
                                                Contact Number
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
                                        {filteredPatients.map((patient) => (
                                            <TableRow key={patient.id}>
                                                <TableCell>
                                                    <Checkbox
                                                        checked={selectedPatients.includes(patient.id)}
                                                        onCheckedChange={() =>
                                                            handleSelectPatient(patient.id)
                                                        }
                                                    />
                                                </TableCell>
                                                <TableCell className="font-medium">
                                                    {patient.name}
                                                </TableCell>
                                                <TableCell>
                                                    <Badge
                                                        variant="outline"
                                                        className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
                                                    >
                                                        <div
                                                            className={`w-2 h-2 rounded-full ${
                                                                patient.status.toLowerCase() ===
                                                                "active"
                                                                    ? "bg-green-400"
                                                                    : "bg-red-400"
                                                            }`}
                                                        />
                                                        <span className="hidden sm:inline">
                                                            {patient.status}
                                                        </span>
                                                    </Badge>
                                                </TableCell>
                                                <TableCell className="hidden sm:table-cell">
                                                    {patient.last_appointment || "-"}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {patient.birth_date || "-"}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {patient.age || "-"}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {patient.contact_number || "-"}
                                                </TableCell>
                                                <TableCell className="hidden md:table-cell">
                                                    {patient.address || "-"}
                                                </TableCell>
                                                <TableCell>
                                                    <Button
                                                        aria-haspopup="true"
                                                        size="icon"
                                                        variant="ghost"
                                                        onClick={() => router.push(
                                                            `/Patients/Patient-View?id=${patient.id}`
                                                        )}
                                                    >
                                                        <MoreHorizontal className="h-4 w-4" />
                                                        <span className="sr-only">
                                                            Toggle menu
                                                        </span>
                                                    </Button>

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
                                                                    permanently delete this record and remove
                                                                    it from the system.
                                                                </AlertDialogDescription>
                                                            </AlertDialogHeader>
                                                            <AlertDialogFooter>
                                                                <AlertDialogCancel>
                                                                    Cancel
                                                                </AlertDialogCancel>
                                                                <AlertDialogAction
                                                                    className="bg-red-600 hover:bg-red-700"
                                                                    onClick={() => handleDelete(patient.id)}
                                                                >
                                                                    Delete
                                                                </AlertDialogAction>
                                                            </AlertDialogFooter>
                                                        </AlertDialogContent>
                                                    </AlertDialog>
                                                </TableCell>
                                            </TableRow>
                                        ))}
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