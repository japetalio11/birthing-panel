    "use client";

    import React, { useState, useEffect } from "react";
    import { Dna, FilePenLine, MoreHorizontal, Search, Trash2 } from "lucide-react";
    import { useForm, FormProvider } from "react-hook-form";
    import { Button } from "@/components/ui/button";
    import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
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
    import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
    import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
    } from "@/components/ui/table";
    import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuLabel,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
    } from "@/components/ui/dropdown-menu";
    import { toast } from "sonner";
    import { z } from "zod";
    import { zodResolver } from "@hookform/resolvers/zod";
    import { supabase } from "@/lib/supabase/client";

    type Props = {
    context: "patient";
    id: string | null;
    fields?: any[]; // From useFieldArray or passed from PatientView
    append?: (supplement: any) => void;
    remove?: (index: number) => void;
    update?: (index: number, supplement: any) => void;
    };

    // Define the form schema for adding/editing supplements
    const formSchema = z.object({
    name: z.string().min(1, "Supplement name is required"),
    severity: z.string().min(1, "Severity is required"),
    });

    type FormValues = z.infer<typeof formSchema>;

    export default function SupplementRecommendation({ context, id, fields = [], append, remove, update }: Props) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [supplementsData, setSupplementsData] = useState<any[]>([]);
    const [fetchError, setFetchError] = useState<string | null>(null);

    // Initialize form for adding/editing supplements
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        name: "",
        severity: "",
        },
    });

    // Fetch supplements from Supabase if id is provided (existing patient)
    useEffect(() => {
        async function fetchSupplements() {
        if (!id) {
            setSupplementsData(fields); // Use passed fields for new patient or view mode
            setFetchError(null);
            return;
        }
        try {
            const { data, error } = await supabase
            .from("supplement")
            .select("*")
            .eq("patient_id", id);

            if (error) {
            console.error("Supplement fetch error:", error);
            setFetchError("Failed to fetch supplements.");
            toast("Error", {
                description: "Failed to fetch supplements.",
            });
            setSupplementsData([]);
            } else {
            console.log("Fetched supplements for patient_id", id, ":", data);
            setSupplementsData(data);
            setFetchError(null);
            if (append) {
                data.forEach((supplement: any) => {
                append({ id: supplement.id, name: supplement.name, severity: supplement.severity });
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

    // Handle form submission for adding/editing supplements
    const onSubmitSupplement = async (data: FormValues) => {
        if (!id && !append) {
        toast("Error", {
            description: "Cannot add supplement without form integration.",
        });
        return;
        }

        if (id) {
        // Existing patient, save to Supabase
        if (editingIndex !== null) {
            // Update existing supplement
            const supplementToUpdate = (fields.length > 0 ? fields : supplementsData)[editingIndex];
            const { error } = await supabase
            .from("supplement")
            .update({
                name: data.name,
                severity: data.severity,
            })
            .eq("id", supplementToUpdate.id);

            if (error) {
            console.error("Supplement update error:", error);
            toast("Error", {
                description: "Failed to update supplement.",
            });
            return;
            }

            if (update) {
            update(editingIndex, {
                id: supplementToUpdate.id,
                name: data.name,
                severity: data.severity,
            });
            } else {
            setSupplementsData((prev) =>
                prev.map((supplement, idx) =>
                idx === editingIndex ? { ...supplement, name: data.name, severity: data.severity } : supplement
                )
            );
            }
            toast("Supplement Updated", {
            description: "Supplement has been updated successfully.",
            });
        } else {
            // Add new supplement
            const { data: newSupplement, error } = await supabase
            .from("supplement")
            .insert([
                {
                patient_id: id,
                name: data.name,
                severity: data.severity,
                },
            ])
            .select()
            .single();

            if (error) {
            console.error("Supplement insert error:", error);
            toast("Error", {
                description: "Failed to add supplement.",
            });
            return;
            }

            if (append) {
            append({
                id: newSupplement.id,
                name: data.name,
                severity: data.severity,
            });
            } else {
            setSupplementsData((prev) => [...prev, newSupplement]);
            }
            toast("Supplement Added", {
            description: "New supplement has been added successfully.",
            });
        }
        } else if (append) {
        // New patient, append to form's supplements array
        if (editingIndex !== null) {
            // Update existing supplement in form
            update!(editingIndex, {
            name: data.name,
            severity: data.severity,
            });
            toast("Supplement Updated", {
            description: "Supplement has been updated successfully.",
            });
        } else {
            // Add new supplement to form
            append({
            name: data.name,
            severity: data.severity,
            });
            toast("Supplement Added", {
            description: "New supplement has been added successfully.",
            });
        }
        }

        form.reset({ name: "", severity: "" });
        setOpenDialog(false);
        setEditingIndex(null);
    };

    // Handle supplement deletion
    const handleDelete = async (index: number) => {
        if (id) {
        // Existing patient, delete from Supabase
        const supplementToDelete = (fields.length > 0 ? fields : supplementsData)[index];
        const { error } = await supabase
            .from("supplement")
            .delete()
            .eq("id", supplementToDelete.id);

        if (error) {
            console.error("Supplement delete error:", error);
            toast("Error", {
            description: "Failed to delete supplement.",
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
    };

    // Handle edit action
    const handleEdit = (index: number) => {
        const supplement = (fields.length > 0 ? fields : supplementsData)[index];
        form.setValue("name", supplement.name);
        form.setValue("severity", supplement.severity);
        setEditingIndex(index);
        setOpenDialog(true);
    };

    // Determine which data to display
    const displaySupplements = fields.length > 0 ? fields : supplementsData;

    return (
        <Card>
        <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
            <CardTitle>Supplements</CardTitle>
            <CardDescription>Identify your patient's supplements before it's too late</CardDescription>
            </div>
            <div className="relative flex items-center w-full max-w-sm md:w-auto">
            <Search className="absolute left-2.5 top-2.5 mr-2 h-4 w-4 text-muted-foreground" />
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
                    form.reset({ name: "", severity: "" });
                    setEditingIndex(null);
                }
                }}
            >
                <DialogTrigger asChild>
                <Button size="sm" className="h-8 ml-2 flex items-center gap-1">
                    <Dna className="mr-2 h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Supplement</span>
                </Button>
                </DialogTrigger>
                <DialogContent className="sm:max-w-[425px]">
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
                        <FormField
                        control={form.control}
                        name="name"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel htmlFor="supplement" className="text-right">
                                Supplement
                            </FormLabel>
                            <FormControl>
                                <Input
                                id="supplement"
                                placeholder="Enter supplement"
                                className="col-span-3"
                                {...field}
                                />
                            </FormControl>
                            <FormMessage className="col-span-4" />
                            </FormItem>
                        )}
                        />
                        <FormField
                        control={form.control}
                        name="severity"
                        render={({ field }) => (
                            <FormItem className="grid grid-cols-4 items-center gap-4">
                            <FormLabel htmlFor="severity" className="text-right">
                                Severity
                            </FormLabel>
                            <Select
                                onValueChange={field.onChange}
                                value={field.value}
                            >
                                <FormControl>
                                <SelectTrigger id="severity" className="col-span-3">
                                    <SelectValue placeholder="Select severity" />
                                </SelectTrigger>
                                </FormControl>
                                <SelectContent>
                                <SelectItem value="Mild">Mild</SelectItem>
                                <SelectItem value="Moderate">Moderate</SelectItem>
                                <SelectItem value="Severe">Severe</SelectItem>
                                </SelectContent>
                            </Select>
                            <FormMessage className="col-span-4" />
                            </FormItem>
                        )}
                        />
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
            <p className="text-sm text-muted-foreground">No supplements recorded for this patient.</p>
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
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                </TableRow>
                </TableHeader>
                <TableBody>
                {displaySupplements.map((supplement, index) => (
                    <TableRow key={supplement.id || index}>
                    <TableCell>
                        <Checkbox id={`supplement-${supplement.id || index}`} />
                    </TableCell>
                    <TableCell className="font-medium">{supplement.name}</TableCell>
                    <TableCell>{supplement.severity}</TableCell>
                    <TableCell className="text-right">
                        <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button aria-haspopup="true" size="icon" variant="ghost">
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                            onClick={() => handleEdit(index)}
                            >
                            <FilePenLine className="mr-2 h-4 w-4" />
                            Edit
                            </DropdownMenuItem>
                            <DropdownMenuItem
                            className="text-red-600"
                            onClick={() => handleDelete(index)}
                            >
                            <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                            Delete
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                        </DropdownMenu>
                    </TableCell>
                    </TableRow>
                ))}
                </TableBody>
            </Table>
            )}
        </CardContent>

        <CardFooter>
            <div className="text-xs text-muted-foreground">
            Showing <strong>{displaySupplements.length}</strong> of <strong>{displaySupplements.length}</strong> Supplements
            </div>
        </CardFooter>
        </Card>
    );
    }
