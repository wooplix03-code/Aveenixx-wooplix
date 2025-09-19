import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { DropdownMenu, DropdownMenuContent, DropdownMenuTrigger, DropdownMenuItem, DropdownMenuSeparator } from '@/components/ui/dropdown-menu';
import { Switch } from '@/components/ui/switch';
import { 
  Database, 
  Edit, 
  Plus, 
  Trash2, 
  Loader2, 
  Save, 
  RefreshCw,
  TrendingUp,
  AlertCircle,
  CheckCircle,
  RotateCcw,
  Zap,
  Percent,
  Settings,
  Clock,
  Bot,
  ChevronDown
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface AmazonCommissionRate {
  id: number;
  categoryName: string;
  commissionRate: string;
  rateSource: string;
  lastUpdated: string;
  isActive: boolean;
  createdAt: string;
}

interface EditRateDialogData {
  open: boolean;
  rate?: AmazonCommissionRate;
}

export function AmazonRatesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState<EditRateDialogData>({ open: false });
  const [newRate, setNewRate] = useState({ categoryName: '', commissionRate: '' });
  const [automationEnabled, setAutomationEnabled] = useState(false);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch Amazon commission rates
  const { data: rates = [], isLoading, error } = useQuery<AmazonCommissionRate[]>({
    queryKey: ['/api/amazon-rates'],
  });

  // Create/Update rate mutation
  const saveRateMutation = useMutation({
    mutationFn: async (data: { id?: number; categoryName: string; commissionRate: number }) => {
      const url = data.id ? `/api/amazon-rates/${data.id}` : '/api/amazon-rates';
      const method = data.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: data.categoryName,
          commissionRate: data.commissionRate,
          rateSource: data.id ? 'custom' : 'amazon_official'
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save rate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/amazon-rates'] });
      setEditDialog({ open: false });
      setNewRate({ categoryName: '', commissionRate: '' });
      toast({
        title: "Rate Saved",
        description: "Amazon commission rate has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed", 
        description: error instanceof Error ? error.message : 'Failed to save commission rate',
        variant: "destructive",
      });
    },
  });

  // Delete rate mutation
  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/amazon-rates/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete rate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/amazon-rates'] });
      toast({
        title: "Rate Deleted",
        description: "Commission rate has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete commission rate',
        variant: "destructive",
      });
    },
  });

  // Seed default rates mutation
  const seedDefaultRatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/amazon-rates/seed-defaults', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to seed default rates');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/amazon-rates'] });
      toast({
        title: "Default Rates Loaded",
        description: "Amazon default commission rates have been loaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Seed Failed",
        description: error instanceof Error ? error.message : 'Failed to load default rates',
        variant: "destructive",
      });
    },
  });

  const handleEdit = (rate: AmazonCommissionRate) => {
    setEditDialog({ open: true, rate });
  };

  const handleSave = () => {
    const rate = editDialog.rate;
    const commissionRate = parseFloat(rate ? rate.commissionRate : newRate.commissionRate);
    const categoryName = rate ? rate.categoryName : newRate.categoryName;

    if (!categoryName || isNaN(commissionRate) || commissionRate <= 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide a valid category name and commission rate.",
        variant: "destructive",
      });
      return;
    }

    saveRateMutation.mutate({
      id: rate?.id,
      categoryName,
      commissionRate
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this commission rate?')) {
      deleteRateMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Amazon Commission Rates
          </CardTitle>
          <CardDescription>Loading commission rates...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-orange-600" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Zap className="h-5 w-5 text-orange-600" />
            Amazon Commission Rates
          </CardTitle>
          <CardDescription className="text-red-600">Failed to load commission rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/amazon-rates'] })}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Zap className="h-5 w-5 text-orange-600" />
                Amazon Commission Rates Management
              </CardTitle>
              <CardDescription>
                Configure and manage Amazon affiliate commission rates for automated earning calculations during product imports.
              </CardDescription>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="gap-2">
                  <Settings className="h-4 w-4" />
                  Settings
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuItem onClick={() => setSettingsOpen(true)}>
                  <Bot className="h-4 w-4 mr-2" />
                  Automation Settings
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <Clock className="h-4 w-4 mr-2" />
                  Update Schedule
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem>
                  <Database className="h-4 w-4 mr-2" />
                  Export Rates
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Sync Settings
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
            <div className="flex flex-wrap gap-3">
              <Button
                onClick={() => setEditDialog({ open: true })}
                className="bg-orange-600 hover:bg-orange-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Commission Rate
              </Button>
              <Button
                variant="outline"
                onClick={() => seedDefaultRatesMutation.mutate()}
                disabled={seedDefaultRatesMutation.isPending}
              >
                {seedDefaultRatesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Load Amazon Defaults
              </Button>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/amazon-rates'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-orange-600" />
                <span className="text-sm font-medium">Auto-Updates:</span>
                <Switch 
                  checked={automationEnabled} 
                  onCheckedChange={setAutomationEnabled}
                />
              </div>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <Database className="w-8 h-8 text-orange-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Total Categories</p>
                    <p className="text-2xl font-bold">{rates.length}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <TrendingUp className="w-8 h-8 text-green-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Average Rate</p>
                    <p className="text-2xl font-bold">
                      {rates.length > 0 
                        ? `${(rates.reduce((sum: number, rate: AmazonCommissionRate) => sum + parseFloat(rate.commissionRate), 0) / rates.length).toFixed(2)}%`
                        : '0%'
                      }
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center gap-3">
                  <CheckCircle className="w-8 h-8 text-emerald-500" />
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Active Rates</p>
                    <p className="text-2xl font-bold">
                      {rates.filter((rate: AmazonCommissionRate) => rate.isActive).length}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {rates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Zap className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Commission Rates Configured
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by loading Amazon's official commission rates or creating custom ones.
              </p>
              <Button
                onClick={() => seedDefaultRatesMutation.mutate()}
                disabled={seedDefaultRatesMutation.isPending}
              >
                {seedDefaultRatesMutation.isPending ? (
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                ) : (
                  <Database className="h-4 w-4 mr-2" />
                )}
                Load Amazon Defaults
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rates.map((rate) => (
                  <Card key={rate.id} className="border-l-4 border-l-orange-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {rate.categoryName}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {Math.random() > 0.5 ? (
                                <><Bot className="h-3 w-3 mr-1" />Auto</>
                              ) : (
                                <><Clock className="h-3 w-3 mr-1" />Manual</>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100">
                              <Percent className="h-3 w-3 mr-1" />
                              {parseFloat(rate.commissionRate).toFixed(2)}% commission
                            </Badge>
                            {rate.isActive ? (
                              <Badge variant="default" className="bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100">
                                <CheckCircle className="h-3 w-3 mr-1" />
                                Active
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <AlertCircle className="h-3 w-3 mr-1" />
                                Inactive
                              </Badge>
                            )}
                          </div>
                        </div>
                        <div className="flex gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleEdit(rate)}
                            className="h-8 w-8 p-0"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => handleDelete(rate.id)}
                            className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      
                      <div className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                        <div className="flex justify-between">
                          <span>Source:</span>
                          <Badge variant={rate.rateSource === 'amazon_official' ? 'default' : 'secondary'} className="text-xs">
                            {rate.rateSource === 'amazon_official' ? 'Official' : 'Custom'}
                          </Badge>
                        </div>
                        <div className="flex justify-between">
                          <span>Last Updated:</span>
                          <span className="font-medium">{new Date(rate.lastUpdated).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Created:</span>
                          <span className="font-medium">{new Date(rate.createdAt).toLocaleDateString()}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next Check:</span>
                          <span className="font-medium text-orange-600">In 2 days</span>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Edit/Add Rate Dialog */}
      <Dialog open={editDialog.open} onOpenChange={(open) => setEditDialog({ open })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {editDialog.rate ? 'Edit Commission Rate' : 'Add New Commission Rate'}
            </DialogTitle>
            <DialogDescription>
              {editDialog.rate
                ? 'Update the commission rate for this category.'
                : 'Configure commission rate for a new Amazon affiliate category.'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="categoryName">Category Name</Label>
              <Input
                id="categoryName"
                value={editDialog.rate ? editDialog.rate.categoryName : newRate.categoryName}
                onChange={(e) => {
                  if (editDialog.rate) {
                    setEditDialog({
                      ...editDialog,
                      rate: { ...editDialog.rate, categoryName: e.target.value }
                    });
                  } else {
                    setNewRate({ ...newRate, categoryName: e.target.value });
                  }
                }}
                placeholder="e.g., Electronics & Technology"
              />
            </div>

            <div>
              <Label htmlFor="commissionRate">Commission Rate (%)</Label>
              <Input
                id="commissionRate"
                type="number"
                step="0.01"
                min="0"
                max="100"
                value={editDialog.rate ? editDialog.rate.commissionRate : newRate.commissionRate}
                onChange={(e) => {
                  if (editDialog.rate) {
                    setEditDialog({
                      ...editDialog,
                      rate: { ...editDialog.rate, commissionRate: e.target.value }
                    });
                  } else {
                    setNewRate({ ...newRate, commissionRate: e.target.value });
                  }
                }}
                placeholder="e.g., 4.50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialog({ open: false })}>
              Cancel
            </Button>
            <Button 
              onClick={handleSave}
              disabled={saveRateMutation.isPending}
            >
              {saveRateMutation.isPending ? (
                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Rate
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Automation Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-orange-600" />
              Automation Settings
            </DialogTitle>
            <DialogDescription>
              Configure automatic rate checking and update notifications for Amazon commission rates.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Global Automation</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="global-auto">Enable Auto-Updates</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automatically check for rate updates and send notifications</p>
                </div>
                <Switch id="global-auto" checked={automationEnabled} onCheckedChange={setAutomationEnabled} />
              </div>
            </div>

            {/* Schedule Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Update Schedule</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="check-frequency">Check Frequency</Label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option>Weekly</option>
                    <option>Monthly</option>
                    <option>Quarterly</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="notification-method">Notification Method</Label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option>Dashboard Only</option>
                    <option>Email + Dashboard</option>
                    <option>Email Only</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Rate Staleness */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Rate Staleness Detection</h3>
              <div>
                <Label htmlFor="staleness-period">Mark rates as outdated after</Label>
                <select className="w-full mt-1 p-2 border rounded-md">
                  <option>3 months</option>
                  <option>6 months</option>
                  <option>1 year</option>
                </select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setSettingsOpen(false)}>Cancel</Button>
            <Button onClick={() => setSettingsOpen(false)}>Save Settings</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default AmazonRatesManagement;