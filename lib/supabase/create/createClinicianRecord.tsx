import { supabase } from "../client";
import { ClinicianFormValues } from "@/components/dashboard/person/clinicians/ClinicianForm";

export async function createClinicianRecord(data: ClinicianFormValues, personId: string) {
    return await supabase
    .from('clinicians')
    .insert({
        id: personId,
        role: data.role || null,
        license_number: data.licenseNumber || null,
        prescription_id: data.prescriptionId || null,
        specialization: data.specialization || null,
        appointment_id: data.appointmentId || null,
        password: data.password || null,
        ssn: data.ssn || null,
        prescription_Id : data.prescriptionId || null,
    });
}