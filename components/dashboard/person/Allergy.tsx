"use client";

import React, { useState, useEffect } from "react";
import { Dna, FilePenLine, MoreHorizontal, Search, Trash2 } from "lucide-react";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
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
    id: string;
};
    // Define the form schema
const formSchema = z.object({
    name: z.string().min(1, "Allergy name is required"),
    severity: z.string(),
    allergies: z.array(
        z.object({
        id: z.string(),
        name: z.string(),
        severity: z.string()
        })
    )
});

type FormValues = z.infer<typeof formSchema>;

export default function Allergy({ context, id }: Props) {
    const [openDialog, setOpenDialog] = useState(false);
    const [editingIndex, setEditingIndex] = useState<number | null>(null);
    const [allergiesData, setAllergiesData] = useState<any[]>([]);

    // Initialize form with react-hook-form
    const form = useForm<FormValues>({
        resolver: zodResolver(formSchema),
        defaultValues: {
        name: "",
        severity: "",
        allergies: [],
        },
    });

    const { fields, append, remove, update } = useFieldArray({
        control: form.control,
        name: "allergies",
    });

    // Fetch allergies from Supabase
    useEffect(() => {
        async function fetchAllergies() {
        let query = supabase
        .from("allergy")
        .select("*")
        .eq("patient_id", id);

        const { data, error } = await query;
        if (error) {
            console.error(error);
            toast("Error", {
            description: "Failed to fetch allergies.",
            });
        } else {
            setAllergiesData(data);
            form.setValue("allergies", data.map((allergy: any) => ({
            id: allergy.id,
            name: allergy.name,
            severity: allergy.severity,
            })));
        }
    }

        fetchAllergies();
    }, [context, id, form]);

    // Handle form submission for adding/editing allergies
    const onSubmitAllergy = async (data: { name: string; severity: string }) => {
        if (editingIndex !== null) {
        // Update existing allergy
        const allergyToUpdate = fields[editingIndex];
        const { error } = await supabase
            .from("allergy")
            .update({
            name: data.name,
            severity: data.severity,
            })
            .eq("id", allergyToUpdate.id);

        if (error) {
            toast("Error", {
                description: "Failed to update allergy.",
            });
            return;
        }

        update(editingIndex, {
            id: allergyToUpdate.id,
            name: data.name,
            severity: data.severity
        });
        toast("Allergy Updated", {
            description: "Allergy has been updated successfully.",
        });
        } else {
        // Add new allergy
        const { data: newAllergy, error } = await supabase
            .from("allergy")
            .insert([
            {
                patient_id: context === "patient" ? id : null,
                name: data.name,
                severity: data.severity,
            },
            ])
            .select()
            .single();

        if (error) {
            toast("Error", {
            description: "Failed to add allergy.",
            });
            return;
        }

        append({
            id: newAllergy.id,
            name: data.name,
            severity: data.severity
        });
        toast("Allergy Added", {
            description: "New allergy has been added successfully.",
        });
        }

        form.reset({ name: "", severity: "", allergies: form.getValues("allergies") });
        setOpenDialog(false);
        setEditingIndex(null);
    };

    // Handle allergy deletion
    const handleDelete = async (index: number) => {
        const allergyToDelete = fields[index];
        const { error } = await supabase
        .from("allergy")
        .delete()
        .eq("id", allergyToDelete.id);

        if (error) {
        toast("Error", {
            description: "Failed to delete allergy.",
        });
        return;
        }

        remove(index);
        toast("Allergy Deleted", {
        description: "Allergy has been removed from the list.",
        });
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                <CardTitle>Allergies</CardTitle>
                <CardDescription>Identify your patient&apos;s allergies before it&apos;s too late</CardDescription>
                </div>
                <div className="relative flex items-center w-full max-w-sm md:w-auto">
                <Search className="absolute left-2.5 top-2.5 mr-2 h-4 w-4 text-muted-foreground" />
                <Input
                    type="search"
                    placeholder="Search allergies..."
                    className="w-full pl-8 rounded-lg bg-background"
                    onChange={(e) => {
                    // Implement search logic if needed
                    }}
                />
                <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                    <Button size="sm" className="h-8 ml-2 flex items-center gap-1">
                        <Dna className="mr-2 h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Allergy</span>
                    </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-[425px]">
                    <DialogHeader>
                        <DialogTitle>{editingIndex !== null ? "Edit Allergy" : "Add Allergy"}</DialogTitle>
                        <DialogDescription>
                        {editingIndex !== null
                            ? "Edit the allergy details. Click save when you're done!"
                            : "Add a new allergy to your patient. Click save when you're done!"}
                        </DialogDescription>
                    </DialogHeader>
                    <FormProvider {...form}>
                        <Form {...form}>
                        <form
                            onSubmit={form.handleSubmit(onSubmitAllergy)}
                            className="grid gap-4 py-4"
                        >
                            <FormField
                            control={form.control}
                            name="name"
                            render={({ field }) => (
                                <FormItem className="grid grid-cols-4 items-center gap-4">
                                <FormLabel htmlFor="allergy" className="text-right">
                                    Allergy
                                </FormLabel>
                                <FormControl>
                                    <Input
                                    id="allergy"
                                    placeholder="Enter allergy"
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
                                    <SelectItem value="mild">Mild</SelectItem>
                                    <SelectItem value="moderate">Moderate</SelectItem>
                                    <SelectItem value="severe">Severe</SelectItem>
                                    </SelectContent>
                                </Select>
                                <FormMessage className="col-span-4" />
                                </FormItem>
                            )}
                            />
                            <DialogFooter>
                            <Button type="submit">Save allergy</Button>
                            </DialogFooter>
                        </form>
                        </Form>
                    </FormProvider>
                    </DialogContent>
                </Dialog>
                </div>
            </CardHeader>

            <CardContent>
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
                    <TableHead>Allergy</TableHead>
                    <TableHead>Severity</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {fields.map((allergy, index) => (
                    <TableRow key={allergy.id}>
                        <TableCell>
                        <Checkbox id={`allergy-${allergy.id}`} />
                        </TableCell>
                        <TableCell className="font-medium">{allergy.name}</TableCell>
                        <TableCell>{allergy.severity}</TableCell>
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
                                onClick={() => {
                                setEditingIndex(index);
                                form.setValue("name", allergy.name);
                                form.setValue("severity", allergy.severity);
                                setOpenDialog(true);
                                }}
                            >
                                <FilePenLine className="mr-2 h-4 w-4" />
                                <span>Edit</span>
                            </DropdownMenuItem>
                            <DropdownMenuItem asChild>
                                <div className="relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors hover:bg-accent hover:text-accent-foreground text-red-600">
                                <Trash2 className="mr-2 h-4 w-4" />
                                <span
                                    onClick={() => handleDelete(index)}
                                >
                                    Delete
                                </span>
                                </div>
                            </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                        </TableCell>
                    </TableRow>
                    ))}
                </TableBody>
                </Table>
            </CardContent>

            <CardFooter>
                <div className="text-xs text-muted-foreground">
                Showing <strong>{fields.length}</strong> of <strong>{fields.length}</strong> Allergies
                </div>
            </CardFooter>
        </Card>
    );
}