import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export async function POST(req: NextRequest) {
  console.log("Received POST request to /api/export/appointment");
  try {
    const data = await req.json();
    console.log("Request body:", data);

    if (!data.appointment || !data.exportOptions) {
      console.error("Missing appointment data or export options");
      return NextResponse.json({ error: "Missing appointment data or export options" }, { status: 400 });
    }

    const { appointment, exportOptions } = data;
    const patientName = appointment.patient ? 
      `${appointment.patient.person.first_name} ${appointment.patient.person.middle_name ? appointment.patient.person.middle_name + " " : ""}${appointment.patient.person.last_name}` : 
      "Unknown Patient";
    const clinicianName = appointment.clinician ? 
      `${appointment.clinician.person.first_name} ${appointment.clinician.person.middle_name ? appointment.clinician.person.middle_name + " " : ""}${appointment.clinician.person.last_name}` : 
      "Unknown Clinician";

    console.log("Generating PDF for appointment with patient:", patientName);

    // Create jsPDF document for appointment report
    const doc = new jsPDF();
    doc.setFont("helvetica");
    let y = 20;
    const pageHeight = 260;
    const topMargin = 20;
    const leftMargin = 20;
    const tableWidth = 170;

    const checkPageBreak = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight) {
        doc.addPage();
        y = topMargin;
      }
      return y;
    };

    // Header
    doc.setFontSize(20);
    checkPageBreak(30);
    doc.setFillColor(200, 220, 255);
    doc.rect(leftMargin, y - 10, tableWidth, 20, "F");
    doc.text(`Appointment Report`, 105, y, { align: "center" });
    y += 20;
    doc.setFontSize(12);
    doc.text(new Date().toLocaleDateString(), 105, y, { align: "center" });
    y += 20;

    if (exportOptions.appointmentInfo) {
      console.log("Adding appointment information to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20);
      doc.setFillColor(220, 235, 255);
      doc.rect(leftMargin, y - 10, tableWidth, 20, "F");
      doc.text("Appointment Information", leftMargin, y);
      y += 20;

      doc.setFontSize(12);
      const appointmentInfo = [
        ["Date", new Date(appointment.date).toLocaleDateString()],
        ["Service", appointment.service || "Not specified"],
        ["Status", appointment.status || "Not specified"],
        ["Payment Status", appointment.payment_status || "Not specified"],
        ["Weight", appointment.weight ? `${appointment.weight} kg` : "Not recorded"],
        ["Gestational Age", appointment.gestational_age ? `${appointment.gestational_age} weeks` : "Not recorded"],
      ];

      appointmentInfo.forEach((row) => {
        checkPageBreak(10);
        doc.text(`${row[0]}:`, leftMargin, y);
        doc.text(row[1], leftMargin + 50, y);
        y += 10;
      });
      y += 20;
    }

    if (exportOptions.patientInfo && appointment.patient) {
      console.log("Adding patient information to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20);
      doc.setFillColor(220, 235, 255);
      doc.rect(leftMargin, y - 10, tableWidth, 20, "F");
      doc.text("Patient Information", leftMargin, y);
      y += 20;

      doc.setFontSize(12);
      const patientInfo = [
        ["Name", patientName],
        ["Birth Date", appointment.patient.person.birth_date || "Not specified"],
        ["Age", appointment.patient.person.age || "Not specified"],
        ["Contact Number", appointment.patient.person.contact_number || "Not provided"],
        ["Address", appointment.patient.person.address || "Not provided"],
      ];

      patientInfo.forEach((row) => {
        checkPageBreak(10);
        doc.text(`${row[0]}:`, leftMargin, y);
        doc.text(row[1], leftMargin + 50, y);
        y += 10;
      });
      y += 20;
    }

    if (exportOptions.clinicianInfo && appointment.clinician) {
      console.log("Adding clinician information to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20);
      doc.setFillColor(220, 235, 255);
      doc.rect(leftMargin, y - 10, tableWidth, 20, "F");
      doc.text("Clinician Information", leftMargin, y);
      y += 20;

      doc.setFontSize(12);
      const clinicianInfo = [
        ["Name", clinicianName],
        ["Role", appointment.clinician.role || "Not specified"],
        ["Specialization", appointment.clinician.specialization || "Not specified"],
      ];

      clinicianInfo.forEach((row) => {
        checkPageBreak(10);
        doc.text(`${row[0]}:`, leftMargin, y);
        doc.text(row[1], leftMargin + 50, y);
        y += 10;
      });
      y += 20;
    }

    if (exportOptions.vitals && appointment.vitals) {
      console.log("Adding vitals to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20);
      doc.setFillColor(220, 235, 255);
      doc.rect(leftMargin, y - 10, tableWidth, 20, "F");
      doc.text("Vitals", leftMargin, y);
      y += 20;

      doc.setFontSize(12);
      const vitalsInfo = [
        ["Weight", appointment.weight ? `${appointment.weight} kg` : "Not recorded"],
        ["Gestational Age", appointment.gestational_age ? `${appointment.gestational_age} weeks` : "Not recorded"],
        ["Temperature", appointment.vitals.temperature ? `${appointment.vitals.temperature} °C` : "Not recorded"],
        ["Pulse Rate", appointment.vitals.pulse_rate ? `${appointment.vitals.pulse_rate} bpm` : "Not recorded"],
        ["Blood Pressure", appointment.vitals.blood_pressure || "Not recorded"],
        ["Respiration Rate", appointment.vitals.respiration_rate ? `${appointment.vitals.respiration_rate} breaths/min` : "Not recorded"],
        ["Oxygen Saturation", appointment.vitals.oxygen_saturation ? `${appointment.vitals.oxygen_saturation}%` : "Not recorded"],
      ];

      vitalsInfo.forEach((row) => {
        checkPageBreak(10);
        doc.text(`${row[0]}:`, leftMargin, y);
        doc.text(row[1], leftMargin + 50, y);
        y += 10;
      });
      y += 20;
    }

    // Generate PDF buffer
    console.log("Generating PDF buffer...");
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    console.log("PDF buffer generated successfully.");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Appointment_Report_${patientName}_${new Date(appointment.date).toISOString().split('T')[0]}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    const errorMessage = error.message || "An unexpected error occurred while generating the PDF.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
} 