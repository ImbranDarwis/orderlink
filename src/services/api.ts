import { supabase, isSupabaseConfigured } from '../lib/supabase';
import {
  initialOrders,
  initialInventory,
  initialCustomers,
  initialMetrics,
  initialChartData
} from './mockData';

export interface User {
  id: string; // UUID in Supabase
  email: string;
  role: 'Admin' | 'Distributor' | 'Retailer' | 'Driver';
  full_name: string;
  avatar_url?: string | null;
}

export interface Order {
  id: number;
  order_id: string;
  customer_name: string;
  date: string;
  total: number;
  status: 'Processing' | 'Pending' | 'Completed' | 'Shipped' | 'Cancelled';
  created_at?: string;
  distributor_id?: string;
  retailer_id?: string;
  driver_id?: string;
}

export interface MetricCard {
  key: string;
  label: string;
  value: string;
  change: string;
  type: 'green' | 'gray';
}

export interface ChartPoint {
  id: number;
  date: string;
  value: number;
  timeframe: string;
}

export interface OrdersResponse {
  orders: Order[];
  total: number;
}

export interface InventoryItem {
  id: number;
  sku: string;
  name: string;
  category: string;
  stock: number;
  price: number;
  status: 'In Stock' | 'Low Stock' | 'Out of Stock';
  created_at?: string;
  distributor_id?: string;
}

export interface InventoryResponse {
  items: InventoryItem[];
  total: number;
}

export interface Customer {
  id: number;
  name: string;
  email: string;
  phone: string;
  company: string;
  total_orders: number;
  total_spent: number;
  status: 'Active' | 'Inactive';
  created_at?: string;
  distributor_id?: string;
}

export interface CustomersResponse {
  customers: Customer[];
  total: number;
}

// Local storage fallback helpers for demo/offline mode
const getLocalData = <T>(key: string, initial: T[]): T[] => {
  try {
    const saved = localStorage.getItem(key);
    if (saved) return JSON.parse(saved);
  } catch {
    // fallback if storage unavailable
  }
  return initial;
};

const setLocalData = <T>(key: string, data: T[]): void => {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch {
    // ignore
  }
};

