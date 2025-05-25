"use client";

import { Download, Search, TextSearch, ChevronDownIcon, ArrowUpDown, UserRoundPlus } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
  CardContent
} from "@/components/ui/card";
import {
  ChartContainer,
  ChartTooltip,
  ChartTooltipContent,
} from "@/components/ui/chart";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
} from "recharts";
import { useEffect, useState, useMemo } from "react";
import { supabase } from "@/lib/supabase/client";
import { Users, Stethoscope, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Tabs, TabsContent, TabsList, TabsTrigger
} from "@/components/ui/tabs";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import {
  ColumnDef,
  SortingState,
  getCoreRowModel,
  getSortedRowModel,
  useReactTable,
  flexRender,
} from "@tanstack/react-table";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { debounce } from "lodash";
import AppointmentForm from "@/components/dashboard/appointments/AppointmentForm";

// Define the shape of the chart data
interface ChartData {
  age: string;
  numberOfPatients: number;
}

// Define the shape of the appointment data
interface Appointment {
  id: string;
  patient_id: string;
  clinician_id: string;
  date: string;
  service: string;
  weight: string | null;
  vitals: string | null;
  gestational_age: string | null;
  status: "Scheduled" | "Completed" | "Canceled";
  payment_status: "Pending" | "Paid" | "Unpaid";
  patient_name: string;
  clinician_name: string;
}

