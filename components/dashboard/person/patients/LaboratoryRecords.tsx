"use client"

import { useRouter } from "next/navigation"
import React, { useState, useEffect } from "react"
import { MonitorUp, MoreHorizontal, Search, Trash2 } from "lucide-react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Checkbox } from "@/components/ui/checkbox"
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { toast } from "sonner"
import { z } from "zod"
import { zodResolver } from "@hookform/resolvers/zod"
import { supabase } from "@/lib/supabase/client"

// Define the form schema for adding laboratory records
const formSchema = z.object({
  fileName: z.string().min(1, "File name is required"),
  recordType: z.string().min(1, "Record type is required"),
  doctor: z.string().min(1, "Doctor name is required"),
  orderedDate: z.string().min(1, "Ordered date is required"),
  receivedDate: z.string().min(1, "Received date is required"),
  reportedDate: z.string().min(1, "Recorded date is required"),
  impressions: z.string().min(1, "Impressions are required"),
  remarks: z.string().optional(),
  recommendations: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type Props = {
  context: "patient"
  id: string | null
  fields?: any[] // From useFieldArray or passed from PatientView
  append?: (record: any) => void
  remove?: (index: number) => void
}

export default function LaboratoryRecords({ context, id, fields = [], append, remove }: Props) {
  const router = useRouter()
  const [openDialog, setOpenDialog] = useState(false)
  const [recordsData, setRecordsData] = useState<any[]>([])
  const [fetchError, setFetchError] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [filePreview, setFilePreview] = useState<string | null>(null)

  // Initialize form for adding laboratory records
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      fileName: "",
      recordType: "",
      doctor: "",
      orderedDate: "",
      receivedDate: "",
      reportedDate: "",
      impressions: "",
      remarks: "",
      recommendations: "",
    },
  })

  // Fetch records from Supabase if id is provided (existing patient)
  useEffect(() => {
    async function fetchRecords() {
      if (!id) return
      try {
        const { data, error } = await supabase
          .from("laboratory_records")
          .select("*")
          .eq("patient_id", id)

        if (error) {
          console.error("Record fetch error:", error)
          setFetchError("Failed to fetch laboratory records.")
          toast("Error", {
            description: "Failed to fetch laboratory records.",
          })
          setRecordsData([])
        } else {
          console.log("Fetched records for patient_id", id, ":", data)
          setRecordsData(data)
          setFetchError(null)
          if (append) {
            data.forEach((record: any) => {
              if (!fields.some((f) => f.id === record.id)) {
                append({
                  id: record.id,
                  fileName: record.fileName,
                  recordType: record.recordType,
                  doctor: record.doctor,
                  orderedDate: record.orderedDate,
                  receivedDate: record.receivedDate,
                  reportedDate: record.reportedDate,
                  impressions: record.impressions,
                  remarks: record.remarks,
                    recommendations: record.recommendations,
                })
              }
            })
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching records:", err)
        setFetchError("Unexpected error fetching records.")
        toast("Error", {
          description: "Unexpected error fetching records.",
        })
        setRecordsData([])
      }
    }

    fetchRecords()
  }, [id, append])

  // Sync fields with recordsData for new patients or when fields change
  useEffect(() => {
    if (!id) {
      setRecordsData(fields)
      setFetchError(null)
    }
  }, [id, fields])

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      form.setValue("fileName", file.name)
      const reader = new FileReader()
      reader.onload = (e) => {
        setFilePreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  // Handle form submission for adding records
  const onSubmitRecord = async (data: FormValues) => {
    if (!selectedFile) {
      toast("Error", {
        description: "Please select a file.",
      })
      return
    }

    if (!id && !append) {
      toast("Error", {
        description: "Cannot add record without form integration.",
      })
      return
    }

    let fileUrl: string | null = null
    if (selectedFile) {
      const fileExt = selectedFile.name.split(".").pop()
      const fileName = `${Math.random()}.${fileExt}`
      const { error: uploadError, data: uploadData } = await supabase.storage
        .from("laboratory-files")
        .upload(fileName, selectedFile)

      if (uploadError) {
        console.error("File upload error:", uploadError)
        toast("Error", {
          description: "Failed to upload file.",
        })
        return
      }

      fileUrl = supabase.storage.from("laboratory-files").getPublicUrl(fileName).data.publicUrl
    }

    if (id) {
      // Existing patient, save to Supabase
      const { data: newRecord, error } = await supabase
        .from("laboratory_records")
        .insert([
          {
            patient_id: id,
            fileName: data.fileName,
            recordType: data.recordType,
            doctor: data.doctor,
            orderedDate: data.orderedDate,
            receivedDate: data.receivedDate,
            reportedDate: data.reportedDate,
            impressions: data.impressions,
            remarks: data.remarks,
            recommendations: data.recommendations,
            fileUrl,
          },
        ])
        .select()
        .single()

      if (error) {
        console.error("Record insert error:", error)
        toast("Error", {
          description: "Failed to add record.",
        })
        return
      }

      if (append) {
        append({
          id: newRecord.id,
          fileName: data.fileName,
          recordType: data.recordType,
          doctor: data.doctor,
          orderedDate: data.orderedDate,
          receivedDate: data.receivedDate,
          reportedDate: data.reportedDate,
          impressions: data.impressions,
          remarks: data.remarks,
            recommendations: data.recommendations,
          fileUrl,
        })
      } else {
        setRecordsData((prev) => [...prev, newRecord])
      }
      toast("Record Added", {
        description: "New laboratory record has been added successfully.",
      })
    } else if (append) {
      // New patient, append to form's records array
      append({
        fileName: data.fileName,
        recordType: data.recordType,
        doctor: data.doctor,
        orderedDate: data.orderedDate,
        receivedDate: data.receivedDate,
        reportedDate: data.reportedDate,
        impressions: data.impressions,
        remarks: data.remarks,
        recommendations: data.recommendations,
        fileUrl,
      })
      toast("Record Added", {
        description: "New laboratory record has been added successfully.",
      })
    }

    form.reset()
    setSelectedFile(null)
    setFilePreview(null)
    setOpenDialog(false)
  }

  // Handle record deletion
  const handleDelete = async (index: number) => {
    if (id) {
      const recordToDelete = (fields.length > 0 ? fields : recordsData)[index]
      const { error } = await supabase
        .from("laboratory_records")
        .delete()
        .eq("id", recordToDelete.id)

      if (error) {
        console.error("Record delete error:", error)
        toast("Error", {
          description: "Failed to delete record.",
        })
        return
      }

      setRecordsData((prev) => prev.filter((_, idx) => idx !== index))
    }

    if (remove) {
      remove(index)
    }
    toast("Record Deleted", {
      description: "Laboratory record has been removed from the list.",
    })
  }

  // Determine which data to display
  const displayRecords = fields.length > 0 ? fields : recordsData

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2 md:flex-row md:items-center md:justify-between">
        <div className="space-y-1">
          <CardTitle>Laboratory Records</CardTitle>
          <CardDescription>Store your patient's records for safe keeping</CardDescription>
        </div>
        <div className="relative flex items-center w-full max-w-sm md:w-auto">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            type="search"
            placeholder="Search records..."
            className="w-full pl-8 rounded-lg bg-background"
            onChange={(e) => {
              // Implement search logic if needed
            }}
          />
          <Dialog
            open={openDialog}
            onOpenChange={(open) => {
              setOpenDialog(open)
              if (!open) {
                form.reset()
                setSelectedFile(null)
                setFilePreview(null)
              }
            }}
          >
            <DialogTrigger asChild>
              <Button size="sm" className="h-8 ml-2 flex items-center gap-1">
                <MonitorUp className="h-4 w-4" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Add Record</span>
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[1000px]">
              <DialogHeader>
                <DialogTitle>Add Laboratory Record</DialogTitle>
                <DialogDescription>
                  Upload a file and fill in the details for the laboratory record.
                </DialogDescription>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmitRecord)} className="grid gap-4 py-4">
                  <div className="grid grid-cols-3 gap-4">
                    <div className="col-span-3">
                      <FormItem>
                        <FormLabel>File Upload</FormLabel>
                        <FormControl>
                          <Input
                            type="file"
                            onChange={handleFileChange}
                            accept=".pdf,.jpg,.jpeg,.png"
                          />
                        </FormControl>
                        {filePreview && (
                          <div className="mt-2">
                            <img
                              src={filePreview}
                              alt="File preview"
                              className="max-h-40 object-contain"
                            />
                          </div>
                        )}
                      </FormItem>
                    </div>
                    <FormField
                      control={form.control}
                      name="fileName"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>File Name</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter file name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recordType"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Record Type</FormLabel>
                          <Select onValueChange={field.onChange} value={field.value}>
                            <FormControl>
                              <SelectTrigger>
                                <SelectValue placeholder="Select record type" />
                              </SelectTrigger>
                            </FormControl>
                            <SelectContent>
                              <SelectItem value="Blood Test">Blood Test</SelectItem>
                              <SelectItem value="X-Ray">X-Ray</SelectItem>
                              <SelectItem value="MRI">MRI</SelectItem>
                              <SelectItem value="CT Scan">CT Scan</SelectItem>
                            </SelectContent>
                          </Select>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="doctor"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Doctor</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter doctor name" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="orderedDate"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Ordered Date</FormLabel>
                            <FormControl>
                                <DatePicker value={field.value} onChange={field.onChange} />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="receivedDate"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Recieved Date</FormLabel>
                            <FormControl>
                                <DatePicker value={field.value} onChange={field.onChange} />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="reportedDate"
                      render={({ field }) => (
                        <FormItem>
                            <FormLabel>Reported Date</FormLabel>
                            <FormControl>
                                <DatePicker value={field.value} onChange={field.onChange} />
                            </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="impressions"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Impressions</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter impressions" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="remarks"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Remarks</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter remarks" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    <FormField
                      control={form.control}
                      name="recommendations"
                      render={({ field }) => (
                        <FormItem className="col-span-3">
                          <FormLabel>Recommendations</FormLabel>
                          <FormControl>
                            <Input placeholder="Enter recommendations" {...field} />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  <DialogFooter>
                    <Button type="submit">Save Record</Button>
                  </DialogFooter>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>
      </CardHeader>

      <CardContent>
        {fetchError ? (
          <p className="text-sm text-red-600">{fetchError}</p>
        ) : displayRecords.length === 0 ? (
          <p className="text-sm text-muted-foreground">No laboratory records for this patient.</p>
        ) : (
          <Table>
            <TableHeader>
              <TableRow>
                <TableCell>
                  <Checkbox
                    id="select-all"
                    onCheckedChange={(checked) => {
                      // Implement select all logic if needed
                    }}
                  />
                </TableCell>
                <TableHead>File Name</TableHead>
                <TableHead>Record Type</TableHead>
                <TableHead>Doctor</TableHead>
                <TableHead>Ordered Date</TableHead>
                <TableHead>Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {displayRecords.map((record, index) => (
                <TableRow key={record.id || index}>
                  <TableCell>
                    <Checkbox id={`record-${record.id || index}`} />
                  </TableCell>
                  <TableCell className="font-medium">{record.fileName}</TableCell>
                  <TableCell>{record.recordType}</TableCell>
                  <TableCell>{record.doctor}</TableCell>
                  <TableCell>{record.orderedDate}</TableCell>
                  <TableCell>
                    <Button
                      variant="outline"
                      onClick={() => handleDelete(index)}
                    >
                      <Trash2 />
                      Delete
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </CardContent>

      <CardFooter>
        <div className="text-xs text-muted-foreground">
          Showing <strong>{displayRecords.length}</strong> of <strong>{displayRecords.length}</strong> Records
        </div>
      </CardFooter>
    </Card>
  )
}