export const apiService = {
  // Orders CRUD
  async getOrders(params: {
    search?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<OrdersResponse> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('orders').select('*', { count: 'exact' });

        if (params.search) {
          query = query.or(`order_id.ilike.%${params.search}%,customer_name.ilike.%${params.search}%`);
        }
        
        if (params.sortField) {
          query = query.order(params.sortField, { ascending: params.sortOrder === 'asc' });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        if (params.page && params.limit) {
          const from = (params.page - 1) * params.limit;
          const to = from + params.limit - 1;
          query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (!error && data) {
          return { orders: data as Order[], total: count || 0 };
        }
      } catch (err) {
        console.warn('Supabase getOrders failed, falling back to demo data:', err);
      }
    }

    // Fallback Mock Data
    let orders = getLocalData<Order>('orderlink_demo_orders', initialOrders);
    if (params.search) {
      const q = params.search.toLowerCase();
      orders = orders.filter(
        (o) => o.order_id.toLowerCase().includes(q) || o.customer_name.toLowerCase().includes(q)
      );
    }
    if (params.sortField) {
      const field = params.sortField as keyof Order;
      orders.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return params.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    const total = orders.length;
    if (params.page && params.limit) {
      const from = (params.page - 1) * params.limit;
      orders = orders.slice(from, from + params.limit);
    }
    return { orders, total };
  },

  async createOrder(order: Omit<Order, 'id'>): Promise<Order> {
    if (isSupabaseConfigured) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('orders')
          .insert([{ ...order, distributor_id: userData.user?.id }])
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase createOrder failed, fallback to demo mode:', err);
      }
    }

    const orders = getLocalData<Order>('orderlink_demo_orders', initialOrders);
    const newOrder: Order = {
      ...order,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    orders.unshift(newOrder);
    setLocalData('orderlink_demo_orders', orders);
    return newOrder;
  },

  async updateOrder(order: Order): Promise<Order> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('orders')
          .update(order)
          .eq('id', order.id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateOrder failed, fallback to demo mode:', err);
      }
    }

    const orders = getLocalData<Order>('orderlink_demo_orders', initialOrders);
    const idx = orders.findIndex((o) => o.id === order.id);
    if (idx !== -1) {
      orders[idx] = { ...orders[idx], ...order };
      setLocalData('orderlink_demo_orders', orders);
    }
    return order;
  },

  async deleteOrder(id: number): Promise<{ ok: boolean }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('orders').delete().eq('id', id);
        if (!error) return { ok: true };
      } catch (err) {
        console.warn('Supabase deleteOrder failed, fallback to demo mode:', err);
      }
    }

    const orders = getLocalData<Order>('orderlink_demo_orders', initialOrders);
    const filtered = orders.filter((o) => o.id !== id);
    setLocalData('orderlink_demo_orders', filtered);
    return { ok: true };
  },

  // Metrics — compute from real Supabase data when available
  async getMetrics(): Promise<MetricCard[]> {
    if (isSupabaseConfigured) {
      try {
        // Fetch all orders to compute metrics
        const { data: orders, error } = await supabase
          .from('orders')
          .select('total, status');

        if (!error && orders) {
          const totalOrders = orders.length;
          const completedOrders = orders.filter(o => o.status === 'Completed' || o.status === 'Shipped');
          const pendingOrders = orders.filter(o => o.status === 'Pending' || o.status === 'Processing').length;
          const netRevenue = completedOrders.reduce((sum, o) => sum + (Number(o.total) || 0), 0);
          const avgOrderValue = totalOrders > 0
            ? orders.reduce((sum, o) => sum + (Number(o.total) || 0), 0) / totalOrders
            : 0;

          return [
            { key: 'total_orders', label: 'Total Orders', value: String(totalOrders), change: '', type: 'green' },
            { key: 'net_revenue', label: 'Net Revenue', value: String(netRevenue.toFixed(2)), change: '', type: 'green' },
            { key: 'avg_order_value', label: 'Avg Order Value', value: String(avgOrderValue.toFixed(2)), change: '', type: 'gray' },
            { key: 'pending_orders', label: 'Pending Orders', value: String(pendingOrders), change: '', type: 'gray' },
          ];
        }
      } catch (err) {
        console.warn('Supabase getMetrics failed, fallback to demo data:', err);
      }
    }
    return initialMetrics;
  },

  // Chart — compute from real Supabase data when available
  async getChartData(timeframe: string): Promise<ChartPoint[]> {
    if (isSupabaseConfigured) {
      try {
        const { data: orders, error } = await supabase
          .from('orders')
          .select('total, created_at')
          .order('created_at', { ascending: true });

        if (!error && orders && orders.length > 0) {
          // Group orders by date and sum totals
          const grouped: Record<string, number> = {};
          for (const o of orders) {
            const date = o.created_at ? new Date(o.created_at).toISOString().slice(0, 10) : 'Unknown';
            grouped[date] = (grouped[date] || 0) + (Number(o.total) || 0);
          }

          return Object.entries(grouped).map(([date, value], i) => ({
            id: i + 1,
            date,
            value,
            timeframe,
          }));
        }
      } catch (err) {
        console.warn('Supabase getChartData failed, fallback to demo data:', err);
      }
    }
    return initialChartData.map((d) => ({ ...d, timeframe }));
  },

  // Inventory CRUD
  async getInventory(params: {
    search?: string;
    category?: string;
    status?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<InventoryResponse> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('inventory').select('*', { count: 'exact' });

        if (params.search) {
          query = query.or(`name.ilike.%${params.search}%,sku.ilike.%${params.search}%`);
        }
        if (params.category) query = query.eq('category', params.category);
        if (params.status) query = query.eq('status', params.status);
        
        if (params.sortField) {
          query = query.order(params.sortField, { ascending: params.sortOrder === 'asc' });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        if (params.page && params.limit) {
          const from = (params.page - 1) * params.limit;
          const to = from + params.limit - 1;
          query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (!error && data) {
          return { items: data as InventoryItem[], total: count || 0 };
        }
      } catch (err) {
        console.warn('Supabase getInventory failed, fallback to demo data:', err);
      }
    }

    // Fallback Mock Data
    let items = getLocalData<InventoryItem>('orderlink_demo_inventory', initialInventory);
    if (params.search) {
      const q = params.search.toLowerCase();
      items = items.filter(
        (i) => i.name.toLowerCase().includes(q) || i.sku.toLowerCase().includes(q)
      );
    }
    if (params.category) items = items.filter((i) => i.category === params.category);
    if (params.status) items = items.filter((i) => i.status === params.status);

    if (params.sortField) {
      const field = params.sortField as keyof InventoryItem;
      items.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return params.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    const total = items.length;
    if (params.page && params.limit) {
      const from = (params.page - 1) * params.limit;
      items = items.slice(from, from + params.limit);
    }
    return { items, total };
  },

  async createInventoryItem(item: Omit<InventoryItem, 'id'>): Promise<InventoryItem> {
    if (isSupabaseConfigured) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('inventory')
          .insert([{ ...item, distributor_id: userData.user?.id }])
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase createInventoryItem failed, fallback to demo mode:', err);
      }
    }

    const items = getLocalData<InventoryItem>('orderlink_demo_inventory', initialInventory);
    const newItem: InventoryItem = {
      ...item,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    items.unshift(newItem);
    setLocalData('orderlink_demo_inventory', items);
    return newItem;
  },

  async updateInventoryItem(item: InventoryItem): Promise<InventoryItem> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('inventory')
          .update(item)
          .eq('id', item.id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateInventoryItem failed, fallback to demo mode:', err);
      }
    }

    const items = getLocalData<InventoryItem>('orderlink_demo_inventory', initialInventory);
    const idx = items.findIndex((i) => i.id === item.id);
    if (idx !== -1) {
      items[idx] = { ...items[idx], ...item };
      setLocalData('orderlink_demo_inventory', items);
    }
    return item;
  },

  async deleteInventoryItem(id: number): Promise<{ ok: boolean }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('inventory').delete().eq('id', id);
        if (!error) return { ok: true };
      } catch (err) {
        console.warn('Supabase deleteInventoryItem failed, fallback to demo mode:', err);
      }
    }

    const items = getLocalData<InventoryItem>('orderlink_demo_inventory', initialInventory);
    const filtered = items.filter((i) => i.id !== id);
    setLocalData('orderlink_demo_inventory', filtered);
    return { ok: true };
  },

  // Customers CRUD
  async getCustomers(params: {
    search?: string;
    status?: string;
    sortField?: string;
    sortOrder?: 'asc' | 'desc';
    page?: number;
    limit?: number;
  } = {}): Promise<CustomersResponse> {
    if (isSupabaseConfigured) {
      try {
        let query = supabase.from('customers').select('*', { count: 'exact' });

        if (params.search) {
          query = query.or(`name.ilike.%${params.search}%,email.ilike.%${params.search}%`);
        }
        if (params.status) query = query.eq('status', params.status);
        
        if (params.sortField) {
          query = query.order(params.sortField, { ascending: params.sortOrder === 'asc' });
        } else {
          query = query.order('created_at', { ascending: false });
        }

        if (params.page && params.limit) {
          const from = (params.page - 1) * params.limit;
          const to = from + params.limit - 1;
          query = query.range(from, to);
        }

        const { data, error, count } = await query;
        if (!error && data) {
          return { customers: data as Customer[], total: count || 0 };
        }
      } catch (err) {
        console.warn('Supabase getCustomers failed, fallback to demo data:', err);
      }
    }

    // Fallback Mock Data
    let customers = getLocalData<Customer>('orderlink_demo_customers', initialCustomers);
    if (params.search) {
      const q = params.search.toLowerCase();
      customers = customers.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.email.toLowerCase().includes(q) ||
          c.company.toLowerCase().includes(q)
      );
    }
    if (params.status) customers = customers.filter((c) => c.status === params.status);

    if (params.sortField) {
      const field = params.sortField as keyof Customer;
      customers.sort((a, b) => {
        const valA = a[field] ?? '';
        const valB = b[field] ?? '';
        if (valA < valB) return params.sortOrder === 'asc' ? -1 : 1;
        if (valA > valB) return params.sortOrder === 'asc' ? 1 : -1;
        return 0;
      });
    }
    const total = customers.length;
    if (params.page && params.limit) {
      const from = (params.page - 1) * params.limit;
      customers = customers.slice(from, from + params.limit);
    }
    return { customers, total };
  },

  async createCustomer(customer: Omit<Customer, 'id'>): Promise<Customer> {
    if (isSupabaseConfigured) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('customers')
          .insert([{ ...customer, distributor_id: userData.user?.id }])
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase createCustomer failed, fallback to demo mode:', err);
      }
    }

    const customers = getLocalData<Customer>('orderlink_demo_customers', initialCustomers);
    const newCust: Customer = {
      ...customer,
      id: Date.now(),
      created_at: new Date().toISOString()
    };
    customers.unshift(newCust);
    setLocalData('orderlink_demo_customers', customers);
    return newCust;
  },

  async updateCustomer(customer: Customer): Promise<Customer> {
    if (isSupabaseConfigured) {
      try {
        const { data, error } = await supabase
          .from('customers')
          .update(customer)
          .eq('id', customer.id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateCustomer failed, fallback to demo mode:', err);
      }
    }

    const customers = getLocalData<Customer>('orderlink_demo_customers', initialCustomers);
    const idx = customers.findIndex((c) => c.id === customer.id);
    if (idx !== -1) {
      customers[idx] = { ...customers[idx], ...customer };
      setLocalData('orderlink_demo_customers', customers);
    }
    return customer;
  },

  async deleteCustomer(id: number): Promise<{ ok: boolean }> {
    if (isSupabaseConfigured) {
      try {
        const { error } = await supabase.from('customers').delete().eq('id', id);
        if (!error) return { ok: true };
      } catch (err) {
        console.warn('Supabase deleteCustomer failed, fallback to demo mode:', err);
      }
    }

    const customers = getLocalData<Customer>('orderlink_demo_customers', initialCustomers);
    const filtered = customers.filter((c) => c.id !== id);
    setLocalData('orderlink_demo_customers', filtered);
    return { ok: true };
  },

  async updateProfile(profile: { full_name?: string; avatar_url?: string | null }): Promise<User> {
    if (isSupabaseConfigured) {
      try {
        const { data: userData } = await supabase.auth.getUser();
        const { data, error } = await supabase
          .from('users')
          .update(profile)
          .eq('id', userData.user?.id)
          .select()
          .single();
        if (!error && data) return data;
      } catch (err) {
        console.warn('Supabase updateProfile failed, fallback to demo mode:', err);
      }
    }

    return {
      id: 'demo-user-id',
      email: 'user@orderlink.io',
      role: 'Admin',
      full_name: profile.full_name || 'Admin User',
      avatar_url: profile.avatar_url || null
    };
  }
};