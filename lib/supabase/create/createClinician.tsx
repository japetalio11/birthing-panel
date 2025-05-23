import { supabase } from '../client';
import { createPersonRecord } from './createPersonRecord';
import { createClinicianRecord } from './createClinicianRecord';
import { ClinicianFormValues } from '@/components/dashboard/person/clinicians/ClinicianForm'

export async function getPersonIdByName(firstName: string, lastName: string) {
    console.log(`getPersonIdByName: Searching for person with name ${firstName} ${lastName}`);
    
    const { data, error } = await supabase
        .from('person')
        .select('id')
        .eq('first_name', firstName)
        .eq('last_name', lastName)
        .single();

    if (error) {
        console.error('getPersonIdByName: Query error:', {
            message: error.message,
            details: error.details,
            hint: error.hint,
            code: error.code
        });
        return null;
    }

    if (!data) {
        console.warn('getPersonIdByName: No person found for given name');
        return null;
    }

    console.log(`getPersonIdByName: Found person ID ${data.id}`);
    return data.id;
}

export async function createClinician(data: ClinicianFormValues) {
    console.log('createClinician: Starting clinician creation', { data });
    
    try {
        console.log('createClinician: Creating person record');
        const { data: personData, error: personError } = await createPersonRecord(data);

        if (personError) {
            console.error('createClinician: Person creation failed', {
                message: personError.message,
                details: personError.details,
                hint: personError.hint,
                code: personError.code
            });
            throw new Error(`Error inserting person data: ${personError.message}`);
        }

        if (!personData || !personData.id) {
            console.error('createClinician: No person data or ID returned', { personData });
            throw new Error('Failed to get person ID after insertion');
        }

        const personId = personData.id;
        console.log(`createClinician: Person record created with ID ${personId}`);

        console.log('createClinician: Creating clinician record');
        const { error: clinicianError } = await createClinicianRecord(data, personId);

        if (clinicianError) {
            console.error('createClinician: Clinician creation failed', {
                message: clinicianError.message,
                details: clinicianError.details,
                hint: clinicianError.hint,
                code: clinicianError.code
            });
            throw new Error(`Error inserting clinician data: ${clinicianError.message}`);
        }

        console.log('createClinician: Clinician record created successfully');
        return { success: true, personId };
    } catch (error) {
        console.error('createClinician: Unexpected error', {
            message: error instanceof Error ? error.message : 'Unknown error',
            stack: error instanceof Error ? error.stack : null
        });
        throw error;
    }
}