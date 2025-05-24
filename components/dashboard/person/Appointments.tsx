"use client";

import React, { useState, useEffect } from "react";
import { Calendar, Search, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardFooter,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";
import { useIsAdmin } from "@/hooks/useIsAdmin";
import { Badge } from "@/components/ui/badge";

type Props = {
    context: "patient" | "clinician";
    id: string | null;
};

interface Appointment {
    id: number;
    patient_name: string;
    clinician_name: string;
    date: string;
    service: string;
    status: string;
    payment_status: string;
}

export default function Appointments({ context, id }: Props) {
    const [appointments, setAppointments] = useState<Appointment[]>([]);
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState<string>("");
    const { isAdmin } = useIsAdmin();
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        async function fetchAppointments() {
            if (!id) return;

            try {
                const query = supabase
                    .from("appointment")
                    .select(`
                        *,
                        clinicians!clinician_id (
                            person (
                                first_name,
                                middle_name,
                                last_name
                            )
                        ),
                        patients!patient_id (
                            person (
                                first_name,
                                middle_name,
                                last_name
                            )
                        )
                    `);

                // Apply filter based on context
                if (context === 'patient') {
                    query.eq("patient_id", id);
                } else {
                    query.eq("clinician_id", id);
                }

                const { data, error } = await query;

                if (error) {
                    console.error("Error fetching appointments:", error);
                    toast.error("Failed to fetch appointments");
                    return;
                }

                const formattedAppointments = data.map((appointment: any) => {
                    const date = new Date(appointment.date);
                    
                    const patientName = appointment.patients?.person
                        ? [
                            appointment.patients.person.first_name,
                            appointment.patients.person.middle_name,
                            appointment.patients.person.last_name
                        ].filter(Boolean).join(" ")
                        : "Unknown Patient";

                    const clinicianName = appointment.clinicians?.person
                        ? [
                            appointment.clinicians.person.first_name,
                            appointment.clinicians.person.middle_name,
                            appointment.clinicians.person.last_name
                        ].filter(Boolean).join(" ")
                        : "Unknown Clinician";

                    return {
                        id: appointment.id,
                        patient_name: patientName,
                        clinician_name: clinicianName,
                        date: new Date(appointment.date).toLocaleDateString(),
                        service: appointment.service || "Prenatal Care",
                        status: appointment.status || "Scheduled",
                        payment_status: appointment.payment_status || "Unpaid"
                    };
                });

                setAppointments(formattedAppointments);
                setLoading(false);
            } catch (error) {
                console.error("Error:", error);
                toast.error("An unexpected error occurred");
                setLoading(false);
            }
        }

        fetchAppointments();
    }, [id, context]);

    // Filter appointments based on search term and filters
    const filteredAppointments = appointments.filter((appointment) => {
        const matchesSearch = 
            appointment.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.clinician_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
            appointment.service.toLowerCase().includes(searchTerm.toLowerCase());
        
        const matchesStatus = statusFilter === "all" || appointment.status.toLowerCase() === statusFilter.toLowerCase();
        
        const matchesDate = !dateFilter || appointment.date === new Date(dateFilter).toLocaleDateString();

        return matchesSearch && matchesStatus && matchesDate;
    });

    const handleDelete = async (appointmentId: number) => {
        try {
            const { error } = await supabase
                .from("appointment")
                .delete()
                .eq("id", appointmentId);

            if (error) throw error;

            setAppointments(appointments.filter(app => app.id !== appointmentId));
            toast.success("Appointment deleted successfully");
        } catch (error) {
            console.error("Error deleting appointment:", error);
            toast.error("Failed to delete appointment");
        }
    };

    return (
        <Card>
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                    <CardTitle>Appointments</CardTitle>
                    <CardDescription>
                        {context === 'patient' 
                            ? "View and manage patient appointments"
                            : "View and manage your appointments with patients"}
                    </CardDescription>
                </div>
                <div className="relative flex items-center">
                    <Dialog>
                        <DialogTrigger asChild>
                            <Button size="sm" className="h-8 flex items-center gap-1">
                                <Calendar className="h-4 w-4" />
                                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                                    New Appointment
                                </span>
                            </Button>
                        </DialogTrigger>
                        <DialogContent>
                            <DialogHeader>
                                <DialogTitle>New Appointment</DialogTitle>
                                <DialogDescription>
                                    Schedule a new appointment. Fill in the details below.
                                </DialogDescription>
                            </DialogHeader>
                            {/* Add appointment form here */}
                            <DialogFooter>
                                <Button type="submit">Schedule Appointment</Button>
                            </DialogFooter>
                        </DialogContent>
                    </Dialog>
                </div>
            </CardHeader>
            <CardContent>
                <div className="flex flex-col gap-4 mb-4">
                    <div className="flex flex-wrap gap-4">
                        <div className="flex-1 min-w-[200px]">
                            <Input
                                type="search"
                                placeholder="Search by name or service..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="w-full"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger className="w-[180px]">
                                <SelectValue placeholder="Filter by status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">All Status</SelectItem>
                                <SelectItem value="scheduled">Scheduled</SelectItem>
                                <SelectItem value="completed">Completed</SelectItem>
                                <SelectItem value="cancelled">Cancelled</SelectItem>
                            </SelectContent>
                        </Select>
                        <Input
                            type="date"
                            value={dateFilter}
                            onChange={(e) => setDateFilter(e.target.value)}
                            className="w-[180px]"
                        />
                    </div>
                </div>

                {loading ? (
                    <div className="text-center py-4">Loading appointments...</div>
                ) : filteredAppointments.length === 0 ? (
                    <div className="text-center py-4">
                        <p className="text-sm text-muted-foreground">
                            {searchTerm || statusFilter !== "all" || dateFilter
                                ? "No appointments found matching the search criteria."
                                : context === 'patient'
                                    ? "No appointments scheduled for this patient."
                                    : "No appointments scheduled with this clinician."}
                        </p>
                    </div>
                ) : (
                    <Table>
                        <TableHeader>
                            <TableRow>
                                <TableHead>
                                    <Checkbox />
                                </TableHead>
                                {context === 'clinician' ? (
                                    <TableHead>Patient Name</TableHead>
                                ) : (
                                    <TableHead>Clinician Name</TableHead>
                                )}
                                <TableHead>Date</TableHead>
                                <TableHead>Service</TableHead>
                                <TableHead>Status</TableHead>
                                <TableHead>Payment Status</TableHead>
                                {isAdmin && <TableHead>Actions</TableHead>}
                            </TableRow>
                        </TableHeader>
                        <TableBody>
                            {filteredAppointments.map((appointment) => (
                                <TableRow key={appointment.id}>
                                    <TableCell>
                                        <Checkbox />
                                    </TableCell>
                                    <TableCell>
                                        {context === 'clinician' 
                                            ? appointment.patient_name 
                                            : appointment.clinician_name}
                                    </TableCell>
                                    <TableCell>{appointment.date}</TableCell>
                                    <TableCell>{appointment.service}</TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    appointment.status.toLowerCase() === "completed"
                                                        ? "bg-green-400"
                                                        : appointment.status.toLowerCase() === "scheduled"
                                                        ? "bg-blue-400"
                                                        : "bg-red-400"
                                                }`}
                                            />
                                            <span className="hidden sm:inline">{appointment.status}</span>
                                        </Badge>
                                    </TableCell>
                                    <TableCell>
                                        <Badge
                                            variant="outline"
                                            className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
                                        >
                                            <div
                                                className={`w-2 h-2 rounded-full ${
                                                    appointment.payment_status.toLowerCase() === "completed"
                                                        ? "bg-green-400"
                                                        : appointment.payment_status.toLowerCase() === "pending"
                                                        ? "bg-yellow-400"
                                                        : "bg-red-400"
                                                }`}
                                            />
                                            <span className="hidden sm:inline">{appointment.payment_status}</span>
                                        </Badge>
                                    </TableCell>
                                    {isAdmin && (
                                        <TableCell>
                                            <Button
                                                variant="outline"
                                                size="sm"
                                                onClick={() => handleDelete(appointment.id)}
                                            >
                                                <Trash2 className="h-4 w-4" />
                                            </Button>
                                        </TableCell>
                                    )}
                                </TableRow>
                            ))}
                        </TableBody>
                    </Table>
                )}
            </CardContent>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                    Showing <strong>{filteredAppointments.length}</strong> of{" "}
                    <strong>{appointments.length}</strong> appointments
                </div>
            </CardFooter>
        </Card>
    );
}
