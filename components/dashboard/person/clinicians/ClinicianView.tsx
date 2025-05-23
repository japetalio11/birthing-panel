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
    license_number: string | null;
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
                    license_number: data.license_number,
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
  <main className="flex flex-col flex-1 items-start gap-8 p-8 bg-gray-50 min-h-screen">

      {/* Header: Profile + Name + Email */}
      <div className="flex items-center gap-8 mb-8">
        <div className="w-24 h-24 rounded-full bg-gray-200 flex items-center justify-center overflow-hidden">
          {clinician.profile_image_url ? (
            <img
              src={clinician.profile_image_url}
              alt={fullName}
              className="object-cover w-full h-full"
            />
          ) : (
            <span className="text-4xl font-bold text-gray-400">
              {clinician.first_name[0]}
            </span>
          )}
        </div>
        <div className="flex-1">
          <h1 className="text-2xl font-semibold">{fullName}</h1>
          <div className="flex items-center gap-2 mt-2">
            <span className="text-gray-500 text-sm">
              {clinician.email || "Email not provided"} 
            </span>
            <Button variant="outline" className="ml-2">Edit</Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="info" className="w-full">
        <TabsList className="flex border-b border-gray-200 mb-8 bg-transparent">
          <TabsTrigger value="info" className="px-6 py-2 text-base font-medium border-b-2 data-[state=active]:border-red-500 data-[state=active]:text-red-600 rounded-none">
            Clinician Information
          </TabsTrigger>
          <TabsTrigger value="appointments" className="px-6 py-2 text-base font-medium border-b-2 rounded-none">
            Appointment History
          </TabsTrigger>
          <TabsTrigger value="prescriptions" className="px-6 py-2 text-base font-medium border-b-2 rounded-none">
            Prescription History
          </TabsTrigger>
          <TabsTrigger value="supplements" className="px-6 py-2 text-base font-medium border-b-2 rounded-none">
            Supplement Recommendation
          </TabsTrigger>
        </TabsList>
        <TabsContent value="info">
          <div>
            <h2 className="text-red-500 font-semibold mb-4">BASIC INFORMATION</h2>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-y-8 gap-x-12 text-base">
              <div>
                <span className="block text-gray-500">Age</span>
                <span className="font-semibold">{clinician.age ? `${clinician.age} years old` : "Not specified"}</span>
              </div>
              <div>
                <span className="block text-gray-500">Birth Date</span>
                <span className="font-semibold">{clinician.birth_date || "Not specified"}</span>
              </div>
              <div>
                <span className="block text-gray-500">Religion</span>
                <span className="font-semibold">{clinician.religion || "Not specified"}</span>
              </div>
              <div>
                <span className="block text-gray-500">Marital Status</span>
                <span className="font-semibold">{clinician.marital_status || "Not specified"}</span>
              </div>
              <div>
                <span className="block text-gray-500">Address</span>
                <span className="font-semibold">{clinician.address || "Not specified"}</span>
              </div>
              <div>
                <span className="block text-gray-500">Phone Number</span>
                <span className="font-semibold">{clinician.contact_number || "Not provided"}</span>
              </div>
              <div>
                <span className="block text-gray-500">Citizenship</span>
                <span className="font-semibold">{clinician.citizenship || "Not specified"}</span>
              </div>
              <div>
                <span className="block text-gray-500">Specialization</span>
                <span className="font-semibold">{clinician.specialization || "Not specified"}</span>
              </div>
              <div>
                <span className="block text-gray-500">License Number</span>
                <span className="font-semibold">{clinician.license_number || "Not specified"}</span>
              </div>
              <div>
                <span className="block text-gray-500">Role</span>
                <span className="font-semibold">{clinician.role || "Not specified"}</span>
              </div>
            </div>
          </div>
        </TabsContent>
        {/* Additional TabsContent for appointments, prescriptions, supplements can be added here */}
      </Tabs>

      {/* Delete Dialog */}
      <div className="mt-10">
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
      </div>
  </main>
  );
}