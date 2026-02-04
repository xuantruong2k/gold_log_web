import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { transactionSchema, type TransactionFormData } from '@/schemas/transaction.schema';
import { useCreateTransaction } from '@/hooks/useTransactions';
import { TransactionType, GoldUnit } from '@/types';

interface TransactionFormProps {
  onSuccess?: () => void;
  onCancel?: () => void;
}

export const TransactionForm: React.FC<TransactionFormProps> = ({ onSuccess, onCancel }) => {
  const { mutate: createTransaction, isPending: isLoading } = useCreateTransaction();
  const [priceDisplay, setPriceDisplay] = useState('');

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
    reset,
  } = useForm<TransactionFormData>({
    resolver: zodResolver(transactionSchema),
    shouldFocusError: false, // Prevent auto-focus on validation errors
    defaultValues: {
      type: TransactionType.BUY,
      unit: GoldUnit.CHI,
      currency: 'VND',
      transactionDate: new Date().toISOString().slice(0, 16),
    },
  });

  const quantity = watch('quantity');
  const pricePerUnit = watch('pricePerUnit');
  const totalAmount = quantity && pricePerUnit ? quantity * pricePerUnit : 0;

  // Format number with thousand separator (dots for Vietnamese)
  const formatPrice = (value: string): string => {
    // Remove all non-digit characters
    const numbers = value.replace(/\D/g, '');
    if (!numbers) return '';
    // Add thousand separators with dots
    return numbers.replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  };

  // Handle price input change
  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const inputValue = e.target.value;
    const formatted = formatPrice(inputValue);
    setPriceDisplay(formatted);
    // Set actual numeric value for form
    const numericValue = parseFloat(inputValue.replace(/\D/g, ''));
    setValue('pricePerUnit', numericValue || 0, { shouldValidate: true, shouldTouch: true });
  };

  const onSubmit = (data: TransactionFormData) => {
    // Prevent any focus changes during submission
    const activeElement = document.activeElement as HTMLElement;
    if (activeElement) {
      activeElement.blur();
    }

    createTransaction(data, {
      onSuccess: () => {
        reset();
        setPriceDisplay('');
        onSuccess?.();
      },
      onError: (error: unknown) => {
        const err = error as { response?: { status?: number; data?: { message?: string } } };
        if (err.response?.status === 409) {
          alert('This transaction already exists. Please check your transaction list.');
        } else {
          alert(err.response?.data?.message || 'Failed to create transaction. Please try again.');
        }
      },
    });
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} noValidate className="space-y-6">
      {/* Transaction Type */}
      <div>
        <label className="block text-sm font-medium text-gray-700">Transaction Type *</label>
        <div className="mt-2 space-x-4">
          <label className="inline-flex items-center">
            <input
              type="radio"
              {...register('type')}
              value={TransactionType.BUY}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">BUY</span>
          </label>
          <label className="inline-flex items-center">
            <input
              type="radio"
              {...register('type')}
              value={TransactionType.SELL}
              className="form-radio h-4 w-4 text-blue-600"
            />
            <span className="ml-2 text-gray-700">SELL</span>
          </label>
        </div>
        {errors.type && <p className="mt-1 text-sm text-red-600">{errors.type.message}</p>}
      </div>

      {/* Quantity */}
      <div>
        <label htmlFor="quantity" className="block text-sm font-medium text-gray-700">
          Quantity *
        </label>
        <input
          id="quantity"
          type="number"
          step="0.01"
          {...register('quantity', { valueAsNumber: true })}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="10.5"
        />
        {errors.quantity && <p className="mt-1 text-sm text-red-600">{errors.quantity.message}</p>}
      </div>

      {/* Unit */}
      <div>
        <label htmlFor="unit" className="block text-sm font-medium text-gray-700">
          Unit
        </label>
        <select
          id="unit"
          {...register('unit')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value={GoldUnit.CHI}>Chỉ (CHI) - ~3.75g</option>
          <option value={GoldUnit.LUONG}>Lượng (LUONG) - ~37.5g</option>
          <option value={GoldUnit.OZ}>Troy Ounce (OZ) - ~31.1g</option>
        </select>
        {errors.unit && <p className="mt-1 text-sm text-red-600">{errors.unit.message}</p>}
      </div>

      {/* Price per Unit */}
      <div>
        <label htmlFor="pricePerUnit" className="block text-sm font-medium text-gray-700">
          Price per Unit (VND) *
        </label>
        <input
          id="pricePerUnit"
          type="text"
          inputMode="numeric"
          value={priceDisplay}
          onChange={handlePriceChange}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="75.000.000"
        />
        {/* Hidden input to register with react-hook-form */}
        <input
          type="hidden"
          {...register('pricePerUnit', { valueAsNumber: true })}
        />
        {errors.pricePerUnit && (
          <p className="mt-1 text-sm text-red-600">{errors.pricePerUnit.message}</p>
        )}
      </div>

      {/* Currency */}
      <div>
        <label htmlFor="currency" className="block text-sm font-medium text-gray-700">
          Currency
        </label>
        <select
          id="currency"
          {...register('currency')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        >
          <option value="VND">VND</option>
          <option value="USD">USD</option>
        </select>
      </div>

      {/* Provider */}
      <div>
        <label htmlFor="provider" className="block text-sm font-medium text-gray-700">
          Provider
        </label>
        <input
          id="provider"
          type="text"
          {...register('provider')}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="SJC, PNJ, etc."
        />
        {errors.provider && <p className="mt-1 text-sm text-red-600">{errors.provider.message}</p>}
      </div>

      {/* Transaction Date */}
      <div>
        <label htmlFor="transactionDate" className="block text-sm font-medium text-gray-700">
          Transaction Date
        </label>
        <input
          id="transactionDate"
          type="datetime-local"
          {...register('transactionDate')}
          onKeyDown={(e) => {
            // Prevent Enter key from interfering with form submission
            if (e.key === 'Enter') {
              e.preventDefault();
            }
          }}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" className="block text-sm font-medium text-gray-700">
          Notes
        </label>
        <textarea
          id="notes"
          {...register('notes')}
          rows={3}
          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
          placeholder="Optional notes about this transaction"
        />
        {errors.notes && <p className="mt-1 text-sm text-red-600">{errors.notes.message}</p>}
      </div>

      {/* Total Amount Display */}
      <div className="rounded-md bg-blue-50 p-4">
        <p className="text-sm text-blue-600">Total Amount</p>
        <p className="text-2xl font-bold text-blue-900">
          {totalAmount.toLocaleString('vi-VN')} VND
        </p>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        {onCancel && (
          <button
            type="button"
            onClick={onCancel}
            className="rounded-md border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50"
          >
            Cancel
          </button>
        )}
        <button
          type="submit"
          disabled={isLoading}
          className="rounded-md bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {isLoading ? 'Saving...' : 'Save Transaction'}
        </button>
      </div>
    </form>
  );
};
