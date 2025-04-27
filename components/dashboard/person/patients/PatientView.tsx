"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Download, Mail, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import Allergy from "../Allergy";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
Card,
CardContent,
CardDescription,
CardHeader,
CardTitle,
} from "@/components/ui/card";

// Define combined patient data type
interface Patient {
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
    status: string | null;
    ec_first_name: string | null;
    ec_middle_name: string | null;
    ec_last_name: string | null;
    ec_contact_number: string | null;
    ec_relationship: string | null;
    expected_date_of_confinement: string | null;
    last_menstrual_cycle: string | null;
    gravidity: string | null;
    parity: string | null;
    occupation: string | null;
    ssn: string | null;
    member: string | null;
    allergy_id: number | null;
}

export default function PatientView() {
    const router = useRouter();
    const [patient, setPatient] = useState<Patient | null>(null);
    const [loading, setLoading] = useState(true);
    const searchParams = useSearchParams();
    const id = searchParams.get("id");

    // Fetch patient data from Supabase for person.id = 2
    useEffect(() => {
        async function fetchPatient() {
        try {
            const { data, error } = await supabase
            .from("patients")
            .select(
            `
                *,
                person (
                    *
                )
            `
            )
            .eq("person_id", id)
            .single();

            if (error) {
            console.error("Supabase query error:", error);
            toast("Error", {
                description: `Failed to fetch patient data: ${error.message}`,
            });
            setLoading(false);
            return router.push("/Patients");
            }

            if (!data) {
            console.warn("No person found with ID 2");
            toast("Error", {
                description: "No person found with ID 2.",
            });
            setLoading(false);
            return router.push("/Patients");
            }

            // Combine person and patient data
            const combinedData: Patient = {
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
                status: data.person.status,
                ec_first_name: data.person.ec_first_name,
                ec_middle_name: data.person.ec_middle_name,
                ec_last_name: data.person.ec_last_name,
                ec_contact_number: data.person.ec_contact_number,
                ec_relationship: data.person.ec_relationship,
                expected_date_of_confinement: data.expected_date_of_confinement || null,
                last_menstrual_cycle: data.last_menstrual_cycle || null,
                gravidity: data.gravidity || null,
                parity: data.parity || null,
                occupation: data.occupation || null,
                ssn: data.ssn || null,
                member: data.member || null,
                allergy_id: data.allergy_id || null,
            };

            console.log("Fetched patient data:", combinedData);
            setPatient(combinedData);
        } catch (err) {
            console.error("Unexpected error fetching patient:", err);
            toast("Error", {
            description: "An unexpected error occurred while fetching patient data.",
            });
            setLoading(false);
            return router.push("/Patients");
        }
        setLoading(false);
        }

        fetchPatient();
    }, [router]);

    if (!patient) {
        return null; // Redirect already handled in fetchPatient
    }

    const fullName = `${patient.first_name} ${patient.middle_name ? patient.middle_name + " " : ""}${patient.last_name}`;
    const ecFullName = patient.ec_first_name
        ? `${patient.ec_first_name} ${patient.ec_middle_name ? patient.ec_middle_name + " " : ""}${patient.ec_last_name}`
        : "Not provided";

    return (
        <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
        <div className="grid gap-4 ">
            {/* Row for Basic Information and Quick Actions */}
            <div className="flex flex-col md:flex-row gap-4">
            {/* Basic Information Card */}
            <Card className="flex-1 md:flex-[2]">
                <CardHeader>
                <CardTitle className="text-2xl">{fullName}</CardTitle>
                </CardHeader>
                <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                    <Label className="font-semibol mb-2">Patient Status</Label>
                    <p className="text-sm">{patient.status || "Not specified"}</p>
                    </div>
                    <div>
                    <Label className="font-semibold mb-2">Estimated Date of Confinement</Label>
                    <p className="text-sm">{patient.expected_date_of_confinement || "Not specified"}</p>
                    </div>
                    <div>
                    <Label className="font-semibold mb-2">Next Appointment</Label>
                    <p className="text-sm">{patient.next_appointment || "Not scheduled"}</p>
                    </div>
                    <div>
                    <Label className="font-semibold mb-2">Last Visit</Label>
                    <p className="text-sm">{patient.last_visit || "No record"}</p>
                    </div>
                </div>
                </CardContent>
            </Card>

            {/* Quick Actions Card */}
            <Card className="flex-1 md:flex-1">
                <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>A quick overview of actions you can take.</CardDescription>
                </CardHeader>
                <CardContent>
                <div className="flex flex-col gap-6">
                    <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                        <div>
                        <Label htmlFor="deactivate">Deactivate</Label>
                        <p className="text-xs text-muted-foreground mt-2 mr-4">
                            Deactivating will temporarily put patient in inactive status. You can reactivate them later.
                        </p>
                        </div>
                        <Switch id="deactivate" className="scale-125" />
                    </div>
                    </div>

                    <div className="flex flex-col items-center gap-2">
                    <div className="flex gap-2">
                        <div>
                        <Label htmlFor="archive">Archive</Label>
                        <p className="text-xs text-muted-foreground mt-2 mr-4">
                            Archiving will remove the patient from the active list. You can restore them later.
                        </p>
                        </div>
                        <Switch id="archive" className="scale-125" />
                    </div>
                    </div>

                    <div className="flex flex-col gap-2">
                    <Button variant="outline">
                        <Mail className="mr-2 h-4 w-4" />
                        Set Appointment
                    </Button>
                    <Button variant="destructive">
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete Patient
                    </Button>
                    </div>
                </div>
                </CardContent>
            </Card>
            </div>

            <Tabs defaultValue="overview">
            <div className="flex items-center">
                <TabsList>
                <TabsTrigger value="overview">Patient Overview</TabsTrigger>
                <TabsTrigger value="appointments">Appointments</TabsTrigger>
                <TabsTrigger value="supplements">Supplement Recommendation</TabsTrigger>
                <TabsTrigger value="prescriptions">Prescription</TabsTrigger>
                <TabsTrigger value="records">Laboratory Records</TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                <Button size="sm" variant="outline" className="h-8 gap-1">
                    <Download className="mr-2 h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                </Button>
                </div>
            </div>

            <TabsContent value="overview">
                <Card x-chunk="dashboard-06-chunk-0">
                <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                    <CardTitle>{fullName}</CardTitle>
                    <CardDescription>Basic Information</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="text-sm">
                    <div className="grid grid-cols-2 gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Date of Birth</Label>
                            <div className="col-span-3">{patient.birth_date}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Age</Label>
                            <div className="col-span-3">{patient.age || "Not specified"}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Contact</Label>
                            <div className="col-span-3">{patient.contact_number || "Not provided"}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Address</Label>
                            <div className="col-span-3">{patient.address || "Not provided"}</div>
                        </div>
                        {/* <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Marital Status</Label>
                            <div className="col-span-3">{patient.marital_status || "Not provided"}</div>
                        </div> */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Citizenship</Label>
                            <div className="col-span-3">{patient.citizenship || "Not specified"}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Religion</Label>
                            <div className="col-span-3">{patient.religion || "Not specified"}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Occupation</Label>
                            <div className="col-span-3">{patient.occupation || "Not specified"}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">SSN</Label>
                            <div className="col-span-3">{patient.ssn || "Not provided"}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right">Member Status</Label>
                            <div className="col-span-3">{patient.member || "Not specified"}</div>
                        </div>
                    </div>
                </CardContent>
                </Card>

                <div className="pt-8">
                <Card x-chunk="dashboard-06-chunk-0">
                    <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                    <div className="space-y-1">
                        <CardTitle>Emergency Contact</CardTitle>
                        <CardDescription>In case of an emergency, please contact this person.</CardDescription>
                    </div>
                    </CardHeader>
                    <CardContent className="text-sm">
                    <div className="grid gap-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Name</Label>
                        <div className="col-span-3">{ecFullName}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Relationship</Label>
                        <div className="col-span-3">{patient.ec_relationship || "Not specified"}</div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                        <Label className="text-right">Phone</Label>
                        <div className="col-span-3">{patient.ec_contact_number || "Not provided"}</div>
                        </div>
                    </div>
                    </CardContent>
                </Card>
                </div>

                <div className="pt-8">
                    <Allergy context="patient" id={id} />
                </div>
            </TabsContent>
            </Tabs>
        </div>
        </main>
    );
}