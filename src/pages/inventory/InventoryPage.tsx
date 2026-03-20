import { useState } from 'react';
import { useInventoryItems, useCreateInventoryItem, useSuppliers, useCreateSupplier, useInventoryCategories } from '@/hooks/useInventory';
import { useAuth } from '@/contexts/AuthContext';
import { formatCurrency } from '@/lib/currency';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Plus, Package, Search, AlertTriangle, Truck, ClipboardList } from 'lucide-react';
import PartsRequestsTab from '@/components/inventory/PartsRequestsTab';

export default function InventoryPage() {
  const { role } = useAuth();
  const { data: items, isLoading: itemsLoading } = useInventoryItems();
  const { data: suppliers } = useSuppliers();
  const { data: categories } = useInventoryCategories();
  const createItem = useCreateInventoryItem();
  const createSupplier = useCreateSupplier();

  const [searchTerm, setSearchTerm] = useState('');
  const [isItemDialogOpen, setIsItemDialogOpen] = useState(false);
  const [isSupplierDialogOpen, setIsSupplierDialogOpen] = useState(false);

  // Mechanics can only view inventory and request parts
  const isMechanic = role === 'mechanic';
  const canManageInventory = !isMechanic;

  const [itemForm, setItemForm] = useState({
    name: '',
    sku: '',
    description: '',
    category_id: '',
    quantity: 0,
    min_quantity: 5,
    unit: 'pieces',
    unit_cost: 0,
    supplier_id: '',
    location: '',
  });

  const [supplierForm, setSupplierForm] = useState({
    name: '',
    contact_person: '',
    email: '',
    phone: '',
    address: '',
  });

  const filteredItems = items?.filter(item =>
    item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    item.sku?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const lowStockItems = items?.filter(item => item.quantity <= (item.min_quantity || 5)) || [];

  const handleItemSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createItem.mutateAsync(itemForm);
      setIsItemDialogOpen(false);
      setItemForm({
        name: '',
        sku: '',
        description: '',
        category_id: '',
        quantity: 0,
        min_quantity: 5,
        unit: 'pieces',
        unit_cost: 0,
        supplier_id: '',
        location: '',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  const handleSupplierSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await createSupplier.mutateAsync(supplierForm);
      setIsSupplierDialogOpen(false);
      setSupplierForm({
        name: '',
        contact_person: '',
        email: '',
        phone: '',
        address: '',
      });
    } catch (error) {
      // Error handled by mutation
    }
  };

  if (itemsLoading) {
    return <div className="p-6">Loading inventory...</div>;
  }

  const totalValue = items?.reduce((sum, item) => sum + (item.quantity * (item.unit_cost || 0)), 0) || 0;

  return (
    <div className="p-6 space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">
            {isMechanic ? 'Parts & Inventory' : 'Inventory Management'}
          </h1>
          <p className="text-muted-foreground">
            {isMechanic 
              ? 'View available parts and request what you need' 
              : 'Track parts, supplies, and stock levels'}
          </p>
        </div>
      </div>

      <Tabs defaultValue={isMechanic ? 'requests' : 'items'} className="space-y-6">
        <TabsList>
          {!isMechanic && <TabsTrigger value="items">Inventory Items</TabsTrigger>}
          {!isMechanic && <TabsTrigger value="suppliers">Suppliers</TabsTrigger>}
          <TabsTrigger value="requests" className="gap-1">
            <ClipboardList className="h-4 w-4" />
            Parts Requisition
          </TabsTrigger>
          {isMechanic && <TabsTrigger value="items">View Inventory</TabsTrigger>}
        </TabsList>

        <TabsContent value="items" className="space-y-6">
          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Items</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{items?.length || 0}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Low Stock Items</CardTitle>
                <AlertTriangle className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">{lowStockItems.length}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Stock Value</CardTitle>
                <Package className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatCurrency(totalValue)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Suppliers</CardTitle>
                <Truck className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{suppliers?.length || 0}</div>
              </CardContent>
            </Card>
          </div>

          {/* Low Stock Alert */}
          {lowStockItems.length > 0 && (
            <Card className="border-warning">
              <CardHeader>
                <CardTitle className="text-warning flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5" />
                  Low Stock Alert
                </CardTitle>
                <CardDescription>These items need to be restocked</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {lowStockItems.map(item => (
                    <Badge key={item.id} variant="outline" className="border-warning text-warning">
                      {item.name}: {item.quantity} left
                    </Badge>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Items Table */}
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                <div>
                  <CardTitle>Inventory Items</CardTitle>
                  <CardDescription>All parts and supplies</CardDescription>
                </div>
                <div className="flex gap-2">
                  <div className="relative w-64">
                    <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search items..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-8"
                    />
                  </div>
                  {/* Only show Add Item button for non-mechanics */}
                  {canManageInventory && (
                    <Dialog open={isItemDialogOpen} onOpenChange={setIsItemDialogOpen}>
                      <DialogTrigger asChild>
                        <Button className="gap-2">
                          <Plus className="h-4 w-4" />
                          Add Item
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>Add Inventory Item</DialogTitle>
                          <DialogDescription>Add a new part or supply to inventory</DialogDescription>
                        </DialogHeader>
                        <form onSubmit={handleItemSubmit} className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="name">Item Name</Label>
                              <Input
                                id="name"
                                value={itemForm.name}
                                onChange={(e) => setItemForm({ ...itemForm, name: e.target.value })}
                                required
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="sku">SKU</Label>
                              <Input
                                id="sku"
                                value={itemForm.sku}
                                onChange={(e) => setItemForm({ ...itemForm, sku: e.target.value })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="category">Category</Label>
                            <Select value={itemForm.category_id} onValueChange={(value) => setItemForm({ ...itemForm, category_id: value })}>
                              <SelectTrigger>
                                <SelectValue placeholder="Select category" />
                              </SelectTrigger>
                              <SelectContent>
                                {categories?.map((cat) => (
                                  <SelectItem key={cat.id} value={cat.id}>{cat.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="grid grid-cols-3 gap-4">
                            <div className="space-y-2">
                              <Label htmlFor="quantity">Quantity</Label>
                              <Input
                                id="quantity"
                                type="number"
                                value={itemForm.quantity}
                                onChange={(e) => setItemForm({ ...itemForm, quantity: parseInt(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="min_quantity">Min Qty</Label>
                              <Input
                                id="min_quantity"
                                type="number"
                                value={itemForm.min_quantity}
                                onChange={(e) => setItemForm({ ...itemForm, min_quantity: parseInt(e.target.value) })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label htmlFor="unit_cost">Unit Cost</Label>
                              <Input
                                id="unit_cost"
                                type="number"
                                step="0.01"
                                value={itemForm.unit_cost}
                                onChange={(e) => setItemForm({ ...itemForm, unit_cost: parseFloat(e.target.value) })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="location">Location</Label>
                            <Input
                              id="location"
                              value={itemForm.location}
                              onChange={(e) => setItemForm({ ...itemForm, location: e.target.value })}
                              placeholder="Shelf A1"
                            />
                          </div>
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setIsItemDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="submit" disabled={createItem.isPending}>
                              Add Item
                            </Button>
                          </DialogFooter>
                        </form>
                      </DialogContent>
                    </Dialog>
                  )}
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Name</TableHead>
                    <TableHead>SKU</TableHead>
                    <TableHead>Quantity</TableHead>
                    <TableHead>Unit Cost</TableHead>
                    <TableHead>Location</TableHead>
                    <TableHead>Status</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems?.map((item) => (
                    <TableRow key={item.id}>
                      <TableCell className="font-medium">{item.name}</TableCell>
                      <TableCell className="font-mono">{item.sku || '-'}</TableCell>
                      <TableCell>
                        {item.quantity} {item.unit}
                      </TableCell>
                      <TableCell>{formatCurrency(item.unit_cost)}</TableCell>
                      <TableCell>{item.location || '-'}</TableCell>
                      <TableCell>
                        <Badge variant={item.quantity <= (item.min_quantity || 5) ? 'destructive' : 'default'}>
                          {item.quantity <= (item.min_quantity || 5) ? 'Low Stock' : 'In Stock'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {!isMechanic && (
          <TabsContent value="suppliers" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                  <div>
                    <CardTitle>Suppliers</CardTitle>
                    <CardDescription>Manage your vendors and suppliers</CardDescription>
                  </div>
                  <Dialog open={isSupplierDialogOpen} onOpenChange={setIsSupplierDialogOpen}>
                    <DialogTrigger asChild>
                      <Button className="gap-2">
                        <Plus className="h-4 w-4" />
                        Add Supplier
                      </Button>
                    </DialogTrigger>
                    <DialogContent>
                      <DialogHeader>
                        <DialogTitle>Add Supplier</DialogTitle>
                        <DialogDescription>Add a new vendor</DialogDescription>
                      </DialogHeader>
                      <form onSubmit={handleSupplierSubmit} className="space-y-4">
                        <div className="space-y-2">
                          <Label htmlFor="supplier_name">Company Name</Label>
                          <Input
                            id="supplier_name"
                            value={supplierForm.name}
                            onChange={(e) => setSupplierForm({ ...supplierForm, name: e.target.value })}
                            required
                          />
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                          <div className="space-y-2">
                            <Label htmlFor="contact_person">Contact Person</Label>
                            <Input
                              id="contact_person"
                              value={supplierForm.contact_person}
                              onChange={(e) => setSupplierForm({ ...supplierForm, contact_person: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="phone">Phone</Label>
                            <Input
                              id="phone"
                              value={supplierForm.phone}
                              onChange={(e) => setSupplierForm({ ...supplierForm, phone: e.target.value })}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="email">Email</Label>
                          <Input
                            id="email"
                            type="email"
                            value={supplierForm.email}
                            onChange={(e) => setSupplierForm({ ...supplierForm, email: e.target.value })}
                          />
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="address">Address</Label>
                          <Input
                            id="address"
                            value={supplierForm.address}
                            onChange={(e) => setSupplierForm({ ...supplierForm, address: e.target.value })}
                          />
                        </div>
                        <DialogFooter>
                          <Button type="button" variant="outline" onClick={() => setIsSupplierDialogOpen(false)}>
                            Cancel
                          </Button>
                          <Button type="submit" disabled={createSupplier.isPending}>
                            Add Supplier
                          </Button>
                        </DialogFooter>
                      </form>
                    </DialogContent>
                  </Dialog>
                </div>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Company</TableHead>
                      <TableHead>Contact Person</TableHead>
                      <TableHead>Email</TableHead>
                      <TableHead>Phone</TableHead>
                      <TableHead>Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {suppliers?.map((supplier) => (
                      <TableRow key={supplier.id}>
                        <TableCell className="font-medium">{supplier.name}</TableCell>
                        <TableCell>{supplier.contact_person || '-'}</TableCell>
                        <TableCell>{supplier.email || '-'}</TableCell>
                        <TableCell>{supplier.phone || '-'}</TableCell>
                        <TableCell>
                          <Badge variant={supplier.is_active ? 'default' : 'secondary'}>
                            {supplier.is_active ? 'Active' : 'Inactive'}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </TabsContent>
        )}

        <TabsContent value="requests" className="space-y-6">
          <PartsRequestsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}
