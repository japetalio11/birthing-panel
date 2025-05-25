import { useState } from "react";
import AppointmentForm from "@/components/dashboard/appointments/AppointmentForm";

export default function Dashboard() {
  const [open, setOpen] = useState(false); // State to manage the form's open/closed state

  return <AppointmentForm open={open} onOpenChange={setOpen} />;
}