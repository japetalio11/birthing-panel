
import { NextRequest, NextResponse } from "next/server";
import { jsPDF } from "jspdf";

export async function POST(req: NextRequest) {
  console.log("Received POST request to /api/export");
  try {
    const data = await req.json();
    console.log("Request body:", data);

    if (!data.patient || !data.exportOptions) {
      console.error("Missing patient data or export options");
      return NextResponse.json({ error: "Missing patient data or export options" }, { status: 400 });
    }

    const { patient, exportOptions, allergies, supplements, labRecords, prescriptions } = data;
    const fullName = `${patient.first_name} ${patient.middle_name ? patient.middle_name + " " : ""}${patient.last_name}`;
    const ecFullName = patient.ec_first_name
      ? `${patient.ec_first_name} ${patient.ec_middle_name ? patient.ec_middle_name + " " : ""}${patient.ec_last_name}`
      : "Not provided";

    console.log("Generating PDF for patient:", fullName);

    const doc = new jsPDF();
    doc.setFont("helvetica");
    let y = 20;
    const pageHeight = 260;
    const topMargin = 20;

    const checkPageBreak = (requiredSpace: number) => {
      if (y + requiredSpace > pageHeight) {
        doc.addPage();
        y = topMargin;
      }
    };

    doc.setFontSize(20);
    checkPageBreak(30); 
    doc.text(`Patient Report: ${fullName}`, 105, y, { align: "center" });
    y += 10;
    doc.setFontSize(12);
    doc.text(new Date().toLocaleDateString(), 105, y, { align: "center" });
    y += 20;

    if (exportOptions.basicInfo) {
      console.log("Adding basic information to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20); 
      doc.text("Patient Information", 20, y);
      y += 10;
      doc.setFontSize(12);
      const patientInfo = [
        `Full Name: ${fullName}`,
        `Date of Birth: ${patient.birth_date || "Not specified"}`,
        `Age: ${patient.age || "Not specified"}`,
        `Contact Number: ${patient.contact_number || "Not provided"}`,
        `Address: ${patient.address || "Not provided"}`,
        `Marital Status: ${patient.marital_status || "Not provided"}`,
        `Citizenship: ${patient.citizenship || "Not specified"}`,
        `Religion: ${patient.religion || "Not specified"}`,
        `Occupation: ${patient.occupation || "Not specified"}`,
        `SSN: ${patient.ssn || "Not provided"}`,
        `Member Status: ${patient.member || "Not specified"}`,
        `Status: ${patient.status || "Not specified"}`,
        `Expected Date of Confinement: ${patient.expected_date_of_confinement || "Not specified"}`,
      ];
      patientInfo.forEach((line) => {
        checkPageBreak(10);
        doc.text(line, 20, y);
        y += 10;
      });

      y += 10;
      doc.setFontSize(14);
      checkPageBreak(20);
      doc.text("Emergency Contact", 20, y);
      y += 10;
      doc.setFontSize(12);
      const ecInfo = [
        `Name: ${ecFullName}`,
        `Relationship: ${patient.ec_relationship || "Not specified"}`,
        `Contact Number: ${patient.ec_contact_number || "Not provided"}`,
      ];
      ecInfo.forEach((line) => {
        checkPageBreak(10);
        doc.text(line, 20, y);
        y += 10;
      });
      y += 10;
    }

    if (exportOptions.allergies && allergies.length > 0) {
      console.log("Adding allergies to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20); 
      doc.text("Allergies", 20, y);
      y += 10;
      doc.setFontSize(12);
      allergies.forEach((allergy: any, index: number) => {
        checkPageBreak(10);
        doc.text(`Allergy ${index + 1}: ${allergy.name || "N/A"} (Severity: ${allergy.severity || "N/A"})`, 20, y);
        y += 10;
      });
      y += 10;
    }

    if (exportOptions.supplements && supplements.length > 0) {
      console.log("Adding supplements to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20); 
      doc.text("Supplements", 20, y);
      y += 10;
      doc.setFontSize(12);
      supplements.forEach((supp: any, index: number) => {
        checkPageBreak(15); 
        doc.text(
          `Supplement ${index + 1}: ${supp.name || "N/A"} (Strength: ${supp.strength || "N/A"}, Amount: ${supp.amount || "N/A"}, Frequency: ${supp.frequency || "N/A"}, Clinician: ${supp.clinician || "N/A"}, Status: ${supp.status || "N/A"})`,
          20,
          y,
          { maxWidth: 170 }
        );
        y += 15;
      });
      y += 10;
    }

    if (exportOptions.prescriptions && prescriptions.length > 0) {
      console.log("Adding prescriptions to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20); 
      doc.text("Prescriptions", 20, y);
      y += 10;
      doc.setFontSize(12);
      prescriptions.forEach((pres: any, index: number) => {
        checkPageBreak(15); 
        doc.text(
          `Prescription ${index + 1}: ${pres.name || "N/A"} (Strength: ${pres.strength || "N/A"}, Amount: ${pres.amount || "N/A"}, Frequency: ${pres.frequency || "N/A"}, Route: ${pres.route || "N/A"}, Clinician: ${pres.clinician || "N/A"}, Status: ${pres.status || "N/A"}, Issued: ${pres.date ? new Date(pres.date).toLocaleDateString() : "N/A"})`,
          20,
          y,
          { maxWidth: 170 }
        );
        y += 15;
      });
      y += 20;
    }

    if (exportOptions.labRecords && labRecords.length > 0) {
      console.log("Adding lab records to PDF...");
      doc.setFontSize(16);
      checkPageBreak(20);
      doc.text("Laboratory Records", 20, y);
      y += 10;
      doc.setFontSize(12);
      labRecords.forEach((record: any, index: number) => {
        checkPageBreak(10);
        doc.text(`${record.filename || "N/A"} (${record.type || "N/A"})`, 20, y);
        y += 10;
        const labInfo = [
          `Doctor: ${record.doctor || "N/A"}`,
          `Company: ${record.company || "N/A"}`,
          `Ordered Date: ${record.ordered_date || "N/A"}`,
          `Received Date: ${record.received_date || "N/A"}`,
          `Reported Date: ${record.reported_date || "N/A"}`,
          `Impressions: ${record.impressions || "N/A"}`,
          `Remarks: ${record.remarks || "N/A"}`,
          `Recommendations: ${record.recommendations || "N/A"}`,
          `Notes: ${record.notes || "N/A"}`,
          `File URL: ${record.fileurl || "N/A"}`,
        ];
        labInfo.forEach((line) => {
          checkPageBreak(10);
          doc.text(`- ${line}`, 30, y, { maxWidth: 160 });
          y += 10;
        });
        y += 10;
      });
      y += 10;
    }

    console.log("Generating PDF buffer...");
    const pdfBuffer = Buffer.from(doc.output("arraybuffer"));
    console.log("PDF buffer generated successfully.");

    return new NextResponse(pdfBuffer, {
      status: 200,
      headers: {
        "Content-Type": "application/pdf",
        "Content-Disposition": `attachment; filename="Patient_Report_${fullName}.pdf"`,
      },
    });
  } catch (error: any) {
    console.error("Error generating PDF:", error);
    const errorMessage = error.message || "An unexpected error occurred while generating the PDF.";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}