import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceCard } from './PriceCard';
import type { GoldPrice } from '@/types';
import { GoldProvider } from '@/types';

describe('PriceCard', () => {
  const mockPrice: GoldPrice = {
    provider: GoldProvider.SJC,
    buyPrice: 7450000,
    sellPrice: 7500000,
    unit: 'CHI',
    unitDisplayName: 'Chỉ',
    currency: 'VND',
    updatedAt: '2026-01-31T14:25:00Z',
    spread: 50000,
    spreadPercentage: 0.67,
  };

  it('should render price information correctly', () => {
    render(<PriceCard price={mockPrice} />);

    expect(screen.getByText('SJC')).toBeInTheDocument();
    expect(screen.getByText('Buy')).toBeInTheDocument();
    expect(screen.getByText('Sell')).toBeInTheDocument();
    // formatCurrency uses vi-VN locale which formats as 7.450.000 (with dots)
    expect(screen.getByText(/7\.450\.000 VND/)).toBeInTheDocument();
    expect(screen.getByText(/7\.500\.000 VND/)).toBeInTheDocument();
  });

  it('should display unit and spread', () => {
    render(<PriceCard price={mockPrice} />);

    expect(screen.getByText(/per Chỉ/)).toBeInTheDocument();
    expect(screen.getByText(/Spread: 50\.000 VND/)).toBeInTheDocument();
  });

  it('should show relative time', () => {
    render(<PriceCard price={mockPrice} />);

    // Should show some time indication (exact text depends on current time)
    const timeElements = screen.getAllByText(/ago|just now/);
    expect(timeElements.length).toBeGreaterThan(0);
  });

  it('should show action button when onSelect is provided', () => {
    const onSelect = vi.fn();
    render(<PriceCard price={mockPrice} onSelect={onSelect} />);

    const button = screen.getByText('Use This Price');
    expect(button).toBeInTheDocument();
  });

  it('should not show action button when onSelect is not provided', () => {
    render(<PriceCard price={mockPrice} />);

    expect(screen.queryByText('Use This Price')).not.toBeInTheDocument();
  });

  it('should call onSelect when button is clicked', () => {
    const onSelect = vi.fn();
    render(<PriceCard price={mockPrice} onSelect={onSelect} />);

    const button = screen.getByText('Use This Price');
    button.click();

    expect(onSelect).toHaveBeenCalledTimes(1);
  });

  it('should render international prices correctly (USD)', () => {
    const usdPrice: GoldPrice = {
      provider: GoldProvider.WORLD_GOLD,
      buyPrice: 2050.5,
      sellPrice: 2055.75,
      unit: 'OZ',
      unitDisplayName: 'Troy Ounce',
      currency: 'USD',
      updatedAt: '2026-01-31T14:25:00Z',
      spread: 5.25,
      spreadPercentage: 0.26,
    };

    render(<PriceCard price={usdPrice} />);

    expect(screen.getByText('WORLD_GOLD')).toBeInTheDocument();
    expect(screen.getByText(/\$2,050\.50/)).toBeInTheDocument();
    expect(screen.getByText(/\$2,055\.75/)).toBeInTheDocument();
    expect(screen.getByText(/per Troy Ounce/)).toBeInTheDocument();
  });
});
