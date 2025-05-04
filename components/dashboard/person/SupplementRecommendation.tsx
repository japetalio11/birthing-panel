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
    append?: (supplement: any) => void;
    remove?: (index: number) => void;
    update?: (index: number, supplement: any) => void;
};

const formSchema = z.object({
    name: z.string().min(1, "Supplement name is required"),
    strength: z.string().min(1, "Strength is required"),
    amount: z.string().min(1, "Amount is required"),
    frequency: z.string().min(1, "Frequency is required"),
    route: z.string().min(1, "Route is required"),
    clinician_id: z.string().min(1, "Clinician is required"), // Changed to clinician_id
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
    update,
}: Props) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [supplementsData, setSupplementsData] = useState<any[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);
    const [clinicians, setClinicians] = useState<Clinician[]>([]); // State for clinicians

    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
            name: "",
            strength: "",
            amount: "",
            frequency: "",
            route: "",
            clinician_id: "", // Added clinician_id
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

                const clinicianList: Clinician[] = data.map((clinician: any) => ({
                    id: clinician.id.toString(),
                    full_name: `${clinician.person.first_name} ${clinician.person.middle_name} ${clinician.person.last_name}`,
                }));

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
                const { data, error } = await supabase
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
                        )
                    `)
                    .eq("patient_id", id);

                if (error) {
                    console.error("Supplement fetch error:", error);
                    setFetchError("Failed to fetch supplements.");
                    toast("Error", {
                        description: "Failed to fetch supplements.",
                    });
                    setSupplementsData([]);
                } else {
                    const formattedData = data.map((supplement: any) => ({
                        ...supplement,
                        clinician: supplement.clinicians
                            ? `${supplement.clinicians.person.first_name} ${supplement.clinicians.middle_name} ${supplement.clinicians.person.last_name}`
                            : "Unknown",
                    }));
                    setSupplementsData(formattedData);
                    setFetchError(null);
                    if (append) {
                        formattedData.forEach((supplement: any) => {
                            append({
                                id: supplement.id,
                                name: supplement.name,
                                strength: supplement.strength,
                                amount: supplement.amount,
                                frequency: supplement.frequency,
                                route: supplement.route,
                                clinician_id: supplement.clinician_id?.toString(),
                                clinician: supplement.clinician,
                            });
                        });
                    }
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
    }, [id, fields, append]);

    const onSubmitSupplement = async (data: FormValues) => {
        if (!id && !append) {
            toast("Error", {
                description: "Cannot add supplement without form integration.",
            });
            return;
        }

        try {
            if (id) {
                if (editingIndex !== null) {
                    const supplementToUpdate = (fields.length > 0 ? fields : supplementsData)[editingIndex];
                    const { error } = await supabase
                        .from("supplements")
                        .update({
                            name: data.name,
                            strength: data.strength,
                            amount: data.amount,
                            frequency: data.frequency,
                            route: data.route,
                            clinician_id: parseInt(data.clinician_id), // Save clinician_id
                        })
                        .eq("id", supplementToUpdate.id);

                    if (error) {
                        console.error("Supplement update error:", error);
                        toast("Error", {
                            description: `Failed to update supplement: ${error.message}`,
                        });
                        return;
                    }

                    if (update) {
                        update(editingIndex, {
                            id: supplementToUpdate.id,
                            name: data.name,
                            strength: data.strength,
                            amount: data.amount,
                            frequency: data.frequency,
                            route: data.route,
                            clinician_id: data.clinician_id,
                            clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown",
                        });
                    } else {
                        setSupplementsData((prev) =>
                            prev.map((supplement, idx) =>
                                idx === editingIndex
                                    ? {
                                          ...supplement,
                                          ...data,
                                          clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown",
                                      }
                                    : supplement,
                            ),
                        );
                    }
                    toast("Supplement Updated", {
                        description: "Supplement has been updated successfully.",
                    });
                } else {
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
                                clinician_id: parseInt(data.clinician_id), // Save clinician_id
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
                            clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown",
                        });
                    } else {
                        setSupplementsData((prev) => [
                            ...prev,
                            {
                                ...newSupplement,
                                clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown",
                            },
                        ]);
                    }
                    toast("Supplement Added", {
                        description: "New supplement has been added successfully.",
                    });
                }
            } else if (append) {
                if (editingIndex !== null) {
                    update!(editingIndex, {
                        name: data.name,
                        strength: data.strength,
                        amount: data.amount,
                        frequency: data.frequency,
                        route: data.route,
                        clinician_id: data.clinician_id,
                        clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown",
                    });
                    toast("Supplement Updated", {
                        description: "Supplement has been updated successfully.",
                    });
                } else {
                    append({
                        name: data.name,
                        strength: data.strength,
                        amount: data.amount,
                        frequency: data.frequency,
                        route: data.route,
                        clinician_id: data.clinician_id,
                        clinician: clinicians.find((c) => c.id === data.clinician_id)?.full_name || "Unknown",
                    });
                    toast("Supplement Added", {
                        description: "New supplement has been added successfully.",
                    });
                }
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
            setEditingIndex(null);
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
        };
    };

    const handleEdit = (index: number) => {
        const supplement = (fields.length > 0 ? fields : supplementsData)[index];
        form.reset({
            name: supplement.name,
            strength: supplement.strength,
            amount: supplement.amount,
            frequency: supplement.frequency,
            route: supplement.route,
            clinician_id: supplement.clinician_id?.toString() || "",
        });
        setEditingIndex(index);
        setOpenDialog(true);
    };

    const displaySupplements = fields.length > 0 ? fields : supplementsData;

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <CardTitle>Supplements</CardTitle>
                    <CardDescription>
                        Identify your patient's supplements before it's too late
                    </CardDescription>
                </div>
                <div className="relative flex items-center w-full max-w-sm md:w-auto">
                    <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                        type="search"
                        placeholder="Search supplements..."
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
                                setEditingIndex(null);
                            }
                        }}
                    >
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8 ml-2 flex items-center gap-1">
                                <PillBottle className="h-4 w-4" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    Add Supplement
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-[1000px]">
                            <DialogHeader>
                                <DialogTitle>{editingIndex !== null ? "Edit Supplement" : "Add Supplement"}</DialogTitle>
                                <DialogDescription>
                                    {editingIndex !== null
                                        ? "Edit the supplement details. Click save when you're done!"
                                        : "Add a new supplement to your patient. Click save when you're done!"}
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
                                            <Button type="submit">Save supplement</Button>
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
                ) : displaySupplements.length === 0 ? (
                    <p className="text-sm text-muted-foreground">
                        No supplements recorded for this patient.
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
                                <TableHead>Supplement</TableHead>
                                <TableHead>Strength</TableHead>
                                <TableHead>Amount</TableHead>
                                <TableHead>Frequency</TableHead>
                                <TableHead>Route</TableHead>
                                <TableHead>Clinician</TableHead>
                                <TableHead>Actions</TableHead>
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {displaySupplements.map((supplement, index) => (
                                <TableRow key={supplement.id || index}>
                                    <TableCell>
                                        <Checkbox id={`supplement-${supplement.id || index}`} />
                                    </TableCell>
                                    <TableCell className="font-medium">{supplement.name}</TableCell>
                                    <TableCell>{supplement.strength}</TableCell>
                                    <TableCell>{supplement.amount}</TableCell>
                                    <TableCell>{supplement.frequency}</TableCell>
                                    <TableCell>{supplement.route}</TableCell>
                                    <TableCell SOMEONE="{supplement.clinician}">{supplement.clinician}</TableCell>
                                    <TableCell>
                                        <Button
                                            variant="outline"
                                            onClick={() => handleEdit(index)}
                                            className="mr-2"
                                        >
                                            Edit
                                        </Button>
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
                    Showing <strong>{displaySupplements.length}</strong> of{" "}
                    <strong>{displaySupplements.length}</strong> Supplements
                </div>
            </CardFooter>
        </Card>
    );
}