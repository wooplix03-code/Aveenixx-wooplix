import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { useToast } from '@/hooks/use-toast';
import { 
  DollarSign, 
  TrendingUp, 
  Calculator, 
  Edit,
  Save,
  X,
  Tag,
  Percent,
  Clock,
  AlertTriangle,
  Database
} from 'lucide-react';
import { apiRequest } from '@/lib/queryClient';

interface CommissionCalculation {
  productId: string;
  productName: string;
  productPrice: number;
  category: string;
  commissionRate: number;
  commissionAmount: number;
  isPromotional: boolean;
  promotionalRate?: number;
  actualRate: number;
  source: 'database' | 'default' | 'promotional';
}

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

interface CommissionCalculatorProps {
  productId: string;
  productName: string;
  productPrice: number;
  category: string;
  productType: 'affiliate' | 'dropship';
  costPrice?: number;
  onSave: (data: { commissionRate?: number; costPrice?: number; profitMargin?: number }) => void;
}

export function CommissionCalculator({
  productId,
  productName,
  productPrice,
  category,
  productType,
  costPrice,
  onSave
}: CommissionCalculatorProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editingRate, setEditingRate] = useState<number>(0);
  const [editingCostPrice, setEditingCostPrice] = useState<number>(costPrice || 0);
  const [editingProfitAmount, setEditingProfitAmount] = useState<number>(0);
  const [editingProfitMargin, setEditingProfitMargin] = useState<number>(0);
  const [useAutomaticMarkup, setUseAutomaticMarkup] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch commission calculation
  const { data: commission, isLoading, error } = useQuery<CommissionCalculation>({
    queryKey: [`/api/products/${productId}/commission`],
    enabled: productType === 'affiliate' && !!productId,
    staleTime: 0, // Force fresh data
    refetchOnMount: true,
    refetchOnWindowFocus: true,
    retry: 3,
  });

  // Fetch dropship markup rates for automatic pricing
  const { data: dropshipRatesData } = useQuery<{success: boolean, rates: {categoryRates: DropshipMarkupRate[], productOverrides: any[]}}>({
    queryKey: ['/api/dropship/rates'],
    enabled: productType === 'dropship',
    staleTime: 5 * 60 * 1000, // Cache for 5 minutes
  });

  const dropshipRates = dropshipRatesData?.rates?.categoryRates || [];

  // Find category markup rate for dropship products
  const getCategoryMarkupRate = () => {
    if (!category || dropshipRates.length === 0) return null;
    
    return dropshipRates.find(rate => 
      rate.categoryName.toLowerCase().includes(category.toLowerCase()) ||
      category.toLowerCase().includes(rate.categoryName.toLowerCase())
    );
  };

  const categoryMarkupRate = getCategoryMarkupRate();

  const updateCommissionMutation = useMutation({
    mutationFn: async (commissionRate: number) => {
      const response = await fetch(`/api/products/${productId}/commission-rate`, {
        method: 'PUT',
        body: JSON.stringify({ commissionRate }),
        headers: { 'Content-Type': 'application/json' }
      });
      if (!response.ok) {
        throw new Error('Failed to update commission rate');
      }
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/products/${productId}/commission`] });
      toast({
        title: "Success",
        description: "Commission rate updated successfully",
      });
      setIsEditing(false);
    },
    onError: (error: any) => {
      toast({
        title: "Error",
        description: error.message || "Failed to update commission rate",
        variant: "destructive",
      });
    },
  });

  useEffect(() => {
    if (commission && !isEditing) {
      // Use commissionRate (database stored) as primary, fallback to actualRate (calculated)
      const rate = (commission as any).commissionRate || (commission as any).actualRate || 0;
      setEditingRate(rate);
    }
  }, [commission, isEditing]);

  const handleSave = () => {
    if (productType === 'affiliate') {
      if (editingRate < 0 || editingRate > 100) {
        toast({
          title: "Invalid Rate",
          description: "Commission rate must be between 0% and 100%",
          variant: "destructive",
        });
        return;
      }
      
      updateCommissionMutation.mutate(editingRate);
      onSave({ commissionRate: editingRate });
    } else {
      // Dropshipping model
      if (editingCostPrice < 0) {
        toast({
          title: "Invalid Cost",
          description: "Cost price cannot be negative",
          variant: "destructive",
        });
        return;
      }
      
      // For dropship products, calculate final cost
      const finalCost = useAutomaticMarkup && categoryMarkupRate 
        ? productPrice / (1 + (parseFloat(categoryMarkupRate.markupPercentage) / 100))
        : editingCostPrice;
      
      onSave({ costPrice: finalCost });
      setIsEditing(false);
    }
  };

  const handleCancel = () => {
    if (commission) {
      const rate = (commission as any).actualRate || 0;
      setEditingRate(rate);
    }
    setEditingCostPrice(costPrice || 0);
    setIsEditing(false);
  };

  // Calculate values based on product type
  const calculateValues = () => {
    if (productType === 'affiliate') {
      // Use commissionRate (database stored) as primary, fallback to actualRate (calculated)
      const commissionData = commission as any;
      const rate = isEditing ? editingRate : (commissionData?.commissionRate || commissionData?.actualRate || 0);
      const earnings = (productPrice * rate) / 100;
      
      
      return {
        rate,
        earnings,
        margin: rate,
        profit: earnings
      };
    } else {
      // Dropshipping
      let cost;
      let automaticMarkupApplied = false;
      
      if (useAutomaticMarkup && categoryMarkupRate) {
        // Calculate cost using category markup rate
        const markupPercent = parseFloat(categoryMarkupRate.markupPercentage);
        cost = productPrice / (1 + (markupPercent / 100));
        automaticMarkupApplied = true;
      } else {
        // Use manual cost price
        cost = isEditing ? editingCostPrice : (costPrice || 0);
      }
      
      const profit = productPrice - cost;
      const margin = cost > 0 ? ((profit / cost) * 100) : 0;
      return {
        rate: margin,
        earnings: profit,
        margin,
        profit,
        cost,
        automaticMarkupApplied,
        categoryMarkupRate: categoryMarkupRate ? parseFloat(categoryMarkupRate.markupPercentage) : null
      };
    }
  };

  const values = calculateValues();

  if (productType === 'affiliate' && isLoading) {
    return (
      <div className="flex items-center justify-between text-xs w-full">
        <div className="flex items-center justify-between w-full mr-2">
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">📊 Amazon:</span>
            <span className="font-medium text-blue-600">${productPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Rate:</span>
            <span className="text-gray-400">Loading...</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Earnings:</span>
            <span className="text-gray-400">Loading...</span>
          </div>
        </div>
        <div className="animate-spin rounded-full h-3 w-3 border border-orange-500 border-t-transparent"></div>
      </div>
    );
  }

  if (productType === 'affiliate' && error) {
    return (
      <div className="flex items-center justify-between text-xs w-full">
        <div className="flex items-center justify-between w-full mr-2">
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">📊 Amazon:</span>
            <span className="font-medium text-blue-600">${productPrice.toFixed(2)}</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Rate:</span>
            <span className="text-red-500">Error</span>
          </div>
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Earnings:</span>
            <span className="text-red-500">Error</span>
          </div>
        </div>
        <AlertTriangle className="h-3 w-3 text-red-500" />
      </div>
    );
  }

  // Ultra-compact full-width design
  return (
    <div className="flex items-center justify-between text-xs w-full">
      {productType === 'affiliate' ? (
        <div className="flex items-center justify-between w-full mr-2">
          {/* Affiliate: Distributed across full width */}
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">📊 Amazon:</span>
            <span className="font-medium text-blue-600">${productPrice.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Rate:</span>
            {isEditing ? (
              <div className="inline-flex items-center gap-1">
                <Input
                  type="number"
                  value={editingRate}
                  onChange={(e) => setEditingRate(parseFloat(e.target.value) || 0)}
                  className="w-12 h-5 text-xs px-1"
                  step="0.1"
                  min="0"
                  max="100"
                />
                <span>%</span>
              </div>
            ) : (
              <span className="font-medium text-orange-600">{values.rate.toFixed(2)}%</span>
            )}
            {(commission as any)?.source === 'default' && <span className="text-amber-600 text-xs">(Default)</span>}
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Earnings:</span>
            <span className="font-medium text-green-600">${values.earnings.toFixed(2)}</span>
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between w-full mr-2">
          {/* Dropship: Distributed across full width */}
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">💼 Cost:</span>
            {isEditing ? (
              <div className="inline-flex items-center gap-1">
                <span>$</span>
                <Input
                  type="number"
                  value={editingCostPrice}
                  onChange={(e) => setEditingCostPrice(parseFloat(e.target.value) || 0)}
                  className="w-12 h-5 text-xs px-1"
                  step="0.01"
                  min="0"
                />
              </div>
            ) : (
              <span className="font-medium text-red-600">${(values.cost || 0).toFixed(2)}</span>
            )}
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Profit:</span>
            <span className={`font-medium ${values.profit >= 0 ? 'text-green-600' : 'text-red-600'}`}>${values.profit.toFixed(2)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Margin:</span>
            <span className={`font-medium ${values.margin >= 0 ? 'text-green-600' : 'text-red-600'}`}>{values.margin.toFixed(1)}%</span>
          </div>
          
          <div className="flex items-center gap-1">
            <span className="text-gray-700 dark:text-gray-300">Sell:</span>
            <span className="font-medium text-blue-600">${productPrice.toFixed(2)}</span>
          </div>
        </div>
      )}
      
      {/* Action Buttons */}
      {!isEditing ? (
        <Button
          variant="ghost"
          size="sm"
          onClick={() => {
            setIsEditing(true);
            if (productType === 'affiliate') {
              setEditingRate(values.rate);
            } else {
              setEditingCostPrice(costPrice || 0);
            }
          }}
          className="h-5 w-5 p-0 text-gray-400 hover:text-gray-600"
        >
          <Edit className="h-3 w-3" />
        </Button>
      ) : (
        <div className="flex gap-1">
          <Button
            variant="ghost"
            size="sm"
            onClick={handleSave}
            disabled={updateCommissionMutation.isPending}
            className="h-5 w-5 p-0 text-green-600 hover:text-green-700"
          >
            {updateCommissionMutation.isPending ? (
              <div className="animate-spin rounded-full h-2 w-2 border border-current" />
            ) : (
              <Save className="h-3 w-3" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleCancel}
            className="h-5 w-5 p-0 text-red-600 hover:text-red-700"
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
}