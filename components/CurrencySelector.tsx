import React from 'react';
import { currencies, type Currency } from '../services/currencyService';

interface CurrencySelectorProps {
  selectedCurrency: Currency;
  onCurrencyChange: (currencyCode: string) => void;
}

export const CurrencySelector: React.FC<CurrencySelectorProps> = ({ selectedCurrency, onCurrencyChange }) => {
  return (
    <div className="relative">
      <select
        value={selectedCurrency.code}
        onChange={(e) => onCurrencyChange(e.target.value)}
        className="text-sm appearance-none block w-full pl-3 pr-8 py-1.5 bg-white border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-1 focus:ring-brand-coral focus:border-brand-coral"
        aria-label="Select currency"
      >
        {currencies.map((currency) => (
          <option key={currency.code} value={currency.code}>
            {currency.name} ({currency.code})
          </option>
        ))}
      </select>
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20"><path d="M9.293 12.95l.707.707L15.657 8l-1.414-1.414L10 10.828 5.757 6.586 4.343 8z"/></svg>
      </div>
    </div>
  );
};

export default CurrencySelector;