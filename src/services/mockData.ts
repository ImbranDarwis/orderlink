import { Order, InventoryItem, Customer, MetricCard, ChartPoint } from './api';

export const initialOrders: Order[] = [
  {
    id: 1,
    order_id: 'ORD-8492',
    customer_name: 'PT Maju Bersama',
    date: '2026-09-15',
    total: 4250000,
    status: 'Completed',
    created_at: new Date(Date.now() - 3600000).toISOString()
  },
  {
    id: 2,
    order_id: 'ORD-8491',
    customer_name: 'Toko Berkah Jaya',
    date: '2026-09-15',
    total: 1850000,
    status: 'Shipped',
    created_at: new Date(Date.now() - 7200000).toISOString()
  },
  {
    id: 3,
    order_id: 'ORD-8490',
    customer_name: 'Warung Bu Siti',
    date: '2026-09-14',
    total: 920000,
    status: 'Processing',
    created_at: new Date(Date.now() - 86400000).toISOString()
  },
  {
    id: 4,
    order_id: 'ORD-8489',
    customer_name: 'Mini Market Sejahtera',
    date: '2026-09-14',
    total: 5400000,
    status: 'Pending',
    created_at: new Date(Date.now() - 90000000).toISOString()
  },
  {
    id: 5,
    order_id: 'ORD-8488',
    customer_name: 'CV Sinar Abadi',
    date: '2026-09-13',
    total: 3100000,
    status: 'Completed',
    created_at: new Date(Date.now() - 172800000).toISOString()
  },
  {
    id: 6,
    order_id: 'ORD-8487',
    customer_name: 'Toko Sumber Rejeki',
    date: '2026-09-13',
    total: 750000,
    status: 'Completed',
    created_at: new Date(Date.now() - 180000000).toISOString()
  },
  {
    id: 7,
    order_id: 'ORD-8486',
    customer_name: 'Warung Pak Joko',
    date: '2026-09-12',
    total: 1200000,
    status: 'Shipped',
    created_at: new Date(Date.now() - 259200000).toISOString()
  },
  {
    id: 8,
    order_id: 'ORD-8485',
    customer_name: 'PT Nusantara Distribusi',
    date: '2026-09-12',
    total: 8600000,
    status: 'Completed',
    created_at: new Date(Date.now() - 265000000).toISOString()
  }
];

export const initialInventory: InventoryItem[] = [
  {
    id: 1,
    sku: 'SKU-001',
    name: 'Minyak Goreng 2L',
    category: 'Sembako',
    stock: 140,
    price: 48000,
    status: 'In Stock'
  },
  {
    id: 2,
    sku: 'SKU-002',
    name: 'Beras Premium 5kg',
    category: 'Sembako',
    stock: 85,
    price: 72000,
    status: 'In Stock'
  },
  {
    id: 3,
    sku: 'SKU-003',
    name: 'Gula Pasir 1kg',
    category: 'Sembako',
    stock: 18,
    price: 17500,
    status: 'Low Stock'
  },
  {
    id: 4,
    sku: 'SKU-004',
    name: 'Kopi Robusta 250g',
    category: 'Minuman',
    stock: 90,
    price: 25000,
    status: 'In Stock'
  },
  {
    id: 5,
    sku: 'SKU-005',
    name: 'Teh Celup Kotak',
    category: 'Minuman',
    stock: 210,
    price: 12000,
    status: 'In Stock'
  },
  {
    id: 6,
    sku: 'SKU-006',
    name: 'Mie Instan Goreng (Kardus)',
    category: 'Makanan',
    stock: 45,
    price: 115000,
    status: 'In Stock'
  },
  {
    id: 7,
    sku: 'SKU-007',
    name: 'Susu UHT 1L',
    category: 'Minuman',
    stock: 8,
    price: 19500,
    status: 'Low Stock'
  },
  {
    id: 8,
    sku: 'SKU-008',
    name: 'Kecap Manis 600ml',
    category: 'Bumbu',
    stock: 0,
    price: 24000,
    status: 'Out of Stock'
  }
];

export const initialCustomers: Customer[] = [
  {
    id: 1,
    name: 'Andi Wijaya',
    email: 'andi@tokoanda.com',
    phone: '081234567890',
    company: 'Toko Anda',
    total_orders: 15,
    total_spent: 6750000,
    status: 'Active'
  },
  {
    id: 2,
    name: 'Rina Susanti',
    email: 'rina@warungrina.com',
    phone: '081234567891',
    company: 'Warung Rina',
    total_orders: 8,
    total_spent: 3200000,
    status: 'Active'
  },
  {
    id: 3,
    name: 'Bambang Hermanto',
    email: 'bambang@minimarketbambang.com',
    phone: '081234567892',
    company: 'Mini Market Bambang',
    total_orders: 22,
    total_spent: 11000000,
    status: 'Active'
  },
  {
    id: 4,
    name: 'Sari Dewi',
    email: 'sari@tokosari.com',
    phone: '081234567893',
    company: 'Toko Sari',
    total_orders: 6,
    total_spent: 2400000,
    status: 'Inactive'
  },
  {
    id: 5,
    name: 'Eko Prasetyo',
    email: 'eko@warungeko.com',
    phone: '081234567894',
    company: 'Warung Eko',
    total_orders: 18,
    total_spent: 8100000,
    status: 'Active'
  },
  {
    id: 6,
    name: 'Doni Setiawan',
    email: 'doni@minimarketdoni.com',
    phone: '081234567895',
    company: 'Mini Market Doni',
    total_orders: 30,
    total_spent: 15000000,
    status: 'Active'
  }
];

export const initialMetrics: MetricCard[] = [
  { key: 'revenue', label: 'Total Revenue', value: 'Rp 26.070.000', change: '+20.1% from last month', type: 'green' },
  { key: 'orders', label: 'Total Orders', value: '104', change: '+14.5% from last month', type: 'green' },
  { key: 'customers', label: 'Active Customers', value: '58', change: '+8.2% from last month', type: 'green' },
  { key: 'active', label: 'Active Drivers', value: '12', change: '4 delivering now', type: 'green' }
];

export const initialChartData: ChartPoint[] = [
  { id: 1, date: 'May', value: 320, timeframe: 'Monthly' },
  { id: 2, date: 'Jun', value: 450, timeframe: 'Monthly' },
  { id: 3, date: 'Jul', value: 410, timeframe: 'Monthly' },
  { id: 4, date: 'Aug', value: 580, timeframe: 'Monthly' },
  { id: 5, date: 'Sep', value: 690, timeframe: 'Monthly' }
];
