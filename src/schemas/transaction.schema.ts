import { z } from 'zod';
import { TransactionType } from '@/types';

export const transactionSchema = z.object({
  type: z.nativeEnum(TransactionType, {
    required_error: 'Transaction type is required',
  }),
  quantity: z
    .number({
      required_error: 'Quantity is required',
      invalid_type_error: 'Quantity must be a number',
    })
    .positive('Quantity must be greater than 0')
    .max(1e10, 'Quantity is too large'),
  unit: z.enum(['CHI', 'LUONG', 'OZ']).default('CHI'),
  pricePerUnit: z
    .number({
      required_error: 'Price per unit is required',
      invalid_type_error: 'Price must be a number',
    })
    .positive('Price must be greater than 0')
    .max(1e15, 'Price is too large'),
  currency: z.enum(['VND', 'USD']).default('VND'),
  provider: z.string().max(100, 'Provider name is too long').optional(),
  transactionDate: z.string().optional().transform((val) => {
    if (!val) return undefined;
    // If it's already in full ISO format, return as is
    if (val.includes('Z') || val.includes('+')) return val;
    // Convert datetime-local format (2026-01-31T23:22) to full ISO 8601
    return new Date(val).toISOString();
  }),
  notes: z.string().max(500, 'Notes must be less than 500 characters').optional(),
});

export type TransactionFormData = z.infer<typeof transactionSchema>;
