import { Request, Response } from 'express';
import { db } from '../db';
import { vendors, users } from '@shared/schema';
import { eq, desc, count, sum } from 'drizzle-orm';
import { insertVendorSchema } from '@shared/schema';

export const registerVendor = async (req: Request, res: Response) => {
  try {
    // Check if user is authenticated
    if (!req.user) {
      return res.status(401).json({ message: 'Authentication required' });
    }

    const userId = req.user.id;

    // Check if user already has a vendor account
    const existingVendor = await db
      .select()
      .from(vendors)
      .where(eq(vendors.userId, userId));

    if (existingVendor.length > 0) {
      return res.status(409).json({ message: 'Vendor account already exists' });
    }

    // Validate request body
    const validationResult = insertVendorSchema.safeParse({
      ...req.body,
      userId,
    });

    if (!validationResult.success) {
      return res.status(400).json({ 
        message: 'Invalid vendor data',
        errors: validationResult.error.errors,
      });
    }

    // Create vendor account
    const [newVendor] = await db
      .insert(vendors)
      .values(validationResult.data)
      .returning();

    // Update user role to vendor
    await db
      .update(users)
      .set({ role: 'vendor' })
      .where(eq(users.id, userId));

    res.status(201).json({
      message: 'Vendor registration successful',
      vendor: newVendor,
    });
  } catch (error) {
    console.error('Vendor registration error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVendorProfile = async (req: Request, res: Response) => {
  try {
    if (!req.vendor) {
      return res.status(403).json({ message: 'Vendor access required' });
    }

    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, req.vendor.id));

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    res.json(vendor);
  } catch (error) {
    console.error('Get vendor profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const updateVendorProfile = async (req: Request, res: Response) => {
  try {
    if (!req.vendor) {
      return res.status(403).json({ message: 'Vendor access required' });
    }

    const allowedUpdates = [
      'businessName',
      'businessDescription',
      'contactName',
      'email',
      'phone',
      'address',
      'city',
      'state',
      'zipCode',
      'country',
      'website',
    ];

    const updates = Object.keys(req.body)
      .filter(key => allowedUpdates.includes(key))
      .reduce((obj, key) => {
        obj[key] = req.body[key];
        return obj;
      }, {} as any);

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ message: 'No valid updates provided' });
    }

    const [updatedVendor] = await db
      .update(vendors)
      .set({ ...updates, updatedAt: new Date() })
      .where(eq(vendors.id, req.vendor.id))
      .returning();

    res.json(updatedVendor);
  } catch (error) {
    console.error('Update vendor profile error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVendorStats = async (req: Request, res: Response) => {
  try {
    if (!req.vendor) {
      return res.status(403).json({ message: 'Vendor access required' });
    }

    const vendorId = req.vendor.id;

    // Get basic vendor stats
    const [vendor] = await db
      .select()
      .from(vendors)
      .where(eq(vendors.id, vendorId));

    if (!vendor) {
      return res.status(404).json({ message: 'Vendor not found' });
    }

    // For now, return the vendor data with some calculated fields
    // In a real app, you'd calculate these from orders, products, etc.
    const stats = {
      totalSales: parseFloat(vendor.totalSales || '0'),
      totalOrders: vendor.totalOrders || 0,
      totalProducts: 42, // This would come from products table
      totalCustomers: 178, // This would come from orders analysis
      monthlyRevenue: 12345.67, // This would come from recent orders
      pendingOrders: 8, // This would come from orders with pending status
      rating: parseFloat(vendor.rating || '0'),
      reviewCount: vendor.reviewCount || 0,
    };

    res.json(stats);
  } catch (error) {
    console.error('Get vendor stats error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVendorOrders = async (req: Request, res: Response) => {
  try {
    if (!req.vendor) {
      return res.status(403).json({ message: 'Vendor access required' });
    }

    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // For now, return mock data
    // In a real app, you'd query the orders table filtered by vendor
    const mockOrders = [
      {
        id: 1,
        orderNumber: 'ORD-2024-001',
        customerName: 'John Smith',
        amount: 299.99,
        status: 'pending',
        date: '2024-01-15',
      },
      {
        id: 2,
        orderNumber: 'ORD-2024-002',
        customerName: 'Sarah Johnson',
        amount: 149.50,
        status: 'processing',
        date: '2024-01-14',
      },
      {
        id: 3,
        orderNumber: 'ORD-2024-003',
        customerName: 'Mike Davis',
        amount: 89.99,
        status: 'shipped',
        date: '2024-01-13',
      },
    ];

    res.json({
      orders: mockOrders,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockOrders.length,
        pages: Math.ceil(mockOrders.length / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get vendor orders error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

export const getVendorProducts = async (req: Request, res: Response) => {
  try {
    if (!req.vendor) {
      return res.status(403).json({ message: 'Vendor access required' });
    }

    const { page = 1, limit = 10, category } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    // For now, return mock data
    // In a real app, you'd query the products table filtered by vendor
    const mockProducts = [
      {
        id: 1,
        name: 'Wireless Headphones',
        sales: 45,
        revenue: 2249.55,
        stock: 23,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop',
      },
      {
        id: 2,
        name: 'Smart Watch',
        sales: 32,
        revenue: 1599.68,
        stock: 15,
        status: 'active',
        image: 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=100&h=100&fit=crop',
      },
      {
        id: 3,
        name: 'Laptop Stand',
        sales: 28,
        revenue: 839.72,
        stock: 8,
        status: 'low_stock',
        image: 'https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=100&h=100&fit=crop',
      },
    ];

    res.json({
      products: mockProducts,
      pagination: {
        page: Number(page),
        limit: Number(limit),
        total: mockProducts.length,
        pages: Math.ceil(mockProducts.length / Number(limit)),
      },
    });
  } catch (error) {
    console.error('Get vendor products error:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};