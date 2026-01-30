
import React, { useState } from 'react';
import { Button } from './Button';
import { Spinner } from './Spinner';
import * as adminService from '../services/adminService';
import type { Language, AdminOrder } from '../types';

interface OrderStatusModalProps {
  isOpen: boolean;
  onClose: () => void;
  language: Language;
}

const OrderStatusModal: React.FC<OrderStatusModalProps> = ({ isOpen, onClose, language }) => {
  const [orderNumber, setOrderNumber] = useState('');
  const [phone, setPhone] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [foundOrder, setFoundOrder] = useState<AdminOrder | null>(null);

  if (!isOpen) return null;

  const t = (ar: string, en: string) => language === 'ar' ? ar : en;

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');
    setFoundOrder(null);

    try {
      // Fetch all orders - optimization: move to specific API call later
      const orders = await adminService.getOrders();

      // Normalize helper
      const norm = (s: string) => s.trim().toLowerCase().replace(/\s/g, '');

      const order = orders.find(o =>
        norm(o.orderNumber) === norm(orderNumber) &&
        norm(o.shippingDetails.phone) === norm(phone)
      );

      if (order) {
        setFoundOrder(order);
      } else {
        setError(t('لم يتم العثور على طلب مطابق. يرجى التحقق من المعلومات والمحاولة مرة أخرى.', 'No matching order found. Please check your information and try again.'));
      }
    } catch (err) {
      console.error(err);
      setError(t('حدث خطأ أثناء البحث.', 'An error occurred while searching.'));
    } finally {
      setIsLoading(false);
    }
  };

  const handleClose = () => {
    setOrderNumber('');
    setPhone('');
    setIsLoading(false);
    setError('');
    setFoundOrder(null);
    onClose();
  }

  return (
    <div
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={handleClose}
    >
      <div
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-md animate-fade-in-up"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-bold text-brand-navy">{t('التحقق من حالة الطلب', 'Check Order Status')}</h2>
          <button onClick={handleClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>

        {!foundOrder ? (
          <form onSubmit={handleSearch} className="space-y-4">
            <div>
              <label htmlFor="orderNumber" className="block text-sm font-medium text-gray-700">{t('رقم الطلب', 'Order Number')}</label>
              <input type="text" id="orderNumber" value={orderNumber} onChange={e => setOrderNumber(e.target.value)} placeholder="RWY-123456789" className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-coral focus:border-brand-coral text-gray-900" required />
            </div>
            <div>
              <label htmlFor="phone" className="block text-sm font-medium text-gray-700">{t('رقم الهاتف المستخدم في الطلب', 'Phone Number used in Order')}</label>
              <input type="tel" id="phone" value={phone} onChange={e => setPhone(e.target.value)} className="mt-1 block w-full px-3 py-2 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-brand-coral focus:border-brand-coral text-gray-900" required />
            </div>

            {error && <p className="text-sm text-red-600 text-center">{error}</p>}

            <div className="pt-2">
              <Button type="submit" className="w-full text-lg flex items-center justify-center" disabled={isLoading}>
                {isLoading ? <Spinner /> : t('بحث', 'Search')}
              </Button>
            </div>
          </form>
        ) : (
          <div className="space-y-4 text-center">
            <h3 className="text-xl font-bold text-brand-coral">{t('حالة طلبك', 'Your Order Status')}</h3>
            <p className="text-gray-700">{t('الطلب رقم:', 'Order #:')} <span className="font-bold text-brand-navy">{foundOrder.orderNumber}</span></p>
            <div className="p-4 bg-brand-baby-blue/50 rounded-lg text-brand-navy">
              <p className="font-semibold text-lg">{foundOrder.status}</p>
              <p className="text-sm mt-1">
                {t('آخر تحديث:', 'Last updated:')} {new Date(foundOrder.orderDate).toLocaleString(language === 'ar' ? 'ar-EG' : 'en-US')}
              </p>
            </div>
            <Button onClick={handleClose} variant="outline" className="w-full">
              {t('إغلاق', 'Close')}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderStatusModal;
