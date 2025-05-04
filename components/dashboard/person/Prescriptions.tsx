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

type Props = {
    context: "patient";
    id: string | null;
    fields?: any[];
    append?: (prescription: any) => void;
    remove?: (index: number) => void;
};

const formSchema = z.object({
    name: z.string().min(1, "Prescription name is required"),
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

export default function Prescriptions({
    context,
    id,
    fields = [],
    append,
    remove,
}: Props) {
    const [openDialog, setOpenDialog] = useState(false);
    const [prescriptionsData, setPrescriptionsData] = useState<any[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [clinicians, setClinicians] = useState<Clinician[]>([]);

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
                    console.error("Clinician fetch error:", error.code, error.message, error.details);
                    toast("Error", {
                        description: "Failed to fetch clinicians: " + error.message,
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

    // Fetch prescriptions
    useEffect(() => {
        async function fetchPrescriptions() {
            if (!id) {
                setPrescriptionsData(fields);
                setFetchError(null);
                return;
            }

            try {
                const { data, error } = await supabase
                    .from("prescriptions")
                    .select(`
                        id,
                        clinician_id,
                        patient_id,
                        appointment_id,
                        status,
                        appointments (
                            name,
                            strength,
                            amount,
                            frequency,
                            route
                        ),
                        clinicians!clinician_id (
                            id,
                            person (
                                first_name,
                                middle_name,
                                last_name
                            )
                        )
                    `)
                    .eq("patient_id", id);

                if (error) {
                    console.error("Prescription fetch error:", error.code, error.message, error.details);
                    setFetchError(`Failed to fetch prescriptions: ${error.message}`);
                    toast("Error", {
                        description: `Failed to fetch prescriptions: ${error.message}`,
                    });
                    setPrescriptionsData([]);
                } else {
                    const formattedData = data.map((prescription: any) => {
                        const clinicianName = prescription.clinicians?.person
                            ? [
                                  prescription.clinicians.person.first_name,
                                  prescription.clinicians.person.middle_name,
                                  prescription.clinicians.person.last_name,
                              ]
                                  .filter((part) => part != null && part !== "")
                                  .join(" ") || "Unknown Clinician"
                            : "Unknown Clinician";

                        if (!prescription.clinicians?.person?.first_name) {
                            console.warn(`Missing clinician name for prescription ID ${prescription.id}:`, prescription.clinicians);
                        }

                        if (!prescription.appointments) {
                            console.warn(`Missing appointment data for prescription ID ${prescription.id}:`, prescription);
                        }

                        return {
                            id: prescription.id,
                            name: prescription.appointments?.name || "N/A",
                            strength: prescription.appointments?.strength || "N/A",
                            amount: prescription.appointments?.amount || "N/A",
                            frequency: prescription.appointments?.frequency || "N/A",
                            route: prescription.appointments?.route || "N/A",
                            clinician_id: prescription.clinician_id?.toString(),
                            clinician: clinicianName,
                            appointment_id: prescription.appointment_id,
                            status: prescription.status,
                        };
                    });
                    setPrescriptionsData(formattedData);
                    setFetchError(null);
                    if (append) {
                        formattedData.forEach((prescription: any) => {
                            append({
                                id: prescription.id,
                                name: prescription.name,
                                strength: prescription.strength,
                                amount: prescription.amount,
                                frequency: prescription.frequency,
                                route: prescription.route,
                                clinician_id: prescription.clinician_id,
                                clinician: prescription.clinician,
                                appointment_id: prescription.appointment_id,
                                status: prescription.status,
                            });
                        });
                    }
                }
            } catch (err) {
                console.error("Unexpected error fetching prescriptions:", err);
                setFetchError("Unexpected error fetching prescriptions.");
                toast("Error", {
                    description: "Unexpected error fetching prescriptions.",
                });
                setPrescriptionsData([]);
            }
        }

        fetchPrescriptions();
    }, [id, fields, append]);

    const onSubmitPrescription = async (data: FormValues) => {
        if (!id && !append) {
            toast("Error", {
                description: "Cannot add prescription without form integration.",
            });
            return;
        }

        try {
            if (id) {
                // First, insert into appointments to get an appointment_id
                const { data: newAppointment, error: appointmentError } = await supabase
                    .from("appointments")
                    .insert([
                        {
                            name: data.name,
                            strength: data.strength,
                            amount: data.amount,
                            frequency: data.frequency,
                            route: data.route,
                        },
                    ])
                    .select()
                    .single();

                if (appointmentError) {
                    console.error("Appointment insert error:", appointmentError.code, appointmentError.message, appointmentError.details);
                    toast("Error", {
                        description: `Failed to create appointment for prescription: ${appointmentError.message}`,
                    });
                    return;
                }

                // Then, insert into prescriptions with the appointment_id
                const { data: newPrescription, error: prescriptionError } = await supabase
                    .from("prescriptions")
                    .insert([
                        {
                            patient_id: id,
                            clinician_id: parseInt(data.clinician_id),
                            appointment_id: newAppointment.id,
                            status: "active", // Assuming a default status
                        },
                    ])
                    .select()
                    .single();

                if (prescriptionError) {
                    console.error("Prescription insert error:", prescriptionError.code, prescriptionError.message, prescriptionError.details);
                    toast("Error", {
                        description: `Failed to add prescription: ${prescriptionError.message}`,
                    });
                    return;
                }

                const clinicianName = clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown Clinician";
                if (clinicianName === "Unknown Clinician") {
                    console.warn(`No clinician found for clinician_id ${data.clinician_id} during prescription insert`);
                }

                if (append) {
                    append({
                        id: newPrescription.id,
                        name: data.name,
                        strength: data.strength,
                        amount: data.amount,
                        frequency: data.frequency,
                        route: data.route,
                        clinician_id: data.clinician_id,
                        clinician: clinicianName,
                        appointment_id: newPrescription.appointment_id,
                        status: newPrescription.status,
                    });
                } else {
                    setPrescriptionsData((prev) => [
                        ...prev,
                        {
                            id: newPrescription.id,
                            name: data.name,
                            strength: data.strength,
                            amount: data.amount,
                            frequency: data.frequency,
                            route: data.route,
                            clinician_id: data.clinician_id,
                            clinician: clinicianName,
                            appointment_id: newPrescription.appointment_id,
                            status: newPrescription.status,
                        },
                    ]);
                }
                toast("Prescription Added", {
                    description: "New prescription has been added successfully.",
                });
            } else if (append) {
                const clinicianName = clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown Clinician";
                if (clinicianName === "Unknown Clinician") {
                    console.warn(`No clinician found for clinician_id ${data.clinician_id} during prescription append`);
                }

                append({
                    name: data.name,
                    strength: data.strength,
                    amount: data.amount,
                    frequency: data.frequency,
                    route: data.route,
                    clinician_id: data.clinician_id,
                    clinician: clinicianName,
                    appointment_id: null, // No appointment_id when id is null
                    status: "active",
                });
                toast("Prescription Added", {
                    description: "New prescription has been added successfully.",
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
            console.error("Unexpected error saving prescription:", err);
            toast("Error", {
                description: "An unexpected error occurred while saving the prescription.",
            });
        }
    };

    const handleDelete = async (index: number) => {
        try {
            if (id) {
                const prescriptionToDelete = (fields.length > 0 ? fields : prescriptionsData)[index];
                const { error: prescriptionError } = await supabase
                    .from("prescriptions")
                    .delete()
                    .eq("id", prescriptionToDelete.id);

                if (prescriptionError) {
                    console.error("Prescription delete error:", prescriptionError.code, prescriptionError.message, prescriptionError.details);
                    toast("Error", {
                        description: `Failed to delete prescription: ${prescriptionError.message}`,
                    });
                    return;
                }

                // Optionally delete the associated appointment
                if (prescriptionToDelete.appointment_id) {
                    const { error: appointmentError } = await supabase
                        .from("appointments")
                        .delete()
                        .eq("id", prescriptionToDelete.appointment_id);

                    if (appointmentError) {
                        console.warn("Appointment delete error:", appointmentError.code, appointmentError.message, appointmentError.details);
                    }
                }

                setPrescriptionsData((prev) => prev.filter((_, idx) => idx !== index));
            }

            if (remove) {
                remove(index);
            }
            toast("Prescription Deleted", {
                description: "Prescription has been removed from the list.",
            });
        } catch (err) {
            console.error("Unexpected error deleting prescription:", err);
            toast("Error", {
                description: "An unexpected error occurred while deleting the prescription.",
            });
        }
    };

    const displayPrescriptions = fields.length > 0 ? fields : prescriptionsData;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <CardTitle>Prescriptions</CardTitle>
                    <CardDescription>
                        Identify your patient's prescriptions before it's too late
                    </CardDescription>
                </div>
                <div className="relative flex items-center w-full max-w-sm md:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search prescriptions..."
                        className="w-full pl-8 rounded-lg bg-background"
                        onChange={(e) => {
                            // Implement search logic if needed
                        }}
                    />
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
                            <Button size="sm" className="h-8 ml-2 flex items-center gap-1">
                                <PillBottle className="h-4 w-4" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Add Prescription
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[1000px]">
                            <DialogHeader>
                                <DialogTitle>Add Prescription</DialogTitle>
                                <DialogDescription>
                                    Add a new prescription to your patient. Click save when you're done!
                                </DialogDescription>
                            </DialogHeader>
                            <FormProvider {...form}>
                                <Form {...form}>
                                    <form
                                        onSubmit={form.handleSubmit(onSubmitPrescription)}
                                        className="grid gap-4 py-4"
                                    >
                                        <div className="grid grid-cols-3 gap-4">
                                            <FormField
                                                control={form.control}
                                                name="name"
                                                render={({ field }) => (
                                                    <FormItem className="grid grid-cols-4 items-center gap-2">
                                                        <FormLabel htmlFor="prescription" className="text-right">
                                                            Prescription
                                                        </FormLabel>
                                                        <FormControl>
                                                            <Input
                                                                id="prescription"
                                                                placeholder="Enter prescription"
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
                                                                {clinicians.map((clinician) => (
                                                                    <SelectItem key={clinician.id} value={clinician.id}>
                                                                        {clinician.full_name}
                                                                    </SelectItem>
                                                                ))}
                                                            </SelectContent>
                                                        </Select>
                                                        <FormMessage className="col-span-4" />
                                                    </FormItem>
                                                )}
                                            />
                                        </div>
                                        <DialogFooter>
                                            <Button type="submit">Save prescription</Button>
                                        </DialogFooter>
                                    </form>
                                </Form>
                            </FormProvider>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                {fetchError ? (
                    <p className="text-sm text-red-600">{fetchError}</p>
                ) : displayPrescriptions.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No prescriptions recorded for this patient.
                    </p>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableCell>
                                    <Checkbox
                                        id="select-all"
                                        onCheckedChange={(checked) => {
                                            // Implement select all logic if needed
                                        }}
                                    />
                                </TableCell>
                                <TableHead>Prescription</TableHead>
                                <TableHead>Strength</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Clinician</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displayPrescriptions.map((prescription, index) => (
                                <TableRow key={prescription.id || index}>
                                    <TableCell>
                                        <Checkbox id={`prescription-${prescription.id || index}`} />
                                    </TableCell>
                                    <TableCell className="font-medium">{prescription.name}</TableCell>
                                    <TableCell>{prescription.strength}</TableCell>
                                    <TableCell>{prescription.amount}</TableCell>
                                    <TableCell>{prescription.frequency}</TableCell>
                                    <TableCell>{prescription.route}</TableCell>
                                    <TableCell>{prescription.clinician || "Unknown Clinician"}</TableCell>
                                    <TableCell>{prescription.status}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleDelete(index)}
                                        >
                                            <Trash2 />
                                            Delete
                                        </Button>
                                    </TableCell>
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{displayPrescriptions.length}</strong> of{" "}
                    <strong>{displayPrescriptions.length}</strong> Prescriptions
                </div>
            </CardFooter>
        </Card>
    );
}