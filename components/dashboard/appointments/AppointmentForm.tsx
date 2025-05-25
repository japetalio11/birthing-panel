"use client";

import * as React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";

const appointmentFormSchema = z.object({
  patient_id: z.coerce.string().min(1, "Patient is required"),
  clinician_id: z.coerce.string().min(1, "Clinician is required"),
  date: z.string().min(1, "A valid date is required"), // Changed to string
  service: z.string().min(1, "Service is required"),
});

type AppointmentFormValues = z.infer<typeof appointmentFormSchema>;

interface Person {
  id: string;
  first_name: string;
  middle_name?: string;
  last_name: string;
}

interface AppointmentFormProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

const inputClass = "h-10 w-full min-w-[140px]";

export default function AppointmentForm({ open, onOpenChange, onSuccess }: AppointmentFormProps) {
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [isLoading, setIsLoading] = React.useState(false);
  const [patients, setPatients] = React.useState<Person[]>([]);
  const [clinicians, setClinicians] = React.useState<Person[]>([]);

  const services = ["Prenatal Care", "Postpartum Care", "Consultation", "Ultrasound", "Lab Test"];

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patient_id: "",
      clinician_id: "",
      date: new Date().toISOString().split("T")[0], // Initialize with today's date as string
      service: "",
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const { data: patientsData, error: patientsError } = await supabase
          .from("patients")
          .select("id, person (first_name, middle_name, last_name)");

        if (patientsError) throw new Error("Error fetching patients");

        setPatients(
          patientsData.map((p: any) => ({
            id: p.id.toString(),
            first_name: p.person.first_name || "",
            middle_name: p.person.middle_name || "",
            last_name: p.person.last_name || "",
          }))
        );

        const { data: cliniciansData, error: cliniciansError } = await supabase
          .from("clinicians")
          .select("id, role, specialization, person (first_name, middle_name, last_name)");

        if (cliniciansError) throw new Error("Error fetching clinicians");

        setClinicians(
          cliniciansData.map((c: any) => ({
            id: c.id.toString(),
            first_name: c.person.first_name || "",
            middle_name: c.person.middle_name || "",
            last_name: c.person.last_name || "",
            role: c.role,
            specialization: c.specialization,
          }))
        );
      } catch (error) {
        toast.error("Error fetching data");
      } finally {
        setIsLoading(false);
      }
    };

    if (open) {
      form.reset({
        patient_id: "",
        clinician_id: "",
        date: new Date().toISOString().split("T")[0], // Reset to today's date as string
        service: "",
      });
      fetchData();
    }
  }, [open, form]);

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);

      // Convert string date to Date object for Supabase
      const appointmentDate = new Date(data.date);
      if (isNaN(appointmentDate.getTime())) {
        throw new Error("Invalid date provided");
      }
      appointmentDate.setHours(0, 0, 0, 0);

      const { data: existingAppointment, error: checkError } = await supabase
        .from("appointment")
        .select("id")
        .eq("patient_id", data.patient_id)
        .eq("clinician_id", data.clinician_id)
        .eq("date", appointmentDate.toISOString())
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        throw new Error("Error checking for existing appointment");
      }

      if (existingAppointment) {
        throw new Error("An appointment already exists for this patient, clinician, and date.");
      }

      const newAppointment = {
        patient_id: data.patient_id,
        clinician_id: data.clinician_id,
        date: appointmentDate.toISOString(),
        service: data.service,
        status: "Scheduled",
        payment_status: "Unpaid",
      };

      const { error } = await supabase.from("appointment").insert([newAppointment]);

      if (error) throw error;

      const patient = patients.find((p) => p.id === data.patient_id);
      toast.success("Appointment created successfully", {
        description: `Appointment for ${patient?.first_name} ${patient?.last_name} on ${appointmentDate.toLocaleDateString()}`,
      });

      form.reset({
        patient_id: "",
        clinician_id: "",
        date: new Date().toISOString().split("T")[0],
        service: "",
      });
      onOpenChange(false);
      onSuccess?.();
    } catch (error) {
      toast.error("Failed to create appointment", {
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
          <DialogTitle>Add New Appointment</DialogTitle>
          <DialogDescription>
            Create a new appointment by filling in the basic details below.
          </DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6 py-4">
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

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="date"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <DatePicker
                        value={field.value ? new Date(field.value) : new Date()}
                        onChange={(date) => field.onChange(date.toISOString().split("T")[0])}
                        className={inputClass}
                      />
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

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting || isLoading}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin mr-2" />
                    Creating...
                  </>
                ) : (
                  "Create Appointment"
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}