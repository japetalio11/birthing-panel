"use client";

import { useRouter, useSearchParams } from "next/navigation";
import React, { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { Calendar, Trash2, RefreshCcw, Download } from "lucide-react";
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
import VitalsForm from "./VitalsForm";
import UpdateAppointmentForm from "./UpdateAppointmentForm";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useCurrentUser } from "@/hooks/useCurrentUser";
import Prescriptions from "../person/Prescriptions";
import SupplementRecommendation from "../person/SupplementRecommendation";

interface Person {
  id: number;
  first_name: string;
  middle_name: string | null;
  last_name: string;
  birth_date: string;
  age: string | null;
  contact_number: string | null;
  address: string | null;
}

interface Patient {
  id: number;
  person: Person;
}

interface Clinician {
  role: string;
  specialization: string;
  person: {
    first_name: string;
    middle_name: string | null;
    last_name: string;
  };
}

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
  patient?: Patient;
  clinician?: Clinician;
}

interface Vitals {
  id: string;
  temperature: number | null;
  pulse_rate: number | null;
  blood_pressure: string | null;
  respiration_rate: number | null;
  oxygen_saturation: number | null;
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
  const [vitals, setVitals] = useState<Vitals[]>([]);
  const [showVitalsForm, setShowVitalsForm] = useState(false);
  const [hasExistingVitals, setHasExistingVitals] = useState(false);
  const [showUpdateForm, setShowUpdateForm] = useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportOptions, setExportOptions] = useState({
    appointmentInfo: true,
    patientInfo: false,
    clinicianInfo: false,
    vitals: false,
    prescriptions: false,
    supplements: false
  });
  const [exportFormat, setExportFormat] = useState("pdf");
  const [isExporting, setIsExporting] = useState(false);
  const { userData } = useCurrentUser();

  // Fetch appointment data from Supabase
  useEffect(() => {
    if (!id) {
      toast.error("No appointment ID provided.");
      router.push("/Dashboard/Appointments");
      return;
    }

    async function fetchAppointment() {
      try {
        // First fetch the basic appointment data
        const { data: appointmentData, error: appointmentError } = await supabase
          .from("appointment")
          .select("*")
          .eq("id", id)
          .single();

        if (appointmentError) {
          console.error("Supabase query error:", appointmentError);
          toast.error(`Failed to fetch appointment: ${appointmentError.message}`);
          setLoading(false);
          router.push("/Dashboard/Appointments");
          return;
        }

        if (!appointmentData) {
          console.warn("No appointment found with ID:", id);
          toast.error("Appointment not found.");
          setLoading(false);
          router.push("/Dashboard/Appointments");
          return;
        }

        // Fetch patient data
        const { data: patientData, error: patientError } = await supabase
          .from("patients")
          .select(`
            *,
            person (
              id,
              first_name,
              middle_name,
              last_name,
              birth_date,
              age,
              contact_number,
              address
            )
          `)
          .eq('id', appointmentData.patient_id)
          .single();

        if (patientError) {
          console.error("Error fetching patient:", patientError);
          toast.error(`Failed to fetch patient data: ${patientError.message}`);
        }

        // Fetch clinician data
        const { data: clinicianData, error: cliniciansError } = await supabase
          .from("clinicians")
          .select(`
            id,
            role,
            specialization,
            person (
              id,
              first_name,
              middle_name,
              last_name
            )
          `)
          .eq('id', appointmentData.clinician_id)
          .single();

        if (cliniciansError) {
          console.error("Error fetching clinician:", cliniciansError);
          toast.error(`Failed to fetch clinician data: ${cliniciansError.message}`);
        }

        // Transform the data
        const transformedData: Appointment = {
          ...appointmentData,
          patient: patientData ? {
            id: patientData.id,
            person: patientData.person
          } : undefined,
          clinician: clinicianData ? {
            role: clinicianData.role,
            specialization: clinicianData.specialization,
            person: clinicianData.person
          } : undefined
        };

        console.log("Fetched Data:", {
          appointment: appointmentData,
          patient: patientData,
          clinician: clinicianData,
          transformed: transformedData
        });

        setAppointment(transformedData);
        setIsCancelled(transformedData.status.toLowerCase() === "canceled");

        console.log("Starting vitals fetch for appointment:", id);

        // Fetch vitals for this appointment
        try {
          const { data: vitalsData, error: vitalsError } = await supabase
            .from("vitals")
            .select(`
              id,
              temperature,
              pulse_rate,
              blood_pressure,
              respiration_rate,
              oxygen_saturation
            `)
            .eq("id", id);

          console.log("Raw vitals response:", vitalsData);

          if (vitalsError) {
            throw vitalsError;
          }

          setVitals(vitalsData || []);
          setHasExistingVitals(vitalsData && vitalsData.length > 0);

        } catch (error: any) {
          console.error("Detailed vitals fetch error:", {
            error,
            errorType: typeof error,
            errorKeys: error ? Object.keys(error) : 'no keys',
            errorString: error ? error.toString() : 'no toString',
            errorStack: error?.stack || 'no stack trace'
          });
        }

        setLoading(false);
      } catch (err) {
        console.error("Unexpected error fetching appointment:", err);
        toast.error("An unexpected error occurred while fetching the appointment.");
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
      setShowUpdateForm(true);
    }
  };

  const handleUpdateSuccess = async () => {
    // Refresh appointment data after update
    if (!id) return;

    try {
      const { data: appointmentData, error: appointmentError } = await supabase
        .from("appointment")
        .select(`
          *,
          patient:patient_id (
            person (
              id,
              first_name,
              middle_name,
              last_name,
              birth_date,
              age,
              contact_number,
              address
            )
          ),
          clinician:clinician_id (
            person (
              id,
              first_name,
              middle_name,
              last_name
            )
          )
        `)
        .eq("id", id)
        .single();

      if (appointmentError) throw appointmentError;

      const transformedData = {
        ...appointmentData,
        patient: appointmentData.patient ? {
          id: appointmentData.patient.id,
          person: appointmentData.patient.person
        } : undefined,
        clinician: appointmentData.clinician ? {
          role: appointmentData.clinician.role,
          specialization: appointmentData.clinician.specialization,
          person: appointmentData.clinician.person
        } : undefined
      };

      setAppointment(transformedData);
      setIsCancelled(transformedData.status.toLowerCase() === "canceled");
    } catch (err: any) {
      console.error("Error refreshing appointment data:", err);
      toast.error("Failed to refresh appointment data");
    }
  };

  async function handleExport() {
    console.log("Starting export process...");
    if (!appointment) {
      console.error("No appointment data available.");
      toast.error("No appointment data available for export.");
      return;
    }

    const hasSelectedOptions = Object.values(exportOptions).some((option) => option);
    if (!hasSelectedOptions) {
      console.warn("No export options selected.");
      toast.error("Please select at least one export option.");
      return;
    }

    setIsExporting(true);
    try {
      console.log("Preparing export data with options:", exportOptions);

      // Fetch prescriptions if selected
      let prescriptionsData = null;
      if (exportOptions.prescriptions) {
        const { data: prescriptions, error: prescriptionsError } = await supabase
          .from("prescriptions")
          .select("*")
          .eq("appointment_id", appointment.id);

        if (prescriptionsError) {
          console.error("Error fetching prescriptions:", prescriptionsError);
          toast.error("Failed to fetch prescriptions data");
        } else {
          prescriptionsData = prescriptions;
        }
      }

      // Fetch supplements if selected
      let supplementsData = null;
      if (exportOptions.supplements) {
        const { data: supplements, error: supplementsError } = await supabase
          .from("supplements")
          .select("*")
          .eq("appointment_id", appointment.id);

        if (supplementsError) {
          console.error("Error fetching supplements:", supplementsError);
          toast.error("Failed to fetch supplements data");
        } else {
          supplementsData = supplements;
        }
      }

      // Include vitals data and the newly fetched data in the export
      const exportData = {
        appointment: {
          ...appointment,
          vitals: vitals[0] || null,
          prescriptions: prescriptionsData || null,
          supplements: supplementsData || null
        },
        exportOptions,
        exportFormat
      };

      console.log("Sending request to /api/export/appointment...");
      const response = await fetch("/api/export/appointment", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(exportData),
      });
      console.log("API response status:", response.status);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `API request failed with status ${response.status}`);
      }

      console.log("Processing download...");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const patientName = appointment.patient ? 
        `${appointment.patient.person.first_name} ${appointment.patient.person.middle_name ? appointment.patient.person.middle_name + " " : ""}${appointment.patient.person.last_name}` : 
        "Unknown";
      const a = document.createElement("a");
      a.href = url;
      a.download = `Appointment_Report_${patientName}_${new Date(appointment.date).toISOString().split('T')[0]}.${exportFormat}`;
      a.click();
      window.URL.revokeObjectURL(url);

      console.log("Export successful.");
      toast.success("Export generated successfully.");
      setOpenExportDialog(false);
    } catch (error: any) {
      console.error("Export failed:", error);
      const errorMessage = error.message || "An unexpected error occurred during export.";
      toast.error(`Failed to generate export: ${errorMessage}`);
    } finally {
      setIsExporting(false);
    }
  }

  if (loading || !appointment) {
    return <div>Loading...</div>;
  }

  const isDeleteEnabled = deleteInput.trim().toLowerCase() === "confirm";

  const getPatientName = () => {
    const person = appointment?.patient?.person;
    if (!person) return "Unknown Patient";
    return `${person.first_name}${person.middle_name ? ` ${person.middle_name}` : ""} ${person.last_name}`;
  };

  const getClinicianName = () => {
    const person = appointment?.clinician?.person;
    if (!person) return "Unknown Clinician";
    return `${person.first_name}${person.middle_name ? ` ${person.middle_name}` : ""} ${person.last_name}`;
  };

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
        onClick={() => appointment && handleDelete(appointment.id)}
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
              <TabsTrigger value="supplements">Supplements</TabsTrigger>
              {(userData?.isAdmin || userData?.isDoctor) && (
                <TabsTrigger value="prescriptions">Prescriptions</TabsTrigger>
              )}
            </TabsList>
            <div className="ml-auto flex items-center gap-2">
              <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
                <DialogTrigger asChild>
                  <Button size="sm" variant="outline" className="h-8 gap-1">
                    <Download className="h-4 w-4" />
                    <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Export Appointment Data</DialogTitle>
                    <DialogDescription>
                      Select the data to include in the export and choose the format.
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid gap-4 py-4">
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="appointmentInfo"
                        checked={exportOptions.appointmentInfo}
                        onCheckedChange={(checked) =>
                          setExportOptions({ ...exportOptions, appointmentInfo: !!checked })
                        }
                      />
                      <Label htmlFor="appointmentInfo">Appointment Information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="patientInfo"
                        checked={exportOptions.patientInfo}
                        onCheckedChange={(checked) =>
                          setExportOptions({ ...exportOptions, patientInfo: !!checked })
                        }
                      />
                      <Label htmlFor="patientInfo">Patient Information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="clinicianInfo"
                        checked={exportOptions.clinicianInfo}
                        onCheckedChange={(checked) =>
                          setExportOptions({ ...exportOptions, clinicianInfo: !!checked })
                        }
                      />
                      <Label htmlFor="clinicianInfo">Clinician Information</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="vitals"
                        checked={exportOptions.vitals}
                        onCheckedChange={(checked) =>
                          setExportOptions({ ...exportOptions, vitals: !!checked })
                        }
                      />
                      <Label htmlFor="vitals">Vitals</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="prescriptions"
                        checked={exportOptions.prescriptions}
                        onCheckedChange={(checked) =>
                          setExportOptions({ ...exportOptions, prescriptions: !!checked })
                        }
                      />
                      <Label htmlFor="prescriptions">Prescriptions</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox
                        id="supplements"
                        checked={exportOptions.supplements}
                        onCheckedChange={(checked) =>
                          setExportOptions({ ...exportOptions, supplements: !!checked })
                        }
                      />
                      <Label htmlFor="supplements">Supplements</Label>
                    </div>
                    <div className="grid grid-cols-4 items-center gap-4">
                      <Label htmlFor="format" className="text-right">
                        Format
                      </Label>
                      <Select value={exportFormat} onValueChange={setExportFormat}>
                        <SelectTrigger className="col-span-3">
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="pdf">PDF</SelectItem>
                          <SelectItem value="csv">CSV</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  <DialogFooter>
                    <DialogPrimitive.Close>
                      <Button variant="outline">Cancel</Button>
                    </DialogPrimitive.Close>
                    <Button onClick={handleExport} disabled={isExporting}>
                      {isExporting ? "Exporting..." : "Export"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>

          <TabsContent value="overview">
            <div className="grid gap-4">
              {/* Patient Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Patient Information</CardTitle>
                  <CardDescription>All gathered patient information</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold mr-2">Name</Label>
                      <span className="text-sm">{getPatientName()}</span>
                    </div>
                    <div>
                      <Label className="font-semibold mr-2">Date of Birth</Label>
                      <span className="text-sm">
                        {appointment?.patient?.person?.birth_date ? 
                          new Date(appointment.patient.person.birth_date).toLocaleDateString() 
                          : "Not provided"}
                      </span>
                    </div>
                    <div>
                      <Label className="font-semibold mr-2">Age</Label>
                      <span className="text-sm">{appointment?.patient?.person?.age || "Not provided"}</span>
                    </div>
                    <div>
                      <Label className="font-semibold mr-2">Contact Number</Label>
                      <span className="text-sm">{appointment?.patient?.person?.contact_number || "Not provided"}</span>
                    </div>
                    <div className="col-span-2">
                      <Label className="font-semibold mr-2">Address</Label>
                      <span className="text-sm">{appointment?.patient?.person?.address || "Not provided"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Clinician Information Card */}
              <Card>
                <CardHeader>
                  <CardTitle>Clinician Information</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <Label className="font-semibold mr-2">Name</Label>
                      <span className="text-sm">{getClinicianName()}</span>
                    </div>
                    <div>
                      <Label className="font-semibold mr-2">Role</Label>
                      <span className="text-sm">{appointment?.clinician?.role || "Not specified"}</span>
                    </div>
                    <div className="col-span-2">
                      <Label className="font-semibold mr-2">Specialization</Label>
                      <span className="text-sm">{appointment?.clinician?.specialization || "Not specified"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="vitals">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Vitals History</CardTitle>
                  <CardDescription>Record and view patient vitals for this appointment</CardDescription>
                </div>
                <Button onClick={() => setShowVitalsForm(true)}>
                  {hasExistingVitals ? "Update Vitals" : "Add Vitals"}
                </Button>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  {vitals.map((vital) => (
                    <div key={vital.id} className="border rounded-lg p-4">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {/* Measurements Column */}
                        <div className="space-y-4">
                          <div>
                            <Label className="font-semibold mr-2">Weight</Label>
                            <span className="text-sm">{appointment?.weight ? `${appointment.weight} kg` : "Not recorded"}</span>
                          </div>
                          <div>
                            <Label className="font-semibold mr-2">Gestational Age</Label>
                            <span className="text-sm">{appointment?.gestational_age ? `${appointment.gestational_age} weeks` : "Not recorded"}</span>
                          </div>
                          <div>
                            <Label className="font-semibold mr-2">Blood Pressure</Label>
                            <span className="text-sm">{vital.blood_pressure || "Not recorded"}</span>
                          </div>
                        </div>

                        {/* Vital Signs Column 1 */}
                        <div className="space-y-4">
                          <div>
                            <Label className="font-semibold mr-2">Temperature</Label>
                            <span className="text-sm">{vital.temperature ? `${vital.temperature} °C` : "Not recorded"}</span>
                          </div>
                          <div>
                            <Label className="font-semibold mr-2">Pulse Rate</Label>
                            <span className="text-sm">{vital.pulse_rate ? `${vital.pulse_rate} bpm` : "Not recorded"}</span>
                          </div>
                        </div>

                        {/* Vital Signs Column 2 */}
                        <div className="space-y-4">
                          <div>
                            <Label className="font-semibold mr-2">Respiration Rate</Label>
                            <span className="text-sm">
                              {vital.respiration_rate ? `${vital.respiration_rate} breaths/min` : "Not recorded"}
                            </span>
                          </div>
                          <div>
                            <Label className="font-semibold mr-2">Oxygen Saturation</Label>
                            <span className="text-sm">
                              {vital.oxygen_saturation ? `${vital.oxygen_saturation}%` : "Not recorded"}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {vitals.length === 0 && (
                    <div className="text-center text-muted-foreground py-4">
                      No records yet
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="supplements">
            <SupplementRecommendation 
              context="patient" 
              id={appointment?.patient_id || null} 
              appointment_id={id}
            />
          </TabsContent>

          {(userData?.isAdmin || userData?.isDoctor) && (
            <TabsContent value="prescriptions">
              <Prescriptions 
                context="patient" 
                id={appointment?.patient_id || null} 
                appointment_id={id}
              />
            </TabsContent>
          )}
        </Tabs>
      </div>

      {/* Vitals Form Dialog */}
      {appointment && (
        <VitalsForm
          open={showVitalsForm}
          onOpenChange={setShowVitalsForm}
          appointmentId={id!}
          existingVitals={vitals[0]}
          appointmentData={appointment ? {
            weight: appointment.weight ? Number(appointment.weight) : null,
            gestational_age: appointment.gestational_age ? Number(appointment.gestational_age) : null,
          } : null}
          onSuccess={() => {
            // Refresh both vitals and appointment data after successful submission
            const refreshData = async () => {
              try {
                // Fetch updated appointment data
                const { data: appointmentData, error: appointmentError } = await supabase
                  .from("appointment")
                  .select(`
                    *,
                    patient:patient_id (
                      person (
                        id,
                        first_name,
                        middle_name,
                        last_name,
                        birth_date,
                        age,
                        contact_number,
                        address
                      )
                    ),
                    clinician:clinician_id (
                      role,
                      specialization,
                      person (
                        first_name,
                        middle_name,
                        last_name
                      )
                    )
                  `)
                  .eq("id", id)
                  .single();

                if (appointmentError) throw appointmentError;

                // Transform and update appointment state
                const transformedData = {
                  ...appointmentData,
                  patient: appointmentData.patient ? {
                    id: appointmentData.patient.id,
                    person: appointmentData.patient.person
                  } : undefined,
                  clinician: appointmentData.clinician ? {
                    role: appointmentData.clinician.role,
                    specialization: appointmentData.clinician.specialization,
                    person: appointmentData.clinician.person
                  } : undefined
                };

                setAppointment(transformedData);

                // Fetch updated vitals data
                const { data: vitalsData, error: vitalsError } = await supabase
                  .from("vitals")
                  .select(`
                    id,
                    temperature,
                    pulse_rate,
                    blood_pressure,
                    respiration_rate,
                    oxygen_saturation
                  `)
                  .eq("id", id);

                if (vitalsError) throw vitalsError;

                setVitals(vitalsData || []);
                setHasExistingVitals(vitalsData && vitalsData.length > 0);

              } catch (error: any) {
                console.error("Error refreshing data:", error);
                toast.error("Failed to refresh data");
              }
            };

            refreshData();
          }}
        />
      )}

      {appointment && (
        <UpdateAppointmentForm
          open={showUpdateForm}
          onOpenChange={setShowUpdateForm}
          appointmentData={{
            id: appointment?.id || "",
            patient_id: appointment?.patient_id || "",
            clinician_id: appointment?.clinician_id || "",
            date: appointment?.date || new Date().toISOString(),
            service: appointment?.service || "",
            status: appointment?.status || "",
            payment_status: appointment?.payment_status || "",
          }}
          onSuccess={handleUpdateSuccess}
        />
      )}
    </main>
  );
}