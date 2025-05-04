"use client"

import { useRouter } from "next/navigation"
import React, { useState, useEffect } from "react"
import { MonitorUp, MoreHorizontal, Search, Trash2, FileDown, Eye, FilePenLine, X } from "lucide-react"
import { useForm } from "react-hook-form"
import { Button } from "@/components/ui/button"
import { DatePicker } from "@/components/ui/date-picker"
import { Label } from "@/components/ui/label"
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
import { Separator } from "@radix-ui/react-dropdown-menu"

const formSchema = z.object({
  filename: z.string().min(1, "File name is required"),
  type: z.string().min(1, "Record type is required"),
  doctor: z.string().min(1, "Doctor name is required"),
  ordered_date: z.string().min(1, "Ordered date is required"),
  received_date: z.string().min(1, "Received date is required"),
  reported_date: z.string().min(1, "Reported date is required"),
  impressions: z.string().min(1, "Impressions are required"),
  remarks: z.string().optional(),
  recommendations: z.string().optional(),
  company: z.string().optional(),
  notes: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type Props = {
  context: "patient"
  id: string | null
  fields?: any[] 
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
  const [isUploading, setIsUploading] = useState(false)
  const [isSidebarOpen, setIsSidebarOpen] = useState(false)
  const [selectedRecord, setSelectedRecord] = useState<any | null>(null)

  const today = new Date().toISOString().split('T')[0]

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      filename: "",
      type: "",
      doctor: "",
      ordered_date: today,
      received_date: today,
      reported_date: today,
      impressions: "",
      remarks: "",
      recommendations: "",
      company: "",
      notes: ""
    },
  })

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
          toast.error("Failed to fetch laboratory records.")
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
                  filename: record.filename,
                  type: record.type,
                  doctor: record.doctor,
                  ordered_date: record.ordered_date,
                  received_date: record.received_date,
                  reported_date: record.reported_date,
                  impressions: record.impressions,
                  remarks: record.remarks,
                  recommendations: record.recommendations,
                  company: record.company,
                  notes: record.notes,
                  fileurl: record.fileurl,
                })
              }
            })
          }
        }
      } catch (err) {
        console.error("Unexpected error fetching records:", err)
        setFetchError("Unexpected error fetching records.")
        toast.error("Unexpected error fetching records.")
        setRecordsData([])
      }
    }

    fetchRecords()
  }, [id, append])

  useEffect(() => {
    if (!id) {
      setRecordsData(fields)
      setFetchError(null)
    }
  }, [id, fields])

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (file) {
      setSelectedFile(file)
      form.setValue("filename", file.name)

      if (file.type.startsWith('image/')) {
        const reader = new FileReader()
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string)
        }
        reader.readAsDataURL(file)
      } else {
        setFilePreview(null)
      }
    }
  }

  const formatDate = (date: string | Date): string => {
    if (!date) return today
    
    if (typeof date === 'string') {
      if (date.includes('T')) {
        return date.split('T')[0]
      }
      return date
    }
    
    return date.toISOString().split('T')[0]
  }

  const onSubmitRecord = async (data: FormValues) => {
    try {
      if (!selectedFile) {
        toast.error("Please select a file.")
        return
      }

      if (!id && !append) {
        toast.error("Cannot add record without form integration.")
        return
      }

      setIsUploading(true)

      const formattedData = {
        ...data,
        ordered_date: formatDate(data.ordered_date),
        received_date: formatDate(data.received_date),
        reported_date: formatDate(data.reported_date),
      }

      console.log("Submitting record with data:", formattedData)

      let fileurl: string | null = null
      if (selectedFile) {
        const fileExt = selectedFile.name.split(".").pop()
        const uniquePrefix = `${id || 'new'}_${Date.now()}`
        const fileName = `${uniquePrefix}_${Math.random().toString(36).substring(2, 15)}.${fileExt}`

        const { error: uploadError, data: uploadData } = await supabase.storage
          .from("laboratory-files")
          .upload(fileName, selectedFile)

        if (uploadError) {
          console.error("File upload error:", uploadError)
          toast.error("Failed to upload file: " + uploadError.message)
          setIsUploading(false)
          return
        }

        fileurl = supabase.storage.from("laboratory-files").getPublicUrl(fileName).data.publicUrl
        console.log("File uploaded successfully, URL:", fileurl)
      }

      if (id) {
        const { data: newRecord, error } = await supabase
          .from("laboratory_records")
          .insert([{
            patient_id: id,
            filename: formattedData.filename,
            type: formattedData.type,
            doctor: formattedData.doctor,
            ordered_date: formattedData.ordered_date,
            received_date: formattedData.received_date,
            reported_date: formattedData.reported_date,
            impressions: formattedData.impressions,
            remarks: formattedData.remarks,
            recommendations: formattedData.recommendations,
            company: formattedData.company,
            notes: formattedData.notes,
            fileurl: fileurl,
            attachment: fileurl,
          }])
          .select()
          .single()

        if (error) {
          console.error("Record insert error:", error)
          toast.error("Failed to add record: " + error.message)
          setIsUploading(false)
          return
        }

        if (append) {
          append({
            id: newRecord.id,
            filename: formattedData.filename,
            type: formattedData.type,
            doctor: formattedData.doctor,
            ordered_date: formattedData.ordered_date,
            received_date: formattedData.received_date,
            reported_date: formattedData.reported_date,
            impressions: formattedData.impressions,
            remarks: formattedData.remarks,
            recommendations: formattedData.recommendations,
            company: formattedData.company,
            notes: formattedData.notes,
            fileurl: fileurl,
            attachment: fileurl,
          })
        } else {
          setRecordsData((prev) => [...prev, newRecord])
        }
        toast.success("New laboratory record has been added successfully.")
      } else if (append) {
        append({
          filename: formattedData.filename,
          type: formattedData.type,
          doctor: formattedData.doctor,
          ordered_date: formattedData.ordered_date,
          received_date: formattedData.received_date,
          reported_date: formattedData.reported_date,
          impressions: formattedData.impressions,
          remarks: formattedData.remarks,
          recommendations: formattedData.recommendations,
          company: formattedData.company,
          notes: formattedData.notes,
          fileurl: fileurl,
          attachment: fileurl,
        })
        toast.success("New laboratory record has been added successfully.")
      }

      form.reset({
        filename: "",
        type: "",
        doctor: "",
        ordered_date: today,
        received_date: today,
        reported_date: today,
        impressions: "",
        remarks: "",
        recommendations: "",
        company: "",
        notes: "",
      })
      
      setSelectedFile(null)
      setFilePreview(null)
      setOpenDialog(false)
    } catch (error) {
      console.error("Error in onSubmitRecord:", error)
      toast.error("An unexpected error occurred while saving the record.")
    } finally {
      setIsUploading(false)
    }
  }

  const handleDelete = async (index: number) => {
    try {
      if (id) {
        const recordToDelete = (fields.length > 0 ? fields : recordsData)[index]
        
        if (recordToDelete.fileurl) {
          const fileurl = recordToDelete.fileurl
          const fileName = fileurl.substring(fileurl.lastIndexOf('/') + 1)
          
          if (fileName) {
            const { error: storageError } = await supabase.storage
              .from("laboratory-files")
              .remove([fileName])
              
            if (storageError) {
              console.error("File deletion error:", storageError)
            }
          }
        }

        const { error } = await supabase
          .from("laboratory_records")
          .delete()
          .eq("id", recordToDelete.id)

        if (error) {
          console.error("Record delete error:", error)
          toast.error("Failed to delete record: " + error.message)
          return
        }

        setRecordsData((prev) => prev.filter((_, idx) => idx !== index))
      }

      if (remove) {
        remove(index)
      }
      
      toast.success("Laboratory record has been removed from the list.")
    } catch (error) {
      console.error("Error deleting record:", error)
      toast.error("An unexpected error occurred while deleting the record.")
    }
  }

  const handleDownload = (fileurl: string, filename: string) => {
    if (!fileurl) {
      toast.error("No file available for download")
      return
    }

    const link = document.createElement('a')
    link.href = fileurl
    link.download = filename
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  const handlePreview = (record: any) => {
    setSelectedRecord(record)
    setIsSidebarOpen(true)
  }

  const closeSidebar = () => {
    setIsSidebarOpen(false)
    setSelectedRecord(null)
  }

  const displayRecords = fields.length > 0 ? fields : recordsData

  const handleDateChange = (name: "ordered_date" | "received_date" | "reported_date", value: string) => {
    form.setValue(name, value, { shouldValidate: true })
  }

  return (
    <div className="relative flex">
      <Card className="w-full">
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
                  form.reset({
                    filename: "",
                    type: "",
                    doctor: "",
                    ordered_date: today,
                    received_date: today,
                    reported_date: today,
                    impressions: "",
                    remarks: "",
                    recommendations: "",
                    company: "",
                    notes: "",
                  })
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
                    <div className="grid grid-cols-4 gap-4">
                      <div className="col-span-2">
                        <FormItem>
                          <FormLabel>File Upload</FormLabel>
                          <FormControl>
                            <Input
                              type="file"
                              onChange={handleFileChange}
                              accept=".pdf,.jpg,.jpeg,.png,.doc,.docx"
                              disabled={isUploading}
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
                          {selectedFile && !filePreview && (
                            <div className="text-sm text-muted-foreground">
                              Selected file: {selectedFile.name} ({(selectedFile.size / 1024).toFixed(2)} KB)
                            </div>
                          )}
                        </FormItem>
                      </div>
                      <div className="col-span-2">
                        <FormField
                          control={form.control}
                          name="filename"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel>File Name</FormLabel>
                              <FormControl>
                                <Input placeholder="Enter file name" {...field} disabled={isUploading} />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      </div>
                      <div className="col-span-4">
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="type"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Record Type</FormLabel>
                                <Select onValueChange={field.onChange} value={field.value} disabled={isUploading}>
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
                                    <SelectItem value="Ultrasound">Ultrasound</SelectItem>
                                    <SelectItem value="EKG/ECG">EKG/ECG</SelectItem>
                                    <SelectItem value="Pathology">Pathology</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
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
                                  <Input placeholder="Enter doctor name" {...field} disabled={isUploading} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="company"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Company</FormLabel>
                                <FormControl>
                                  <Input placeholder="Enter laboratory company" {...field} disabled={isUploading} />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <div className="col-span-4">
                        <div className="grid grid-cols-3 gap-4">
                          <FormField
                            control={form.control}
                            name="ordered_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Ordered Date</FormLabel>
                                <FormControl>
                                  <DatePicker
                                    value={field.value}
                                    onChange={(value) => handleDateChange("ordered_date", value)}
                                    disabled={isUploading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="received_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Received Date</FormLabel>
                                <FormControl>
                                  <DatePicker
                                    value={field.value}
                                    onChange={(value) => handleDateChange("received_date", value)}
                                    disabled={isUploading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                          <FormField
                            control={form.control}
                            name="reported_date"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel>Reported Date</FormLabel>
                                <FormControl>
                                  <DatePicker
                                    value={field.value}
                                    onChange={(value) => handleDateChange("reported_date", value)}
                                    disabled={isUploading}
                                  />
                                </FormControl>
                                <FormMessage />
                              </FormItem>
                            )}
                          />
                        </div>
                      </div>
                      <FormField
                        control={form.control}
                        name="impressions"
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormLabel>Impressions</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter impressions" {...field} disabled={isUploading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="remarks"
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormLabel>Remarks</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter remarks" {...field} disabled={isUploading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="recommendations"
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormLabel>Recommendations</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter recommendations" {...field} disabled={isUploading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="notes"
                        render={({ field }) => (
                          <FormItem className="col-span-4">
                            <FormLabel>Notes</FormLabel>
                            <FormControl>
                              <Input placeholder="Enter additional notes" {...field} disabled={isUploading} />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </div>
                    <DialogFooter>
                      <Button type="submit" disabled={isUploading}>
                        {isUploading ? "Uploading..." : "Save Record"}
                      </Button>
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
                  <TableHead>Company</TableHead>
                  <TableHead>Ordered Date</TableHead>
                  <TableHead></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {displayRecords.map((record, index) => (
                  <TableRow key={record.id || index}>
                    <TableCell>
                      <Checkbox id={`record-${record.id || index}`} />
                    </TableCell>
                    <TableCell className="font-medium">{record.filename}</TableCell>
                    <TableCell>{record.type}</TableCell>
                    <TableCell>{record.doctor}</TableCell>
                    <TableCell>{record.company}</TableCell>
                    <TableCell>{record.ordered_date}</TableCell>
                    <TableCell className="flex gap-2">
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuLabel>Toggle Actions</DropdownMenuLabel>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleDownload(record.fileurl, record.filename)}>
                            <FileDown className="mr-2 h-4 w-4" />
                            Download
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handlePreview(record)}>
                            <Eye className="mr-2 h-4 w-4" />
                            Preview
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <FilePenLine className="mr-2 h-4 w-4" />
                            Edit
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleDelete(index)}>
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
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

      {/* Right Sidebar for Preview */}
      <div
        className={`fixed right-0 top-0 h-full w-100 bg-background shadow-lg transform transition-transform duration-300 ${
          isSidebarOpen ? 'translate-x-0' : 'translate-x-full'
        } z-50 border-l`}
      >
        {selectedRecord && (
          <div className="flex flex-col h-full">
            <div className="p-4 flex justify-between items-center">
              <h2 className="font-semibold">Record Details</h2>
              <Button variant="outline" size="icon" onClick={closeSidebar}>
                <X />
              </Button>
            </div>
            <div className="p-4 flex-1 overflow-y-auto">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <Label className="font-semibold mb-2">File Name</Label>
                  <p className="text-sm">{selectedRecord.filename}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Record Type</Label>
                  <p className="text-sm">{selectedRecord.type}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Doctor</Label>
                  <p className="text-sm">{selectedRecord.doctor}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Company</Label>
                  <p className="text-sm">{selectedRecord.company || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Ordered Date</Label>
                  <p className="text-sm">{selectedRecord.ordered_date}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Received Date</Label>
                  <p className="text-sm">{selectedRecord.received_date}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Reported Date</Label>
                  <p className="text-sm">{selectedRecord.reported_date}</p>
                </div>
            </div>

            <div className="col-span-2 my-4">
                <Separator className="border-t" />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-1 gap-4">
                <div>
                  <Label className="font-semibold mb-2">Remarks</Label>
                  <p className="text-sm">{selectedRecord.remarks || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Impressions</Label>
                  <p className="text-sm">{selectedRecord.impressions}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Recommendations</Label>
                  <p className="text-sm">{selectedRecord.recommendations || 'N/A'}</p>
                </div>
                <div>
                  <Label className="font-semibold mb-2">Notes</Label>
                  <p className="text-sm">{selectedRecord.notes || 'N/A'}</p>
                </div>
              </div>
            </div>
            
            <div className="p-4">
              <Button
                className="w-full"
                onClick={() => handleDownload(selectedRecord.fileurl, selectedRecord.filename)}
                disabled={!selectedRecord.fileurl}
              >
                <FileDown />
                Download File
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}