import React, { useState, useEffect, useRef } from 'react';
import { useAuth, UserRole, AppTheme, AppLanguage, AppCurrency } from '../contexts/AuthContext';
import {
  apiService,
  Order,
  MetricCard,
  ChartPoint,
  InventoryItem,
  Customer
} from '../services/api';
import { NewOrderModal } from '../components/NewOrderModal';
import { translations } from '../lib/translations';
import { formatCurrency, formatCurrencyCompact } from '../lib/currency';
import {
  LayoutDashboard,
  FileText,
  Package,
  Users,
  TrendingUp,
  Settings,
  Plus,
  Search,
  Bell,
  ChevronDown,
  Download,
  ShoppingCart,
  DollarSign,
  Clock,
  ArrowUpDown,
  MoreHorizontal,
  Calendar,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Truck,
  XCircle,
  Building,
  Check,
  Trash2,
  User,
  Sun,
  Moon,
  Edit2
} from 'lucide-react';

type TabType = 'Dashboard' | 'Orders' | 'Inventory' | 'Customers' | 'Analytics' | 'Settings';

interface Toast {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

export const Dashboard: React.FC = () => {
  const {
    role,
    setRole,
    signOut,
    user,
    theme,
    setTheme,
    language,
    setLanguage,
    currency,
    setCurrency,
    profileName,
    setProfileName,
    hasPermission
  } = useAuth();

  const [activeTab, setActiveTab] = useState<TabType>('Dashboard');
  const [toasts, setToasts] = useState<Toast[]>([]);

  // Translations
  const t = translations[language] || translations.EN;

  // Core Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [totalOrders, setTotalOrders] = useState(0);
  const [metrics, setMetrics] = useState<MetricCard[]>([]);
  const [chartData, setChartData] = useState<ChartPoint[]>([]);
  const [timeframe, setTimeframe] = useState('30_days');

  // Inventory States
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [totalInventory, setTotalInventory] = useState(0);
  const [invSearch, setInvSearch] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [invCategory, setInvCategory] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [invStatus, setInvStatus] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [invSortField, setInvSortField] = useState('id');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [invSortOrder, setInvSortOrder] = useState<'asc' | 'desc'>('asc');
  const [invPage, setInvPage] = useState(1);
  const [isInvModalOpen, setIsInvModalOpen] = useState(false);
  const [isInvEditModalOpen, setIsInvEditModalOpen] = useState(false);
  const [editInv, setEditInv] = useState<InventoryItem | null>(null);

  // Customer States
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [totalCustomers, setTotalCustomers] = useState(0);
  const [custSearch, setCustSearch] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [custStatus, setCustStatus] = useState('');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [custSortField, setCustSortField] = useState('id');
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const [custSortOrder, setCustSortOrder] = useState<'asc' | 'desc'>('asc');
  const [custPage, setCustPage] = useState(1);
  const [isCustModalOpen, setIsCustModalOpen] = useState(false);
  const [isCustEditModalOpen, setIsCustEditModalOpen] = useState(false);
  const [editCust, setEditCust] = useState<Customer | null>(null);

  // Search, Pagination, Sorting for Orders
  const [orderSearch, setOrderSearch] = useState('');
  const [orderSortField, setOrderSortField] = useState<string>('id');
  const [orderSortOrder, setOrderSortOrder] = useState<'asc' | 'desc'>('desc');
  const [orderPage, setOrderPage] = useState(1);
  const [orderLimit] = useState(10);

  const [loading, setLoading] = useState(true);
  const [isOrderModalOpen, setIsOrderModalOpen] = useState(false);
  const [isOrderEditModalOpen, setIsOrderEditModalOpen] = useState(false);
  const [editOrder, setEditOrder] = useState<Order | null>(null);

  // Dropdown States
  const [showBellDropdown, setShowBellDropdown] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showTimeframeDropdown, setShowTimeframeDropdown] = useState(false);

  // Form Inputs for Custom Additions
  const [newInv, setNewInv] = useState({ sku: '', name: '', category: 'Packaging', stock: 10, price: 9.99, status: 'In Stock' as InventoryItem['status'] });
  const [newCust, setNewCust] = useState({ name: '', email: '', phone: '', company: '', total_orders: 0, total_spent: 0, status: 'Active' as Customer['status'] });

  // Settings State (Interactive Profile)
  const activeProfileName = user?.full_name || profileName;
  const activeEmail = user?.email || 'user@orderlink.io';
  const [tempProfileName, setTempProfileName] = useState(activeProfileName);
  const [profileRole, setProfileRole] = useState<UserRole>(role || 'Retailer');
  const [profileEmail, setProfileEmail] = useState(activeEmail);
  const [profileAvatarUrl, setProfileAvatarUrl] = useState(user?.avatar_url || '');
  const [profileCompany, setProfileCompany] = useState('OrderLink Logistics');


  const bellRef = useRef<HTMLDivElement>(null);
  const profileRef = useRef<HTMLDivElement>(null);
  const timeframeRef = useRef<HTMLDivElement>(null);

