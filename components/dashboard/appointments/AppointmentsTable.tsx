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
    id: "time",
    header: ({ column }) => (
      <Button
        variant="ghost"
        onClick={() => column.toggleSorting(column.getIsSorted() === "asc")}
      >
        Time
        <ArrowUpDown className="ml-2 h-4 w-4" />
      </Button>
    ),
    cell: ({ row }) => (
      <div>
        {new Date(row.original.date).toLocaleTimeString([], {
          hour: "numeric",
          minute: "2-digit",
          hour12: true,
        })}
      </div>
    ),
    sortingFn: (rowA, rowB) => {
      return new Date(rowA.original.date).getTime() - new Date(rowB.original.date).getTime();
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

  // Handle export
  const handleExport = () => {
    const headers = [
      "Patient Name",
      "Clinician Name",
      "Date",
      "Time",
      "Service",
      "Status",
      "Payment Status",
    ];
    const rows = filteredAppointments.map((appointment) => [
      appointment.patient_name,
      appointment.clinician_name,
      new Date(appointment.date).toLocaleDateString(),
      new Date(appointment.date).toLocaleTimeString([], {
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }),
      appointment.service,
      appointment.status,
      appointment.payment_status,
    ]);

    const csvContent = [
      headers.join(","),
      ...rows.map((row) => row.map((cell) => `"${cell}"`).join(",")),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "appointments_export.csv";
    link.click();
    toast.success("Data exported successfully.");
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

            <Dialog>
              <DialogTrigger asChild>
                <Button size="sm" variant="outline" className="h-8 gap-1">
                  <Download />
                  <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Export</span>
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Export Data</DialogTitle>
                  <DialogDescription>
                    Export the current appointment list as a CSV file.
                  </DialogDescription>
                </DialogHeader>
                <DialogFooter>
                  <Button variant="outline" onClick={() => {}}>
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