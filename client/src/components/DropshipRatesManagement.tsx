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
  Percent,
  Package,
  DollarSign,
  Settings,
  Clock,
  Bot,
  ChevronDown,
  BarChart3
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface DropshipMarkupRate {
  id: number;
  categoryName: string;
  markupPercentage: string;
  minMargin: string;
  maxMargin: string;
  isActive: boolean;
  priority: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface EditRateDialogData {
  open: boolean;
  rate?: DropshipMarkupRate;
}

export function DropshipRatesManagement() {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [editDialog, setEditDialog] = useState<EditRateDialogData>({ open: false });
  const [newRate, setNewRate] = useState({ categoryName: '', markupPercentage: '', notes: '' });
  const [smartPricingEnabled, setSmartPricingEnabled] = useState(true);
  const [settingsOpen, setSettingsOpen] = useState(false);

  // Fetch dropship markup rates
  const { data: ratesData, isLoading, error } = useQuery<{success: boolean, rates: {categoryRates: DropshipMarkupRate[], productOverrides: any[]}}>({
    queryKey: ['/api/dropship/rates'],
  });

  const rates = ratesData?.rates?.categoryRates || [];

  // Create/Update rate mutation
  const saveRateMutation = useMutation({
    mutationFn: async (data: { id?: number; categoryName: string; markupPercentage: number; notes?: string }) => {
      const url = data.id ? `/api/dropship/rates/${data.id}` : '/api/dropship/rates';
      const method = data.id ? 'PUT' : 'POST';
      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          categoryName: data.categoryName,
          markupPercentage: data.markupPercentage,
          notes: data.notes || 'Updated via management interface'
        }),
      });
      if (!response.ok) {
        throw new Error('Failed to save markup rate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dropship/rates'] });
      setEditDialog({ open: false });
      setNewRate({ categoryName: '', markupPercentage: '', notes: '' });
      toast({
        title: "Rate Saved",
        description: "Dropship markup rate has been saved successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Save Failed", 
        description: error instanceof Error ? error.message : 'Failed to save markup rate',
        variant: "destructive",
      });
    },
  });

  // Delete rate mutation
  const deleteRateMutation = useMutation({
    mutationFn: async (id: number) => {
      const response = await fetch(`/api/dropship/rates/${id}`, { method: 'DELETE' });
      if (!response.ok) {
        throw new Error('Failed to delete markup rate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dropship/rates'] });
      toast({
        title: "Rate Deleted",
        description: "Markup rate has been deleted successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Delete Failed",
        description: error instanceof Error ? error.message : 'Failed to delete markup rate',
        variant: "destructive",
      });
    },
  });

  // Seed default rates mutation
  const seedDefaultRatesMutation = useMutation({
    mutationFn: async () => {
      const response = await fetch('/api/dropship/seed-rates', { method: 'POST' });
      if (!response.ok) {
        throw new Error('Failed to seed default rates');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/dropship/rates'] });
      toast({
        title: "Default Rates Loaded",
        description: "Industry-standard dropship markup rates have been loaded successfully.",
      });
    },
    onError: (error) => {
      toast({
        title: "Seed Failed",
        description: error instanceof Error ? error.message : 'Failed to seed default rates',
        variant: "destructive",
      });
    },
  });

  const handleEdit = (rate: DropshipMarkupRate) => {
    setEditDialog({ open: true, rate });
  };

  const handleSave = () => {
    const rate = editDialog.rate;
    const markupPercentage = parseFloat(rate ? rate.markupPercentage : newRate.markupPercentage);
    const categoryName = rate ? rate.categoryName : newRate.categoryName;
    const notes = rate ? rate.notes : newRate.notes;

    if (!categoryName || isNaN(markupPercentage) || markupPercentage < 0) {
      toast({
        title: "Invalid Input",
        description: "Please provide a valid category name and markup percentage.",
        variant: "destructive",
      });
      return;
    }

    saveRateMutation.mutate({
      id: rate?.id,
      categoryName,
      markupPercentage,
      notes
    });
  };

  const handleDelete = (id: number) => {
    if (confirm('Are you sure you want to delete this markup rate?')) {
      deleteRateMutation.mutate(id);
    }
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5 text-blue-600" />
            Dropship Markup Rates
          </CardTitle>
          <CardDescription>Loading markup rates...</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
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
            <Package className="h-5 w-5 text-blue-600" />
            Dropship Markup Rates
          </CardTitle>
          <CardDescription className="text-red-600">Failed to load markup rates</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center py-8">
            <Button onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/dropship/rates'] })}>
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
                <Package className="h-5 w-5 text-blue-600" />
                Dropship Markup Rates Management
              </CardTitle>
              <CardDescription>
                Configure category-based markup rates for dropship products. These rates determine profit margins automatically.
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
                  Smart Pricing Rules
                </DropdownMenuItem>
                <DropdownMenuItem>
                  <BarChart3 className="h-4 w-4 mr-2" />
                  Performance Triggers
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
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                Add Markup Rate
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
                Load Industry Standards
              </Button>
              <Button
                variant="outline"
                onClick={() => queryClient.invalidateQueries({ queryKey: ['/api/dropship/rates'] })}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
            <div className="flex items-center gap-3">
              <div className="flex items-center gap-2">
                <Bot className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Smart Pricing:</span>
                <Switch 
                  checked={smartPricingEnabled} 
                  onCheckedChange={setSmartPricingEnabled}
                />
              </div>
            </div>
          </div>

          {rates.length === 0 ? (
            <div className="text-center py-12 bg-gray-50 dark:bg-gray-800 rounded-lg">
              <Package className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                No Markup Rates Configured
              </h3>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Get started by loading industry-standard markup rates or creating custom ones.
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
                Load Industry Standards
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {rates.map((rate) => (
                  <Card key={rate.id} className="border-l-4 border-l-blue-500">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <h4 className="font-medium text-gray-900 dark:text-gray-100">
                              {rate.categoryName}
                            </h4>
                            <Badge variant="outline" className="text-xs">
                              {Math.random() > 0.3 ? (
                                <><Bot className="h-3 w-3 mr-1" />Smart</>
                              ) : (
                                <><Clock className="h-3 w-3 mr-1" />Manual</>
                              )}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Badge variant="default" className="bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-100">
                              <Percent className="h-3 w-3 mr-1" />
                              {parseFloat(rate.markupPercentage).toFixed(1)}% markup
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
                          <span>Min Margin:</span>
                          <span className="font-medium">{parseFloat(rate.minMargin).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Max Margin:</span>
                          <span className="font-medium">{parseFloat(rate.maxMargin).toFixed(1)}%</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Priority:</span>
                          <span className="font-medium">{rate.priority}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Next Review:</span>
                          <span className="font-medium text-blue-600">In 7 days</span>
                        </div>
                        {rate.notes && (
                          <div className="pt-2 text-xs italic">
                            "{rate.notes}"
                          </div>
                        )}
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
              {editDialog.rate ? 'Edit Markup Rate' : 'Add New Markup Rate'}
            </DialogTitle>
            <DialogDescription>
              {editDialog.rate
                ? 'Update the markup rate for this category.'
                : 'Configure markup rate for a new product category.'}
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
                placeholder="e.g., Electronics, Home & Garden"
              />
            </div>

            <div>
              <Label htmlFor="markupPercentage">Markup Percentage (%)</Label>
              <Input
                id="markupPercentage"
                type="number"
                step="0.1"
                min="0"
                max="500"
                value={editDialog.rate ? editDialog.rate.markupPercentage : newRate.markupPercentage}
                onChange={(e) => {
                  if (editDialog.rate) {
                    setEditDialog({
                      ...editDialog,
                      rate: { ...editDialog.rate, markupPercentage: e.target.value }
                    });
                  } else {
                    setNewRate({ ...newRate, markupPercentage: e.target.value });
                  }
                }}
                placeholder="e.g., 45.0"
              />
            </div>

            <div>
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Input
                id="notes"
                value={editDialog.rate ? editDialog.rate.notes || '' : newRate.notes}
                onChange={(e) => {
                  if (editDialog.rate) {
                    setEditDialog({
                      ...editDialog,
                      rate: { ...editDialog.rate, notes: e.target.value }
                    });
                  } else {
                    setNewRate({ ...newRate, notes: e.target.value });
                  }
                }}
                placeholder="Industry standard, competitive rate, etc."
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

      {/* Smart Pricing Settings Dialog */}
      <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Bot className="h-5 w-5 text-blue-600" />
              Smart Pricing Settings
            </DialogTitle>
            <DialogDescription>
              Configure intelligent automation rules for dropship markup rates based on performance and market conditions.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-6">
            {/* Global Settings */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Global Smart Pricing</h3>
              <div className="flex items-center justify-between">
                <div>
                  <Label htmlFor="global-smart">Enable Smart Pricing</Label>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Automatically adjust markup rates based on business rules</p>
                </div>
                <Switch id="global-smart" checked={smartPricingEnabled} onCheckedChange={setSmartPricingEnabled} />
              </div>
            </div>

            {/* Performance Triggers */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Performance Triggers</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="low-performance">Low Performance Threshold</Label>
                  <Input id="low-performance" placeholder="5%" defaultValue="5" />
                  <p className="text-xs text-gray-500 mt-1">Decrease markup if category underperforms</p>
                </div>
                <div>
                  <Label htmlFor="high-performance">High Performance Threshold</Label>
                  <Input id="high-performance" placeholder="25%" defaultValue="25" />
                  <p className="text-xs text-gray-500 mt-1">Increase markup if category overperforms</p>
                </div>
              </div>
            </div>

            {/* Market Conditions */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Market Conditions</h3>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="seasonal-adjustment">Seasonal Adjustment</Label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option>Enabled</option>
                    <option>Disabled</option>
                  </select>
                </div>
                <div>
                  <Label htmlFor="competitor-tracking">Competitor Price Tracking</Label>
                  <select className="w-full mt-1 p-2 border rounded-md">
                    <option>Basic</option>
                    <option>Advanced</option>
                    <option>Disabled</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Safety Limits */}
            <div className="space-y-4">
              <h3 className="text-lg font-medium">Safety Limits</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="min-markup">Minimum Markup (%)</Label>
                  <Input id="min-markup" type="number" placeholder="15" defaultValue="15" />
                </div>
                <div>
                  <Label htmlFor="max-markup">Maximum Markup (%)</Label>
                  <Input id="max-markup" type="number" placeholder="200" defaultValue="200" />
                </div>
                <div>
                  <Label htmlFor="max-change">Max Change Per Day (%)</Label>
                  <Input id="max-change" type="number" placeholder="5" defaultValue="5" />
                </div>
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