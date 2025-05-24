"use client";

import { TrendingDownIcon, TrendingUpIcon, Download, Activity } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
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
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase/client";
import { Users, Stethoscope, Calendar } from "lucide-react";
import { useRouter } from "next/navigation";

// Define the shape of the chart data
interface ChartData {
  age: string;
  numberOfPatients: number;
}
export default function Dashboard() {
  const router = useRouter();
  const [chartData, setChartData] = useState<ChartData[]>([]);
  const [activePatients, setActivePatients] = useState<number>(0);
  const [activeClinicians, setActiveClinicians] = useState<number>(0);
  const [totalAppointments, setTotalAppointments] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch data from Supabase
  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true);
        setError(null);

        // Fetch active patients (status = 'Active' in person table joined with patients)
        const { data: patientsData, error: patientsError } = await supabase
          .from("person")
          .select("id")
          .eq("status", "Active")
          .in("id", (await supabase.from("patients").select("id")).data?.map(p => p.id) || []);

        if (patientsError) throw new Error(`Patients query error: ${patientsError.message}`);
        setActivePatients(patientsData?.length || 0);

        // Fetch active clinicians (status = 'Active' in person table joined with clinicians)
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
          return;
        }

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

  return (
    <main className="grid flex-1 gap-4 p-4 sm:px-6 sm:py-0 md:gap-8">
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

      <div className="grid w-full gap-4 md:grid-cols-2">
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

        <Card className="@container/card rounded-lg border border-gray-200">
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle>Recent Activity</CardTitle>
              <CardDescription>Latest updates and actions</CardDescription>
            </div>
            <Button
              size="sm"
              variant="outline"
              className="h-8 flex items-center gap-1"
            >
              <Download />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Export
              </span>
            </Button>
          </CardHeader>
          <div className="p-4 bg-white rounded-lg">
            <div className="text-center">Placeholder for recent activity data</div>
          </div>
        </Card>
      </div>
    </main>
  );
}