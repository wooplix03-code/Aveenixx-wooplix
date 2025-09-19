import { useQuery } from '@tanstack/react-query';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Package, ShoppingBag, Truck, CheckCircle } from 'lucide-react';

// Format currency function
const formatCents = (cents: number) => {
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
  }).format(cents / 100);
};

// Format date function
const formatDateTime = (dateString: string) => {
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  });
};

export default function MyOrders() {
  const { data: orders = [], isLoading } = useQuery({
    queryKey: ['/api/my-account/order-tracking'],
    queryFn: async () => {
      const response = await fetch('/api/my-account/order-tracking');
      if (!response.ok) {
        throw new Error('Failed to fetch orders');
      }
      return response.json();
    },
  });

  const getStatusBadge = (status: string) => {
    const variants: Record<string, { color: string; icon: any }> = {
      pending: { color: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300', icon: Package },
      processing: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Package },
      shipped: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Truck },
      in_transit: { color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300', icon: Truck },
      delivered: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
      confirmed: { color: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300', icon: CheckCircle },
    };
    
    const variant = variants[status] || variants.pending;
    const Icon = variant.icon;
    
    return (
      <Badge className={variant.color}>
        <Icon className="h-3 w-3 mr-1" />
        {status}
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <h1 className="text-2xl font-bold">My Orders</h1>
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <div key={i} className="animate-pulse bg-gray-200 dark:bg-gray-700 h-32 rounded-lg"></div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex items-center">
        <ShoppingBag className="h-6 w-6 mr-3 text-blue-600" />
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Orders</h1>
      </div>

      {orders?.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order: any) => (
            <Card key={order.id} className="hover:shadow-md transition-shadow">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-lg">Order {order.orderNumber || order.id}</CardTitle>
                  <div className="text-right">
                    <div className="text-lg font-bold text-gray-900 dark:text-white">
                      {order.total || '$0.00'}
                    </div>
                    <div className="text-sm text-gray-500">
                      {order.createdAt ? formatDateTime(order.createdAt) : 'Date not available'}
                    </div>
                  </div>
                </div>
              </CardHeader>
              
              <CardContent className="pt-0">
                <div className="flex items-center justify-between">
                  <div className="flex space-x-3">
                    <div className="text-center">
                      <div className="text-xs text-gray-500 mb-1">Order Status</div>
                      {getStatusBadge(order.status)}
                    </div>
                    {order.tracking && (
                      <div className="text-center">
                        <div className="text-xs text-gray-500 mb-1">Shipping Status</div>
                        {getStatusBadge(order.tracking.status)}
                      </div>
                    )}
                  </div>
                  
                  <div className="text-right">
                    {order.tracking && (
                      <div className="text-sm text-gray-600 dark:text-gray-400">
                        Tracking: <span className="font-medium text-gray-900 dark:text-white">{order.tracking.trackingNumber}</span>
                      </div>
                    )}
                  </div>
                </div>

                {/* Tracking Information */}
                {order.tracking && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm">
                      <div className="flex justify-between items-center">
                        <span className="text-gray-600 dark:text-gray-400">Carrier:</span>
                        <span className="font-medium">{order.tracking.carrier}</span>
                      </div>
                      {order.tracking.shippedAt && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Shipped:</span>
                          <span>{formatDateTime(order.tracking.shippedAt)}</span>
                        </div>
                      )}
                      {order.tracking.deliveredAt && (
                        <div className="flex justify-between items-center mt-1">
                          <span className="text-gray-600 dark:text-gray-400">Delivered:</span>
                          <span>{formatDateTime(order.tracking.deliveredAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                {order.shippingAddress && (
                  <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm">
                      <div className="text-gray-600 dark:text-gray-400 mb-1">Shipping Address:</div>
                      <div className="text-gray-900 dark:text-white">
                        {typeof order.shippingAddress === 'string' 
                          ? order.shippingAddress 
                          : `${order.shippingAddress.street}, ${order.shippingAddress.city}, ${order.shippingAddress.state} ${order.shippingAddress.zip}`
                        }
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex items-center justify-center h-64 text-gray-500 dark:text-gray-400">
            <div className="text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 opacity-50" />
              <h3 className="text-lg font-medium mb-2">No Orders Yet</h3>
              <p className="text-sm">Your order history will appear here once you make purchases</p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}