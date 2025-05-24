"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Calendar, Trash2, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
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
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

// Define appointment data type
interface Appointment {
  id: string;
  patient_id: string;
  clinician_id: string;
  date: string;
  service: string;
  weight: string | null;
  vitals: string | null;
  gestational_age: string | null;
  status: string;
  payment_status: string;
}

export default function AppointmentView() {
  const router = useRouter();
  const [appointment, setAppointment] = useState<Appointment | null>(null);
  const [loading, setLoading] = useState(true);
  const [openDialog, setOpenDialog] = useState(false);
  const [deleteInput, setDeleteInput] = useState("");
  const [isCancelled, setIsCancelled] = useState(false);
  const searchParams = useSearchParams();
  const id = searchParams.get("id");

  // Fetch appointment data from Supabase
  useEffect(() => {
    if (!id) {
      toast.error("No appointment ID provided.");
      router.push("/Dashboard/Appointments");
      return;
    }

    async function fetchAppointment() {
      try {
        const { data, error } = await supabase
          .from("appointment")
          .select("*")
          .eq("id", id)
          .single();

        if (error) {
          console.error("Supabase query error:", error);
          toast.error(`Failed to fetch appointment: ${error.message}`);
          setLoading(false);
          router.push("/Dashboard/Appointments");
          return;
        }

        if (!data) {
          console.warn("No appointment found with ID:", id);
          toast.error("Appointment not found.");
          setLoading(false);
          router.push("/Dashboard/Appointments");
          return;
        }

        setAppointment(data);
        setIsCancelled(data.status.toLowerCase() === "canceled");
        setLoading(false);
      } catch (err) {
        console.error("Unexpected error fetching appointment:", err);
        toast.error("An unexpected error occurred.");
        setLoading(false);
        router.push("/Dashboard/Appointments");
      }
    }

    fetchAppointment();
  }, [router, id]);

  // Handle cancel switch toggle
  const handleCancelToggle = async () => {
    if (!appointment) return;

    const newStatus = isCancelled ? "Scheduled" : "Canceled";
    try {
      const { error } = await supabase
        .from("appointment")
        .update({ status: newStatus })
        .eq("id", appointment.id);

      if (error) throw error;

      setIsCancelled(!isCancelled);
      setAppointment({ ...appointment, status: newStatus });
      toast.success(`Appointment status updated to ${newStatus}.`);
    } catch (err: any) {
      toast.error(`Error updating status: ${err.message}`);
    }
  };

  // Handle delete appointment
  const handleDelete = async (id: string) => {
    try {
      const { error } = await supabase
        .from("appointment")
        .delete()
        .eq("id", id);

      if (error) throw error;

      toast.success("Appointment deleted successfully.");
      setOpenDialog(false);
      router.push("/Dashboard/Appointments");
    } catch (err: any) {
      toast.error(`Error deleting appointment: ${err.message}`);
    }
  };

  // Redirect to update appointment form
  const handleUpdateAppointment = () => {
    if (appointment) {
      // Fix the routing path to match where the UpdateAppointmentForm component is actually located
      router.push(`/Dashboard/Appointments/Appointment-Update?id=${appointment.id}`);
    }
  };

  if (loading || !appointment) {
    return <div>Loading...</div>;
  }

  const isDeleteEnabled = deleteInput.trim().toLowerCase() === "confirm";

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <div className="grid gap-4">
        {/* Row for Basic Information and Quick Actions */}
        <div className="flex flex-col md:flex-row gap-4">
          {/* Basic Information Card */}
          <Card className="flex-1 md:flex-[2]">
            <CardHeader>
              <CardTitle className="text-2xl pt-2">Appointment Details</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold mb-2">Appointment Status</Label>
                  <p className="text-sm">{appointment.status || "Not specified"}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Appointment Date</Label>
                  <p className="text-sm">
                    {new Date(appointment.date).toLocaleDateString() || "Not specified"}
                  </p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Service</Label>
                  <p className="text-sm">{appointment.service || "Not specified"}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Payment Status</Label>
                  <p className="text-sm">{appointment.payment_status || "Not specified"}</p>
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
                      <Label htmlFor="cancel">Cancel Appointment</Label>
                      <p className="text-xs text-muted-foreground mt-2 mr-4">
                        Cancelling will mark the appointment as cancelled. You can reschedule later.
                      </p>
                    </div>
                    <Switch
                      id="cancel"
                      className="scale-125"
                      checked={isCancelled}
                      onCheckedChange={handleCancelToggle}
                    />
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <Button
                    variant="outline"
                    onClick={handleUpdateAppointment}
                  >
                    <RefreshCcw className="h-4 w-4 mr-2" />
                    Update Appointment
                  </Button>
                  <Dialog open={openDialog} onOpenChange={setOpenDialog}>
                    <DialogTrigger asChild>
                      <Button variant="outline">
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Appointment
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
  <DialogHeader>
    <DialogTitle>Delete Appointment</DialogTitle>
    <DialogDescription>
      Are you sure you want to delete this appointment? This action cannot be undone.
    </DialogDescription>
    <div className="grid gap-2 py-4">
      <Label htmlFor="reason">Type "confirm" to confirm deletion</Label>
      <Input
        id="reason"
        className="focus:border-red-500 focus:ring-red-500"
        placeholder="Enter 'confirm'"
        value={deleteInput}
        onChange={(e) => setDeleteInput(e.target.value)}
      />
    </div>
  </DialogHeader>

  {isDeleteEnabled && (
    <DialogFooter>
      <Button
        variant="destructive"
        onClick={() => handleDelete(appointment.id)}
      >
        Confirm Delete
      </Button>
    </DialogFooter>
  )}
</DialogContent>

                  </Dialog>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="overview">
          <div className="flex items-center">
            <TabsList>
              <TabsTrigger value="overview">Appointment Overview</TabsTrigger>
              <TabsTrigger value="vitals">Vitals</TabsTrigger>
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <Calendar className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
              </Button>
            </div>
          </div>

          <TabsContent value="overview">
            <Card>
              <CardHeader>
                <CardTitle>Appointment Information</CardTitle>
                <CardDescription>All details about this appointment</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Date</Label>
                    <div className="col-span-3">
                      {new Date(appointment.date).toLocaleString() || "Not specified"}
                    </div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Service</Label>
                    <div className="col-span-3">{appointment.service || "Not specified"}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Status</Label>
                    <div className="col-span-3">{appointment.status || "Not specified"}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Payment Status</Label>
                    <div className="col-span-3">{appointment.payment_status || "Not specified"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="vitals">
            <Card>
              <CardHeader>
                <CardTitle>Vitals and Notes</CardTitle>
                <CardDescription>Additional medical information for this appointment</CardDescription>
              </CardHeader>
              <CardContent className="text-sm">
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Weight</Label>
                    <div className="col-span-3">{appointment.weight || "Not recorded"}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Vitals</Label>
                    <div className="col-span-3">{appointment.vitals || "Not recorded"}</div>
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right">Gestational Age</Label>
                    <div className="col-span-3">{appointment.gestational_age || "Not recorded"}</div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </main>
  );
}