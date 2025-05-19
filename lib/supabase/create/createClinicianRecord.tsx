import { supabase } from "../client";
import { ClinicianFormValues } from "@/components/dashboard/person/clinicans/ClinicianForm";

export async function createClinicianRecord(data: ClinicianFormValues, personId: string) {
    return await supabase
    .from('clinicians')
    .insert({
        id: personId,
        gravidity: data.gravidity || null,
        parity: data.parity || null,
        last_menstrual_cycle: data.lmc ? data.lmc.toISOString().split('T')[0] : null,
        expected_date_of_confinement: data.edc ? data.edc.toISOString().split('T')[0] : null,
        member: data.member || null,
        ssn: data.ssn || null,
        occupation: data.occupation || null,
        marital_status: data.maritalStatus || null,
    });
}