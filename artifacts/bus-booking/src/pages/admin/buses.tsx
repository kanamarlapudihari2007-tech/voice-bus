import { useState, useEffect } from "react";
import { useLocation } from "wouter";
import { useListBuses, getListBusesQueryKey, useCreateBus, useUpdateBus, useDeleteBus, CreateBusRequest } from "@workspace/api-client-react";
import { useAuth } from "@/lib/auth";
import { useToast } from "@/hooks/use-toast";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Plus, Edit2, Trash2, Bus as BusIcon, Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const defaultBusForm: CreateBusRequest = {
  busNumber: "",
  fromLocation: "",
  toLocation: "",
  departureTime: "",
  arrivalTime: "",
  totalSeats: 40,
  price: 50
};

export default function AdminBuses() {
  const [, setLocation] = useLocation();
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!user || user.role !== "ADMIN") {
      setLocation("/");
    }
  }, [user, setLocation]);

  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [formData, setFormData] = useState<CreateBusRequest>(defaultBusForm);

  const { data: buses, isLoading } = useListBuses({
    query: {
      enabled: !!user && user.role === "ADMIN",
      queryKey: getListBusesQueryKey()
    }
  });

  const createBus = useCreateBus();
  const updateBus = useUpdateBus();
  const deleteBus = useDeleteBus();

  const handleOpenDialog = (bus?: any) => {
    if (bus) {
      setEditingId(bus.id);
      setFormData({
        busNumber: bus.busNumber,
        fromLocation: bus.fromLocation,
        toLocation: bus.toLocation,
        departureTime: bus.departureTime,
        arrivalTime: bus.arrivalTime,
        totalSeats: bus.totalSeats,
        price: bus.price
      });
    } else {
      setEditingId(null);
      setFormData(defaultBusForm);
    }
    setIsDialogOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      if (editingId) {
        await updateBus.mutateAsync({
          id: editingId,
          data: formData
        });
        toast({ title: "Bus updated successfully" });
      } else {
        await createBus.mutateAsync({
          data: formData
        });
        toast({ title: "Bus created successfully" });
      }
      
      setIsDialogOpen(false);
      queryClient.invalidateQueries({ queryKey: getListBusesQueryKey() });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Action failed",
        description: error.message || "Failed to save bus",
      });
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm("Are you sure you want to delete this bus?")) return;
    
    try {
      await deleteBus.mutateAsync({ id });
      toast({ title: "Bus deleted successfully" });
      queryClient.invalidateQueries({ queryKey: getListBusesQueryKey() });
    } catch (error: any) {
      toast({
        variant: "destructive",
        title: "Deletion failed",
        description: error.message || "Failed to delete bus",
      });
    }
  };

  const isSubmitting = createBus.isPending || updateBus.isPending;

  if (!user || user.role !== "ADMIN") return null;

  return (
    <Layout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-gray-900">Manage Buses</h1>
            <p className="text-gray-500 mt-1">Add, edit, or remove bus schedules</p>
          </div>
          <Button onClick={() => handleOpenDialog()} data-testid="button-add-bus" className="shadow-sm">
            <Plus className="w-4 h-4 mr-2" /> Add New Bus
          </Button>
        </div>

        <Card className="shadow-sm border-t-4 border-t-primary">
          <CardContent className="p-0">
            <Table>
              <TableHeader className="bg-gray-50">
                <TableRow>
                  <TableHead className="font-bold">Bus No.</TableHead>
                  <TableHead className="font-bold">Route</TableHead>
                  <TableHead className="font-bold">Timing</TableHead>
                  <TableHead className="font-bold text-center">Seats</TableHead>
                  <TableHead className="font-bold text-right">Price</TableHead>
                  <TableHead className="font-bold text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {isLoading ? (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-8 text-gray-500">
                      <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-primary" />
                      Loading buses...
                    </TableCell>
                  </TableRow>
                ) : buses && buses.length > 0 ? (
                  buses.map((bus) => (
                    <TableRow key={bus.id} data-testid={`row-bus-${bus.id}`}>
                      <TableCell className="font-mono font-medium">{bus.busNumber}</TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{bus.fromLocation}</div>
                        <div className="text-sm text-gray-500">to {bus.toLocation}</div>
                      </TableCell>
                      <TableCell>
                        <div className="font-medium text-gray-900">{bus.departureTime}</div>
                        <div className="text-sm text-gray-500">to {bus.arrivalTime}</div>
                      </TableCell>
                      <TableCell className="text-center">
                        <span className={`px-2 py-1 rounded-full text-xs font-bold ${bus.availableSeats < 10 ? 'bg-orange-100 text-orange-700' : 'bg-emerald-100 text-emerald-700'}`}>
                          {bus.availableSeats} / {bus.totalSeats}
                        </span>
                      </TableCell>
                      <TableCell className="text-right font-bold">${bus.price}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="icon" onClick={() => handleOpenDialog(bus)} className="text-blue-600 hover:text-blue-700 hover:bg-blue-50" data-testid={`button-edit-${bus.id}`}>
                            <Edit2 className="w-4 h-4" />
                          </Button>
                          <Button variant="ghost" size="icon" onClick={() => handleDelete(bus.id)} className="text-red-600 hover:text-red-700 hover:bg-red-50" disabled={deleteBus.isPending} data-testid={`button-delete-${bus.id}`}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center py-12">
                      <div className="flex flex-col items-center text-gray-500">
                        <BusIcon className="w-12 h-12 mb-3 text-gray-300" />
                        <p>No buses configured yet.</p>
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Dialog for Create/Edit */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="sm:max-w-[600px]">
            <DialogHeader>
              <DialogTitle>{editingId ? "Edit Bus" : "Add New Bus"}</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit} className="space-y-4 py-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="busNumber">Bus Number</Label>
                  <Input id="busNumber" value={formData.busNumber} onChange={e => setFormData({...formData, busNumber: e.target.value})} required data-testid="input-bus-number" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="price">Price ($)</Label>
                  <Input id="price" type="number" value={formData.price} onChange={e => setFormData({...formData, price: Number(e.target.value)})} required min="1" data-testid="input-bus-price" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="fromLocation">From Location</Label>
                  <Input id="fromLocation" value={formData.fromLocation} onChange={e => setFormData({...formData, fromLocation: e.target.value})} required data-testid="input-bus-from" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="toLocation">To Location</Label>
                  <Input id="toLocation" value={formData.toLocation} onChange={e => setFormData({...formData, toLocation: e.target.value})} required data-testid="input-bus-to" />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="departureTime">Departure Time (e.g. 10:00 AM)</Label>
                  <Input id="departureTime" value={formData.departureTime} onChange={e => setFormData({...formData, departureTime: e.target.value})} required data-testid="input-bus-departure" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="arrivalTime">Arrival Time (e.g. 02:00 PM)</Label>
                  <Input id="arrivalTime" value={formData.arrivalTime} onChange={e => setFormData({...formData, arrivalTime: e.target.value})} required data-testid="input-bus-arrival" />
                </div>
                
                <div className="space-y-2 md:col-span-2">
                  <Label htmlFor="totalSeats">Total Seats</Label>
                  <Input id="totalSeats" type="number" value={formData.totalSeats} onChange={e => setFormData({...formData, totalSeats: Number(e.target.value)})} required min="1" disabled={!!editingId} data-testid="input-bus-seats" />
                  {editingId && <p className="text-xs text-muted-foreground mt-1">Total seats cannot be changed after creation.</p>}
                </div>
              </div>
              <DialogFooter className="pt-4 border-t mt-6">
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSubmitting} data-testid="button-save-bus">
                  {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                  {editingId ? "Save Changes" : "Create Bus"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </div>
    </Layout>
  );
}
