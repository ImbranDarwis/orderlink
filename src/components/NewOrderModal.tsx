import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';
import { apiService, Order } from '../services/api';
import { translations } from '../lib/translations';
import { EXCHANGE_RATE } from '../lib/currency';
import { X, Plus, AlertCircle } from 'lucide-react';

interface NewOrderModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const NewOrderModal: React.FC<NewOrderModalProps> = ({ isOpen, onClose, onSuccess }) => {
  const { language, currency, theme } = useAuth();
  const t = translations[language] || translations.EN;

  const [customer, setCustomer] = useState('');
  const [total, setTotal] = useState('');
  const [status, setStatus] = useState<Order['status']>('Processing');
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!customer.trim()) {
      setError(language === 'EN' ? 'Customer name is required.' : 'Nama pelanggan wajib diisi.');
      return;
    }

    const totalVal = parseFloat(total);
    if (isNaN(totalVal) || totalVal <= 0) {
      setError(language === 'EN' ? 'Please enter a valid total amount.' : 'Silakan masukkan jumlah total yang valid.');
      return;
    }

    setIsLoading(true);

    try {
      // Generate a random order ID like #OL-XXXX
      const randomId = Math.floor(1000 + Math.random() * 9000);
      const orderIdStr = `#OL-${randomId}`;

      // Format date like "Oct 26, 2023, 10:32 AM"
      const now = new Date();
      const monthsEN = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      const monthsID = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des'];
      const months = language === 'EN' ? monthsEN : monthsID;
      const month = months[now.getMonth()];
      const day = now.getDate();
      const year = now.getFullYear();
      let hours = now.getHours();
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12;
      const formattedDate = `${month} ${day}, ${year}, ${hours}:${minutes} ${ampm}`;

      // Convert entered total to USD if active currency is IDR
      const finalTotalInUSD = currency === 'IDR' ? (totalVal / EXCHANGE_RATE) : totalVal;

      await apiService.createOrder({
        order_id: orderIdStr,
        customer_name: customer,
        date: formattedDate,
        total: finalTotalInUSD,
        status,
      });

      onSuccess();
      setCustomer('');
      setTotal('');
      setStatus('Processing');
      onClose();
    } catch (err: any) {
      setError(err.message || 'Failed to create order.');
    } finally {
      setIsLoading(false);
    }
  };

  const isDark = theme === 'dark';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose}></div>

      {/* Modal Box */}
      <div className={`w-full max-w-md rounded-2xl shadow-2xl overflow-hidden relative z-10 animate-in fade-in zoom-in duration-200 border ${
        isDark ? 'bg-[#0f1315] border-[#1e2427] text-slate-100' : 'bg-white border-slate-200 text-slate-800'
      }`}>
        {/* Header */}
        <div className={`flex items-center justify-between px-6 py-4 border-b ${
          isDark ? 'border-[#1e2427] bg-[#121618]/50' : 'border-slate-100 bg-slate-50'
        }`}>
          <h2 className={`text-sm font-bold flex items-center gap-2 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            <Plus className="w-5 h-5 text-[#10b981]" />
            {t.newOrder}
          </h2>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-200 p-1 rounded-lg transition-colors cursor-pointer">
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-950/20 border border-red-800/50 rounded-lg text-red-400 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div>
            <label htmlFor="order-customer" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {language === 'EN' ? 'Customer Name' : 'Nama Pelanggan'}
            </label>
            <input
              id="order-customer"
              name="customer"
              type="text"
              required
              value={customer}
              onChange={(e) => setCustomer(e.target.value)}
              className={`w-full border text-xs px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:border-[#10b981] ${
                isDark ? 'bg-[#121618] border-[#1e2427] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
              placeholder="e.g. Liam Wright"
            />
          </div>

          <div>
            <label htmlFor="order-total" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {language === 'EN' ? 'Total Amount' : 'Jumlah Total'} ({currency === 'USD' ? 'USD $' : 'IDR Rp'})
            </label>
            <input
              id="order-total"
              name="total"
              type="number"
              step="0.01"
              required
              value={total}
              onChange={(e) => setTotal(e.target.value)}
              className={`w-full border text-xs px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:border-[#10b981] ${
                isDark ? 'bg-[#121618] border-[#1e2427] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
              placeholder={currency === 'USD' ? 'e.g. 129.99' : 'e.g. 1950000'}
            />
          </div>

          <div>
            <label htmlFor="order-status" className="block text-[10px] font-bold uppercase tracking-wider text-slate-400 mb-1.5">
              {language === 'EN' ? 'Order Status' : 'Status Pesanan'}
            </label>
            <select
              id="order-status"
              name="status"
              value={status}
              onChange={(e) => setStatus(e.target.value as Order['status'])}
              className={`w-full border text-xs px-4 py-2.5 rounded-xl transition-all focus:outline-none focus:border-[#10b981] cursor-pointer ${
                isDark ? 'bg-[#121618] border-[#1e2427] text-slate-200' : 'bg-slate-50 border-slate-200 text-slate-800'
              }`}
            >
              <option value="Processing">{t.processing}</option>
              <option value="Pending">{t.pending}</option>
              <option value="Completed">{t.completed}</option>
              <option value="Shipped">{t.shipped}</option>
              <option value="Cancelled">{t.cancelled}</option>
            </select>
          </div>

          {/* Footer */}
          <div className={`flex gap-3 pt-4 border-t mt-6 ${isDark ? 'border-[#1e2427]' : 'border-slate-100'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`flex-1 border font-medium py-2.5 px-4 rounded-xl text-xs transition-all cursor-pointer text-center ${
                isDark ? 'bg-[#121618] border-[#1e2427] text-slate-300 hover:bg-[#151a1c]' : 'bg-slate-100 border-slate-200 text-slate-700 hover:bg-slate-200'
              }`}
            >
              {t.cancel}
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="flex-1 bg-[#10b981] hover:bg-[#059669] text-white font-semibold py-2.5 px-4 rounded-xl text-xs shadow-lg shadow-emerald-950/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
            >
              {isLoading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              ) : (
                language === 'EN' ? 'Create Order' : 'Buat Pesanan'
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
