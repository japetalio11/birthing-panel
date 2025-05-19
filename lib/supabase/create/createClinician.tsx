import { supabase } from '../client';
import { createPersonRecord } from './createPersonRecord';
import { createClinicianRecord } from './createClinicianRecord';
import { ClinicianFormValues } from '@/components/dashboard/person/clinicians/ClinicianForm'

export async function getPersonIdByName(firstName: string, lastName: string) {
    const { data, error } = await supabase
    .from('person')
    .select('id')
    .eq('first_name', firstName)
    .eq('last_name', lastName)
    .single();

    if (error) {
        console.error('Query error:', error);
        return null;
    }

    return data.id;
}

export async function createClinician(data: ClinicianFormValues) {
    try {
        const {data: personData, error : personError} = await createPersonRecord(data);

        if (personError) {
            throw new Error(`Error inserting person data: ${personError.message}`);
        }

        if (!personData || !personData.id) {
            throw new Error('Failed to get person ID after insertion');
        }

        const personId = personData.id;

        const {error: clinicianError} = await createClinicianRecord(data,personId);

        if (clinicianError) {
            throw new Error(`Error inserting clinician data: ${clinicianError.message}`);
        }
          
        return { success: true, personId };
    } catch (error) {
        console.error("Error in createClinician:", error);
        throw error;
    }
}