import { supabase } from '@/lib/supabase/client';
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      console.error('Error parsing request body:', error);
      return NextResponse.json({ error: 'Invalid request body' }, { status: 400 });
    }

    const { name, password } = body;

    // Validate input
    if (!name || !password) {
      console.error('Missing name or password:', { name, password });
      return NextResponse.json({ error: 'Name and password are required' }, { status: 400 });
    }

    // Log input for debugging
    const trimmedName = name.trim();
    console.log('Input received:', { name: trimmedName, password });

    // Query admin table
    const { data, error } = await supabase
      .from('admin')
      .select('first_name, middle_name, last_name, password, role');

    if (error) {
      console.error('Supabase query error:', {
        message: error.message,
        details: error.details,
        hint: error.hint,
        code: error.code,
      });
      return NextResponse.json({ error: 'Database error' }, { status: 500 });
    }

    if (!data || data.length === 0) {
      console.log('No admin records found in table');
      return NextResponse.json({ error: 'Invalid name or password' }, { status: 401 });
    }

    // Find matching admin
    const admin = data.find((record) => {
      const dbFullName = [
        record.first_name,
        record.middle_name,
        record.last_name
      ]
        .filter(Boolean)
        .join(' ')
        .trim();
      const isNameMatch = dbFullName.toLowerCase() === trimmedName.toLowerCase();
      const isPasswordMatch = record.password === password;
      console.log('Checking record:', {
        dbFullName,
        inputName: trimmedName,
        isNameMatch,
        isPasswordMatch,
        raw: {
          first_name: record.first_name,
          middle_name: record.middle_name,
          last_name: record.last_name,
          password: record.password,
          role: record.role,
        },
      });
      return isNameMatch && isPasswordMatch;
    });

    if (!admin) {
      console.log('No matching admin found for:', { name: trimmedName, password });
      return NextResponse.json({ error: 'Invalid name or password' }, { status: 401 });
    }

    // Construct full name for response
    const fullName = [
      admin.first_name,
      admin.middle_name,
      admin.last_name
    ]
      .filter(Boolean)
      .join(' ')
      .trim();

    console.log('Login successful for:', { name: trimmedName });
    return NextResponse.json({ 
      success: true,
      user: {
        name: fullName,
        role: admin.role
      }
    });
  } catch (error: any) {
    console.error('API error:', {
      message: error.message,
      stack: error.stack,
      requestBody: await request.text().catch(() => 'Unable to parse request body'),
    });
    return NextResponse.json({ error: 'Server error' }, { status: 500 });
  }
}