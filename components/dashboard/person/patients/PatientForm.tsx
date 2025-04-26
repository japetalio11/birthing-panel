"use client";

import * as React from "react";
import { z } from "zod";
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    Camera,
    CircleX,
    Send,
    Dna,
    Search,
    MoreHorizontal,
    FilePenLine,
    Trash2,
    Loader2,
} from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
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
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
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
} from "@/components/ui/dropdown-menu";
import {
        Select,
        SelectContent,
        SelectItem,
        SelectTrigger,
        SelectValue,
} from "@/components/ui/select"
import { createPatient } from "@/lib/supabase/create/createPatient";

    // Combined schema for patient and allergies
export const patientFormSchema = z.object({
    firstName: z.string().min(1, "First name is required"),
    middleName: z.string().optional(),
    lastName: z.string().min(1, "Last name is required"),
    age: z.string().min(1, "Age is required"),
    birthDate: z.date(),
    contactNumber: z.string().min(1, "Contact number is required"),
    citizenship: z.string().optional(),
    address: z.string().optional(),
    maritalStatus: z.string().optional(),
    religion: z.string().optional(),
    member: z.string().optional(),
    ssn: z.string().optional(),
    gravidity: z.string().optional(),
    parity: z.string().optional(),
    lmc: z.date().optional(),
    edc: z.date().optional(),
    ecFirstName: z.string().optional(),
    ecMiddleName: z.string().optional(),
    ecLastName: z.string().optional(),
    ecContactNumber: z.string().optional(),
    ecRelationship: z.string().optional(),
    profileImage: z.any().optional(), // Adjust based on file handling needs
    allergies: z.array(
        z.object({
        name: z.string().min(1, "Allergy name is required"),
        severity: z.string().min(1, "Severity is required"),
        })
    ).optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export default function PatientForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);
    const [severity, setSeverity] = React.useState("");
    const [marital, setMarital] = React.useState("marital");

// Initialize form with combined schema
    const form = useForm<PatientFormValues>({
        resolver: zodResolver(patientFormSchema),
            defaultValues: {
            firstName: "",
            middleName: "",
            lastName: "",
            age: "",
            birthDate: new Date(),
            contactNumber: "",
            citizenship: "",
            address: "",
            maritalStatus: "",
            religion: "",
            member: "",
            ssn: "",
            gravidity: "",
            parity: "",
            lmc: undefined,
            edc: undefined,
            ecFirstName: "",
            ecMiddleName: "",
            ecLastName: "",
            ecContactNumber: "",
            ecRelationship: "",
            profileImage: null,
            allergies: [],
            },
    });

    const { fields, append, remove } = useFieldArray({
        control: form.control,
        name: "allergies",
    });

    const onSubmit = async (data: PatientFormValues) => {
        try {
            setIsSubmitting(true);
            await createPatient(data); // Ensure createPatient handles allergies
            toast("Patient Added Successfully", {
                description: `${data.firstName} ${data.middleName || ""} ${data.lastName} has been added.`,
            });
            form.reset();
                router.push("/Patients");
            } catch (error) {
            console.error("Error submitting form:", error);
            toast("Error Adding Patient", {
                description: error instanceof Error ? error.message : "Unknown error occurred",
            });
            } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <FormProvider {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                    <fieldset className="grid gap-6 rounded-lg border p-6">
                        <legend className="-ml-1 px-1 text-sm font-medium">Basic Information</legend>
                        <div className="flex flex-col md:flex-row gap-6">
                        <div className="flex flex-col items-center gap-2">
                            <div className="relative w-full">
                            <FormField
                                control={form.control}
                                name="profileImage"
                                render={({ field }) => (
                                <FormItem className="flex flex-col items-center">
                                    <div className="relative w-40 mr-2 h-40 rounded-full overflow-hidden border">
                                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                                        <div className="w-full h-3/4 flex flex-col items-center justify-center">
                                        <div className="w-12 h-12 bg-gray-500 rounded-full mb-1"></div>
                                        <div className="w-20 h-10 bg-gray-500 rounded-t-full"></div>
                                        </div>
                                    </div>
                                    </div>
                                    <FormControl>
                                    <input
                                        type="file"
                                        accept="image/*"
                                        className="hidden"
                                        id="profile-upload"
                                        onChange={(e) => field.onChange(e.target.files ? e.target.files[0] : null)}
                                    />
                                    </FormControl>
                                    <div
                                    className="absolute right-0 bottom-2 bg-black rounded-full p-3 cursor-pointer transition-colors"
                                    onClick={() => document.getElementById("profile-upload")?.click()}
                                    >
                                    <Camera className="h-4 w-4 text-white" />
                                    </div>
                                </FormItem>
                                )}
                            />
                            </div>
                        </div>

                        <div className="flex-1 grid gap-4">
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="firstName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>First Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter First Name" {...field} aria-required="true" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="middleName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Middle Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter Middle Name" {...field} />
                                    </FormControl>
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="lastName"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Last Name</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter Last Name" {...field} aria-required="true" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                            <FormField
                                control={form.control}
                                name="age"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Age</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter Age" {...field} aria-required="true" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="birthDate"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Birth Date</FormLabel>
                                    <FormControl>
                                    <DatePicker date={field.value} onDateChange={field.onChange} />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="contactNumber"
                                render={({ field }) => (
                                <FormItem>
                                    <FormLabel>Contact Number</FormLabel>
                                    <FormControl>
                                    <Input placeholder="Enter Contact Number" {...field} aria-required="true" />
                                    </FormControl>
                                    <FormMessage />
                                </FormItem>
                                )}
                            />
                            </div>
                        </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
                        <FormField
                            control={form.control}
                            name="citizenship"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Citizenship</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter citizenship" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="address"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Address</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter address" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="maritalStatus"
                            render={() => ( 
                                <FormItem>
                                    <FormLabel>Marital Status</FormLabel>
                                        <Select value={marital} onValueChange={setMarital}>
                                            <SelectTrigger id="marital">
                                                <SelectValue placeholder="Select status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="single">Single</SelectItem>
                                                <SelectItem value="married">Married</SelectItem>
                                                <SelectItem value="divorced">Divorced</SelectItem>
                                                <SelectItem value="widowed">Widowed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                </FormItem>
                            )}
                        />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="religion"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Religion</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter religion" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="member"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Member</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter health insurance organization" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ssn"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Social Security Number</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter SSN" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <FormField
                            control={form.control}
                            name="gravidity"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Gravidity</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="G" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="parity"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Parity</FormLabel>
                                <FormControl>
                                <Input type="number" placeholder="P" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="lmc"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Menstrual Cycle</FormLabel>
                                <FormControl>
                                <DatePicker date={field.value} onDateChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="edc"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Expected Date of Confinement</FormLabel>
                                <FormControl>
                                <DatePicker date={field.value} onDateChange={field.onChange} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        </div>
                    </fieldset>

                    <fieldset className="grid gap-6 rounded-lg border p-6">
                        <legend className="-ml-1 px-1 text-sm font-medium">Emergency Contact</legend>
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        <FormField
                            control={form.control}
                            name="ecFirstName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>First Name</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter first name" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ecMiddleName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Middle Name</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter middle name" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ecLastName"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Last Name</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter last name" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                            control={form.control}
                            name="ecContactNumber"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Contact Number</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter contact number" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        <FormField
                            control={form.control}
                            name="ecRelationship"
                            render={({ field }) => (
                            <FormItem>
                                <FormLabel>Relationship</FormLabel>
                                <FormControl>
                                <Input placeholder="Enter relationship" {...field} />
                                </FormControl>
                            </FormItem>
                            )}
                        />
                        </div>
                    </fieldset>

                    <div className="pt-3">
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
                                placeholder="Search..."
                                className="w-full pl-8 rounded-lg bg-background"
                            />
                            <Dialog>
                                <DialogTrigger asChild>
                                <Button size="sm" className="h-8 ml-2 flex items-center gap-1">
                                    <Dna className="mr-2 h-4 w-4" />
                                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Allergy</span>
                                </Button>
                                </DialogTrigger>
                                <DialogContent className="sm:max-w-[425px]">
                                <DialogHeader>
                                    <DialogTitle>Add Allergy</DialogTitle>
                                    <DialogDescription>
                                    Add a new allergy to your patient. Click <strong>save</strong> when you&apos;re done!
                                    </DialogDescription>
                                </DialogHeader>
                                <div className="grid gap-4 py-4">
                                    <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="allergy" className="text-right">
                                        Allergy
                                    </Label>
                                    <Input
                                        id="allergy"
                                        placeholder="Enter allergy"
                                        className="col-span-3"
                                        aria-required="true"
                                    />
                                    </div>
                                    <div className="grid grid-cols-4 items-center gap-4">
                                    <Label htmlFor="severity" className="text-right">
                                        Severity
                                    </Label>
                                    <Select value={severity} onValueChange={setSeverity}>
                                        <SelectTrigger id="severity" className="col-span-3">
                                            <SelectValue placeholder="Select severity" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="Mild">Mild</SelectItem>
                                            <SelectItem value="Moderate">Moderate</SelectItem>
                                            <SelectItem value="Severe">Severe</SelectItem>
                                        </SelectContent>
                                    </Select>
                                    </div>
                                </div>
                                <DialogFooter>
                                    <Button
                                        type="button"
                                        variant="outline"
                                        className="h-8 gap-1"
                                        onClick={() => {
                                        const allergy = (document.getElementById("allergy") as HTMLInputElement).value;

                                        if (!allergy || !severity) {
                                            toast("Error", {
                                                description: "Please fill in all fields.",
                                                variant: "destructive",
                                            });
                                            return;
                                        }

                                        append({ name: allergy, severity });

                                        toast("Allergy Added", {
                                            description: "Allergy has been added to the list.",
                                        });

                                        // Clear inputs
                                        (document.getElementById("allergy") as HTMLInputElement).value = "";
                                            setSeverity(""); // reset Select
                                        }}
                                        
                                    >
                                        Save allergy
                                    </Button>
                                </DialogFooter>
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
                                <TableHead>Allergies</TableHead>
                                <TableHead>Severity</TableHead>
                                <TableHead></TableHead>
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
                                    <TableCell>
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
                                            // Implement edit logic if needed
                                            toast("Edit", {
                                                description: "Edit functionality not implemented yet.",
                                            });
                                            }}
                                        >
                                            <FilePenLine className="mr-2 h-4 w-4 text-black" />
                                            <span className="ml-2">Edit</span>
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-red-600"
                                            onClick={() => {
                                            remove(index);
                                            toast("Allergy Deleted", {
                                                description: "Allergy has been removed from the list.",
                                            });
                                            }}
                                        >
                                            <Trash2 className="mr-2 h-4 w-4 text-red-600" />
                                            <span className="ml-2">Delete</span>
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
                    </div>

                    <div className="justify-end gap-2ml-auto flex items-center gap-2">
                        <Button
                        size="sm"
                        variant="outline"
                        className="h-8 gap-1"
                        onClick={() => {
                            form.reset();
                            router.push("/Patients");
                        }}
                        >
                        <CircleX className="mr-2 h-4 w-4" />
                        <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Discard</span>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                        {isSubmitting ? (
                            <>
                            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                            Submitting...
                            </>
                        ) : (
                            <>
                            <Send className="mr-2 h-4 w-4" />
                            Submit Form
                            </>
                        )}
                        </Button>
                    </div>
                </form>
            </FormProvider>
        </main>
    );
}
