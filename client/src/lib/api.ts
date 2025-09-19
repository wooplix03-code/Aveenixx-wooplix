export async function getVendorProducts() {
  // Mock data for now - in production this would call the backend API
  return [
    {
      id: 1,
      name: "Wireless Bluetooth Headphones",
      price: 89.99,
      image: "https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=300&h=200&fit=crop",
      category: "Electronics"
    },
    {
      id: 2,
      name: "Smart Fitness Watch",
      price: 199.99,
      image: "https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=300&h=200&fit=crop",
      category: "Wearables"
    },
    {
      id: 3,
      name: "Portable Bluetooth Speaker",
      price: 45.99,
      image: "https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=300&h=200&fit=crop",
      category: "Audio"
    },
    {
      id: 4,
      name: "Wireless Charging Pad",
      price: 29.99,
      image: "https://images.unsplash.com/photo-1586953208448-b95a79798f07?w=300&h=200&fit=crop",
      category: "Accessories"
    },
    {
      id: 5,
      name: "USB-C Hub",
      price: 59.99,
      image: "https://images.unsplash.com/photo-1625842268584-8f3296236761?w=300&h=200&fit=crop",
      category: "Accessories"
    },
    {
      id: 6,
      name: "Laptop Stand",
      price: 39.99,
      image: "https://images.unsplash.com/photo-1527864550417-7fd91fc51a46?w=300&h=200&fit=crop",
      category: "Office"
    }
  ];
}