'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Plus, Edit2, Trash2, GripVertical } from 'lucide-react';
import { toast } from 'sonner';

type MasterListItem = {
  id: string;
  value: string;
  sortOrder: number;
  isActive: boolean;
  netsuiteInternalId?: number | null;
};

type ListKey = {
  id: string;
  keyName: string;
  description?: string | null;
  masterListItems: MasterListItem[];
  _count: { masterListItems: number };
};

type Props = {
  initialListKeys: ListKey[];
};

export default function MasterListManager({ initialListKeys }: Props) {
  const [listKeys, setListKeys] = useState<ListKey[]>(initialListKeys);
  const [selectedKey, setSelectedKey] = useState<ListKey | null>(
    initialListKeys[0] || null
  );
  const [isAddingKey, setIsAddingKey] = useState(false);
  const [isAddingItem, setIsAddingItem] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [newKeyDescription, setNewKeyDescription] = useState('');
  const [newItemValue, setNewItemValue] = useState('');
  const [newItemSortOrder, setNewItemSortOrder] = useState(0);
  const [editingItem, setEditingItem] = useState<MasterListItem | null>(null);

  const handleAddListKey = async () => {
    if (!newKeyName.trim()) {
      toast.error('Key name is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/list-keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          keyName: newKeyName,
          description: newKeyDescription,
        }),
      });

      if (!response.ok) throw new Error('Failed to create list key');

      const newKey = await response.json();
      setListKeys([...listKeys, { ...newKey, masterListItems: [], _count: { masterListItems: 0 } }]);
      setNewKeyName('');
      setNewKeyDescription('');
      setIsAddingKey(false);
      toast.success('List key created');
    } catch {
      toast.error('Failed to create list key');
    }
  };

  const handleAddItem = async () => {
    if (!selectedKey || !newItemValue.trim()) {
      toast.error('Value is required');
      return;
    }

    try {
      const response = await fetch('/api/admin/master-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listKeyId: selectedKey.id,
          value: newItemValue,
          sortOrder: newItemSortOrder,
        }),
      });

      if (!response.ok) throw new Error('Failed to create item');

      const newItem = await response.json();

      // Update local state
      const updatedKeys = listKeys.map(key => {
        if (key.id === selectedKey.id) {
          return {
            ...key,
            masterListItems: [...key.masterListItems, newItem],
            _count: { masterListItems: key._count.masterListItems + 1 },
          };
        }
        return key;
      });

      setListKeys(updatedKeys);
      setSelectedKey(updatedKeys.find(k => k.id === selectedKey.id) || null);
      setNewItemValue('');
      setNewItemSortOrder(0);
      setIsAddingItem(false);
      toast.success('Item added');
    } catch {
      toast.error('Failed to add item');
    }
  };

  const handleUpdateItem = async () => {
    if (!editingItem) return;

    try {
      const response = await fetch(`/api/admin/master-list/${editingItem.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          value: editingItem.value,
          sortOrder: editingItem.sortOrder,
        }),
      });

      if (!response.ok) throw new Error('Failed to update item');

      // Update local state
      const updatedKeys = listKeys.map(key => ({
        ...key,
        masterListItems: key.masterListItems.map(item =>
          item.id === editingItem.id ? editingItem : item
        ),
      }));

      setListKeys(updatedKeys);
      setSelectedKey(updatedKeys.find(k => k.id === selectedKey?.id) || null);
      setEditingItem(null);
      toast.success('Item updated');
    } catch {
      toast.error('Failed to update item');
    }
  };

  const handleDeleteItem = async (itemId: string) => {
    if (!confirm('Are you sure you want to deactivate this item?')) return;

    try {
      const response = await fetch(`/api/admin/master-list/${itemId}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete item');

      // Update local state
      const updatedKeys = listKeys.map(key => ({
        ...key,
        masterListItems: key.masterListItems.filter(item => item.id !== itemId),
        _count: {
          masterListItems: key.masterListItems.filter(item => item.id !== itemId).length,
        },
      }));

      setListKeys(updatedKeys);
      setSelectedKey(updatedKeys.find(k => k.id === selectedKey?.id) || null);
      toast.success('Item deactivated');
    } catch {
      toast.error('Failed to delete item');
    }
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* List Keys Panel */}
      <Card className="lg:col-span-1">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">List Categories</CardTitle>
          <Dialog open={isAddingKey} onOpenChange={setIsAddingKey}>
            <DialogTrigger asChild>
              <Button size="sm" className="gap-1">
                <Plus className="h-4 w-4" />
                Add
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add New List Category</DialogTitle>
                <DialogDescription>
                  Create a new category for dropdown options
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label>Key Name</Label>
                  <Input
                    value={newKeyName}
                    onChange={(e) => setNewKeyName(e.target.value)}
                    placeholder="e.g., Industry, WearType, DurationUnit"
                  />
                </div>
                <div>
                  <Label>Description</Label>
                  <Input
                    value={newKeyDescription}
                    onChange={(e) => setNewKeyDescription(e.target.value)}
                    placeholder="What this list controls"
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddingKey(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddListKey}>Create</Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardHeader>
        <CardContent>
          <div className="space-y-2">
            {listKeys.map((key) => (
              <Button
                key={key.id}
                variant={selectedKey?.id === key.id ? 'default' : 'ghost'}
                className="w-full justify-between"
                onClick={() => setSelectedKey(key)}
              >
                <span>{key.keyName}</span>
                <span className="text-xs opacity-70">
                  {key._count.masterListItems} items
                </span>
              </Button>
            ))}
            {listKeys.length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-4">
                No list categories yet. Create one to get started.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Items Panel */}
      <Card className="lg:col-span-2">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="text-lg">
            {selectedKey ? `${selectedKey.keyName} Items` : 'Select a Category'}
          </CardTitle>
          {selectedKey && (
            <Dialog open={isAddingItem} onOpenChange={setIsAddingItem}>
              <DialogTrigger asChild>
                <Button size="sm" className="gap-1">
                  <Plus className="h-4 w-4" />
                  Add Item
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add New Item</DialogTitle>
                  <DialogDescription>
                    Add a new option to {selectedKey.keyName}
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label>Value</Label>
                    <Input
                      value={newItemValue}
                      onChange={(e) => setNewItemValue(e.target.value)}
                      placeholder="e.g., Mining & Quarrying"
                    />
                  </div>
                  <div>
                    <Label>Sort Order</Label>
                    <Input
                      type="number"
                      value={newItemSortOrder}
                      onChange={(e) => setNewItemSortOrder(parseInt(e.target.value) || 0)}
                      placeholder="0"
                    />
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingItem(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddItem}>Add</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </CardHeader>
        <CardContent>
          {selectedKey ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-12">#</TableHead>
                  <TableHead>Value</TableHead>
                  <TableHead className="w-24">Order</TableHead>
                  <TableHead className="w-24">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedKey.masterListItems.map((item) => (
                  <TableRow key={item.id}>
                    <TableCell>
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </TableCell>
                    <TableCell>{item.value}</TableCell>
                    <TableCell>{item.sortOrder}</TableCell>
                    <TableCell>
                      <div className="flex gap-1">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => setEditingItem(item)}
                        >
                          <Edit2 className="h-4 w-4" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive"
                          onClick={() => handleDeleteItem(item.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
                {selectedKey.masterListItems.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={4} className="text-center text-muted-foreground">
                      No items yet. Add one to get started.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          ) : (
            <p className="text-center text-muted-foreground py-8">
              Select a category from the left to manage its items
            </p>
          )}
        </CardContent>
      </Card>

      {/* Edit Item Dialog */}
      <Dialog open={!!editingItem} onOpenChange={(open) => !open && setEditingItem(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Edit Item</DialogTitle>
          </DialogHeader>
          {editingItem && (
            <div className="space-y-4">
              <div>
                <Label>Value</Label>
                <Input
                  value={editingItem.value}
                  onChange={(e) =>
                    setEditingItem({ ...editingItem, value: e.target.value })
                  }
                />
              </div>
              <div>
                <Label>Sort Order</Label>
                <Input
                  type="number"
                  value={editingItem.sortOrder}
                  onChange={(e) =>
                    setEditingItem({
                      ...editingItem,
                      sortOrder: parseInt(e.target.value) || 0,
                    })
                  }
                />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditingItem(null)}>
              Cancel
            </Button>
            <Button onClick={handleUpdateItem}>Save</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
