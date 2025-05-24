"use client";

import * as React from "react";
import { z } from "zod";
<<<<<<< HEAD
import { useForm, useFieldArray, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import {
    Camera,
    CircleX,
    Send,
    Loader2,
} from "lucide-react";
=======
import { useForm, FormProvider } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { CircleX, Send, Loader2 } from "lucide-react";
>>>>>>> bcb83ee4ad44959a2f7e3ed2e3ba7beb65195a23
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { DatePicker } from "@/components/ui/date-picker";
import { toast } from "sonner";
<<<<<<< HEAD
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
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
    occupation: z.string().optional(),
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
    profileImage: z.any().optional(),
});

export type PatientFormValues = z.infer<typeof patientFormSchema>;

export default function AppointmentForm() {
    const router = useRouter();
    const [isSubmitting, setIsSubmitting] = React.useState(false);

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
            occupation: "",
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
        },
    });

    const onSubmit = async (data: PatientFormValues) => {
        try {
            setIsSubmitting(true);
            await createPatient(data); // Assumes createPatient handles allergies
            toast.success("Patient Added Successfully", {
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
                                                <div className="relative w-40  h-40 rounded-full overflow-hidden border">
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
                                                    <DatePicker value={field.value} onChange={field.onChange} />
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
                                name="maritalStatus"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Marital Status</FormLabel>
                                        <Select
                                            value={field.value}
                                            onValueChange={field.onChange}
                                        >
                                            <SelectTrigger id="maritalStatus" className="col-span-3">
                                                <SelectValue placeholder="Select marital status" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="Single">Single</SelectItem>
                                                <SelectItem value="Married">Married</SelectItem>
                                                <SelectItem value="Divorced">Divorced</SelectItem>
                                                <SelectItem value="Widowed">Widowed</SelectItem>
                                            </SelectContent>
                                        </Select>
                                    </FormItem>
                                )}
                            />
                            <FormField
                                control={form.control}
                                name="occupation"
                                render={({ field }) => (
                                    <FormItem>
                                        <FormLabel>Occupation</FormLabel>
                                        <FormControl>
                                            <Input placeholder="Enter occupation" {...field} />
                                        </FormControl>
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
                                            <DatePicker value={field.value} onChange={field.onChange} />
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
                                            <DatePicker value={field.value} onChange={field.onChange} />
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

                    <div className="justify-end gap-2ml-auto flex items-center gap-2">
                        <Button
                            size="sm"
                            variant="outline"
                            className="h-8 gap-1"
                            onClick={() => {
                                form.reset();
                                router.push("/Appointments");
                            }}
                        >
                            <CircleX />
                            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Discard</span>
                        </Button>
                        <Button type="submit" disabled={isSubmitting}>
                            {isSubmitting ? (
                                <>
                                    <Loader2 className=" h-4 w-4 animate-spin" />
                                    Submitting...
                                </>
                            ) : (
                                <>
                                    <Send />
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
=======
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { supabase } from "@/lib/supabase/client";
import { Popover, PopoverTrigger, PopoverContent } from "@/components/ui/popover";
import { ScrollArea } from "@/components/ui/scroll-area";
import { TimePicker12Demo } from "@/components/dashboard/appointments/TimePicker12Demo";

const appointmentFormSchema = z.object({
  patient_id: z.coerce.string().min(1, "Patient is required"),
  clinician_id: z.coerce.string().min(1, "Clinician is required"),
  date: z.coerce.date(),
  time: z.string().min(1, "Time is required"), // <-- Added
  service: z.string().min(1, "Service is required"),
  weight: z.string().optional(),
  vitals: z.string().optional(),
  gestational_age: z.string().optional(),
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

interface TimePicker12DemoProps {
  date?: Date; // or date: Date | undefined;
  setDate: (date: Date | undefined) => void;
}

// Add a utility class for consistent input/select height and width
const inputClass = "h-10 w-full min-w-[140px]"; // adjust min-w as needed

export default function AddAppointmentForm() {
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [patients, setPatients] = React.useState<Person[]>([]);
  const [clinicians, setClinicians] = React.useState<Person[]>([]);

  // Add state for time picker
  const [date, setDate] = React.useState<Date | undefined>(undefined);

  const services = ["Prenatal Care", "Postpartum Care", "Consultation", "Ultrasound", "Lab Test"];
  const vitalSigns = [
    "Temperature",
    "Blood Pressure",
    "Pulse Rate",
    "Respiration Rate",
    "Oxygen Saturation",
  ];

  const form = useForm<AppointmentFormValues>({
    resolver: zodResolver(appointmentFormSchema),
    defaultValues: {
      patient_id: "",
      clinician_id: "",
      date: new Date(),
      time: "", // <-- Added
      service: "",
      weight: "",
      vitals: "",
      gestational_age: "",
      status: "Scheduled",
      payment_status: "Unpaid",
    },
  });

  React.useEffect(() => {
    const fetchData = async () => {
      const { data: patientsData, error: patientsError } = await supabase
        .from("patients")
        .select("id, person (first_name, middle_name, last_name)");

      if (patientsError) {
        console.error("Patients fetch error:", patientsError);
        toast.error("Error fetching patients");
      }

      if (patientsData) {
        setPatients(
          patientsData.map((p: any) => ({
            id: p.id.toString(),
            first_name: p.person?.first_name || "",
            middle_name: p.person?.middle_name || "",
            last_name: p.person?.last_name || "",
          }))
        );
      }

      const { data: cliniciansData, error: cliniciansError } = await supabase
        .from("clinicians")
        .select("id, person (first_name, middle_name, last_name)");

      if (cliniciansError) {
        console.error("Clinicians fetch error:", cliniciansError);
        toast.error("Error fetching clinicians");
      }

      if (cliniciansData) {
        setClinicians(
          cliniciansData.map((c: any) => ({
            id: c.id.toString(),
            first_name: c.person?.first_name || "",
            middle_name: c.person?.middle_name || "",
            last_name: c.person?.last_name || "",
          }))
        );
      }
    };

    fetchData();
  }, []);

  const onSubmit = async (data: AppointmentFormValues) => {
    try {
      setIsSubmitting(true);

      // Combine date and time for uniqueness check
      const appointmentDateTime = new Date(data.date);
      const [hours, minutes] = data.time.split(":").map(Number);
      appointmentDateTime.setHours(hours, minutes, 0, 0);

      const { data: existingAppointment, error: checkError } = await supabase
        .from("appointment")
        .select("id")
        .eq("patient_id", data.patient_id)
        .eq("clinician_id", data.clinician_id)
        .eq("date", appointmentDateTime.toISOString())
        .single();

      if (checkError && checkError.code !== "PGRST116") {
        console.error("Check error:", checkError);
        throw new Error("Error checking for existing appointment");
      }

      if (existingAppointment) {
        throw new Error("An appointment already exists for this patient, clinician, date, and time.");
      }

      const newAppointment = {
        patient_id: data.patient_id,
        clinician_id: data.clinician_id,
        date: appointmentDateTime.toISOString(),
        time: data.time, // <-- Added
        service: data.service,
        weight: data.weight ? parseFloat(data.weight) : null,
        vitals: data.vitals || null,
        gestational_age: data.gestational_age ? parseInt(data.gestational_age, 10) : null,
        status: data.status,
        payment_status: data.payment_status,
      };

      const { error } = await supabase.from("appointment").insert([newAppointment]);

      if (error) {
        if (error.code === "23505") {
          throw new Error("An appointment with these details already exists.");
        }
        throw error;
      }

      const patient = patients.find((p) => p.id === data.patient_id);
      toast.success("Appointment created successfully", {
        description: `Appointment for ${patient?.first_name} ${patient?.last_name} on ${appointmentDateTime.toLocaleDateString()} at ${data.time}`,
      });
      router.push("/Dashboard/Appointments");
    } catch (error) {
      console.error("Create error:", error);
      toast.error("Failed to create appointment", {
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
            <legend className="-ml-1 px-1 text-sm font-medium">Add Appointment Details</legend>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Patient */}
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
              {/* Clinician */}
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
              {/* Date */}
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
              {/* Time Picker */}
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1">Time</label>
                <div className={inputClass}>
                  <TimePicker12Demo date={date} setDate={setDate} />
                </div>
              </div>
              {/* Service (dropdown) */}
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
              {/* Weight */}
              <FormField
                control={form.control}
                name="weight"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Weight</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Weight (kg)" {...field} className={inputClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Gestational Age */}
              <FormField
                control={form.control}
                name="gestational_age"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Gestational Age</FormLabel>
                    <FormControl>
                      <Input type="number" placeholder="Gestational Age (weeks)" {...field} className={inputClass} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Vitals (dropdown) */}
              <FormField
                control={form.control}
                name="vitals"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Vitals</FormLabel>
                    <Select value={field.value || ""} onValueChange={field.onChange}>
                      <SelectTrigger className={inputClass}>
                        <SelectValue placeholder="Select vitals" />
                      </SelectTrigger>
                      <SelectContent>
                        {vitalSigns.map((v) => (
                          <SelectItem key={v} value={v}>{v}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Status */}
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
                        <SelectItem value="Scheduled">Scheduled</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                        <SelectItem value="Canceled">Canceled</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Payment Status */}
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
                        <SelectItem value="Unpaid">Unpaid</SelectItem>
                        <SelectItem value="Pending">Pending</SelectItem>
                        <SelectItem value="Completed">Completed</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
          </fieldset>

          <div className="justify-end ml-auto flex items-center gap-2">
            <Button
              size="sm"
              variant="outline"
              className="h-8 gap-1"
              onClick={() => {
                form.reset();
                router.push("/Dashboard/Appointments");
              }}
            >
              <CircleX />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Cancel</span>
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Send />
                  Create Appointment
                </>
              )}
            </Button>
          </div>
        </form>
      </FormProvider>
    </main>
  );
}
>>>>>>> bcb83ee4ad44959a2f7e3ed2e3ba7beb65195a23
