"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { HardDrive, Plus, Edit, Trash2, Power, PowerOff, Check, X } from "lucide-react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import type { HD } from "@/lib/types"
import { useToast } from "@/hooks/use-toast"

export function HDManagement() {
  const { toast } = useToast()
  const [hds, setHds] = useState<HD[]>([])
  const [dialogOpen, setDialogOpen] = useState(false)
  const [isEditing, setIsEditing] = useState(false)
  const [currentHd, setCurrentHd] = useState<HD | null>(null)
  const [formData, setFormData] = useState({
    name: "",
    path: "",
    totalSpace: 0,
    freeSpace: 0,
    color: "#3B82F6",
  })

  const [isFileSystemAccessSupported, setIsFileSystemAccessSupported] = useState(false)

  // Check if the File System Access API is supported
  useEffect(() => {
    setIsFileSystemAccessSupported(
      "showDirectoryPicker" in window ||
        (navigator.userAgent.includes("Chrome") && Number.parseInt(navigator.userAgent.split("Chrome/")[1]) >= 86),
    )
  }, [])

  // Function to select directory path
  const selectDirectoryPath = async () => {
    try {
      // @ts-ignore - TypeScript doesn't know about showDirectoryPicker yet
      const directoryHandle = await window.showDirectoryPicker()
      if (directoryHandle) {
        setFormData({ ...formData, path: directoryHandle.name })
        toast({
          title: "Folder Selected",
          description: `Selected folder: ${directoryHandle.name}`,
        })
      }
    } catch (error) {
      // User cancelled or browser doesn't support it
      if (error instanceof Error && error.name !== "AbortError") {
        toast({
          title: "Error",
          description: "Could not access file system. Please enter the path manually.",
          variant: "destructive",
        })
      }
    }
  }

  useEffect(() => {
    // Load data from localStorage
    const storedHds = localStorage.getItem("hds")

    if (storedHds) {
      setHds(JSON.parse(storedHds))
    }
  }, [])

  const openAddDialog = () => {
    setIsEditing(false)
    setCurrentHd(null)
    setFormData({
      name: "",
      path: "",
      totalSpace: 1000000000000, // 1TB default
      freeSpace: 500000000000, // 500GB default
      color: "#3B82F6",
    })
    setDialogOpen(true)
  }

  const openEditDialog = (hd: HD) => {
    setIsEditing(true)
    setCurrentHd(hd)
    setFormData({
      name: hd.name,
      path: hd.path,
      totalSpace: hd.totalSpace,
      freeSpace: hd.freeSpace,
      color: hd.color,
    })
    setDialogOpen(true)
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target

    if (name === "totalSpace" || name === "freeSpace") {
      // Convert TB to bytes
      const valueInTB = Number.parseFloat(value)
      const valueInBytes = valueInTB * 1000000000000
      setFormData({ ...formData, [name]: valueInBytes })
    } else {
      setFormData({ ...formData, [name]: value })
    }
  }

  const saveHd = () => {
    if (!formData.name || !formData.path) {
      toast({
        title: "Error",
        description: "Name and path are required.",
        variant: "destructive",
      })
      return
    }

    if (formData.freeSpace > formData.totalSpace) {
      toast({
        title: "Error",
        description: "Free space cannot be greater than total space.",
        variant: "destructive",
      })
      return
    }

    const updatedHds = [...hds]

    if (isEditing && currentHd) {
      // Update existing HD
      const index = updatedHds.findIndex((hd) => hd.id === currentHd.id)
      if (index !== -1) {
        updatedHds[index] = {
          ...currentHd,
          name: formData.name,
          path: formData.path,
          totalSpace: formData.totalSpace,
          freeSpace: formData.freeSpace,
          color: formData.color,
        }
      }
    } else {
      // Add new HD
      const newHd: HD = {
        id: Date.now().toString(),
        name: formData.name,
        path: formData.path,
        connected: true,
        totalSpace: formData.totalSpace,
        freeSpace: formData.freeSpace,
        color: formData.color,
      }
      updatedHds.push(newHd)
    }

    setHds(updatedHds)
    localStorage.setItem("hds", JSON.stringify(updatedHds))
    setDialogOpen(false)

    toast({
      title: isEditing ? "HD Updated" : "HD Added",
      description: `${formData.name} has been ${isEditing ? "updated" : "added"} successfully.`,
    })
  }

  const deleteHd = (id: string) => {
    // Check if any series are using this HD
    const storedSeries = localStorage.getItem("series")
    if (storedSeries) {
      const series = JSON.parse(storedSeries)
      const seriesUsingHd = series.filter((s: any) => s.hdId === id)

      if (seriesUsingHd.length > 0) {
        toast({
          title: "Cannot Delete HD",
          description: `This HD is being used by ${seriesUsingHd.length} series. Please move them to another HD first.`,
          variant: "destructive",
        })
        return
      }
    }

    const updatedHds = hds.filter((hd) => hd.id !== id)
    setHds(updatedHds)
    localStorage.setItem("hds", JSON.stringify(updatedHds))

    toast({
      title: "HD Deleted",
      description: "The HD has been deleted successfully.",
    })
  }

  const toggleHdConnection = (id: string) => {
    const updatedHds = hds.map((hd) => (hd.id === id ? { ...hd, connected: !hd.connected } : hd))

    setHds(updatedHds)
    localStorage.setItem("hds", JSON.stringify(updatedHds))

    const hd = updatedHds.find((hd) => hd.id === id)

    toast({
      title: hd?.connected ? "HD Connected" : "HD Disconnected",
      description: `${hd?.name} is now ${hd?.connected ? "connected" : "disconnected"}.`,
    })
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <div>
          <h1 className="text-2xl font-bold text-blue-900">HD Management</h1>
          <p className="text-blue-700">Manage your storage devices</p>
        </div>

        <Button onClick={openAddDialog}>
          <Plus className="mr-2 h-4 w-4" />
          Add HD
        </Button>
      </div>

      {hds.length === 0 ? (
        <div className="flex h-40 flex-col items-center justify-center rounded-lg border border-dashed border-blue-300 bg-blue-50/50 p-8 text-center">
          <HardDrive className="mb-2 h-10 w-10 text-blue-400" />
          <p className="text-blue-700">No hard drives added yet.</p>
          <Button variant="link" onClick={openAddDialog}>
            Add your first HD
          </Button>
        </div>
      ) : (
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {hds.map((hd) => (
            <Card key={hd.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-3 rounded-full" style={{ backgroundColor: hd.color }} />
                    <CardTitle>{hd.name}</CardTitle>
                  </div>
                  <Badge variant={hd.connected ? "default" : "destructive"}>
                    {hd.connected ? "Connected" : "Disconnected"}
                  </Badge>
                </div>
                <CardDescription>{hd.path}</CardDescription>
              </CardHeader>
              <CardContent>
                {hd.connected && (
                  <>
                    <div className="mb-1 flex items-center justify-between text-sm">
                      <span>Storage Usage</span>
                      <span>
                        {((hd.totalSpace - hd.freeSpace) / 1000000000000).toFixed(1)} TB /{" "}
                        {(hd.totalSpace / 1000000000000).toFixed(1)} TB
                      </span>
                    </div>
                    <Progress
                      value={Math.round((1 - hd.freeSpace / hd.totalSpace) * 100)}
                      className="h-2 bg-blue-100"
                    />
                    <div className="mt-1 text-xs text-blue-600">
                      {(hd.freeSpace / 1000000000000).toFixed(1)} TB Free (
                      {Math.round((hd.freeSpace / hd.totalSpace) * 100)}%)
                    </div>
                  </>
                )}

                <div className="mt-4 flex justify-end gap-2">
                  <Button variant="outline" size="sm" onClick={() => toggleHdConnection(hd.id)}>
                    {hd.connected ? (
                      <>
                        <PowerOff className="mr-2 h-4 w-4 text-red-500" />
                        Disconnect
                      </>
                    ) : (
                      <>
                        <Power className="mr-2 h-4 w-4 text-green-500" />
                        Connect
                      </>
                    )}
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => openEditDialog(hd)}>
                    <Edit className="mr-2 h-4 w-4" />
                    Edit
                  </Button>

                  <Button variant="outline" size="sm" onClick={() => deleteHd(hd.id)}>
                    <Trash2 className="mr-2 h-4 w-4 text-red-500" />
                    Delete
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit HD" : "Add New HD"}</DialogTitle>
            <DialogDescription>
              {isEditing ? "Update the details of your hard drive." : "Add a new hard drive to your collection."}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="name">HD Name</Label>
              <Input
                id="name"
                name="name"
                placeholder="Main Media HD"
                value={formData.name}
                onChange={handleInputChange}
              />
            </div>

            <div className="grid gap-2">
              <Label htmlFor="path">Path</Label>
              <div className="flex gap-2">
                <Input
                  id="path"
                  name="path"
                  placeholder="D:/Media"
                  value={formData.path}
                  onChange={handleInputChange}
                  className="flex-1"
                />
                <Button type="button" variant="outline" onClick={selectDirectoryPath} className="whitespace-nowrap">
                  Select Folder
                </Button>
              </div>
              {!isFileSystemAccessSupported && (
                <p className="text-xs text-amber-600">
                  Note: Directory selection is not supported in your browser. You'll need to enter the path manually.
                </p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="totalSpace">Total Space (TB)</Label>
                <Input
                  id="totalSpace"
                  name="totalSpace"
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={(formData.totalSpace / 1000000000000).toFixed(1)}
                  onChange={handleInputChange}
                />
              </div>

              <div className="grid gap-2">
                <Label htmlFor="freeSpace">Free Space (TB)</Label>
                <Input
                  id="freeSpace"
                  name="freeSpace"
                  type="number"
                  step="0.1"
                  min="0"
                  max={(formData.totalSpace / 1000000000000).toFixed(1)}
                  value={(formData.freeSpace / 1000000000000).toFixed(1)}
                  onChange={handleInputChange}
                />
              </div>
            </div>

            <div className="grid gap-2">
              <Label htmlFor="color">Color</Label>
              <div className="flex gap-2">
                <Input
                  id="color"
                  name="color"
                  type="color"
                  className="w-12"
                  value={formData.color}
                  onChange={handleInputChange}
                />
                <Input name="color" value={formData.color} onChange={handleInputChange} />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setDialogOpen(false)}>
              <X className="mr-2 h-4 w-4" />
              Cancel
            </Button>
            <Button onClick={saveHd}>
              <Check className="mr-2 h-4 w-4" />
              {isEditing ? "Update" : "Add"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

