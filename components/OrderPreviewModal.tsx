
import React from 'react';
import type { AdminOrder, Language } from '../types';
import { Button } from './Button';

interface OrderPreviewModalProps {
  order: AdminOrder;
  onClose: () => void;
  language: Language;
}

const DetailSection: React.FC<{ title: string; children: React.ReactNode; className?: string }> = ({ title, children, className = '' }) => (
    <div className={`bg-gray-50 p-4 rounded-lg border ${className}`}>
        <h4 className="text-md font-bold text-brand-coral border-b pb-2 mb-2">{title}</h4>
        <div className="space-y-1 text-sm text-brand-navy">{children}</div>
    </div>
);

const DetailItem: React.FC<{ label: string; value?: string | number | null }> = ({ label, value }) => (
    <p>
        <span className="font-semibold text-gray-600">{label}:</span> {value || 'N/A'}
    </p>
);

export const OrderPreviewModal: React.FC<OrderPreviewModalProps> = ({ order, onClose, language }) => {
  if (!order) return null;
  const t = (ar: string, en: string) => language === 'ar' ? ar : en;
  const currency = t('د.ك', 'KWD');

  return (
    <div 
      className="fixed inset-0 bg-black/60 z-50 flex justify-center items-center p-4"
      aria-modal="true"
      role="dialog"
      onClick={onClose}
    >
      <div 
        className="bg-white rounded-2xl shadow-2xl p-6 sm:p-8 w-full max-w-2xl animate-fade-in-up max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-brand-navy">{t('تفاصيل الطلب', 'Order Details')}</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-3xl">&times;</button>
        </div>
        
        <div className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-4">
                <DetailSection title={t('ملخص الطلب', 'Order Summary')}>
                    <DetailItem label={t('رقم الطلب', 'Order #')} value={order.orderNumber} />
                    <DetailItem label={t('تاريخ الطلب', 'Date')} value={new Date(order.orderDate).toLocaleString()} />
                    <DetailItem label={t('الحالة', 'Status')} value={order.status} />
                    <DetailItem label={t('المجموع', 'Total')} value={`${order.total.toFixed(3)} ${currency}`} />
                </DetailSection>

                <DetailSection title={t('بيانات الشحن', 'Shipping Details')}>
                    <DetailItem label={t('الاسم', 'Name')} value={order.shippingDetails.name} />
                    <DetailItem label={t('البريد الإلكتروني', 'Email')} value={order.shippingDetails.email} />
                    <DetailItem label={t('الهاتف', 'Phone')} value={order.shippingDetails.phone} />
                    <DetailItem label={t('العنوان', 'Address')} value={`${order.shippingDetails.address}, ${order.shippingDetails.city}`} />
                </DetailSection>
            </div>
            
            <DetailSection title={t('تفاصيل القصة', 'Story Details')}>
                <DetailItem label={t('عنوان القصة', 'Title')} value={order.storyData.title} />
                <DetailItem label={t('اسم الطفل', "Child's Name")} value={order.storyData.childName} />
                <DetailItem label={t('عمر الطفل', "Child's Age")} value={order.storyData.childAge} />
                <DetailItem label={t('حجم الكتاب', 'Book Size')} value={order.storyData.size} />
                <DetailItem label={t('الشخصية الرئيسية', 'Main Character')} value={order.storyData.mainCharacter.name} />
                {order.storyData.useSecondCharacter && (
                    <DetailItem label={t('الشخصية الثانوية', 'Second Character')} value={order.storyData.secondCharacter?.name} />
                )}
            </DetailSection>

            <DetailSection title={t('تفاصيل الصفحات والرسوم', 'Page & Illustration Details')} className="col-span-full">
                <div className="space-y-3 max-h-64 overflow-y-auto pr-2">
                    {order.storyData.pages.map(page => (
                        <div key={page.pageNumber} className="text-xs border-b pb-2 last:border-b-0">
                            <p className="font-bold text-gray-700">Page {page.pageNumber}:</p>
                            <p className="text-gray-600 italic">"{page.text}"</p>
                            <p className="mt-1 font-mono text-blue-800 bg-blue-50 p-1 rounded">
                                <span className="font-semibold">Summary:</span> {page.pageSummary || 'N/A'}
                            </p>
                        </div>
                    ))}
                </div>
            </DetailSection>
        </div>
        
        <div className="mt-6 flex justify-end">
          <Button onClick={onClose} variant="secondary">
            {t('إغلاق', 'Close')}
          </Button>
        </div>
      </div>
    </div>
  );
};
