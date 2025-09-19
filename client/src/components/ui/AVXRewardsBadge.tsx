import { useEffect, useState } from 'react';
import { Badge } from '@/components/ui/badge';
import { Sparkles, Clock, Zap } from 'lucide-react';

interface AVXRewardsBadgeProps {
  productId: string;
  productPrice: number;
  productType?: string;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'compact' | 'detailed';
  className?: string;
}

interface RewardCalculation {
  avxRewardCents: number;
  displayText: string;
  isInstantReward: boolean;
  coolingOffDays: number;
  avxRewardPercentage: number;
}

export default function AVXRewardsBadge({ 
  productId, 
  productPrice, 
  productType = 'physical',
  size = 'md', 
  variant = 'default',
  className = ''
}: AVXRewardsBadgeProps) {
  const [rewards, setRewards] = useState<RewardCalculation | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchRewards = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        const response = await fetch(`/api/products/${productId}/avx-rewards`);
        if (!response.ok) {
          throw new Error('Failed to fetch rewards');
        }
        
        const rewardData = await response.json();
        setRewards(rewardData);
      } catch (err) {
        console.error('Error fetching AVX rewards:', err);
        setError('Failed to load rewards');
        
        // Fallback calculation for basic display
        const fallbackRewards = Math.round(productPrice * 100 * 0.03); // 3% fallback
        setRewards({
          avxRewardCents: fallbackRewards,
          displayText: `Earn $${(fallbackRewards / 100).toFixed(2)} AVX Rewards`,
          isInstantReward: productType === 'dropship',
          coolingOffDays: productType === 'affiliate' ? 45 : 3,
          avxRewardPercentage: 3
        });
      } finally {
        setIsLoading(false);
      }
    };

    if (productId && productPrice > 0) {
      fetchRewards();
    }
  }, [productId, productPrice, productType]);

  // Don't render if no rewards or loading
  if (isLoading || !rewards || rewards.avxRewardCents <= 0) {
    return null;
  }

  const rewardAmount = (rewards.avxRewardCents / 100).toFixed(2);
  const rewardPercentage = rewards.avxRewardPercentage.toFixed(1);

  // Size variants
  const sizeClasses = {
    sm: 'text-xs px-2 py-1',
    md: 'text-sm px-2 py-1',
    lg: 'text-base px-3 py-1.5'
  };

  // Icon size variants
  const iconSizes = {
    sm: 'h-3 w-3',
    md: 'h-3 w-3',
    lg: 'h-4 w-4'
  };

  const getVariantContent = () => {
    switch (variant) {
      case 'compact':
        return (
          <div className="flex items-center gap-1">
            <Sparkles className={iconSizes[size]} />
            <span>${rewardAmount}</span>
          </div>
        );
      
      case 'detailed':
        return (
          <div className="flex items-center gap-1">
            <Sparkles className={iconSizes[size]} />
            <span>Earn ${rewardAmount} AVX</span>
            {!rewards.isInstantReward && (
              <Clock className={`${iconSizes[size]} opacity-70`} />
            )}
          </div>
        );
      
      default:
        return (
          <div className="flex items-center gap-1">
            <Sparkles className={iconSizes[size]} />
            <span>+${rewardAmount} AVX</span>
          </div>
        );
    }
  };

  const getBadgeStyle = () => {
    if (rewards.isInstantReward) {
      // Instant rewards (dropship) - green theme
      return "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100 hover:bg-green-200 border-green-300";
    } else {
      // Pending rewards (affiliate) - orange theme
      return "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-100 hover:bg-orange-200 border-orange-300";
    }
  };

  return (
    <Badge 
      variant="outline" 
      className={`
        ${sizeClasses[size]} 
        ${getBadgeStyle()} 
        font-medium cursor-default transition-colors
        ${className}
      `}
      title={`${rewards.displayText}${!rewards.isInstantReward ? ` (Available in ${rewards.coolingOffDays} days)` : ' (Instant)'}`}
    >
      {getVariantContent()}
    </Badge>
  );
}

// Quick component for cart totals
export function AVXRewardsCartSummary({ cartItems, className = '' }: { 
  cartItems: Array<{ id: string; quantity: number }>, 
  className?: string 
}) {
  const [totalRewards, setTotalRewards] = useState<{
    totalRewardCents: number;
    instantRewardCents: number;
    pendingRewardCents: number;
  } | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const fetchCartRewards = async () => {
      if (!cartItems || cartItems.length === 0) {
        setTotalRewards(null);
        return;
      }

      try {
        setIsLoading(true);
        
        const response = await fetch('/api/cart/avx-rewards', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ cartItems })
        });
        
        if (response.ok) {
          const data = await response.json();
          setTotalRewards(data);
        }
      } catch (error) {
        console.error('Error fetching cart rewards:', error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCartRewards();
  }, [cartItems]);

  if (isLoading || !totalRewards || totalRewards.totalRewardCents <= 0) {
    return null;
  }

  const totalAmount = (totalRewards.totalRewardCents / 100).toFixed(2);
  const instantAmount = (totalRewards.instantRewardCents / 100).toFixed(2);
  const pendingAmount = (totalRewards.pendingRewardCents / 100).toFixed(2);

  return (
    <div className={`bg-gradient-to-r from-green-50 to-orange-50 dark:from-green-950 dark:to-orange-950 border rounded-lg p-3 ${className}`}>
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="h-4 w-4 text-green-600" />
          <span className="font-medium text-sm">Total AVX Rewards:</span>
        </div>
        <span className="font-bold text-green-600">${totalAmount}</span>
      </div>
      
      {(totalRewards.instantRewardCents > 0 || totalRewards.pendingRewardCents > 0) && (
        <div className="mt-2 text-xs text-gray-600 dark:text-gray-400 space-y-1">
          {totalRewards.instantRewardCents > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Zap className="h-3 w-3" />
                <span>Instant:</span>
              </div>
              <span className="text-green-600">${instantAmount}</span>
            </div>
          )}
          {totalRewards.pendingRewardCents > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                <span>Pending:</span>
              </div>
              <span className="text-orange-600">${pendingAmount}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}