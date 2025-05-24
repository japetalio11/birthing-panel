"use client";

import React, { useState, useEffect } from "react";
import { PillBottle, Trash2, Search } from "lucide-react";
import { useForm, FormProvider } from "react-hook-form";
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
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Form,
    FormControl,
    FormField,
    FormItem,
    FormLabel,
    FormMessage,
} from "@/components/ui/form";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { supabase } from "@/lib/supabase/client";
import { Separator } from "@radix-ui/react-dropdown-menu";
import { useIsAdmin } from "@/hooks/useIsAdmin";

type Props = {
    context: "patient" | "clinician";
    id: string | null;
    fields?: any[];
    append?: (supplement: any) => void;
    remove?: (index: number) => void;
};

const formSchema = z.object({
    name: z.string().min(1, "Supplement name is required"),
    strength: z.string().min(1, "Strength is required"),
    amount: z.string().min(1, "Amount is required"),
    frequency: z.string().min(1, "Frequency is required"),
    route: z.string().min(1, "Route is required"),
    clinician_id: z.string().min(1, "Clinician is required"),
});

type FormValues = z.infer<typeof formSchema>;

type Clinician = {
    id: string;
    full_name: string;
};

export default function SupplementRecommendation({
    context,
    id,
    fields = [],
    append,
    remove,
}: Props) {
    const [openDialog, setOpenDialog] = useState(false);
    const [supplementsData, setSupplementsData] = useState<any[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [clinicians, setClinicians] = useState<Clinician[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("");
    const { isAdmin } = useIsAdmin();

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            strength: "",
            amount: "",
            frequency: "",
            route: "",
            clinician_id: "",
        },
    });

    // Fetch clinicians
    useEffect(() => {
        async function fetchClinicians() {
            try {
                const { data, error } = await supabase
                    .from("clinicians")
                    .select(`
                        id,
                        person (
                            first_name,
                            middle_name,
                            last_name
                        )
                    `);

                if (error) {
                    console.error("Clinician fetch error:", error);
                    toast("Error", {
                        description: "Failed to fetch clinicians.",
                    });
                    return;
                }

                const clinicianList: Clinician[] = data.map((clinician: any) => {
                    const nameParts = [
                        clinician.person?.first_name,
                        clinician.person?.middle_name,
                        clinician.person?.last_name,
                    ].filter((part) => part != null && part !== "");
                    const full_name = nameParts.length > 0 ? nameParts.join(" ") : "Unknown Clinician";

                    if (!clinician.person?.first_name || !clinician.person?.last_name) {
                        console.warn(`Missing name data for clinician ID ${clinician.id}:`, clinician.person);
                    }

                    return {
                        id: clinician.id.toString(),
                        full_name,
                    };
                });

                setClinicians(clinicianList);
            } catch (err) {
                console.error("Unexpected error fetching clinicians:", err);
                toast("Error", {
                    description: "Unexpected error fetching clinicians.",
                });
            }
        }

        fetchClinicians();
    }, []);

    // Fetch supplements
    useEffect(() => {
        async function fetchSupplements() {
            if (!id) {
                setSupplementsData(fields);
                setFetchError(null);
                return;
            }
            try {
                const query = supabase
                    .from("supplements")
                    .select(`
                        *,
                        clinicians (
                            id,
                            person (
                                first_name,
                                middle_name,
                                last_name
                            )
                        ),
                        patients!patient_id (
                            id,
                            person (
                                first_name,
                                middle_name,
                                last_name
                            )
                        )
                    `);

                // Apply filter based on context
                if (context === 'patient') {
                    query.eq("patient_id", id);
                } else {
                    query.eq("clinician_id", id);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Supplement fetch error:", error);
                    setFetchError("Failed to fetch supplements.");
                    toast("Error", {
                        description: "Failed to fetch supplements.",
                    });
                    setSupplementsData([]);
                    return;
                }

                const formattedData = data.map((supplement: any) => {
                    const clinicianName = supplement.clinicians?.person
                        ? [
                              supplement.clinicians.person.first_name,
                              supplement.clinicians.person.middle_name,
                              supplement.clinicians.person.last_name,
                          ]
                              .filter((part) => part != null && part !== "")
                              .join(" ") || "Unknown Clinician"
                        : "Unknown Clinician";

                    const patientName = supplement.patients?.person
                        ? [
                              supplement.patients.person.first_name,
                              supplement.patients.person.middle_name,
                              supplement.patients.person.last_name,
                          ]
                              .filter((part) => part != null && part !== "")
                              .join(" ") || "Unknown Patient"
                        : "Unknown Patient";

                    if (!supplement.clinicians?.person?.first_name) {
                        console.warn(`Missing clinician name for supplement ID ${supplement.id}:`, supplement.clinicians);
                    }

                    return {
                        ...supplement,
                        clinician: clinicianName,
                        patient: patientName,
                        date: supplement.date ? new Date(supplement.date).toLocaleDateString() : "N/A",
                        status: supplement.status || "Active",
                    };
                });
                setSupplementsData(formattedData);
                setFetchError(null);
                if (append) {
                    formattedData.forEach((supplement: any) => {
                        append({
                            ...supplement
                        });
                    });
                }
            } catch (err) {
                console.error("Unexpected error fetching supplements:", err);
                setFetchError("Unexpected error fetching supplements.");
                toast("Error", {
                    description: "Unexpected error fetching supplements.",
                });
                setSupplementsData([]);
            }
        }

        fetchSupplements();
    }, [id, fields, append, context]);

    const onSubmitSupplement = async (data: FormValues) => {
        if (!id && !append) {
            toast("Error", {
                description: "Cannot add supplement without form integration.",
            });
            return;
        }

        try {
            if (id) {
                const { data: newSupplement, error } = await supabase
                    .from("supplements")
                    .insert([
                        {
                            patient_id: id,
                            name: data.name,
                            strength: data.strength,
                            amount: data.amount,
                            frequency: data.frequency,
                            route: data.route,
                            clinician_id: parseInt(data.clinician_id),
                            status: "Active",
                            date: new Date().toISOString(),
                        },
                    ])
                    .select()
                    .single();

                if (error) {
                    console.error("Supplement insert error:", error);
                    toast("Error", {
                        description: `Failed to add supplement: ${error.message}`,
                    });
                    return;
                }

                if (append) {
                    append({
                        id: newSupplement.id,
                        name: data.name,
                        strength: data.strength,
                        amount: data.amount,
                        frequency: data.frequency,
                        route: data.route,
                        clinician_id: data.clinician_id,
                        clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown Clinician",
                        status: "Active",
                        date: new Date().toLocaleDateString(),
                    });
                } else {
                    setSupplementsData((prev) => [
                        ...prev,
                        {
                            ...newSupplement,
                            clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown Clinician",
                            status: "Active",
                            date: new Date().toLocaleDateString(),
                        },
                    ]);
                }
                toast("Supplement Added", {
                    description: "New supplement has been added successfully.",
                });
            } else if (append) {
                append({
                    name: data.name,
                    strength: data.strength,
                    amount: data.amount,
                    frequency: data.frequency,
                    route: data.route,
                    clinician_id: data.clinician_id,
                    clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown Clinician",
                    status: "Active",
                    date: new Date().toLocaleDateString(),
                });
                toast("Supplement Added", {
                    description: "New supplement has been added successfully.",
                });
            }

            form.reset({
                name: "",
                strength: "",
                amount: "",
                frequency: "",
                route: "",
                clinician_id: "",
            });
            setOpenDialog(false);
        } catch (err) {
            console.error("Unexpected error:", err);
            toast("Error", {
                description: "An unexpected error occurred while saving the supplement.",
            });
        }
    };

    const handleDelete = async (index: number) => {
        try {
            if (id) {
                const supplementToDelete = (fields.length > 0 ? fields : supplementsData)[index];
                const { error } = await supabase
                    .from("supplements")
                    .delete()
                    .eq("id", supplementToDelete.id);

                if (error) {
                    console.error("Supplement delete error:", error);
                    toast("Error", {
                        description: `Failed to delete supplement: ${error.message}`,
                    });
                    return;
                }

                setSupplementsData((prev) => prev.filter((_, idx) => idx !== index));
            }

            if (remove) {
                remove(index);
            }
            toast("Supplement Deleted", {
                description: "Supplement has been removed from the list.",
            });
        } catch (err) {
            console.error("Unexpected error deleting supplement:", err);
            toast("Error", {
                description: "An unexpected error occurred while deleting the supplement.",
            });
        }
    };

    const handleStatusChange = async (index: number, newStatus: string) => {
        try {
            const supplementToUpdate = (fields.length > 0 ? fields : supplementsData)[index];
            if (id) {
                const { error } = await supabase
                    .from("supplements")
                    .update({ status: newStatus })
                    .eq("id", supplementToUpdate.id);

                if (error) {
                    console.error("Supplement status update error:", error);
                    toast("Error", {
                        description: `Failed to update supplement status: ${error.message}`,
                    });
                    return;
                }
            }

            setSupplementsData((prev) =>
                prev.map((supp, idx) =>
                    idx === index ? { ...supp, status: newStatus } : supp
                )
            );

            if (fields.length > 0 && append) {
                append({
                    ...supplementToUpdate,
                    status: newStatus,
                });
            }

            toast.success("Status Updated", {
                description: `Supplement status changed to ${newStatus}.`,
            });
        } catch (err) {
            console.error("Unexpected error updating status:", err);
            toast("Error", {
                description: "An unexpected error occurred while updating the status.",
            });
        }
    };

    const displaySupplements = fields.length > 0 ? fields : supplementsData;

    // Filter supplements based on search term and filters
    const filteredSupplements = displaySupplements.filter((supplement) => {
        const matchesSearch =
            supplement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            supplement.patient?.toLowerCase().includes(searchTerm.toLowerCase());

        const matchesStatus = statusFilter === "all" || supplement.status === statusFilter;

        const matchesDate = !dateFilter ||
            (supplement.date && new Date(supplement.date).toLocaleDateString() === new Date(dateFilter).toLocaleDateString());

        return matchesSearch && matchesStatus && matchesDate;
    });

    return (
        <Card>
            <CardHeader className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <CardTitle>Supplements</CardTitle>
                    <CardDescription>
                        {context === 'patient'
                            ? "Identify your patient's supplements before it's too late"
                            : "View all supplements you have given to patients"}
                    </CardDescription>
                </div>
                <div className="flex flex-col gap-4 md:flex-row md:items-center md:gap-3 w-full md:w-auto">
                    <div className="relative w-full md:w-64">
                        <Search className="absolute left-2.5 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                        <Input
                            type="search"
                            placeholder="Search supplements..."
                            className="w-full pl-8 pr-4 py-2 rounded-lg bg-background"
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                    <Select value={statusFilter} onValueChange={setStatusFilter}>
                        <SelectTrigger className="w-full md:w-40">
                            <SelectValue placeholder="Filter by status" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">All Status</SelectItem>
                            <SelectItem value="Active">Active</SelectItem>
                            <SelectItem value="Completed">Completed</SelectItem>
                            <SelectItem value="Discontinued">Discontinued</SelectItem>
                        </SelectContent>
                    </Select>
                    <Input
                        type="date"
                        value={dateFilter}
                        onChange={(e) => setDateFilter(e.target.value)}
                        className="w-full md:w-40"
                    />
                    {context === 'patient' && (
                        <Dialog
                            open={openDialog}
                            onOpenChange={(open) => {
                                setOpenDialog(open);
                                if (!open) {
                                    form.reset({
                                        name: "",
                                        strength: "",
                                        amount: "",
                                        frequency: "",
                                        route: "",
                                        clinician_id: "",
                                    });
                                }
                            }}
                        >
                            <DialogTrigger asChild>
                                <Button size="sm" className="h-8 flex items-center gap-1">
                                    <PillBottle className="h-4 w-4" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                        Add Supplement
                                    </span>
                                </Button>
                            </DialogTrigger>
                            <DialogContent className="sm:max-w-[1000px]">
                                <DialogHeader>
                                    <DialogTitle>Add Supplement</DialogTitle>
                                    <DialogDescription>
                                        Add a new supplement to your patient. Click save when you're done!
                                    </DialogDescription>
                                </DialogHeader>
                                <FormProvider {...form}>
                                    <Form {...form}>
                                        <form
                                            onSubmit={form.handleSubmit(onSubmitSupplement)}
                                            className="grid gap-4 py-4"
                                        >
                                            <div className="grid grid-cols-3 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="name"
                                                    render={({ field }) => (
                                                        <FormItem className="grid grid-cols-4 items-center gap-2">
                                                            <FormLabel htmlFor="supplement" className="text-right">
                                                                Supplement
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    id="supplement"
                                                                    placeholder="Enter supplement"
                                                                    className="col-span-4"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="col-span-4" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="strength"
                                                    render={({ field }) => (
                                                        <FormItem className="grid grid-cols-4 items-center gap-2">
                                                            <FormLabel htmlFor="strength" className="text-right">
                                                                Strength
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    id="strength"
                                                                    placeholder="Enter strength"
                                                                    className="col-span-4"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="col-span-4" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="amount"
                                                    render={({ field }) => (
                                                        <FormItem className="grid grid-cols-4 items-center gap-2">
                                                            <FormLabel htmlFor="amount" className="text-right">
                                                                Amount
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    id="amount"
                                                                    placeholder="Enter amount"
                                                                    className="col-span-4"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="col-span-4" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <div className="grid grid-cols-3 gap-4">
                                                <FormField
                                                    control={form.control}
                                                    name="frequency"
                                                    render={({ field }) => (
                                                        <FormItem className="grid grid-cols-4 items-center gap-2">
                                                            <FormLabel htmlFor="frequency" className="text-right">
                                                                Frequency
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    id="frequency"
                                                                    placeholder="Enter frequency"
                                                                    className="col-span-4"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="col-span-4" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="route"
                                                    render={({ field }) => (
                                                        <FormItem className="grid grid-cols-4 items-center gap-2">
                                                            <FormLabel htmlFor="route" className="text-right">
                                                                Route
                                                            </FormLabel>
                                                            <FormControl>
                                                                <Input
                                                                    id="route"
                                                                    placeholder="Enter route"
                                                                    className="col-span-4"
                                                                    {...field}
                                                                />
                                                            </FormControl>
                                                            <FormMessage className="col-span-4" />
                                                        </FormItem>
                                                    )}
                                                />
                                                <FormField
                                                    control={form.control}
                                                    name="clinician_id"
                                                    render={({ field }) => (
                                                        <FormItem className="grid grid-cols-4 items-center gap-2">
                                                            <FormLabel htmlFor="clinician_id" className="text-right">
                                                                Clinician
                                                            </FormLabel>
                                                            <Select onValueChange={field.onChange} value={field.value}>
                                                                <FormControl>
                                                                    <SelectTrigger id="clinician_id" className="col-span-4">
                                                                        <SelectValue placeholder="Select clinician" />
                                                                    </SelectTrigger>
                                                                </FormControl>
                                                                <SelectContent>
                                                                    <div className="relative">
                                                                        <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                                                                        <Input
                                                                            type="search"
                                                                            placeholder="Search by name..."
                                                                            className="w-full pl-8 rounded-lg bg-background"
                                                                            // value={searchTerm}
                                                                            // onChange={(e) => setSearchTerm(e.target.value)}
                                                                        />
                                                                    </div>
                                                                    <div className="pt-2">
                                                                        <Separator />
                                                                        {clinicians.map((clinician) => (
                                                                            <SelectItem key={clinician.id} value={clinician.id}>
                                                                                {clinician.full_name}
                                                                            </SelectItem>
                                                                        ))}
                                                                    </div>
                                                                </SelectContent>
                                                            </Select>
                                                            <FormMessage className="col-span-4" />
                                                        </FormItem>
                                                    )}
                                                />
                                            </div>
                                            <DialogFooter>
                                                <Button type="submit">Save supplement</Button>
                                            </DialogFooter>
                                        </form>
                                    </Form>
                                </FormProvider>
                            </DialogContent>
                        </Dialog>
                    )}
                </div>
            </CardHeader>
            <CardContent>
                {fetchError ? (
                    <p className="text-sm text-red-600">{fetchError}</p>
                ) : filteredSupplements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        {searchTerm || statusFilter !== "all" || dateFilter
                            ? "No supplements found matching the search criteria."
                            : context === 'patient'
                                ? "No supplements recorded for this patient."
                                : "No supplements given by this clinician."}
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell>
                                    <Checkbox id="select-all" />
                                </TableCell>
                                <TableHead>Supplement</TableHead>
                                <TableHead>Strength</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Status</TableHead>
                                {context === 'patient' ? (
                                    <TableHead>Clinician</TableHead>
                                ) : (
                                    <TableHead>Patient</TableHead>
                                )}
                                <TableHead>Issued on</TableHead>
                                {isAdmin && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredSupplements.map((supplement, index) => (
                                <TableRow key={supplement.id || index}>
                                    <TableCell>
                                        <Checkbox id={`supplement-${supplement.id || index}`} />
                                    </TableCell>
                                    <TableCell className="font-medium">{supplement.name}</TableCell>
                                    <TableCell>{supplement.strength}</TableCell>
                                    <TableCell>{supplement.amount}</TableCell>
                                    <TableCell>{supplement.frequency}</TableCell>
                                    <TableCell>{supplement.route}</TableCell>
                                    <TableCell>
                                        <Select
                                            value={supplement.status}
                                            onValueChange={(value) => handleStatusChange(index, value)}
                                        >
                                            <SelectTrigger>
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Active" className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-green-400" />
                                                    Active
                                                </SelectItem>
                                                <SelectItem value="Completed" className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-blue-400" />
                                                    Completed
                                                </SelectItem>
                                                <SelectItem value="Discontinued" className="flex items-center gap-2">
                                                    <div className="w-2 h-2 rounded-full bg-red-400" />
                                                    Discontinued
                                                </SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </TableCell>
                                    <TableCell>
                                        {context === 'patient' ? supplement.clinician : supplement.patient}
                                    </TableCell>
                                    <TableCell>{supplement.date}</TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                onClick={() => handleDelete(index)}
                                            >
                                                <Trash2 />
                                                Delete
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredSupplements.length}</strong> of{" "}
                    <strong>{displaySupplements.length}</strong> Supplements
                </div>
            </CardFooter>
        </Card>
    );
}