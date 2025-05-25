"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage, Form } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const appointmentFormSchema = z.object({
  patient_id: z.coerce.string().min(1, "Patient is required"),
  clinician_id: z.coerce.string().min(1, "Clinician is required"),
  date: z.coerce.date(),
  service: z.string().min(1, "Service is required"),
  status: z.string().min(1, "Status is required"),
  payment_status: z.string().min(1, "Payment status is required"),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface Person {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
}

interface UpdateAppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
  appointmentData: {
    id: string;
    patient_id: string;
    clinician_id: string;
    date: string;
    service: string;
    status: string;
    payment_status: string;
  };
}

const inputClass = "h-10 w-full min-w-[140px]";

export default function UpdateAppointmentForm({ open, onOpenChange, onSuccess, appointmentData }: UpdateAppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [patients, setPatients] = React.useState<Person[]>([]);
  const [clinicians, setClinicians] = React.useState<Person[]>([]);

  const services = ["Prenatal Care", "Postpartum Care", "Consultation", "Ultrasound", "Lab Test"];
  const statuses = ["Scheduled", "Completed", "Canceled"];
  const paymentStatuses = ["Paid", "Unpaid", "Partial"];

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patient_id: appointmentData.patient_id,
      clinician_id: appointmentData.clinician_id,
      date: new Date(appointmentData.date),
      service: appointmentData.service,
      status: appointmentData.status,
      payment_status: appointmentData.payment_status,
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select(`
          id,
          person (
            first_name,
            middle_name,
            last_name
          )
        `);

      if (patientsError) {
        console.error("Patients fetch error:", patientsError);
        toast.error("Error fetching patients");
      }

      if (patientsData) {
        setPatients(
          patientsData.map((p: any) => ({
            id: p.id.toString(),
            first_name: p.person.first_name || "",
            middle_name: p.person.middle_name || "",
            last_name: p.person.last_name || "",
          }))
        );
      }

      const { data: cliniciansData, error: cliniciansError } = await supabase
        .from("clinicians")
        .select(`
          id,
          role,
          specialization,
          person (
            first_name,
            middle_name,
            last_name
          )
        `);

      if (cliniciansError) {
        console.error("Clinicians fetch error:", cliniciansError);
        toast.error("Error fetching clinicians");
      }

      if (cliniciansData) {
        setClinicians(
          cliniciansData.map((c: any) => ({
            id: c.id.toString(),
            first_name: c.person.first_name || "",
            middle_name: c.person.middle_name || "",
            last_name: c.person.last_name || "",
          }))
        );
      }
    };

    if (open) {
      fetchData();
    }
  }, [open]);

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);

      const appointmentDate = new Date(data.date);
      appointmentDate.setHours(0, 0, 0, 0);

      // Check for existing appointments on the same date (excluding current appointment)
      const { data: existingAppointment, error: checkError } = await supabase
        .from("appointment")
        .select("id")
        .eq("patient_id", data.patient_id)
        .eq("clinician_id", data.clinician_id)
        .eq("date", appointmentDate.toISOString())
        .neq("id", appointmentData.id)
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Check error:", checkError);
        throw new Error("Error checking for existing appointment");
      }

      if (existingAppointment) {
        throw new Error("An appointment already exists for this patient, clinician, and date.");
      }

      const updatedAppointment = {
        patient_id: data.patient_id,
        clinician_id: data.clinician_id,
        date: appointmentDate.toISOString(),
        service: data.service,
        status: data.status,
        payment_status: data.payment_status,
      };

      const { error } = await supabase
        .from("appointment")
        .update(updatedAppointment)
        .eq("id", appointmentData.id);

      if (error) throw error;

      const patient = patients.find((p) => p.id === data.patient_id);
      toast.success("Appointment updated successfully", {
        description: `Appointment for ${patient?.first_name} ${patient?.last_name} on ${appointmentDate.toLocaleDateString()}`,
      });
      
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      console.error("Update error:", error);
      toast.error("Failed to update appointment", {
        description: error instanceof Error ? error.message : "Unknown error occurred",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[725px]">
        <DialogHeader>
          <DialogTitle>Update Appointment</DialogTitle>
          <DialogDescription>
            Update the appointment details below.
          </DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
            {/* First Row: Patient and Clinician */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="patient_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Patient</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select patient" />
                      </SelectTrigger>
                      <SelectContent>
                        {patients.map((p) => (
                          <SelectItem key={p.id} value={p.id}>
                            {p.first_name} {p.middle_name ? p.middle_name + " " : ""}{p.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clinician_id"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Clinician</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select clinician" />
                      </SelectTrigger>
                      <SelectContent>
                        {clinicians.map((c) => (
                          <SelectItem key={c.id} value={c.id}>
                            {c.first_name} {c.middle_name ? c.middle_name + " " : ""}{c.last_name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Second Row: Date and Service */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <div className={inputClass}>
                        <DatePicker value={field.value} onChange={field.onChange} />
                      </div>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="service"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Service</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select service" />
                      </SelectTrigger>
                      <SelectContent>
                        {services.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Third Row: Status and Payment Status */}
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select status" />
                      </SelectTrigger>
                      <SelectContent>
                        {statuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="payment_status"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Payment Status</FormLabel>
                    <Select value={field.value} onValueChange={field.onChange}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select payment status" />
                      </SelectTrigger>
                      <SelectContent>
                        {paymentStatuses.map((s) => (
                          <SelectItem key={s} value={s}>{s}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Updating...
                  </>
                ) : (
                  "Update Appointment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
} 