export default function Dashboard() {
  const router = useRouter();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activePatients, setActivePatients] = useState<number>(0);
  const [activeClinicians, setActiveClinicians] = useState<number>(0);
  const [totalAppointments, setTotalAppointments] = useState<number>(0);
  const [todayAppointments, setTodayAppointments] = useState<Appointment[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [advancedSearch, setAdvancedSearch] = useState({
    service: "",
    status: "",
    payment_status: "",
  });
  const [tab, setTab] = useState("all");
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState({});
  const [showAppointmentForm, setShowAppointmentForm] = useState(false);

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch active patients
        const { data: patientsData, error: patientsError } = await supabase
          .from("person")
          .select("id")
          .eq("status", "Active")
          .in("id", (await supabase.from("patients").select("id")).data?.map(p => p.id) || []);

        if (patientsError) throw new Error(`Patients query error: ${patientsError.message}`);
        setActivePatients(patientsData?.length || 0);

        // Fetch active clinicians
        const { data: cliniciansData, error: cliniciansError } = await supabase
          .from("person")
          .select("id")
          .eq("status", "Active")
          .in("id", (await supabase.from("clinicians").select("id")).data?.map(c => c.id) || []);

        if (cliniciansError) throw new Error(`Clinicians query error: ${cliniciansError.message}`);
        setActiveClinicians(cliniciansData?.length || 0);

        // Fetch total appointments count
        const { count: appointmentsCount, error: appointmentsError } = await supabase
          .from("appointment")
          .select("*", { count: "exact", head: true });

        if (appointmentsError) throw new Error(`Appointments query error: ${appointmentsError.message}`);
        setTotalAppointments(appointmentsCount || 0);

        // Fetch patient age distribution
        const { data: ageData, error: ageError } = await supabase
          .from("person")
          .select("age")
          .not("age", "is", null)
          .in("id", (await supabase.from("patients").select("id")).data?.map(p => p.id) || []);

        if (ageError) throw new Error(`Age distribution query error: ${ageError.message}`);
        if (!ageData || ageData.length === 0) {
          setChartData([]);
          setError("No patient data found");
        } else {
          // Aggregate age data
          const ageCounts = ageData.reduce((acc: { [key: string]: number }, row) => {
            const age = row.age.toString();
            acc[age] = (acc[age] || 0) + 1;
            return acc;
          }, {});

          // Convert to chart data format and sort
          const formattedData = Object.entries(ageCounts)
            .map(([age, count]) => ({
              age,
              numberOfPatients: count,
            }))
            .sort((a, b) => a.age.localeCompare(b.age, undefined, { numeric: true }));

          setChartData(formattedData);
        }

        // Fetch today's appointments
        const today = new Date().toISOString().split('T')[0];
        const { data: appointmentsData, error: todayAppointmentsError } = await supabase
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
            ),
            vitals (
              temperature,
              pulse_rate,
              blood_pressure,
              respiration_rate,
              oxygen_saturation
            )
          `)
          .eq("date", today);

        if (todayAppointmentsError) throw new Error(`Today's appointments query error: ${todayAppointmentsError.message}`);

        const formattedAppointments: Appointment[] = appointmentsData?.map((appointment: any) => {
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
            patient_name: `${patient.first_name || ""} ${patient.middle_name || ""} ${patient.last_name || ""}`.trim(),
            clinician_name: `${clinician.first_name || ""} ${clinician.middle_name || ""} ${clinician.last_name || ""}`.trim(),
          };
        }) || [];

        setTodayAppointments(formattedAppointments);

      } catch (err: any) {
        console.error("Failed to fetch dashboard data:", err);
        setError(`Failed to load dashboard data: ${err.message || "Unknown error"}`);
      } finally {
        setLoading(false);
      }
    }
    fetchDashboardData();
  }, []);

  // Chart configuration for styling
  const chartConfig = {
    numberOfPatients: {
      label: "Number of Patients:",
      color: "black",
    },
  };

  // Define columns for the appointments table
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
        const appointment = row.original;
        const validStatuses = ["Scheduled", "Completed", "Canceled"];
        const updateAppointmentStatus = async (newStatus: "Scheduled" | "Completed" | "Canceled") => {
          if (!validStatuses.includes(newStatus)) {
            toast.error("Invalid status value.");
            return false;
          }
          try {
            // Optimistically update local state
            setTodayAppointments((prev) =>
              prev.map((appt) =>
                appt.id === appointment.id ? { ...appt, status: newStatus } : appt
              )
            );

            const { error } = await supabase
              .from("appointment")
              .update({ status: newStatus })
              .eq("id", appointment.id);

            if (error) {
              // Revert optimistic update on error
              setTodayAppointments((prev) =>
                prev.map((appt) =>
                  appt.id === appointment.id ? { ...appt, status: appointment.status } : appt
                )
              );
              console.error("Appointment status update error:", error);
              toast.error(`Failed to update appointment status: ${error.message}`);
              return false;
            }

            toast.success("Status Updated", {
              description: `Appointment status changed to ${newStatus}.`,
            });
            return true;
          } catch (err) {
            // Revert optimistic update on unexpected error
            setTodayAppointments((prev) =>
              prev.map((appt) =>
                appt.id === appointment.id ? { ...appt, status: appointment.status } : appt
              )
            );
            console.error("Unexpected error updating status:", err);
            toast.error("An unexpected error occurred while updating the status.");
            return false;
          }
        };

        const debouncedUpdateAppointmentStatus = debounce(updateAppointmentStatus, 300);

        return (
          <Select
            value={appointment.status || "Scheduled"}
            onValueChange={async (value) => {
              const newStatus = value as "Scheduled" | "Completed" | "Canceled";
              await debouncedUpdateAppointmentStatus(newStatus);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Scheduled" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-blue-400" />
                Scheduled
              </SelectItem>
              <SelectItem value="Completed" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Completed
              </SelectItem>
              <SelectItem value="Canceled" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                Canceled
              </SelectItem>
            </SelectContent>
          </Select>
        );
      },
      enableSorting: false,
    },
    {
      accessorKey: "payment_status",
      header: "Payment Status",
      cell: ({ row }) => {
        const appointment = row.original;
        const validPaymentStatuses = ["Pending", "Paid", "Unpaid"];
        const updatePaymentStatus = async (newStatus: "Pending" | "Paid" | "Unpaid") => {
          if (!validPaymentStatuses.includes(newStatus)) {
            toast.error("Invalid payment status value.");
            return false;
          }
          try {
            // Optimistically update local state
            setTodayAppointments((prev) =>
              prev.map((appt) =>
                appt.id === appointment.id ? { ...appt, payment_status: newStatus } : appt
              )
            );

            const { error } = await supabase
              .from("appointment")
              .update({ payment_status: newStatus })
              .eq("id", appointment.id);

            if (error) {
              // Revert optimistic update on error
              setTodayAppointments((prev) =>
                prev.map((appt) =>
                  appt.id === appointment.id ? { ...appt, payment_status: appointment.payment_status } : appt
                )
              );
              console.error("Payment status update error:", error);
              toast.error(`Failed to update payment status: ${error.message}`);
              return false;
            }

            toast.success("Payment Status Updated", {
              description: `Payment status changed to ${newStatus}.`,
            });
            return true;
          } catch (err) {
            // Revert optimistic update on unexpected error
            setTodayAppointments((prev) =>
              prev.map((appt) =>
                appt.id === appointment.id ? { ...appt, payment_status: appointment.payment_status } : appt
              )
            );
            console.error("Unexpected error updating payment status:", err);
            toast.error("An unexpected error occurred while updating the payment status.");
            return false;
          }
        };

        const debouncedUpdatePaymentStatus = debounce(updatePaymentStatus, 300);

        return (
          <Select
            value={appointment.payment_status || "Pending"}
            onValueChange={async (value) => {
              const newStatus = value as "Pending" | "Paid" | "Unpaid";
              await debouncedUpdatePaymentStatus(newStatus);
            }}
          >
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="Select payment status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Pending" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-yellow-400" />
                Pending
              </SelectItem>
              <SelectItem value="Paid" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-green-400" />
                Paid
              </SelectItem>
              <SelectItem value="Unpaid" className="flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-red-400" />
                Unpaid
              </SelectItem>
            </SelectContent>
          </Select>
        );
      },
      enableSorting: false,
    },
  ];

  // Handle search and filtering
  const filteredAppointments = useMemo(() => {
    let result = [...todayAppointments];

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
  }, [searchTerm, advancedSearch, tab, todayAppointments]);

  // Initialize table
  const table = useReactTable({
    data: filteredAppointments,
    columns,
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    onRowSelectionChange: setRowSelection,
    state: { sorting, rowSelection },
  });

  async function fetchDashboardData() {
    try {
      setLoading(true);
      setError(null);

      // Fetch active patients
      const { data: patientsData, error: patientsError } = await supabase
        .from("person")
        .select("id")
        .eq("status", "Active")
        .in("id", (await supabase.from("patients").select("id")).data?.map(p => p.id) || []);

      if (patientsError) throw new Error(`Patients query error: ${patientsError.message}`);
      setActivePatients(patientsData?.length || 0);

      // Fetch active clinicians
      const { data: cliniciansData, error: cliniciansError } = await supabase
        .from("person")
        .select("id")
        .eq("status", "Active")
        .in("id", (await supabase.from("clinicians").select("id")).data?.map(c => c.id) || []);

      if (cliniciansError) throw new Error(`Clinicians query error: ${cliniciansError.message}`);
      setActiveClinicians(cliniciansData?.length || 0);

      // Fetch total appointments count
      const { count: appointmentsCount, error: appointmentsError } = await supabase
        .from("appointment")
        .select("*", { count: "exact", head: true });

      if (appointmentsError) throw new Error(`Appointments query error: ${appointmentsError.message}`);
      setTotalAppointments(appointmentsCount || 0);

      // Fetch patient age distribution
      const { data: ageData, error: ageError } = await supabase
        .from("person")
        .select("age")
        .not("age", "is", null)
        .in("id", (await supabase.from("patients").select("id")).data?.map(p => p.id) || []);

      if (ageError) throw new Error(`Age distribution query error: ${ageError.message}`);
      if (!ageData || ageData.length === 0) {
        setChartData([]);
        setError("No patient data found");
      } else {
        // Aggregate age data
        const ageCounts = ageData.reduce((acc: { [key: string]: number }, row) => {
          const age = row.age.toString();
          acc[age] = (acc[age] || 0) + 1;
          return acc;
        }, {});

        // Convert to chart data format and sort
        const formattedData = Object.entries(ageCounts)
          .map(([age, count]) => ({
            age,
            numberOfPatients: count,
          }))
          .sort((a, b) => a.age.localeCompare(b.age, undefined, { numeric: true }));

        setChartData(formattedData);
      }

      // Fetch today's appointments
      const today = new Date().toISOString().split('T')[0];
      const { data: appointmentsData, error: todayAppointmentsError } = await supabase
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
          ),
          vitals (
            temperature,
            pulse_rate,
            blood_pressure,
            respiration_rate,
            oxygen_saturation
          )
        `)
        .eq("date", today);

      if (todayAppointmentsError) throw new Error(`Today's appointments query error: ${todayAppointmentsError.message}`);

      const formattedAppointments: Appointment[] = appointmentsData?.map((appointment: any) => {
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
          patient_name: `${patient.first_name || ""} ${patient.middle_name || ""} ${patient.last_name || ""}`.trim(),
          clinician_name: `${clinician.first_name || ""} ${clinician.middle_name || ""} ${clinician.last_name || ""}`.trim(),
        };
      }) || [];

      setTodayAppointments(formattedAppointments);

    } catch (err: any) {
      console.error("Failed to fetch dashboard data:", err);
      setError(`Failed to load dashboard data: ${err.message || "Unknown error"}`);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="grid flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
      {/* Top cards (Active Patients, Active Clinicians, Total Appointments) */}
      <div className="grid w-full gap-4 sm:grid-cols-2 md:grid-cols-3">
        <Card className="@container/card">
          <CardHeader className="relative flex items-center">
            <div className="rounded border-1 p-2 mr-2">
              <Users size={20} />
            </div>
            <div>
              <CardDescription>Active Patients</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? "Loading..." : activePatients.toLocaleString()}
              </CardTitle>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 font-medium">
              Current number of registered patients
            </div>
            <div className="text-muted-foreground">
              Monitor patient growth trends
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader className="relative flex items-center">
            <div className="rounded border-1 p-2 mr-2">
              <Stethoscope size={20} />
            </div>
            <div>
              <CardDescription>Active Clinicians</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? "Loading..." : activeClinicians.toLocaleString()}
              </CardTitle>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 font-medium">
              Current number of active healthcare providers
            </div>
            <div className="text-muted-foreground">
              Ensure adequate staffing levels
            </div>
          </CardFooter>
        </Card>
        <Card className="@container/card">
          <CardHeader className="relative flex items-center">
            <div className="rounded border-1 p-2 mr-2">
              <Calendar size={20} />
            </div>
            <div>
              <CardDescription>Total Appointments</CardDescription>
              <CardTitle className="@[250px]/card:text-3xl text-2xl font-semibold tabular-nums">
                {loading ? "Loading..." : totalAppointments.toLocaleString()}
              </CardTitle>
            </div>
          </CardHeader>
          <CardFooter className="flex-col items-start gap-1 text-sm">
            <div className="line-clamp-1 font-medium">
              Total scheduled and completed appointments
            </div>
            <div className="text-muted-foreground">
              Track appointment utilization
            </div>
          </CardFooter>
        </Card>
      </div>

      {/* Chart and Appointments stacked vertically */}
      <div className="w-full space-y-4">
        {/* Pregnancy by Age Analysis Card */}
        <Card className="@container/card rounded-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Pregnancy by Age Analysis</CardTitle>
              <CardDescription>Distribution of patients by age</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 flex items-center gap-1"
              onClick={() => router.push("/Patients/Patient-Form")}
            >
              <Download />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
          </CardHeader>
          <div className="p-4 bg-white rounded-lg">
            {loading ? (
              <div className="text-center">Loading...</div>
            ) : error ? (
              <div className="text-red-500 text-center">{error}</div>
            ) : chartData.length === 0 ? (
              <div className="text-center">No data available</div>
            ) : (
              <ChartContainer config={chartConfig}>
                <BarChart
                  data={chartData}
                  margin={{ top: 20, right: 20, left: 20, bottom: 20 }}
                  barGap={0}
                  barCategoryGap={0}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                  <XAxis
                    dataKey="age"
                    label={{
                      value: "Age",
                      position: "insideBottom",
                      offset: -10,
                    }}
                  />
                  <YAxis
                    dataKey="numberOfPatients"
                    label={{
                      value: "Number of Patients",
                      angle: -90,
                      position: "insideLeft",
                      offset: 10,
                    }}
                    domain={[0, "auto"]}
                    tickCount={5}
                  />
                  <ChartTooltip content={<ChartTooltipContent />} />
                  <Bar
                    dataKey="numberOfPatients"
                    fill="black"
                    barSize={50}
                    radius={[4, 4, 0, 0]}
                  />
                </BarChart>
              </ChartContainer>
            )}
          </div>
        </Card>

        {/* Appointments Today Card */}
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

              <Button
                size="sm"
                variant="outline"
                className="h-8 flex items-center gap-1"
                onClick={() => router.push("/Dashboard/Appointments")}
              >
                <Download />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  View All
                </span>
              </Button>
            </div>
          </div>

          <TabsContent value={tab}>
            <Card x-chunk="dashboard-06-chunk-0">
              <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
                <div className="space-y-1">
                  <CardTitle>Appointments Today</CardTitle>
                  <CardDescription>Appointments scheduled for today</CardDescription>
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
                  <p className="text-sm text-muted-foreground">No appointments today.</p>
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
                  <strong>{todayAppointments.length}</strong> appointments
                </div>
              </CardFooter>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <AppointmentForm
        open={showAppointmentForm}
        onOpenChange={setShowAppointmentForm}
        onSuccess={() => {
          fetchDashboardData();
        }}
      />
    </main>
  );
}