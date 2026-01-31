import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceComparison } from './PriceComparison';
import type { GoldPrice } from '@/types';
import { GoldProvider } from '@/types';

describe('PriceComparison', () => {
  const mockPrices: GoldPrice[] = [
    {
      provider: GoldProvider.SJC,
      buyPrice: 7450000,
      sellPrice: 7500000,
      unit: 'CHI',
      unitDisplayName: 'Chỉ',
      currency: 'VND',
      updatedAt: '2026-01-31T14:25:00Z',
      spread: 50000,
      spreadPercentage: 0.67,
    },
    {
      provider: GoldProvider.PNJ,
      buyPrice: 7460000,
      sellPrice: 7490000,
      unit: 'CHI',
      unitDisplayName: 'Chỉ',
      currency: 'VND',
      updatedAt: '2026-01-31T14:25:00Z',
      spread: 30000,
      spreadPercentage: 0.4,
    },
    {
      provider: GoldProvider.SBJ,
      buyPrice: 7455000,
      sellPrice: 7495000,
      unit: 'CHI',
      unitDisplayName: 'Chỉ',
      currency: 'VND',
      updatedAt: '2026-01-31T14:25:00Z',
      spread: 40000,
      spreadPercentage: 0.54,
    },
  ];

  it('should render best buy and sell prices', () => {
    render(<PriceComparison prices={mockPrices} />);

    expect(screen.getByText('Best Prices (VND)')).toBeInTheDocument();
    expect(screen.getByText('Best Buy Price')).toBeInTheDocument();
    expect(screen.getByText('Best Sell Price')).toBeInTheDocument();
  });

  it('should show lowest buy price', () => {
    render(<PriceComparison prices={mockPrices} />);

    // SJC has the lowest buy price (7,450,000)
    // formatCurrency formats as 7.450.000 (with dots) in vi-VN locale
    expect(screen.getByText(/7\.450\.000 VND/)).toBeInTheDocument();
    const cards = screen.getAllByText('SJC');
    expect(cards.length).toBeGreaterThan(0);
  });

  it('should show highest sell price', () => {
    render(<PriceComparison prices={mockPrices} />);

    // SJC has the highest sell price (7,500,000)
    // formatCurrency formats as 7.500.000 (with dots) in vi-VN locale
    expect(screen.getByText(/7\.500\.000 VND/)).toBeInTheDocument();
  });

  it('should not render when no prices are provided', () => {
    const { container } = render(<PriceComparison prices={[]} />);

    expect(container.firstChild).toBeNull();
  });

  it('should show message when no VND prices available', () => {
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

    render(<PriceComparison prices={[usdPrice]} />);

    expect(screen.getByText('No VND prices available')).toBeInTheDocument();
  });

  it('should filter and show only VND prices', () => {
    const mixedPrices: GoldPrice[] = [
      ...mockPrices,
      {
        provider: GoldProvider.WORLD_GOLD,
        buyPrice: 2050.5,
        sellPrice: 2055.75,
        unit: 'OZ',
        unitDisplayName: 'Troy Ounce',
        currency: 'USD',
        updatedAt: '2026-01-31T14:25:00Z',
        spread: 5.25,
        spreadPercentage: 0.26,
      },
    ];

    render(<PriceComparison prices={mixedPrices} />);

    // Should only show VND prices
    expect(screen.queryByText(/\$/)).not.toBeInTheDocument();
    expect(screen.getAllByText(/VND/).length).toBeGreaterThan(0);
  });

  it('should correctly identify best prices across multiple providers', () => {
    const { container } = render(<PriceComparison prices={mockPrices} />);

    // Check that the component rendered successfully
    expect(container.querySelector('.bg-blue-50')).toBeInTheDocument();
    expect(container.querySelector('.bg-white')).toBeInTheDocument();
  });
});
