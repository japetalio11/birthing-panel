"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
    Dialog,
    DialogContent,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Download, Mail, Trash2, RefreshCcw } from "lucide-react";

interface Clinician {
    id: number;
    first_name: string;
    middle_name: string | null;
    last_name: string;
    birth_date: string;
    age: string | null;
    contact_number: string | null;
    citizenship: string | null;
    address: string | null;
    profile_image_url: string | null;
    religion: string | null;
    role: string | null;
    email: string | null;
    occupation: string | null;
    specialization: string | null;
    status: string | null;
    marital_status: string | null;
    ec_first_name: string | null;
    ec_middle_name: string | null;
    ec_last_name: string | null;
    ec_contact_number: string | null;
    ec_relationship: string | null;
}

export default function ClinicianView() {
    const router = useRouter();
    const [clinician, setClinician] = useState<Clinician | null>(null);
    const [loading, setLoading] = useState(true);
    const [openDialog, setOpenDialog] = useState(false);
    const [deleteInput, setDeleteInput] = useState("");
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    useEffect(() => {
        if (!id) {
            toast.error("No clinician ID provided.");
            router.push("/Clinicians");
            return;
        }

        const fetchClinician = async () => {
            try {
                const { data, error } = await supabase
                    .from("clinicians")
                    .select(
                        `
                        *,
                        person (
                            *
                        )
                    `
                    )
                    .eq("id", id)
                    .single();

                if (error) {
                    console.error("Supabase query error:", error);
                    toast.error(`Failed to fetch clinician data: ${error.message}`);
                    router.push("/Clinicians");
                    return;
                }

                if (!data) {
                    toast.error("No clinician found with the provided ID.");
                    router.push("/Clinicians");
                    return;
                }

                const combinedData: Clinician = {
                    id: data.person.id,
                    first_name: data.person.first_name,
                    middle_name: data.person.middle_name,
                    last_name: data.person.last_name,
                    birth_date: data.person.birth_date,
                    age: data.person.age,
                    contact_number: data.person.contact_number,
                    citizenship: data.person.citizenship,
                    address: data.person.address,
                    profile_image_url: data.person.profile_image_url,
                    religion: data.person.religion,
                    role: data.person.role,
                    email: data.person.email,
                    occupation: data.person.occupation,
                    specialization: data.person.specialization,
                    status: data.person.status,
                    marital_status: data.marital_status,
                    ec_first_name: data.person.ec_first_name,
                    ec_middle_name: data.person.ec_middle_name,
                    ec_last_name: data.person.ec_last_name,
                    ec_contact_number: data.person.ec_contact_number,
                    ec_relationship: data.person.ec_relationship,
                };

                setClinician(combinedData);
            } catch (err) {
                console.error("Unexpected error fetching clinician:", err);
                toast.error("An unexpected error occurred while fetching clinician data.");
                router.push("/Clinicians");
            } finally {
                setLoading(false);
            }
        };

        fetchClinician();
    }, [id, router]);

    const handleDelete = async () => {
        if (!clinician) return;

        try {
            const { error: clinicianError } = await supabase
                .from("clinicians")
                .delete()
                .eq("id", clinician.id);

            if (clinicianError) throw clinicianError;

            const { error: personError } = await supabase
                .from("person")
                .delete()
                .eq("id", clinician.id);

            if (personError) throw personError;

            toast.success("Clinician deleted successfully.");
            setOpenDialog(false);
            router.push("/Clinicians");
        } catch (err: any) {
            toast.error(`Error deleting clinician: ${err.message}`);
        }
    };

    if (loading) {
        return <p>Loading...</p>;
    }

    if (!clinician) {
        return null; // Redirect already handled in fetchClinician
    }

    const fullName = `${clinician.first_name} ${clinician.middle_name ? clinician.middle_name + " " : ""}${clinician.last_name}`;
    const ecFullName = clinician.ec_first_name
        ? `${clinician.ec_first_name} ${clinician.ec_middle_name ? clinician.ec_middle_name + " " : ""}${clinician.ec_last_name}`
        : "Not provided";

    const isDeleteEnabled = deleteInput === fullName;

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
            <Card>
                <CardHeader>
                    <CardTitle className="text-2xl">{fullName}</CardTitle>
                    <CardDescription>{clinician.status || "Status not specified"}</CardDescription>
                </CardHeader>
                <CardContent>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <Label>Birth Date</Label>
                            <p>{clinician.birth_date || "Not specified"}</p>
                        </div>
                        <div>
                            <Label>Age</Label>
                            <p>{clinician.age || "Not specified"}</p>
                        </div>
                        <div>
                            <Label>Contact Number</Label>
                            <p>{clinician.contact_number || "Not provided"}</p>
                        </div>
                        <div>
                            <Label>Address</Label>
                            <p>{clinician.address || "Not provided"}</p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                <DialogTrigger asChild>
                    <Button variant="destructive">Delete Clinician</Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle>Delete Clinician</DialogTitle>
                        <p>Type "{fullName}" to confirm deletion.</p>
                    </DialogHeader>
                    <Input
                        value={deleteInput}
                        onChange={(e) => setDeleteInput(e.target.value)}
                        placeholder={`Enter "${fullName}"`}
                    />
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setOpenDialog(false)}>
                            Cancel
                        </Button>
                        <Button variant="destructive" onClick={handleDelete} disabled={!isDeleteEnabled}>
                            Confirm Delete
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </main>
    );
}