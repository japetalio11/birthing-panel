"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Eye,
  Download,
  ListFilter,
  MoreHorizontal,
  Search,
  Trash2,
  UserRoundPlus,
  ChevronDownIcon,
  TextSearch,
  ArrowUpDown,
} from "lucide-react";
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "@/components/ui/dropdown-menu";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/lib/supabase/client";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import AppointmentForm from "./AppointmentForm";
import { useState } from "react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { DatePicker } from "@/components/ui/date-picker";

interface Appointment {
  id: string;
  patient_id: string;
  clinician_id: string;
  date: string;
  service: string;
  weight: string | null;
  vitals: string | null;
  gestational_age: string | null;
  status: string;
  payment_status: string;
  patient_name?: string;
  clinician_name?: string;
  patient?: {
    person: {
      first_name: string;
      middle_name: string | null;
      last_name: string;
      birth_date: string;
      age: string | null;
      contact_number: string | null;
      address: string | null;
    };
  };
  clinician?: {
    role: string;
    specialization: string;
    person: {
      first_name: string;
      middle_name: string | null;
      last_name: string;
    };
  };
}

const columns: ColumnDef<Appointment>[] = [
  {
    id: "select",
    header: ({ table }) => (
      <Checkbox
        checked={
          table.getIsAllPageRowsSelected() ||
          (table.getIsSomePageRowsSelected() && "indeterminate")
        }
        onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
        aria-label="Select all"
      />
    ),
    cell: ({ row }) => (
      <Checkbox
        checked={row.getIsSelected()}
        onCheckedChange={(value) => row.toggleSelected(!!value)}
        aria-label="Select row"
      />
    ),
    enableSorting: false,
  },
  {
    accessorKey: "patient_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Patient Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("patient_name")}</div>,
  },
  {
    accessorKey: "clinician_name",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Clinician Name
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => <div className="font-medium">{row.getValue("clinician_name")}</div>,
  },
  {
    accessorKey: "date",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Date
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>{new Date(row.getValue("date")).toLocaleDateString()}</div>
    ),
    sortingFn: (rowA, rowB, columnId) => {
      return new Date(rowA.getValue(columnId)).getTime() - new Date(rowB.getValue(columnId)).getTime();
    },
  },
  {
    accessorKey: "service",
    header: "Service",
    cell: ({ row }) => <div>{row.getValue("service")}</div>,
  },
  {
    accessorKey: "status",
    header: "Status",
    cell: ({ row }) => {
      const status = row.getValue("status") as string;
      return (
        <Badge
          variant="outline"
          className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              status.toLowerCase() === "completed"
                ? "bg-green-400"
                : status.toLowerCase() === "scheduled"
                ? "bg-blue-400"
                : "bg-red-400"
            }`}
          />
          <span className="hidden sm:inline">{status}</span>
        </Badge>
      );
    },
  },
  {
    accessorKey: "payment_status",
    header: "Payment Status",
    cell: ({ row }) => {
      const status = row.getValue("payment_status") as string;
      return (
        <Badge
          variant="outline"
          className="flex gap-1 px-1.5 text-muted-foreground [&_svg]:size-3"
        >
          <div
            className={`w-2 h-2 rounded-full ${
              status.toLowerCase() === "completed"
                ? "bg-green-400"
                : status.toLowerCase() === "pending"
                ? "bg-yellow-400"
                : "bg-red-400"
            }`}
          />
          <span className="hidden sm:inline">{status}</span>
        </Badge>
      );
    },
  },
];

export default function AppointmentsTable() {
  const router = useRouter();
  const [appointments, setAppointments] = React.useState<Appointment[]>([]);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [advancedSearch, setAdvancedSearch] = React.useState({
    service: "",
    status: "",
    payment_status: "",
  });
  const [tab, setTab] = React.useState("all");
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [rowSelection, setRowSelection] = React.useState({});
  const [showAppointmentForm, setShowAppointmentForm] = React.useState(false);
  const [openExportDialog, setOpenExportDialog] = useState(false);
  const [exportFilters, setExportFilters] = useState({
    startDate: undefined as Date | undefined,
    endDate: undefined as Date | undefined,
    status: "all" as "all" | "scheduled" | "completed" | "canceled",
    sort: "none" as "none" | "asc" | "desc",
    limit: "",
    exportFormat: "csv" as "csv" | "pdf",
    exportContent: {
      appointmentInfo: true,
      patientInfo: false,
      clinicianInfo: false,
      vitals: false
    }
  });

  // Fetch appointments from Supabase
  React.useEffect(() => {
    async function fetchAppointments() {
      try {
        const { data: appointmentsData, error: appointmentsError } = await supabase
          .from("appointment")
          .select(`
            *,
            patient:patient_id (
              person (
                first_name,
                middle_name,
                last_name
              )
            ),
            clinician:clinician_id (
              person (
                first_name,
                middle_name,
                last_name
              )
            )
          `)
          .order("date", { ascending: false });

        if (appointmentsError) {
          console.error("Appointments fetch error:", appointmentsError);
          toast.error(`Failed to fetch appointments: ${appointmentsError.message}`);
          return;
        }

        if (!appointmentsData || appointmentsData.length === 0) {
          console.log("No appointments data found");
          toast.info("No appointments found.");
          setAppointments([]);
          return;
        }

        const formattedAppointments: Appointment[] = appointmentsData.map((appointment: any) => {
          const patient = appointment.patient?.person || {};
          const clinician = appointment.clinician?.person || {};

          return {
            id: appointment.id,
            patient_id: appointment.patient_id,
            clinician_id: appointment.clinician_id,
            date: appointment.date,
            service: appointment.service,
            weight: appointment.weight,
            vitals: appointment.vitals,
            gestational_age: appointment.gestational_age,
            status: appointment.status,
            payment_status: appointment.payment_status,
            patient_name: `${patient.first_name || ""} ${patient.middle_name || ""} ${
              patient.last_name || ""
            }`.trim(),
            clinician_name: `${clinician.first_name || ""} ${clinician.middle_name || ""} ${
              clinician.last_name || ""
            }`.trim(),
          };
        });

        setAppointments(formattedAppointments);
        toast.success("Appointments fetched successfully.");
      } catch (err: any) {
        toast.error(`Error fetching appointments: ${err.message}`);
      }
    }

    fetchAppointments();
  }, []);

  // Handle search and filtering
  const filteredAppointments = React.useMemo(() => {
    let result = [...appointments];

    // Apply search term
    if (searchTerm) {
      result = result.filter(
        (appointment) =>
          appointment.patient_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
          appointment.clinician_name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Apply advanced search
    if (advancedSearch.service) {
      result = result.filter((appointment) =>
        appointment.service.toLowerCase().includes(advancedSearch.service.toLowerCase())
      );
    }
    if (advancedSearch.status) {
      result = result.filter((appointment) =>
        appointment.status.toLowerCase().includes(advancedSearch.status.toLowerCase())
      );
    }
    if (advancedSearch.payment_status) {
      result = result.filter((appointment) =>
        appointment.payment_status
          .toLowerCase()
          .includes(advancedSearch.payment_status.toLowerCase())
      );
    }

    // Apply tab filter
    if (tab === "scheduled") {
      result = result.filter((appointment) => appointment.status.toLowerCase() === "scheduled");
    } else if (tab === "completed") {
      result = result.filter((appointment) => appointment.status.toLowerCase() === "completed");
    } else if (tab === "canceled") {
      result = result.filter((appointment) => appointment.status.toLowerCase() === "canceled");
    }

    return result;
  }, [searchTerm, advancedSearch, tab, appointments]);

  // Initialize table
  const table = useReactTable({
    data: filteredAppointments,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: {
      sorting,
      rowSelection,
    },
  });

  // Update the getExportAppointments function
  const getExportAppointments = async () => {
    try {
        // First get the filtered appointments
        let result = [...filteredAppointments];

        // Apply date filters
        if (exportFilters.startDate || exportFilters.endDate) {
            result = result.filter((appointment) => {
                const apptDate = new Date(appointment.date);
                const start = exportFilters.startDate
                    ? new Date(exportFilters.startDate).setHours(0, 0, 0, 0)
                    : -Infinity;
                const end = exportFilters.endDate
                    ? new Date(exportFilters.endDate).setHours(23, 59, 59, 999)
                    : Infinity;
                return apptDate.getTime() >= start && apptDate.getTime() <= end;
            });
        }

        // Apply status filter
        if (exportFilters.status !== "all") {
            result = result.filter((appointment) =>
                appointment.status.toLowerCase() === exportFilters.status
            );
        }

        // Apply sorting
        if (exportFilters.sort !== "none") {
            result.sort((a, b) => {
                const dateA = new Date(a.date).getTime();
                const dateB = new Date(b.date).getTime();
                return exportFilters.sort === "asc" ? dateA - dateB : dateB - dateA;
            });
        }

        // Apply limit
        if (exportFilters.limit) {
            const limit = parseInt(exportFilters.limit);
            if (!isNaN(limit) && limit > 0) {
                result = result.slice(0, limit);
            }
        }

        // Now fetch complete data for each filtered appointment
        const appointmentsWithDetails = await Promise.all(
            result.map(async (appointment) => {
                // Fetch appointment with related data
                const { data: appointmentData, error: appointmentError } = await supabase
                    .from("appointment")
                    .select(`
                        *,
                        patient:patient_id (
                            person (
                                id,
                                first_name,
                                middle_name,
                                last_name,
                                birth_date,
                                age,
                                contact_number,
                                address
                            )
                        ),
                        clinician:clinician_id (
                            role,
                            specialization,
                            person (
                                id,
                                first_name,
                                middle_name,
                                last_name
                            )
                        )
                    `)
                    .eq('id', appointment.id)
                    .single();

                if (appointmentError) {
                    console.error("Error fetching appointment details:", appointmentError);
                    return appointment;
                }

                // Fetch vitals data
                const { data: vitalsData, error: vitalsError } = await supabase
                    .from("vitals")
                    .select(`
                        id,
                        temperature,
                        pulse_rate,
                        blood_pressure,
                        respiration_rate,
                        oxygen_saturation
                    `)
                    .eq("id", appointment.id)
                    .single();

                if (vitalsError && vitalsError.code !== 'PGRST116') { // Ignore not found error
                    console.error("Error fetching vitals:", vitalsError);
                }

                // Combine all data
                return {
                    ...appointmentData,
                    vitals: vitalsData || null,
                    patient: appointmentData?.patient || null,
                    clinician: appointmentData?.clinician || null
                };
            })
        );

        return appointmentsWithDetails;
    } catch (error) {
        console.error("Error in getExportAppointments:", error);
        toast.error("Error preparing export data");
        return [];
    }
  };

  // Update the handleExport function to use the async getExportAppointments
  const handleExport = async () => {
    try {
        const appointmentsToExport = await getExportAppointments();
        
        if (exportFilters.exportFormat === "csv") {
            // Generate CSV headers based on selected content
            const headers = [];
            if (exportFilters.exportContent.appointmentInfo) {
                headers.push(
                    "Date",
                    "Service",
                    "Status",
                    "Payment Status"
                );
            }
            if (exportFilters.exportContent.patientInfo) {
                headers.push(
                    "Patient Name",
                    "Patient Birth Date",
                    "Patient Age",
                    "Patient Contact",
                    "Patient Address"
                );
            }
            if (exportFilters.exportContent.clinicianInfo) {
                headers.push(
                    "Clinician Name",
                    "Role",
                    "Specialization"
                );
            }
            if (exportFilters.exportContent.vitals) {
                headers.push(
                    "Weight",
                    "Gestational Age",
                    "Temperature",
                    "Pulse Rate",
                    "Blood Pressure",
                    "Respiration Rate",
                    "Oxygen Saturation"
                );
            }

            // Generate rows
            const rows = appointmentsToExport.map(appointment => {
                const row: string[] = [];
                
                if (exportFilters.exportContent.appointmentInfo) {
                    row.push(
                        new Date(appointment.date).toLocaleString(),
                        appointment.service || "",
                        appointment.status || "",
                        appointment.payment_status || ""
                    );
                }
                
                if (exportFilters.exportContent.patientInfo) {
                    const patientPerson = appointment.patient?.person || {
                        first_name: "",
                        middle_name: null,
                        last_name: "",
                        birth_date: "",
                        age: null,
                        contact_number: null,
                        address: null
                    };
                    row.push(
                        `${patientPerson.first_name || ""} ${patientPerson.middle_name || ""} ${patientPerson.last_name || ""}`.trim(),
                        patientPerson.birth_date ? new Date(patientPerson.birth_date).toLocaleDateString() : "",
                        patientPerson.age || "",
                        patientPerson.contact_number || "",
                        patientPerson.address || ""
                    );
                }
                
                if (exportFilters.exportContent.clinicianInfo) {
                    const clinicianData = appointment.clinician || {
                        role: "",
                        specialization: "",
                        person: {
                            first_name: "",
                            middle_name: null,
                            last_name: ""
                        }
                    };
                    row.push(
                        `${clinicianData.person.first_name || ""} ${clinicianData.person.middle_name || ""} ${clinicianData.person.last_name || ""}`.trim(),
                        clinicianData.role || "",
                        clinicianData.specialization || ""
                    );
                }
                
                if (exportFilters.exportContent.vitals) {
                    const vitalsData = appointment.vitals || {
                        temperature: null,
                        pulse_rate: null,
                        blood_pressure: null,
                        respiration_rate: null,
                        oxygen_saturation: null
                    };
                    row.push(
                        appointment.weight || "",
                        appointment.gestational_age || "",
                        vitalsData.temperature || "",
                        vitalsData.pulse_rate || "",
                        vitalsData.blood_pressure || "",
                        vitalsData.respiration_rate || "",
                        vitalsData.oxygen_saturation || ""
                    );
                }
                
                return row;
            });

            // Create CSV content
            const csvContent = [
                headers.join(","),
                ...rows.map(row => row.map(cell => `"${(cell || "").toString().replace(/"/g, '""')}"`).join(","))
            ].join("\n");

            // Download CSV file
            const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
            const link = document.createElement("a");
            const today = new Date().toISOString().split('T')[0];
            link.href = URL.createObjectURL(blob);
            link.download = `appointments_export_${today}.csv`;
            link.click();
            toast.success("CSV exported successfully.");
            setOpenExportDialog(false);
        } else {
            // For PDF export
            for (const appointment of appointmentsToExport) {
                const exportData = {
                    appointment,
                    exportOptions: exportFilters.exportContent
                };

                const response = await fetch("/api/export/appointment", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(exportData),
                });

                if (!response.ok) {
                    const errorData = await response.json();
                    throw new Error(errorData.error || `Failed to export PDF for appointment on ${new Date(appointment.date).toLocaleDateString()}`);
                }

                const pdfBlob = await response.blob();
                const url = window.URL.createObjectURL(pdfBlob);
                const a = document.createElement("a");
                a.href = url;
                a.download = `Appointment_Report_${new Date(appointment.date).toLocaleDateString()}.pdf`;
                a.click();
                window.URL.revokeObjectURL(url);
            }

            toast.success("PDF(s) exported successfully.");
            setOpenExportDialog(false);
        }
    } catch (error: any) {
        console.error("Export failed:", error);
        toast.error(`Failed to generate export: ${error.message}`);
    }
  };

  return (
    <main className="grid flex-1 items-start gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      <Tabs value={tab} onValueChange={setTab}>
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="scheduled">Scheduled</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="canceled">Canceled</TabsTrigger>
          </TabsList>

          <div className="ml-auto flex items-center gap-2">
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                type="search"
                placeholder="Search by name..."
                className="w-full pl-8 rounded-lg bg-background"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <TextSearch />
                  <span className="hidden lg:inline">Advanced Search</span>
                  <span className="lg:hidden">Columns</span>
                  <ChevronDownIcon />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Filter by</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <div className="p-2">
                  <Input
                    placeholder="Service..."
                    value={advancedSearch.service}
                    onChange={(e) =>
                      setAdvancedSearch({
                        ...advancedSearch,
                        service: e.target.value,
                      })
                    }
                    className="mb-2"
                  />
                  <Input
                    placeholder="Status..."
                    value={advancedSearch.status}
                    onChange={(e) =>
                      setAdvancedSearch({
                        ...advancedSearch,
                        status: e.target.value,
                      })
                    }
                    className="mb-2"
                  />
                  <Input
                    placeholder="Payment Status..."
                    value={advancedSearch.payment_status}
                    onChange={(e) =>
                      setAdvancedSearch({
                        ...advancedSearch,
                        payment_status: e.target.value,
                      })
                    }
                  />
                </div>
              </DropdownMenuContent>
            </DropdownMenu>

            <Dialog open={openExportDialog} onOpenChange={setOpenExportDialog}>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                  <Download />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-[600px]">
                <DialogHeader>
                  <DialogTitle>Export Appointments</DialogTitle>
                  <DialogDescription>
                    Customize your export by applying filters and selecting export options.
                  </DialogDescription>
                </DialogHeader>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-1 gap-4">
                    <div className="space-y-2">
                      <Label>Export Format</Label>
                      <Select
                        value={exportFilters.exportFormat}
                        onValueChange={(value) =>
                          setExportFilters({
                            ...exportFilters,
                            exportFormat: value as "csv" | "pdf",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select format" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="pdf">PDF</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2 mb-6">
                      <Label>Export Content</Label>
                      <div className="grid grid-cols-2 gap-4">
                        {/* First Row */}
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="selectAllContent"
                            checked={Object.values(exportFilters.exportContent).every(Boolean)}
                            onCheckedChange={(checked) =>
                              setExportFilters({
                                ...exportFilters,
                                exportContent: {
                                  appointmentInfo: !!checked,
                                  patientInfo: !!checked,
                                  clinicianInfo: !!checked,
                                  vitals: !!checked,
                                },
                              })
                            }
                          />
                          <Label htmlFor="selectAllContent">Select All</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="appointmentInfo"
                            checked={exportFilters.exportContent.appointmentInfo}
                            onCheckedChange={(checked) =>
                              setExportFilters({
                                ...exportFilters,
                                exportContent: {
                                  ...exportFilters.exportContent,
                                  appointmentInfo: !!checked,
                                },
                              })
                            }
                          />
                          <Label htmlFor="appointmentInfo">Appointment Information</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="patientInfo"
                            checked={exportFilters.exportContent.patientInfo}
                            onCheckedChange={(checked) =>
                              setExportFilters({
                                ...exportFilters,
                                exportContent: {
                                  ...exportFilters.exportContent,
                                  patientInfo: !!checked,
                                },
                              })
                            }
                          />
                          <Label htmlFor="patientInfo">Patient Information</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="clinicianInfo"
                            checked={exportFilters.exportContent.clinicianInfo}
                            onCheckedChange={(checked) =>
                              setExportFilters({
                                ...exportFilters,
                                exportContent: {
                                  ...exportFilters.exportContent,
                                  clinicianInfo: !!checked,
                                },
                              })
                            }
                          />
                          <Label htmlFor="clinicianInfo">Clinician Information</Label>
                        </div>
                        <div className="flex items-center space-x-2">
                          <Checkbox
                            id="vitals"
                            checked={exportFilters.exportContent.vitals}
                            onCheckedChange={(checked) =>
                              setExportFilters({
                                ...exportFilters,
                                exportContent: {
                                  ...exportFilters.exportContent,
                                  vitals: !!checked,
                                },
                              })
                            }
                          />
                          <Label htmlFor="vitals">Vitals</Label>
                        </div>
                      </div>
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label>Start Date</Label>
                      <DatePicker
                        value={exportFilters.startDate}
                        onChange={(date) =>
                          setExportFilters({
                            ...exportFilters,
                            startDate: date,
                          })
                        }
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>End Date</Label>
                      <DatePicker
                        value={exportFilters.endDate}
                        onChange={(date) =>
                          setExportFilters({
                            ...exportFilters,
                            endDate: date,
                          })
                        }
                      />
                    </div>
                  </div>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <Label>Status</Label>
                      <Select
                        value={exportFilters.status}
                        onValueChange={(value) =>
                          setExportFilters({
                            ...exportFilters,
                            status: value as "all" | "scheduled" | "completed" | "canceled",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All</SelectItem>
                          <SelectItem value="scheduled">Scheduled</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="canceled">Canceled</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Sort by Date</Label>
                      <Select
                        value={exportFilters.sort}
                        onValueChange={(value) =>
                          setExportFilters({
                            ...exportFilters,
                            sort: value as "none" | "asc" | "desc",
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select sorting" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="asc">Oldest First</SelectItem>
                          <SelectItem value="desc">Newest First</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Export Limit</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 10"
                        value={exportFilters.limit}
                        onChange={(e) =>
                          setExportFilters({
                            ...exportFilters,
                            limit: e.target.value,
                          })
                        }
                      />
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setOpenExportDialog(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleExport}>Export</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </div>

        <TabsContent value={tab}>
          <Card x-chunk="dashboard-06-chunk-0">
            <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
              <div className="space-y-1">
                <CardTitle>Appointments</CardTitle>
                <CardDescription>Manage your appointments and view their details.</CardDescription>
              </div>

              <div className="relative flex items-center w-full max-w-sm md:w-auto">
                <Button
                  size="sm"
                  className="h-8 ml-2 flex items-center gap-1"
                  onClick={() => setShowAppointmentForm(true)}
                >
                  <UserRoundPlus />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    New Appointment
                  </span>
                </Button>
              </div>
            </CardHeader>

            <CardContent>
              {filteredAppointments.length === 0 ? (
                <p className="text-sm text-muted-foreground">No appointments found.</p>
              ) : (
                <Table>
                  <TableHeader>
                    {table.getHeaderGroups().map((headerGroup) => (
                      <TableRow key={headerGroup.id}>
                        {headerGroup.headers.map((header) => (
                          <TableHead key={header.id}>
                            {header.isPlaceholder
                              ? null
                              : flexRender(header.column.columnDef.header, header.getContext())}
                          </TableHead>
                        ))}
                      </TableRow>
                    ))}
                  </TableHeader>
                  <TableBody>
                    {table.getRowModel().rows?.length ? (
                      table.getRowModel().rows.map((row) => (
                        <TableRow
                          key={row.id}
                          data-state={row.getIsSelected() && "selected"}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() =>
                            router.push(`/Dashboard/Appointments/Appointment-View?id=${row.original.id}`)
                          }
                        >
                          {row.getVisibleCells().map((cell) => (
                            <TableCell key={cell.id}>
                              {flexRender(cell.column.columnDef.cell, cell.getContext())}
                            </TableCell>
                          ))}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={columns.length} className="h-24 text-center">
                          No results.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
            <CardFooter>
              <div className="text-xs text-muted-foreground">
                Showing <strong>1-{filteredAppointments.length}</strong> of{" "}
                <strong>{appointments.length}</strong> appointments
              </div>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Add Appointment Form Dialog */}
      <AppointmentForm
        open={showAppointmentForm}
        onOpenChange={setShowAppointmentForm}
        onSuccess={() => {
          // Refresh appointments data after successful creation
          const fetchAppointments = async () => {
            try {
              const { data: appointmentsData, error: appointmentsError } = await supabase
                .from("appointment")
                .select(`
                  *,
                  patient:patient_id (
                    person (
                      first_name,
                      middle_name,
                      last_name
                    )
                  ),
                  clinician:clinician_id (
                    person (
                      first_name,
                      middle_name,
                      last_name
                    )
                  )
                `)
                .order("date", { ascending: false });

              if (appointmentsError) {
                console.error("Appointments fetch error:", appointmentsError);
                toast.error(`Failed to fetch appointments: ${appointmentsError.message}`);
                return;
              }

              if (!appointmentsData || appointmentsData.length === 0) {
                console.log("No appointments data found");
                toast.info("No appointments found.");
                setAppointments([]);
                return;
              }

              const formattedAppointments: Appointment[] = appointmentsData.map((appointment: any) => {
                const patient = appointment.patient?.person || {};
                const clinician = appointment.clinician?.person || {};

                return {
                  id: appointment.id,
                  patient_id: appointment.patient_id,
                  clinician_id: appointment.clinician_id,
                  date: appointment.date,
                  service: appointment.service,
                  weight: appointment.weight,
                  vitals: appointment.vitals,
                  gestational_age: appointment.gestational_age,
                  status: appointment.status,
                  payment_status: appointment.payment_status,
                  patient_name: `${patient.first_name || ""} ${patient.middle_name || ""} ${
                    patient.last_name || ""
                  }`.trim(),
                  clinician_name: `${clinician.first_name || ""} ${clinician.middle_name || ""} ${
                    clinician.last_name || ""
                  }`.trim(),
                };
              });

              setAppointments(formattedAppointments);
              toast.success("Appointments refreshed successfully.");
            } catch (err: any) {
              toast.error(`Error fetching appointments: ${err.message}`);
            }
          };
          fetchAppointments();
        }}
      />
    </main>
  );
}