  // Toast Helper
  const showToast = (message: string, type: Toast['type'] = 'success') => {
    // eslint-disable-next-line react-hooks/purity
    const id = Date.now();
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((to) => to.id !== id));
    }, 3000);
  };

  // Helper for initials
  const getInitials = (name?: string) => {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  };

  // Notifications
  const notifications = [
    { id: 1, text: 'New order #OL-4592 received from Liam Wright', time: '5 mins ago', unread: true },
    { id: 2, text: 'Shipment #SH-8291 has been dispatched', time: '1 hour ago', unread: true },
    { id: 3, text: 'Stock alert: Item SKU-9023 is running low', time: '3 hours ago', unread: false },
    { id: 4, text: 'Payment cleared for invoice #INV-9281', time: '1 day ago', unread: false }
  ];

  // Fetch Dashboard Data
  const loadDashboardData = async () => {
    try {
      setLoading(true);
      const ordersRes = await apiService.getOrders({
        search: orderSearch,
        sortField: orderSortField,
        sortOrder: orderSortOrder,
        page: orderPage,
        limit: activeTab === 'Dashboard' ? 5 : orderLimit
      });
      setOrders(ordersRes.orders || []);
      setTotalOrders(ordersRes.total || 0);

      // Only fetch metrics and charts for roles with permissions (Distributor / Retailer)
      if (role !== 'Driver') {
        const metricsRes = await apiService.getMetrics().catch(() => []);
        setMetrics(metricsRes || []);

        const chartRes = await apiService.getChartData(timeframe).catch(() => []);
        setChartData(chartRes || []);
      } else {
        setMetrics([]);
        setChartData([]);
      }
    } catch (err) {
      console.error('Error loading dashboard data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Inventory Data
  const loadInventoryData = async () => {
    try {
      setLoading(true);
      const res = await apiService.getInventory({
        search: invSearch,
        category: invCategory,
        status: invStatus,
        sortField: invSortField,
        sortOrder: invSortOrder,
        page: invPage,
        limit: 10
      });
      setInventory(res.items || []);
      setTotalInventory(res.total || 0);
    } catch (err) {
      console.error('Error loading inventory:', err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch Customer Data
  const loadCustomerData = async () => {
    try {
      setLoading(true);
      const res = await apiService.getCustomers({
        search: custSearch,
        status: custStatus,
        sortField: custSortField,
        sortOrder: custSortOrder,
        page: custPage,
        limit: 10
      });
      setCustomers(res.customers || []);
      setTotalCustomers(res.total || 0);
    } catch (err) {
      console.error('Error loading customers:', err);
    } finally {
      setLoading(false);
    }
  };

  // Load appropriate data based on tab
  useEffect(() => {
    if (activeTab === 'Dashboard' || activeTab === 'Orders' || activeTab === 'Analytics') {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      loadDashboardData();
    } else if (activeTab === 'Inventory') {
      loadInventoryData();
    } else if (activeTab === 'Customers') {
      loadCustomerData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    activeTab,
    orderSearch,
    orderSortField,
    orderSortOrder,
    orderPage,
    timeframe,
    invSearch,
    invPage,
    custSearch,
    custPage,
    language,
    currency
  ]);

  // Click outside listener
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (bellRef.current && !bellRef.current.contains(event.target as Node)) {
        setShowBellDropdown(false);
      }
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setShowProfileDropdown(false);
      }
      if (timeframeRef.current && !timeframeRef.current.contains(event.target as Node)) {
        setShowTimeframeDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Update temp settings when context updates
  useEffect(() => {
    setTempProfileName(user?.full_name || profileName);
    if (role) setProfileRole(role);
    if (user?.email) setProfileEmail(user.email);
    if (user?.avatar_url !== undefined) setProfileAvatarUrl(user.avatar_url || '');
  }, [profileName, role, user]);

  // Handle Inventory Add
  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newInv.sku || !newInv.name) {
      showToast(language === 'EN' ? 'Please fill out all required fields' : 'Mohon isi semua kolom wajib', 'error');
      return;
    }
    try {
      await apiService.createInventoryItem(newInv);
      showToast(language === 'EN' ? 'Inventory item added successfully!' : 'Barang inventaris berhasil ditambahkan!');
      setIsInvModalOpen(false);
      setNewInv({ sku: '', name: '', category: 'Packaging', stock: 10, price: 9.99, status: 'In Stock' });
      loadInventoryData();
    } catch (err) {
      showToast(language === 'EN' ? 'Failed to add inventory item' : 'Gagal menambahkan barang inventaris', 'error');
    }
  };

  // Quick adjust stock
  const handleAdjustStock = async (item: InventoryItem, amount: number) => {
    const newStock = Math.max(0, item.stock + amount);
    let newStatus: InventoryItem['status'] = 'In Stock';
    if (newStock === 0) newStatus = 'Out of Stock';
    else if (newStock < 20) newStatus = 'Low Stock';

    try {
      await apiService.updateInventoryItem({
        ...item,
        stock: newStock,
        status: newStatus
      });
      showToast(language === 'EN' ? `Stock updated for ${item.name}` : `Stok diperbarui untuk ${item.name}`);
      loadInventoryData();
    } catch (err) {
      showToast(language === 'EN' ? 'Failed to update stock' : 'Gagal memperbarui stok', 'error');
    }
  };

  // Delete Inventory Item
  const handleDeleteInventory = async (id: number) => {
    const msg = language === 'EN' ? 'Are you sure you want to delete this inventory item?' : 'Apakah Anda yakin ingin menghapus barang inventaris ini?';
    if (window.confirm(msg)) {
      try {
        await apiService.deleteInventoryItem(id);
        showToast(language === 'EN' ? 'Inventory item deleted' : 'Barang inventaris dihapus');
        loadInventoryData();
      } catch (err) {
        showToast(language === 'EN' ? 'Failed to delete item' : 'Gagal menghapus barang', 'error');
      }
    }
  };

  // Handle Customer Add
  const handleAddCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCust.name || !newCust.email) {
      showToast(language === 'EN' ? 'Please fill out Name and Email' : 'Mohon isi Nama dan Email', 'error');
      return;
    }
    try {
      await apiService.createCustomer(newCust);
      showToast(language === 'EN' ? 'Customer profile created!' : 'Profil pelanggan berhasil dibuat!');
      setIsCustModalOpen(false);
      setNewCust({ name: '', email: '', phone: '', company: '', total_orders: 0, total_spent: 0, status: 'Active' });
      loadCustomerData();
    } catch (err) {
      showToast(language === 'EN' ? 'Failed to create customer' : 'Gagal membuat profil pelanggan', 'error');
    }
  };

  // Delete Customer
  const handleDeleteCustomer = async (id: number) => {
    const msg = language === 'EN' ? 'Are you sure you want to delete this customer?' : 'Apakah Anda yakin ingin menghapus pelanggan ini?';
    if (window.confirm(msg)) {
      try {
        await apiService.deleteCustomer(id);
        showToast(language === 'EN' ? 'Customer deleted' : 'Pelangan dihapus');
        loadCustomerData();
      } catch (err) {
        showToast(language === 'EN' ? 'Failed to delete customer' : 'Gagal menghapus pelanggan', 'error');
      }
    }
  };

  // Delete Order
  const handleDeleteOrder = async (id: number) => {
    const msg = language === 'EN' ? 'Are you sure you want to delete this order?' : 'Apakah Anda yakin ingin menghapus pesanan ini?';
    if (window.confirm(msg)) {
      try {
        await apiService.deleteOrder(id);
        showToast(language === 'EN' ? 'Order deleted' : 'Pesanan dihapus');
        loadDashboardData();
      } catch (err) {
        showToast(language === 'EN' ? 'Failed to delete order' : 'Gagal menghapus pesanan', 'error');
      }
    }
  };

  // Edit Inventory Item
  const handleEditInventory = (item: InventoryItem) => {
    setEditInv(item);
    setIsInvEditModalOpen(true);
  };

  const handleUpdateInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editInv) return;
    try {
      await apiService.updateInventoryItem(editInv);
      showToast(language === 'EN' ? 'Inventory item updated successfully!' : 'Barang inventaris berhasil diperbarui!');
      setIsInvEditModalOpen(false);
      setEditInv(null);
      loadInventoryData();
    } catch (err) {
      showToast(language === 'EN' ? 'Failed to update inventory item' : 'Gagal memperbarui barang inventaris', 'error');
    }
  };

  // Edit Customer
  const handleEditCustomer = (customer: Customer) => {
    setEditCust(customer);
    setIsCustEditModalOpen(true);
  };

  const handleUpdateCustomer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editCust) return;
    try {
      await apiService.updateCustomer(editCust);
      showToast(language === 'EN' ? 'Customer updated successfully!' : 'Pelanggan berhasil diperbarui!');
      setIsCustEditModalOpen(false);
      setEditCust(null);
      loadCustomerData();
    } catch (err) {
      showToast(language === 'EN' ? 'Failed to update customer' : 'Gagal memperbarui pelanggan', 'error');
    }
  };

  // Edit Order
  const handleEditOrder = (order: Order) => {
    setEditOrder(order);
    setIsOrderEditModalOpen(true);
  };

  const handleUpdateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editOrder) return;
    try {
      await apiService.updateOrder(editOrder);
      showToast(language === 'EN' ? 'Order updated successfully!' : 'Pesanan berhasil diperbarui!');
      setIsOrderEditModalOpen(false);
      setEditOrder(null);
      loadDashboardData();
    } catch (err) {
      showToast(language === 'EN' ? 'Failed to update order' : 'Gagal memperbarui pesanan', 'error');
    }
  };

  // Save Settings (Interactive profile)
  const handleSaveSettings = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const updatedUser = await apiService.updateProfile({
        full_name: tempProfileName,
        avatar_url: profileAvatarUrl.trim() || null
      });
      setProfileName(updatedUser.full_name);
      setRole(profileRole);
      if (user) {
        const newUserObj = { ...user, full_name: updatedUser.full_name, avatar_url: updatedUser.avatar_url };
        localStorage.setItem('user_session', JSON.stringify(newUserObj));
        window.location.reload();
      }
      showToast(language === 'EN' ? 'Profile & settings saved successfully!' : 'Profil & pengaturan berhasil disimpan!');
    } catch {
      showToast(language === 'EN' ? 'Failed to update profile' : 'Gagal memperbarui profil', 'error');
    }
  };

  // Export orders list as a CSV file
  const handleExportCSV = () => {
    const headers = ['Order ID', 'Customer', 'Date', 'Total', 'Status'];
    const rows = orders.map(o => [o.order_id, o.customer_name, o.date, o.total, o.status]);
    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `orderlink_export_${timeframe}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast(language === 'EN' ? 'Data exported successfully!' : 'Data berhasil diekspor!');
  };

  const handleSortOrders = (field: string) => {
    if (orderSortField === field) {
      setOrderSortOrder(orderSortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setOrderSortField(field);
      setOrderSortOrder('desc');
    }
    setOrderPage(1);
  };

  // SVG Chart Helper
  const chartWidth = 900;
  const chartHeight = 140;
  const paddingX = 40;
  const paddingY = 20;

  // Format date for chart x-axis labels (short format)
  const formatChartDate = (dateStr: string, lang: AppLanguage = 'EN') => {
    const date = new Date(dateStr);
    if (lang === 'IND') {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short' });
    }
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short' });
  };

  // Format date for display (table, etc.)
  const formatDisplayDate = (dateStr: string, lang: AppLanguage = 'EN') => {
    const date = new Date(dateStr);
    if (lang === 'IND') {
      return date.toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' });
    }
    return date.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  };

  const getMaxY = () => {
    if (chartData.length === 0) return 1000;
    return Math.max(...chartData.map((d) => d.value), 1000);
  };

  const getPointsPath = () => {
    if (chartData.length === 0) return '';
    const maxY = getMaxY();
    return chartData
      .map((d, index) => {
        // FIX: prevent division by zero if chartData.length is 1
        const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
        const x = paddingX + (index * (chartWidth - paddingX * 2)) / divisor;
        const y = chartHeight - paddingY - (d.value / maxY) * (chartHeight - paddingY * 2);
        return `${index === 0 ? 'M' : 'L'} ${x} ${y}`;
      })
      .join(' ');
  };

  const getAreaPath = () => {
    const points = getPointsPath();
    if (!points) return '';
    const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
    const lastX = paddingX + (chartData.length - 1) * ((chartWidth - paddingX * 2) / divisor);
    return `${points} L ${lastX} ${chartHeight - paddingY} L ${paddingX} ${chartHeight - paddingY} Z`;
  };

  // Theme-based class styles
  const isDark = theme === 'dark';
  const themeBg = isDark ? 'bg-[#0c1011]' : 'bg-slate-50';
  const themeCard = isDark ? 'bg-[#0f1315] border-[#1e2427]' : 'bg-white border-slate-200';
  const themeBorder = isDark ? 'border-[#1e2427]' : 'border-slate-200';
  const themeBorderMuted = isDark ? 'border-[#1e2427]/50' : 'border-slate-100';
  const themeText = isDark ? 'text-slate-100' : 'text-slate-800';
  const themeTextMuted = isDark ? 'text-slate-400' : 'text-slate-500';
  const themeTextTitle = isDark ? 'text-white' : 'text-slate-900';
  const themeInput = isDark ? 'bg-[#121618] border-[#1e2427]' : 'bg-slate-50 border-slate-300';
  const themeHover = isDark ? 'hover:bg-[#121618]/30' : 'hover:bg-slate-50';
  const themeSelect = isDark ? 'bg-[#121618] border-[#1e2427]' : 'bg-white border-slate-300';

  // Status badge helper
  const getStatusBadge = (status: Order['status']) => {
    switch (status) {
      case 'Processing':
        return (
          <span className="bg-[#10b981] text-white px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 w-max">
            <RefreshCw className="w-3 h-3 animate-spin duration-1000" />
            {t.processing}
          </span>
        );
      case 'Pending':
        return (
          <span className="bg-[#f59e0b] text-white px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 w-max">
            <Clock className="w-3 h-3" />
            {t.pending}
          </span>
        );
      case 'Completed':
        return (
          <span className="bg-[#10b981] text-white px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 w-max">
            <CheckCircle2 className="w-3 h-3" />
            {t.completed}
          </span>
        );
      case 'Shipped':
        return (
          <span className="bg-[#3b82f6] text-white px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 w-max">
            <Truck className="w-3 h-3" />
            {t.shipped}
          </span>
        );
      case 'Cancelled':
        return (
          <span className="bg-[#ef4444] text-white px-2.5 py-0.5 rounded-full text-[11px] font-medium flex items-center gap-1 w-max">
            <XCircle className="w-3 h-3" />
            {t.cancelled}
          </span>
        );
      default:
        return null;
    }
  };

  // Render content based on active tab
  const renderTabContent = () => {
    if (activeTab === 'Dashboard') {
      return (
        <div className="flex flex-col gap-4 flex-1 overflow-hidden">
          {/* METRIC CARDS (4 cards) */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
            {metrics.map((card) => {
              const getIcon = (key: string) => {
                switch (key) {
                  case 'total_orders':
                    return (
                      <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center border border-[#10b981]/15 shrink-0">
                        <ShoppingCart className="w-5 h-5 text-[#10b981]" />
                      </div>
                    );
                  case 'net_revenue':
                    return (
                      <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center border border-[#10b981]/15 shrink-0">
                        <DollarSign className="w-5 h-5 text-[#10b981]" />
                      </div>
                    );
                  case 'avg_order_value':
                    return (
                      <div className="w-10 h-10 bg-[#10b981]/10 rounded-lg flex items-center justify-center border border-[#10b981]/15 shrink-0">
                        <DollarSign className="w-5 h-5 text-[#10b981]" />
                      </div>
                    );
                  default:
                    return null;
                }
              };

              const getSparkline = (key: string) => {
                return (
                  <svg className="w-16 h-8 text-[#10b981] shrink-0" viewBox="0 0 100 30" fill="none">
                    <path d="M0 25 L20 18 L40 22 L60 12 L80 15 L100 5" stroke="currentColor" strokeWidth="1.5" />
                  </svg>
                );
              };

              // Convert numerical value dynamically based on Currency and Language
              let displayValue = '';
              const numVal = Number(card.value) || 0;
              if (card.key === 'total_orders' || card.key === 'active_customers') {
                displayValue = numVal.toLocaleString(language === 'EN' ? 'en-US' : 'id-ID');
              } else {
                displayValue = formatCurrency(numVal, currency, true);
              }

              return (
                <div key={card.key} className={`border rounded-xl p-4 flex items-center justify-between shadow-md ${themeCard}`}>
                  <div className="flex items-center gap-3 min-w-0">
                    {getIcon(card.key)}
                    <div className="min-w-0">
                      <p className={`text-[11px] font-semibold uppercase tracking-wider truncate ${themeTextMuted}`}>
                        {card.key === 'total_orders' ? t.totalOrders : card.key === 'net_revenue' ? t.netRevenue : card.key === 'avg_order_value' ? t.avgOrderValue : t.pendingOrders}
                      </p>
                      <h3 className={`text-lg font-bold mt-0.5 truncate ${themeTextTitle}`}>{displayValue}</h3>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] font-bold ${card.type === 'green' ? 'text-[#10b981]' : 'text-slate-500'}`}>
                          {card.change}
                        </span>
                        <span className="text-[10px] text-slate-500">{t.vsLastMonth}</span>
                      </div>
                    </div>
                  </div>
                  {getSparkline(card.key)}
                </div>
              );
            })}
          </div>

          {/* CHART CARD */}
          <div className={`border rounded-xl p-4 flex flex-col h-[210px] shrink-0 ${themeCard}`}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className={`text-xs font-bold uppercase tracking-wider ${themeTextMuted}`}>{t.revenueOverview}</h2>
              <div className="text-[10px] text-slate-500 flex items-center gap-1">
                <span className="w-2 h-2 bg-[#10b981] rounded-full"></span>
                <span>{language === 'EN' ? 'Revenue' : 'Pendapatan'} ({currency})</span>
              </div>
            </div>

            <div className="flex-1 relative min-h-0">
              {loading ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10b981]"></div>
                </div>
              ) : (
                <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                  <defs>
                    <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#10b981" stopOpacity="0.25" />
                      <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                    </linearGradient>
                  </defs>

                  {/* Horizontal Gridlines - Dynamic based on maxY */}
                  {(() => {
                    const maxY = getMaxY();
                    const steps = 5;
                    const stepSize = maxY / steps;
                    return Array.from({ length: steps + 1 }, (_, i) => i * stepSize).map((val, i) => {
                      const y = chartHeight - paddingY - (val / maxY) * (chartHeight - paddingY * 2);
                      return (
                        <g key={`gridline-${i}`}>
                          <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke={isDark ? '#1e2427' : '#e2e8f0'} strokeWidth="0.75" strokeDasharray="3 3" />
                          <text x={paddingX - 10} y={y + 3} fill="#4b5563" fontSize="8" textAnchor="end" fontWeight="500">
                            {formatCurrencyCompact(val, currency, true)}
                          </text>
                        </g>
                      );
                    });
                  })()}

                  {/* Area Path */}
                  {chartData.length > 0 && <path d={getAreaPath()} fill="url(#chart-grad)" />}
                  {chartData.length > 0 && <path d={getPointsPath()} fill="none" stroke="#10b981" strokeWidth="2" />}

                  {/* Dots & Tooltips */}
                  {chartData.map((d, index) => {
                    const maxY = getMaxY();
                    const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
                    const x = paddingX + (index * (chartWidth - paddingX * 2)) / divisor;
                    const y = chartHeight - paddingY - (d.value / maxY) * (chartHeight - paddingY * 2);

                    return (
                      <g key={d.id || `chart-dot-1-${index}`} className="group cursor-pointer">
                        <circle cx={x} cy={y} r="3" fill="#10b981" stroke={isDark ? '#0f1315' : 'white'} strokeWidth="1" className="transition-all duration-200 group-hover:r-5 group-hover:stroke-white" />
                        <g key={`tooltip-${d.id || index}`} className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                          <rect x={x - 45} y={y - 25} width="90" height="18" rx="4" fill="#1e2427" stroke="#10b981" strokeWidth="0.5" />
                          <text x={x} y={y - 13} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">
                            {formatCurrency(d.value, currency, true)}
                          </text>
                        </g>
                        {index % (chartData.length > 10 ? 2 : 1) === 0 && (
                          <text key={`label-${d.id || index}`} x={x} y={chartHeight - 4} fill="#4b5563" fontSize="8" textAnchor="middle" fontWeight="500">
                            {formatChartDate(d.date, language)}
                          </text>
                        )}
                      </g>
                    );
                  })}
                </svg>
              )}
            </div>
          </div>

          {/* RECENT ORDERS TABLE */}
          <div className={`border rounded-xl p-4 flex flex-col flex-1 min-h-0 shadow-md ${themeCard}`}>
            <div className="flex items-center justify-between mb-3 shrink-0">
              <h2 className={`text-xs font-bold uppercase tracking-wider ${themeTextMuted}`}>{t.recentOrders}</h2>
              <button
                onClick={() => setActiveTab('Orders')}
                className="text-[10px] text-[#10b981] hover:underline font-medium cursor-pointer"
              >
                {t.viewAllOrders}
              </button>
            </div>

            <div className="flex-1 overflow-auto min-h-0">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className={`border-b font-semibold ${themeBorder} ${themeTextMuted}`}>
                    <th onClick={() => handleSortOrders('order_id')} className="pb-2.5 pr-6 cursor-pointer hover:text-white select-none">
                      <div className="flex items-center gap-1">
                        {t.orderId} <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" />
                      </div>
                    </th>
                    <th className="pb-2.5 pr-6">{t.customer}</th>
                    <th className="pb-2.5 pr-6">{t.date}</th>
                    <th className="pb-2.5 pr-16 text-right whitespace-nowrap">{t.total}</th>
                    <th className="pb-2.5 pr-6 whitespace-nowrap">{t.status}</th>
                  </tr>
                </thead>
                <tbody className={`divide-y ${isDark ? 'divide-[#1e2427]/40' : 'divide-slate-100'}`}>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">
                        <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#10b981] mx-auto"></div>
                      </td>
                    </tr>
                  ) : orders.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-500">No orders found.</td>
                    </tr>
                  ) : (
                    orders.slice(0, 5).map((order) => (
                      <tr key={order.id} className={`transition-all ${themeHover}`}>
                        <td className="py-2.5 pr-6 font-semibold text-[#10b981] whitespace-nowrap">{order.order_id}</td>
                        <td className={`py-2.5 pr-6 font-medium ${themeText} whitespace-nowrap`}>{order.customer_name}</td>
                        <td className={`py-2.5 pr-6 ${themeTextMuted} whitespace-nowrap`}>{formatDisplayDate(order.date, language)}</td>
                        <td className={`py-2.5 pr-16 text-right font-semibold ${themeText} whitespace-nowrap`}>{formatCurrency(order.total, currency, true)}</td>
                        <td className="py-2.5 pr-6 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'Orders') {
      const orderTotalPages = Math.ceil(totalOrders / orderLimit);
      return (
        <div className={`border rounded-xl p-6 flex flex-col flex-1 min-h-0 shadow-md ${themeCard}`}>
          {/* Header Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0">
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${themeTextTitle}`}>Fulfillment & Order List</h2>
              <p className={`text-[11px] mt-1 ${themeTextMuted}`}>Manage and track all customer orders and shipments</p>
            </div>
            <div className="flex items-center gap-3">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
                  <Search className="w-4 h-4" />
                </span>
                <input aria-label="Field 1" id="field_1" name="field_1"
                  type="text"
                  placeholder="Filter by customer/ID..."
                  value={orderSearch}
                  onChange={(e) => {
                    setOrderSearch(e.target.value);
                    setOrderPage(1);
                  }}
                  className={`text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] pl-9 pr-4 py-2 rounded-xl text-xs w-56 transition-all ${themeInput}`}
                />
              </div>
              <button
                onClick={() => setIsOrderModalOpen(true)}
                className="bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs shadow-md"
              >
                <Plus className="w-4 h-4" /> {t.addItem}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-semibold uppercase tracking-wider text-[10px] ${themeBorder} ${themeTextMuted}`}>
                  <th onClick={() => handleSortOrders('order_id')} className="pb-3 pr-6 cursor-pointer hover:text-white select-none">
                    <div className="flex items-center gap-1">{t.orderId} <ArrowUpDown className="w-3.5 h-3.5 text-slate-500" /></div>
                  </th>
                  <th className="pb-3 pr-6">{t.customer}</th>
                  <th className="pb-3 pr-6">{t.date}</th>
                  <th className="pb-3 pr-16 text-right whitespace-nowrap">{t.total}</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">{t.status}</th>
                  <th className="pb-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e2427]/40' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={6} className="py-12 text-center text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10b981] mx-auto"></div>
                    </td>
                  </tr>
                ) : orders.length === 0 ? (
                  <tr>
                    <td colSpan={6} className={`py-12 text-center ${themeTextMuted}`}>No orders found. Add some using the button!</td>
                  </tr>
                ) : (
                  orders.map((order) => (
                    <tr key={order.id} className={`transition-all ${themeHover}`}>
                      <td className="py-3 pr-6 font-semibold text-[#10b981] whitespace-nowrap">{order.order_id}</td>
                      <td className={`py-3 pr-6 font-medium ${themeText} whitespace-nowrap`}>{order.customer_name}</td>
                      <td className={`py-3 pr-6 ${themeTextMuted} whitespace-nowrap`}>{formatDisplayDate(order.date, language)}</td>
                      <td className={`py-3 pr-16 text-right font-semibold ${themeText} whitespace-nowrap`}>{formatCurrency(order.total, currency, true)}</td>
                      <td className="py-3 pr-6 whitespace-nowrap">{getStatusBadge(order.status)}</td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleEditOrder(order)}
                          className="text-slate-400 hover:text-green-400 p-1.5 rounded-lg transition-colors cursor-pointer mr-1"
                          title="Edit Order"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteOrder(order.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Delete Order"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex items-center justify-between border-t pt-4 mt-4 shrink-0 ${themeBorder}`}>
            <span className={`text-[10px] font-medium ${themeTextMuted}`}>
              {t.showing} {totalOrders === 0 ? 0 : (orderPage - 1) * orderLimit + 1}-
              {Math.min(orderPage * orderLimit, totalOrders)} {t.of} {totalOrders.toLocaleString('en-US')} {t.orders.toLowerCase()}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={orderPage === 1}
                onClick={() => setOrderPage(orderPage - 1)}
                className={`text-slate-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${themeInput}`}
              >
                &lt; {t.previous}
              </button>
              {Array.from({ length: orderTotalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setOrderPage(i + 1)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                    i + 1 === orderPage
                      ? 'bg-[#1a2224] border border-[#10b981]/30 text-[#10b981]'
                      : `text-slate-400 hover:text-white ${themeInput}`
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={orderPage === orderTotalPages || orderTotalPages === 0}
                onClick={() => setOrderPage(orderPage + 1)}
                className={`text-slate-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${themeInput}`}
              >
                {t.next} &gt;
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'Inventory') {
      const invTotalPages = Math.ceil(totalInventory / 10);
      return (
        <div className={`border rounded-xl p-6 flex flex-col flex-1 min-h-0 shadow-md ${themeCard}`}>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0">
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${themeTextTitle}`}>{t.warehouseStock}</h2>
              <p className={`text-[11px] mt-1 ${themeTextMuted}`}>{t.trackStock}</p>
            </div>
            <div className="flex items-center gap-3">
              <input aria-label="Field 2" id="field_2" name="field_2"
                type="text"
                placeholder={t.searchStock}
                value={invSearch}
                onChange={(e) => {
                  setInvSearch(e.target.value);
                  setInvPage(1);
                }}
                className={`text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs w-48 transition-all ${themeInput}`}
              />
              <button
                onClick={() => setIsInvModalOpen(true)}
                className="bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" /> {t.addItem}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-semibold uppercase tracking-wider text-[10px] ${themeBorder} ${themeTextMuted}`}>
                  <th className="pb-3 pr-6">{t.sku}</th>
                  <th className="pb-3 pr-6">{t.productName}</th>
                  <th className="pb-3 pr-6">{t.category}</th>
                  <th className="pb-3 pr-6 text-center">{t.stockLevel}</th>
                  <th className="pb-3 pr-6 text-right whitespace-nowrap">{t.unitPrice}</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">{t.status}</th>
                  <th className="pb-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e2427]/40' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={7} className="py-12 text-center text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10b981] mx-auto"></div>
                    </td>
                  </tr>
                ) : inventory.length === 0 ? (
                  <tr>
                    <td colSpan={7} className={`py-12 text-center ${themeTextMuted}`}>No inventory items found.</td>
                  </tr>
                ) : (
                  inventory.map((item) => (
                    <tr key={item.id} className={`transition-all ${themeHover}`}>
                      <td className={`py-3 pr-6 font-semibold ${themeTextMuted} whitespace-nowrap`}>{item.sku}</td>
                      <td className={`py-3 pr-6 font-medium ${themeText}`}>{item.name}</td>
                      <td className={`py-3 pr-6 ${themeTextMuted} whitespace-nowrap`}>{item.category}</td>
                      <td className="py-3 pr-6 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button
                            onClick={() => handleAdjustStock(item, -10)}
                            className={`w-5 h-5 border hover:border-slate-600 text-slate-400 rounded flex items-center justify-center font-bold text-xs cursor-pointer select-none ${themeInput}`}
                          >
                            -
                          </button>
                          <span className={`font-semibold w-10 text-center ${themeText}`}>{item.stock}</span>
                          <button
                            onClick={() => handleAdjustStock(item, 10)}
                            className={`w-5 h-5 border hover:border-slate-600 text-slate-400 rounded flex items-center justify-center font-bold text-xs cursor-pointer select-none ${themeInput}`}
                          >
                            +
                          </button>
                        </div>
                      </td>
                      <td className={`py-3 pr-6 text-right font-semibold ${themeText} whitespace-nowrap`}>{formatCurrency(item.price, currency)}</td>
                      <td className="py-3 pr-6 whitespace-nowrap">
                        {item.status === 'In Stock' && (
                          <span className="bg-[#10b981]/15 text-[#10b981] border border-[#10b981]/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">{t.inStock}</span>
                        )}
                        {item.status === 'Low Stock' && (
                          <span className="bg-[#f59e0b]/15 text-[#f59e0b] border border-[#f59e0b]/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">{t.lowStock}</span>
                        )}
                        {item.status === 'Out of Stock' && (
                          <span className="bg-[#ef4444]/15 text-[#ef4444] border border-[#ef4444]/20 px-2.5 py-0.5 rounded-full text-[10px] font-medium">{t.outOfStock}</span>
                        )}
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleEditInventory(item)}
                          className="text-slate-400 hover:text-green-400 p-1.5 rounded-lg transition-colors cursor-pointer mr-1"
                          title="Edit Item"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteInventory(item.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Delete Item"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex items-center justify-between border-t pt-4 mt-4 shrink-0 ${themeBorder}`}>
            <span className={`text-[10px] font-medium ${themeTextMuted}`}>
              {t.showing} {totalInventory === 0 ? 0 : (invPage - 1) * 10 + 1}-
              {Math.min(invPage * 10, totalInventory)} {t.of} {totalInventory.toLocaleString('en-US')} {t.inventory.toLowerCase()} {language === 'EN' ? 'items' : 'barang'}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={invPage === 1}
                onClick={() => setInvPage(invPage - 1)}
                className={`text-slate-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${themeInput}`}
              >
                &lt; {t.previous}
              </button>
              {Array.from({ length: invTotalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setInvPage(i + 1)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                    i + 1 === invPage
                      ? 'bg-[#1a2224] border border-[#10b981]/30 text-[#10b981]'
                      : `text-slate-400 hover:text-white ${themeInput}`
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={invPage === invTotalPages || invTotalPages === 0}
                onClick={() => setInvPage(invPage + 1)}
                className={`text-slate-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${themeInput}`}
              >
                {t.next} &gt;
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'Customers') {
      const custTotalPages = Math.ceil(totalCustomers / 10);
      return (
        <div className={`border rounded-xl p-6 flex flex-col flex-1 min-h-0 shadow-md ${themeCard}`}>
          {/* Controls */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-5 shrink-0">
            <div>
              <h2 className={`text-sm font-bold uppercase tracking-wider ${themeTextTitle}`}>{t.customerDirectory}</h2>
              <p className={`text-[11px] mt-1 ${themeTextMuted}`}>{t.manageClients}</p>
            </div>
            <div className="flex items-center gap-3">
              <input aria-label="Field 3" id="field_3" name="field_3"
                type="text"
                placeholder={t.searchCustomers}
                value={custSearch}
                onChange={(e) => {
                  setCustSearch(e.target.value);
                  setCustPage(1);
                }}
                className={`text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs w-48 transition-all ${themeInput}`}
              />
              <button
                onClick={() => setIsCustModalOpen(true)}
                className="bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl font-semibold flex items-center gap-1.5 cursor-pointer text-xs"
              >
                <Plus className="w-4 h-4" /> {t.addItem}
              </button>
            </div>
          </div>

          {/* Table */}
          <div className="flex-1 overflow-auto min-h-0">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className={`border-b font-semibold uppercase tracking-wider text-[10px] ${themeBorder} ${themeTextMuted}`}>
                  <th className="pb-3 pr-6">{t.name}</th>
                  <th className="pb-3 pr-6">{t.company}</th>
                  <th className="pb-3 pr-6">{t.email}</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">{t.phone}</th>
                  <th className="pb-3 pr-6 text-center whitespace-nowrap">{t.totalOrders}</th>
                  <th className="pb-3 pr-6 text-right whitespace-nowrap">{t.totalSpent}</th>
                  <th className="pb-3 pr-6 whitespace-nowrap">{t.status}</th>
                  <th className="pb-3 text-right">{t.actions}</th>
                </tr>
              </thead>
              <tbody className={`divide-y ${isDark ? 'divide-[#1e2427]/40' : 'divide-slate-100'}`}>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="py-12 text-center text-slate-500">
                      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#10b981] mx-auto"></div>
                    </td>
                  </tr>
                ) : customers.length === 0 ? (
                  <tr>
                    <td colSpan={8} className={`py-12 text-center ${themeTextMuted}`}>No customers found.</td>
                  </tr>
                ) : (
                  customers.map((c) => (
                    <tr key={c.id} className={`transition-all ${themeHover}`}>
                      <td className={`py-3 pr-6 font-semibold ${themeText} whitespace-nowrap`}>{c.name}</td>
                      <td className={`py-3 pr-6 font-medium ${themeText}`}>{c.company}</td>
                      <td className={`py-3 pr-6 ${themeTextMuted}`}>{c.email}</td>
                      <td className={`py-3 pr-6 ${themeTextMuted} whitespace-nowrap`}>{c.phone}</td>
                      <td className={`py-3 pr-6 text-center font-medium ${themeText} whitespace-nowrap`}>{c.total_orders}</td>
                      <td className={`py-3 pr-6 text-right font-semibold text-[#10b981] whitespace-nowrap`}>{formatCurrency(c.total_spent, currency)}</td>
                      <td className="py-3 pr-6 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-[10px] font-medium border ${
                          c.status === 'Active'
                            ? 'bg-[#10b981]/15 text-[#10b981] border-[#10b981]/20'
                            : 'bg-slate-800/20 text-slate-400 border-slate-700/30'
                        }`}>
                          {c.status === 'Active' ? t.active : t.inactive}
                        </span>
                      </td>
                      <td className="py-3 text-right">
                        <button
                          onClick={() => handleEditCustomer(c)}
                          className="text-slate-400 hover:text-green-400 p-1.5 rounded-lg transition-colors cursor-pointer mr-1"
                          title="Edit Customer"
                        >
                          <Edit2 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteCustomer(c.id)}
                          className="text-slate-500 hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer"
                          title="Delete Customer"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className={`flex items-center justify-between border-t pt-4 mt-4 shrink-0 ${themeBorder}`}>
            <span className={`text-[10px] font-medium ${themeTextMuted}`}>
              {t.showing} {totalCustomers === 0 ? 0 : (custPage - 1) * 10 + 1}-
              {Math.min(custPage * 10, totalCustomers)} {t.of} {totalCustomers.toLocaleString('en-US')} {t.customers.toLowerCase()}
            </span>
            <div className="flex items-center gap-1.5">
              <button
                disabled={custPage === 1}
                onClick={() => setCustPage(custPage - 1)}
                className={`text-slate-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${themeInput}`}
              >
                &lt; {t.previous}
              </button>
              {Array.from({ length: custTotalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCustPage(i + 1)}
                  className={`px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all cursor-pointer ${
                    i + 1 === custPage
                      ? 'bg-[#1a2224] border border-[#10b981]/30 text-[#10b981]'
                      : `text-slate-400 hover:text-white ${themeInput}`
                  }`}
                >
                  {i + 1}
                </button>
              ))}
              <button
                disabled={custPage === custTotalPages || custTotalPages === 0}
                onClick={() => setCustPage(custPage + 1)}
                className={`text-slate-400 hover:text-white px-2.5 py-1 rounded-lg text-[10px] font-semibold transition-all disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer ${themeInput}`}
              >
                {t.next} &gt;
              </button>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'Analytics') {
      return (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 flex-1 overflow-y-auto pr-1">
          {/* Key Metric cards */}
          <div className="md:col-span-3 grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className={`border rounded-xl p-4 ${themeCard}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${themeTextMuted}`}>{t.fulfillmentRate}</p>
              <h3 className={`text-xl font-bold mt-1 ${themeTextTitle}`}>98.2%</h3>
              <div className="text-[10px] text-[#10b981] mt-1">↑ 1.4% {t.vsLastWeek}</div>
            </div>
            <div className={`border rounded-xl p-4 ${themeCard}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${themeTextMuted}`}>{t.avgDeliveryTime}</p>
              <h3 className={`text-xl font-bold mt-1 ${themeTextTitle}`}>2.4 {language === 'EN' ? 'Days' : 'Hari'}</h3>
              <div className="text-[10px] text-[#10b981] mt-1">↓ 0.3 {language === 'EN' ? 'days faster' : 'hari lebih cepat'}</div>
            </div>
            <div className={`border rounded-xl p-4 ${themeCard}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${themeTextMuted}`}>{t.returnRate}</p>
              <h3 className={`text-xl font-bold mt-1 ${themeTextTitle}`}>0.4%</h3>
              <div className={`text-[10px] mt-1 ${themeTextMuted}`}>{t.stable}</div>
            </div>
            <div className={`border rounded-xl p-4 ${themeCard}`}>
              <p className={`text-[10px] font-bold uppercase tracking-wider ${themeTextMuted}`}>{t.activeDrivers}</p>
              <h3 className={`text-xl font-bold mt-1 ${themeTextTitle}`}>14 {language === 'EN' ? 'Drivers' : 'Supir'}</h3>
              <div className="text-[10px] text-[#10b981] mt-1">3 {t.onStandby}</div>
            </div>
          </div>

          {/* Line Chart card */}
          <div className={`md:col-span-2 border rounded-xl p-5 flex flex-col h-[280px] ${themeCard}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${themeTextMuted}`}>{t.volumeAnalytics}</h3>
            <div className="flex-1 min-h-0 relative">
              <svg className="w-full h-full" viewBox={`0 0 ${chartWidth} ${chartHeight}`} preserveAspectRatio="none">
                <defs>
                  <linearGradient id="chart-grad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="#10b981" stopOpacity="0.2" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0" />
                  </linearGradient>
                </defs>
                {/* Gridlines */}
                {[0, 0.25, 0.5, 0.75, 1].map((val, i) => {
                  const y = paddingY + (1 - val) * (chartHeight - paddingY * 2);
                  return (
                    <g key={`gridline-${i}`}>
                      <line x1={paddingX} y1={y} x2={chartWidth - paddingX} y2={y} stroke={isDark ? '#1e2427' : '#e2e8f0'} strokeWidth="0.5" strokeDasharray="3 3" />
                      <text x={paddingX - 8} y={y + 3} fill="#4b5563" fontSize="8" textAnchor="end" fontWeight="500">{formatCurrencyCompact(getMaxY() * val, currency, true)}</text>
                    </g>
                  );
                })}
                {/* X-axis labels */}
                {chartData.length > 0 && chartData.map((d, index) => {
                  const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
                  const x = paddingX + (index * (chartWidth - paddingX * 2)) / divisor;
                  return index % (chartData.length > 10 ? 2 : 1) === 0 ? (
                    <text key={d.id || index} x={x} y={chartHeight - 4} fill="#4b5563" fontSize="8" textAnchor="middle" fontWeight="500">
                      {formatChartDate(d.date, language)}
                    </text>
                  ) : null;
                })}
                {/* Area Path */}
                {chartData.length > 0 && <path d={getAreaPath()} fill="url(#chart-grad)" />}
                {/* Line Path */}
                {chartData.length > 0 && <path d={getPointsPath()} fill="none" stroke="#10b981" strokeWidth="2.5" />}
                {/* Dots & Tooltips */}
                {chartData.map((d, index) => {
                  const maxY = getMaxY();
                  const divisor = chartData.length > 1 ? chartData.length - 1 : 1;
                  const x = paddingX + (index * (chartWidth - paddingX * 2)) / divisor;
                  const y = chartHeight - paddingY - (d.value / maxY) * (chartHeight - paddingY * 2);

                  return (
                    <g key={d.id || `chart-dot-2-${index}`} className="group cursor-pointer">
                      <circle cx={x} cy={y} r="3" fill="#10b981" stroke={isDark ? '#0f1315' : 'white'} strokeWidth="1" className="transition-all duration-200 group-hover:r-5 group-hover:stroke-white" />
                      <g className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none">
                        <rect x={x - 45} y={y - 25} width="90" height="18" rx="4" fill="#1e2427" stroke="#10b981" strokeWidth="0.5" />
                        <text x={x} y={y - 13} fill="white" fontSize="8" textAnchor="middle" fontWeight="bold">
                          {formatCurrency(d.value, currency, true)}
                        </text>
                      </g>
                    </g>
                  );
                })}
                {chartData.length === 0 && (
                  <text x={chartWidth / 2} y={chartHeight / 2} fill="#4b5563" fontSize="12" textAnchor="middle" dominantBaseline="middle">
                    {t.noDataAvailable}
                  </text>
                )}
              </svg>
            </div>
          </div>

          {/* Fulfillment distribution card */}
          <div className={`border rounded-xl p-5 flex flex-col h-[280px] ${themeCard}`}>
            <h3 className={`text-xs font-bold uppercase tracking-wider mb-4 ${themeTextMuted}`}>{t.fulfillmentStatus}</h3>
            <div className="space-y-4 flex-1 overflow-auto">
              <div>
                <div className={`flex justify-between text-xs mb-1 ${themeText}`}>
                  <span>{t.completed}</span>
                  <span className={`font-semibold ${themeTextTitle}`}>74%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#121618]' : 'bg-slate-100'}`}>
                  <div className="bg-[#10b981] h-full rounded-full" style={{ width: '74%' }}></div>
                </div>
              </div>
              <div>
                <div className={`flex justify-between text-xs mb-1 ${themeText}`}>
                  <span>{t.shipped}</span>
                  <span className={`font-semibold ${themeTextTitle}`}>16%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#121618]' : 'bg-slate-100'}`}>
                  <div className="bg-[#3b82f6] h-full rounded-full" style={{ width: '16%' }}></div>
                </div>
              </div>
              <div>
                <div className={`flex justify-between text-xs mb-1 ${themeText}`}>
                  <span>{t.processing}</span>
                  <span className={`font-semibold ${themeTextTitle}`}>8%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#121618]' : 'bg-slate-100'}`}>
                  <div className="bg-yellow-500 h-full rounded-full" style={{ width: '8%' }}></div>
                </div>
              </div>
              <div>
                <div className={`flex justify-between text-xs mb-1 ${themeText}`}>
                  <span>{t.cancelled}</span>
                  <span className={`font-semibold ${themeTextTitle}`}>2%</span>
                </div>
                <div className={`w-full h-2 rounded-full overflow-hidden ${isDark ? 'bg-[#121618]' : 'bg-slate-100'}`}>
                  <div className="bg-[#ef4444] h-full rounded-full" style={{ width: '2%' }}></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      );
    }

    if (activeTab === 'Settings') {
      return (
        <form onSubmit={handleSaveSettings} className={`border rounded-xl p-6 flex flex-col flex-1 overflow-y-auto shadow-md space-y-6 ${themeCard}`}>
          <div>
            <h2 className={`text-sm font-bold uppercase tracking-wider ${themeTextTitle}`}>{t.enterpriseSettings}</h2>
            <p className={`text-[11px] mt-1 ${themeTextMuted}`}>{t.configureProfile}</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Left Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <User className="w-4 h-4" /> {t.userProfile}
              </h3>
              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${themeTextMuted}`}>{t.displayName}</label>
                <input aria-label="Field 4" id="field_4" name="field_4"
                  type="text"
                  required
                  value={tempProfileName}
                  onChange={(e) => setTempProfileName(e.target.value)}
                  className={`w-full text-slate-200 focus:outline-none focus:border-[#10b981] px-3.5 py-2 rounded-xl text-xs transition-all ${themeInput}`}
                />
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${themeTextMuted}`}>{language === 'EN' ? 'Profile Picture URL (Image Link)' : 'URL Foto Profil (Link Gambar)'}</label>
                <input aria-label="Field Avatar" id="field_avatar" name="field_avatar"
                  type="url"
                  placeholder="https://example.com/photo.jpg"
                  value={profileAvatarUrl}
                  onChange={(e) => setProfileAvatarUrl(e.target.value)}
                  className={`w-full text-slate-200 focus:outline-none focus:border-[#10b981] px-3.5 py-2 rounded-xl text-xs transition-all ${themeInput}`}
                />
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${themeTextMuted}`}>{t.emailAddress}</label>
                <input aria-label="Field 5" id="field_5" name="field_5"
                  type="email"
                  required
                  value={profileEmail}
                  onChange={(e) => setProfileEmail(e.target.value)}
                  className={`w-full text-slate-200 focus:outline-none focus:border-[#10b981] px-3.5 py-2 rounded-xl text-xs transition-all ${themeInput}`}
                />
              </div>
              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1.5 ${themeTextMuted}`}>{t.portalRole}</label>
                <select aria-label="Field 6" id="field_6" name="field_6"
                  value={profileRole}
                  onChange={(e) => setProfileRole(e.target.value as UserRole)}
                  className={`w-full text-slate-200 focus:outline-none focus:border-[#10b981] px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${themeSelect}`}
                >
                  <option value="Distributor">Distributor</option>
                  <option value="Retailer">Retailer</option>
                  <option value="Driver">Driver</option>
                </select>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-4">
              <h3 className="text-xs font-bold text-[#10b981] uppercase tracking-wider flex items-center gap-1.5 border-b pb-2">
                <Building className="w-4 h-4" /> {language === 'EN' ? 'Localization & Organization' : 'Lokalisasi & Organisasi'}
              </h3>
              
              {/* Language Switcher */}
              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1.5 ${themeTextMuted}`}>{t.language}</label>
                <select aria-label="Field 7" id="field_7" name="field_7"
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as AppLanguage)}
                  className={`w-full text-slate-200 focus:outline-none focus:border-[#10b981] px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${themeSelect}`}
                >
                  <option value="EN">{t.english}</option>
                  <option value="IND">{t.indonesian}</option>
                </select>
              </div>

              {/* Currency Switcher */}
              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1.5 ${themeTextMuted}`}>{t.currency}</label>
                <select aria-label="Field 8" id="field_8" name="field_8"
                  value={currency}
                  onChange={(e) => setCurrency(e.target.value as AppCurrency)}
                  className={`w-full text-slate-200 focus:outline-none focus:border-[#10b981] px-3.5 py-2 rounded-xl text-xs transition-all cursor-pointer ${themeSelect}`}
                >
                  <option value="USD">{t.usd}</option>
                  <option value="IDR">{t.idr}</option>
                </select>
              </div>

              <div>
                <label className={`block text-[10px] font-bold uppercase mb-1 ${themeTextMuted}`}>{t.companyName}</label>
                <input aria-label="Field 9" id="field_9" name="field_9"
                  type="text"
                  required
                  value={profileCompany}
                  onChange={(e) => setProfileCompany(e.target.value)}
                  className={`w-full text-slate-200 focus:outline-none focus:border-[#10b981] px-3.5 py-2 rounded-xl text-xs transition-all ${themeInput}`}
                />
              </div>
            </div>
          </div>

          {/* Footer Save Button */}
          <div className={`pt-4 border-t flex justify-end shrink-0 ${themeBorder}`}>
            <button
              type="submit"
              className="bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2 px-6 rounded-xl text-xs shadow-md cursor-pointer transition-all flex items-center gap-1.5"
            >
              <Check className="w-4 h-4" /> {t.saveSettings}
            </button>
          </div>
        </form>
      );
    }

    return null;
  };

  return (
    <div className={`flex h-screen w-screen overflow-hidden font-sans select-none ${themeBg} ${themeText}`}>
      {/* SIDEBAR */}
      <div className={`w-60 border-r flex flex-col justify-between h-full shrink-0 ${themeCard}`}>
        <div>
          {/* Logo */}
          <div className={`px-6 py-5 flex items-center gap-2.5 border-b ${themeBorderMuted}`}>
            <div className="w-7 h-7 bg-[#10b981]/15 rounded-lg flex items-center justify-center border border-[#10b981]/30">
              <ShoppingCart className="w-4 h-4 text-[#10b981]" />
            </div>
            <span className={`text-lg font-bold tracking-tight ${themeTextTitle}`}>OrderLink</span>
          </div>

          {/* New Order Pill Button */}
          <div className="px-4 mt-5">
            <button
              onClick={() => setIsOrderModalOpen(true)}
              className="w-full bg-[#10b981] hover:bg-[#059669] text-white py-2.5 px-4 rounded-full font-semibold flex items-center justify-center gap-2 shadow-lg shadow-emerald-950/20 transition-all cursor-pointer text-sm animate-pulse hover:animate-none"
            >
              <Plus className="w-4 h-4" />
              {t.newOrder}
            </button>
          </div>

          {/* Navigation Menu (6 items) */}
          <nav className="px-3 mt-6 space-y-1">
            {hasPermission('Dashboard') && (
            <button
              onClick={() => setActiveTab('Dashboard')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'Dashboard'
                  ? 'bg-[#10b981]/10 text-[#10b981] border-l-2 border-[#10b981]'
                  : `${themeTextMuted} hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#121618] dark:hover:text-slate-200`
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              {t.dashboard}
            </button>
            )}
            {hasPermission('Orders') && (
            <button
              onClick={() => setActiveTab('Orders')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'Orders'
                  ? 'bg-[#10b981]/10 text-[#10b981] border-l-2 border-[#10b981]'
                  : `${themeTextMuted} hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#121618] dark:hover:text-slate-200`
              }`}
            >
              <FileText className="w-4 h-4" />
              {t.orders}
            </button>
            )}
            {hasPermission('Inventory') && (
            <button
              onClick={() => setActiveTab('Inventory')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'Inventory'
                  ? 'bg-[#10b981]/10 text-[#10b981] border-l-2 border-[#10b981]'
                  : `${themeTextMuted} hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#121618] dark:hover:text-slate-200`
              }`}
            >
              <Package className="w-4 h-4" />
              {t.inventory}
            </button>
            )}
            {hasPermission('Customers') && (
            <button
              onClick={() => setActiveTab('Customers')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'Customers'
                  ? 'bg-[#10b981]/10 text-[#10b981] border-l-2 border-[#10b981]'
                  : `${themeTextMuted} hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#121618] dark:hover:text-slate-200`
              }`}
            >
              <Users className="w-4 h-4" />
              {t.customers}
            </button>
            )}
            {hasPermission('Analytics') && (
            <button
              onClick={() => setActiveTab('Analytics')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'Analytics'
                  ? 'bg-[#10b981]/10 text-[#10b981] border-l-2 border-[#10b981]'
                  : `${themeTextMuted} hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#121618] dark:hover:text-slate-200`
              }`}
            >
              <TrendingUp className="w-4 h-4" />
              {t.analytics}
            </button>
            )}
            {hasPermission('Settings') && (
            <button
              onClick={() => setActiveTab('Settings')}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all cursor-pointer ${
                activeTab === 'Settings'
                  ? 'bg-[#10b981]/10 text-[#10b981] border-l-2 border-[#10b981]'
                  : `${themeTextMuted} hover:bg-slate-100 hover:text-slate-900 dark:hover:bg-[#121618] dark:hover:text-slate-200`
              }`}
            >
              <Settings className="w-4 h-4" />
              {t.settings}
            </button>
            )}
          </nav>
        </div>

        {/* Sidebar Bottom Profile */}
        <div className={`p-4 border-t flex items-center justify-between ${themeBorderMuted}`}>
          <div className="flex items-center gap-2.5 min-w-0">
            {user?.avatar_url ? (
              <img src={user.avatar_url} alt="Profile" className="w-9 h-9 rounded-full object-cover shrink-0 border border-yellow-400/30" />
            ) : (
              <div className="w-9 h-9 rounded-full bg-yellow-500 flex items-center justify-center text-slate-900 font-bold text-sm shrink-0 border border-yellow-400/30">
                {getInitials(user?.full_name || profileName)}
              </div>
            )}
            <div className="min-w-0">
              <p className={`text-xs font-semibold truncate ${themeTextTitle}`}>{user?.full_name || profileName}</p>
              <p className={`text-[10px] truncate ${themeTextMuted}`}>{role || 'Retailer'}</p>
            </div>
          </div>
          <button
            onClick={signOut}
            className={`hover:text-red-400 p-1.5 rounded-lg transition-colors cursor-pointer ${themeTextMuted}`}
            title="Sign Out"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* MAIN CONTENT AREA */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* TOPBAR */}
        <header className={`h-16 border-b px-6 flex items-center justify-between shrink-0 ${themeCard}`}>
          {/* Search bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="w-4 h-4" />
            </span>
            <input aria-label="Field 10" id="field_10" name="field_10"
              type="text"
              placeholder={t.searchGlobal}
              className={`text-slate-200 placeholder-slate-500 focus:outline-none focus:border-[#10b981] pl-9 pr-4 py-1.5 rounded-lg text-xs w-72 transition-all ${themeInput}`}
            />
          </div>

          <div className="flex items-center gap-4">
            {/* LIGHT/DARK MODE TOGGLE - PLACED AT THE TOP RIGHT CORNER OF TOPBAR */}
            <button
              onClick={() => setTheme(isDark ? 'light' : 'dark')}
              className={`p-2 rounded-lg transition-all cursor-pointer flex items-center justify-center border hover:border-slate-500 ${themeInput} ${themeTextMuted}`}
              title={isDark ? 'Switch to Light Mode' : 'Switch to Dark Mode'}
            >
              {isDark ? <Sun className="w-4.5 h-4.5 text-yellow-400" /> : <Moon className="w-4.5 h-4.5 text-slate-600" />}
            </button>

            {/* Notification Bell */}
            <div className="relative" ref={bellRef}>
              <button
                onClick={() => setShowBellDropdown(!showBellDropdown)}
                className={`p-2 rounded-lg transition-all cursor-pointer relative border hover:border-slate-500 ${themeInput} ${themeTextMuted}`}
              >
                <Bell className="w-4.5 h-4.5" />
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full"></span>
              </button>

              {showBellDropdown && (
                <div className={`absolute right-0 mt-2 w-80 border rounded-xl shadow-2xl overflow-hidden z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150 ${themeCard}`}>
                  <div className={`px-4 py-2 border-b flex justify-between items-center bg-slate-100 dark:bg-[#121618]/50 ${themeBorder}`}>
                    <span className={`text-xs font-bold ${themeTextTitle}`}>{t.notifications}</span>
                    <span className="text-[10px] text-[#10b981] font-medium cursor-pointer">{t.markAllRead}</span>
                  </div>
                  <div className={`max-h-64 overflow-y-auto divide-y ${isDark ? 'divide-[#1e2427]/50' : 'divide-slate-100'}`}>
                    {notifications.map((n) => (
                      <div key={n.id} className={`p-3 transition-colors cursor-pointer ${themeHover}`}>
                        <div className="flex gap-2 items-start">
                          <span className={`w-1.5 h-1.5 rounded-full mt-1.5 shrink-0 ${n.unread ? 'bg-[#10b981]' : 'bg-transparent'}`}></span>
                          <div>
                            <p className={`text-xs leading-normal ${themeText}`}>{n.text}</p>
                            <span className={`text-[10px] mt-1 block ${themeTextMuted}`}>{n.time}</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Profile Dropdown - RETAINED ALL 4 ELEMENTS (Avatar, Name, Role, Chevron) */}
            <div className="relative" ref={profileRef}>
              <button
                onClick={() => setShowProfileDropdown(!showProfileDropdown)}
                className={`flex items-center gap-2 p-1.5 rounded-lg transition-all cursor-pointer border hover:border-slate-500 ${themeInput}`}
              >
                {user?.avatar_url ? (
                  <img src={user.avatar_url} alt="Profile" className="w-8 h-8 rounded-full object-cover shrink-0 border border-yellow-400/20" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-yellow-500 flex items-center justify-center text-slate-900 font-bold text-xs border border-yellow-400/20">
                    {getInitials(user?.full_name || profileName)}
                  </div>
                )}
                <div className="text-left hidden md:block">
                  <p className={`text-[10px] uppercase tracking-wider ${themeTextMuted}`}>{role || 'Retailer'}</p>
                </div>
                <ChevronDown className={`w-3.5 h-3.5 ${themeTextMuted}`} />
              </button>

              {showProfileDropdown && (
                <div className={`absolute right-0 mt-2 w-48 border rounded-xl shadow-2xl overflow-hidden z-50 py-1 animate-in fade-in slide-in-from-top-2 duration-150 ${themeCard}`}>
                  <div className={`px-4 py-2.5 border-b bg-slate-100 dark:bg-[#121618]/30 ${themeBorder}`}>
                    <p className={`text-xs font-bold ${themeTextTitle}`}>{user?.full_name || profileName}</p>
                    <p className={`text-[10px] ${themeTextMuted}`}>{user?.email || 'user@orderlink.io'}</p>
                  </div>
                  <div className="py-1">
                    <button
                      onClick={() => {
                        setActiveTab('Settings');
                        setShowProfileDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${themeText} ${themeHover}`}
                    >
                      {language === 'EN' ? 'Settings & Profile' : 'Pengaturan & Profil'}
                    </button>
                    <button
                      onClick={() => {
                        setActiveTab('Analytics');
                        setShowProfileDropdown(false);
                      }}
                      className={`w-full text-left px-4 py-2 text-xs transition-colors cursor-pointer ${themeText} ${themeHover}`}
                    >
                      {t.analytics}
                    </button>
                  </div>
                  <div className={`border-t py-1 ${themeBorder}`}>
                    <button
                      onClick={signOut}
                      className="w-full text-left px-4 py-2 text-xs text-red-400 hover:bg-red-950/20 transition-colors cursor-pointer flex items-center gap-2"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      Sign Out
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* DASHBOARD GRID CONTAINER */}
        <main className="flex-1 overflow-y-auto p-6 flex flex-col gap-4 max-h-[calc(100vh-64px)]">
          {/* Header Section */}
          {activeTab === 'Dashboard' && (
            <div className="flex items-center justify-between shrink-0">
              <h1 className={`text-xl font-bold tracking-tight ${themeTextTitle}`}>{t.dashboard}</h1>

              {/* Controls */}
              <div className="flex items-center gap-3">
                <div className="relative" ref={timeframeRef}>
                  <button
                    onClick={() => setShowTimeframeDropdown(!showTimeframeDropdown)}
                    className={`flex items-center gap-1.5 border hover:border-slate-500 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${themeInput} ${themeText}`}
                  >
                    <Calendar className="w-3.5 h-3.5 text-slate-500" />
                    {timeframe === '30_days' ? t.last30Days : t.last7Days}
                    <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
                  </button>

                  {showTimeframeDropdown && (
                    <div className={`absolute right-0 mt-1.5 w-40 border rounded-lg shadow-2xl overflow-hidden z-40 py-1 animate-in fade-in slide-in-from-top-2 duration-150 ${themeCard}`}>
                      <button
                        onClick={() => {
                          setTimeframe('30_days');
                          setShowTimeframeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                          timeframe === '30_days' ? 'bg-[#10b981]/10 text-[#10b981]' : `${themeText} ${themeHover}`
                        }`}
                      >
                        {t.last30Days}
                      </button>
                      <button
                        onClick={() => {
                          setTimeframe('7_days');
                          setShowTimeframeDropdown(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs transition-colors cursor-pointer ${
                          timeframe === '7_days' ? 'bg-[#10b981]/10 text-[#10b981]' : `${themeText} ${themeHover}`
                        }`}
                      >
                        {t.last7Days}
                      </button>
                    </div>
                  )}
                </div>

                {/* Export CSV button */}
                <button
                  onClick={handleExportCSV}
                  className={`flex items-center gap-1.5 border hover:border-slate-500 px-3.5 py-1.5 rounded-lg text-xs transition-all cursor-pointer ${themeInput} ${themeText}`}
                >
                  <Download className="w-3.5 h-3.5 text-slate-500" />
                  {t.exportData}
                </button>

                {/* New Order button */}
                <button
                  onClick={() => setIsOrderModalOpen(true)}
                  className="bg-[#10b981] hover:bg-[#059669] text-white px-3.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 shadow-md transition-all cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5" />
                  {t.newOrder}
                </button>
              </div>
            </div>
          )}

          {renderTabContent()}
        </main>
      </div>

      {/* TOASTS */}
      <div className="fixed bottom-5 right-5 z-50 flex flex-col gap-2.5">
        {toasts.map((to) => (
          <div
            key={to.id}
            className={`px-4 py-3 rounded-xl border flex items-center gap-2.5 shadow-2xl text-xs font-semibold animate-in slide-in-from-bottom-5 duration-200 ${
              to.type === 'success'
                ? 'bg-[#0f1315] border-[#10b981]/40 text-[#10b981]'
                : to.type === 'error'
                ? 'bg-[#0f1315] border-red-800/40 text-red-400'
                : 'bg-[#0f1315] border-blue-800/40 text-blue-400'
            }`}
          >
            <span className={`w-1.5 h-1.5 rounded-full ${to.type === 'success' ? 'bg-[#10b981]' : to.type === 'error' ? 'bg-red-500' : 'bg-blue-500'}`}></span>
            <span>{to.message}</span>
          </div>
        ))}
      </div>

      {/* MODALS */}
      <NewOrderModal
        isOpen={isOrderModalOpen}
        onClose={() => setIsOrderModalOpen(false)}
        onSuccess={() => {
          showToast(language === 'EN' ? 'New order created successfully!' : 'Pesanan baru berhasil dibuat!');
          loadDashboardData();
        }}
      />

      {/* Add Inventory Modal */}
      {isInvModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInvModalOpen(false)}></div>
          <div className="bg-[#0f1315] border border-[#1e2427] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-5 h-5 text-[#10b981]" /> {t.addWarehouseItem}
            </h3>
            <form onSubmit={handleAddInventory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.skuCode}</label>
                <input aria-label="Field 11" id="field_11" name="field_11"
                  type="text"
                  required
                  placeholder="e.g. SKU-9104"
                  value={newInv.sku}
                  onChange={(e) => setNewInv({ ...newInv, sku: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.productName}</label>
                <input aria-label="Field 12" id="field_12" name="field_12"
                  type="text"
                  required
                  placeholder="e.g. Heavy Duty Pallet"
                  value={newInv.name}
                  onChange={(e) => setNewInv({ ...newInv, name: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.category}</label>
                  <select aria-label="Field 13" id="field_13" name="field_13"
                    value={newInv.category}
                    onChange={(e) => setNewInv({ ...newInv, category: e.target.value })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Cold Chain">Cold Chain</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Storage">Storage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.status}</label>
                  <select aria-label="Field 14" id="field_14" name="field_14"
                    value={newInv.status}
                    onChange={(e) => setNewInv({ ...newInv, status: e.target.value as InventoryItem['status'] })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.stockQuantity}</label>
                  <input aria-label="Field 15" id="field_15" name="field_15"
                    type="number"
                    required
                    value={newInv.stock}
                    onChange={(e) => setNewInv({ ...newInv, stock: parseInt(e.target.value) })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.unitPrice} ({currency === 'USD' ? '$' : 'Rp'})</label>
                  <input aria-label="Field 16" id="field_16" name="field_16"
                    type="number"
                    step="0.01"
                    required
                    value={newInv.price}
                    onChange={(e) => setNewInv({ ...newInv, price: parseFloat(e.target.value) })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#1e2427]">
                <button
                  type="button"
                  onClick={() => setIsInvModalOpen(false)}
                  className="flex-1 bg-[#121618] border border-[#1e2427] text-slate-300 py-2 px-4 rounded-xl text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl text-xs font-semibold"
                >
                  {t.createProduct}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Customer Modal */}
      {isCustModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustModalOpen(false)}></div>
          <div className="bg-[#0f1315] border border-[#1e2427] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-5 h-5 text-[#10b981]" /> {t.addCRMContact}
            </h3>
            <form onSubmit={handleAddCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.clientFullName}</label>
                <input aria-label="Field 17" id="field_17" name="field_17"
                  type="text"
                  required
                  placeholder="e.g. Liam Wright"
                  value={newCust.name}
                  onChange={(e) => setNewCust({ ...newCust, name: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.companyEntity}</label>
                <input aria-label="Field 18" id="field_18" name="field_18"
                  type="text"
                  required
                  placeholder="e.g. Acme Corp"
                  value={newCust.company}
                  onChange={(e) => setNewCust({ ...newCust, company: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.emailAddress}</label>
                  <input aria-label="Field 19" id="field_19" name="field_19"
                    type="email"
                    required
                    placeholder="e.g. name@acme.com"
                    value={newCust.email}
                    onChange={(e) => setNewCust({ ...newCust, email: e.target.value })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.phone}</label>
                  <input aria-label="Field 20" id="field_20" name="field_20"
                    type="text"
                    required
                    placeholder="e.g. +1 (555) 019-2831"
                    value={newCust.phone}
                    onChange={(e) => setNewCust({ ...newCust, phone: e.target.value })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.totalOrders}</label>
                  <input aria-label="Field 21" id="field_21" name="field_21"
                    type="number"
                    value={newCust.total_orders}
                    onChange={(e) => setNewCust({ ...newCust, total_orders: parseInt(e.target.value) })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.totalSpent} ({currency === 'USD' ? '$' : 'Rp'})</label>
                  <input aria-label="Field 22" id="field_22" name="field_22"
                    type="number"
                    step="0.01"
                    value={newCust.total_spent}
                    onChange={(e) => setNewCust({ ...newCust, total_spent: parseFloat(e.target.value) })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.accountStatus}</label>
                <select aria-label="Field 23" id="field_23" name="field_23"
                  value={newCust.status}
                  onChange={(e) => setNewCust({ ...newCust, status: e.target.value as Customer['status'] })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#1e2427]">
                <button
                  type="button"
                  onClick={() => setIsCustModalOpen(false)}
                  className="flex-1 bg-[#121618] border border-[#1e2427] text-slate-300 py-2 px-4 rounded-xl text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl text-xs font-semibold"
                >
                  {t.createContact}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Inventory Modal */}
      {isInvEditModalOpen && editInv && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsInvEditModalOpen(false)}></div>
          <div className="bg-[#0f1315] border border-[#1e2427] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Package className="w-5 h-5 text-[#10b981]" /> {t.editProduct}
            </h3>
            <form onSubmit={handleUpdateInventory} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.skuCode}</label>
                <input aria-label="Field 24" id="field_24" name="field_24"
                  type="text"
                  readOnly
                  value={editInv.sku}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-400 px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.productName}</label>
                <input aria-label="Field 25" id="field_25" name="field_25"
                  type="text"
                  required
                  value={editInv.name}
                  onChange={(e) => setEditInv({ ...editInv, name: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.category}</label>
                  <select aria-label="Field 26" id="field_26" name="field_26"
                    value={editInv.category}
                    onChange={(e) => setEditInv({ ...editInv, category: e.target.value })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="Packaging">Packaging</option>
                    <option value="Cold Chain">Cold Chain</option>
                    <option value="Electronics">Electronics</option>
                    <option value="Storage">Storage</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.status}</label>
                  <select aria-label="Field 27" id="field_27" name="field_27"
                    value={editInv.status}
                    onChange={(e) => setEditInv({ ...editInv, status: e.target.value as InventoryItem['status'] })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="In Stock">In Stock</option>
                    <option value="Low Stock">Low Stock</option>
                    <option value="Out of Stock">Out of Stock</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.stockQuantity}</label>
                  <input aria-label="Field 28" id="field_28" name="field_28"
                    type="number"
                    required
                    value={editInv.stock}
                    onChange={(e) => setEditInv({ ...editInv, stock: parseInt(e.target.value) })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.unitPrice} ({currency === 'USD' ? '$' : 'Rp'})</label>
                  <input aria-label="Field 29" id="field_29" name="field_29"
                    type="number"
                    step="0.01"
                    required
                    value={editInv.price}
                    onChange={(e) => setEditInv({ ...editInv, price: parseFloat(e.target.value) })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#1e2427]">
                <button
                  type="button"
                  onClick={() => { setIsInvEditModalOpen(false); setEditInv(null); }}
                  className="flex-1 bg-[#121618] border border-[#1e2427] text-slate-300 py-2 px-4 rounded-xl text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl text-xs font-semibold"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Customer Modal */}
      {isCustEditModalOpen && editCust && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsCustEditModalOpen(false)}></div>
          <div className="bg-[#0f1315] border border-[#1e2427] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Users className="w-5 h-5 text-[#10b981]" /> {t.editCRMContact}
            </h3>
            <form onSubmit={handleUpdateCustomer} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.clientFullName}</label>
                <input aria-label="Field 30" id="field_30" name="field_30"
                  type="text"
                  required
                  value={editCust.name}
                  onChange={(e) => setEditCust({ ...editCust, name: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.companyEntity}</label>
                <input aria-label="Field 31" id="field_31" name="field_31"
                  type="text"
                  value={editCust.company}
                  onChange={(e) => setEditCust({ ...editCust, company: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.emailAddress}</label>
                  <input aria-label="Field 32" id="field_32" name="field_32"
                    type="email"
                    required
                    value={editCust.email}
                    onChange={(e) => setEditCust({ ...editCust, email: e.target.value })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.phone}</label>
                  <input aria-label="Field 33" id="field_33" name="field_33"
                    type="tel"
                    value={editCust.phone}
                    onChange={(e) => setEditCust({ ...editCust, phone: e.target.value })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                  />
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.accountStatus}</label>
                <select aria-label="Field 34" id="field_34" name="field_34"
                  value={editCust.status}
                  onChange={(e) => setEditCust({ ...editCust, status: e.target.value as Customer['status'] })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                >
                  <option value="Active">Active</option>
                  <option value="Inactive">Inactive</option>
                </select>
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#1e2427]">
                <button
                  type="button"
                  onClick={() => { setIsCustEditModalOpen(false); setEditCust(null); }}
                  className="flex-1 bg-[#121618] border border-[#1e2427] text-slate-300 py-2 px-4 rounded-xl text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl text-xs font-semibold"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {isOrderEditModalOpen && editOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsOrderEditModalOpen(false)}></div>
          <div className="bg-[#0f1315] border border-[#1e2427] w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 p-6 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <FileText className="w-5 h-5 text-[#10b981]" /> {t.editOrder}
            </h3>
            <form onSubmit={handleUpdateOrder} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.orderId}</label>
                <input aria-label="Field 35" id="field_35" name="field_35"
                  type="text"
                  required
                  value={editOrder.order_id}
                  onChange={(e) => setEditOrder({ ...editOrder, order_id: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.customer}</label>
                <input aria-label="Field 36" id="field_36" name="field_36"
                  type="text"
                  required
                  value={editOrder.customer_name}
                  onChange={(e) => setEditOrder({ ...editOrder, customer_name: e.target.value })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.date}</label>
                  <input aria-label="Field 37" id="field_37" name="field_37"
                    type="date"
                    required
                    value={editOrder.date}
                    onChange={(e) => setEditOrder({ ...editOrder, date: e.target.value })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.status}</label>
                  <select aria-label="Field 38" id="field_38" name="field_38"
                    value={editOrder.status}
                    onChange={(e) => setEditOrder({ ...editOrder, status: e.target.value as Order['status'] })}
                    className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none px-3 py-2 rounded-xl text-xs"
                  >
                    <option value="Pending">Pending</option>
                    <option value="Processing">Processing</option>
                    <option value="Shipped">Shipped</option>
                    <option value="Completed">Completed</option>
                    <option value="Cancelled">Cancelled</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-400 uppercase mb-1">{t.total} ({currency === 'USD' ? '$' : 'Rp'})</label>
                <input aria-label="Field 39" id="field_39" name="field_39"
                  type="number"
                  step="0.01"
                  required
                  value={editOrder.total}
                  onChange={(e) => setEditOrder({ ...editOrder, total: parseFloat(e.target.value) })}
                  className="w-full bg-[#121618] border border-[#1e2427] text-slate-200 focus:outline-none focus:border-[#10b981] px-3 py-2 rounded-xl text-xs"
                />
              </div>
              <div className="flex gap-3 pt-4 border-t border-[#1e2427]">
                <button
                  type="button"
                  onClick={() => { setIsOrderEditModalOpen(false); setEditOrder(null); }}
                  className="flex-1 bg-[#121618] border border-[#1e2427] text-slate-300 py-2 px-4 rounded-xl text-xs"
                >
                  {t.cancel}
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white py-2 px-4 rounded-xl text-xs font-semibold"
                >
                  {t.saveChanges}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
 
