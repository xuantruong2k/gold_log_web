import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { PriceList } from './PriceList';
import type { GoldPrice } from '@/types';
import { GoldProvider } from '@/types';

describe('PriceList', () => {
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
  ];

  it('should render all price cards', () => {
    render(<PriceList prices={mockPrices} />);

    expect(screen.getByText('SJC')).toBeInTheDocument();
    expect(screen.getByText('PNJ')).toBeInTheDocument();
  });

  it('should show empty state when no prices are provided', () => {
    render(<PriceList prices={[]} />);

    expect(screen.getByText('No prices available')).toBeInTheDocument();
  });

  it('should show action buttons when onSelectPrice is provided', () => {
    const onSelectPrice = vi.fn();
    render(<PriceList prices={mockPrices} onSelectPrice={onSelectPrice} />);

    const buttons = screen.getAllByText('Use This Price');
    expect(buttons).toHaveLength(2);
  });

  it('should not show action buttons when onSelectPrice is not provided', () => {
    render(<PriceList prices={mockPrices} />);

    expect(screen.queryByText('Use This Price')).not.toBeInTheDocument();
  });

  it('should call onSelectPrice with correct price when button is clicked', () => {
    const onSelectPrice = vi.fn();
    render(<PriceList prices={mockPrices} onSelectPrice={onSelectPrice} />);

    const buttons = screen.getAllByText('Use This Price');
    buttons[0].click();

    expect(onSelectPrice).toHaveBeenCalledTimes(1);
    expect(onSelectPrice).toHaveBeenCalledWith(mockPrices[0]);
  });

  it('should render prices in grid layout', () => {
    const { container } = render(<PriceList prices={mockPrices} />);

    const grid = container.querySelector('.grid');
    expect(grid).toBeInTheDocument();
    expect(grid?.className).toContain('grid-cols-1');
    expect(grid?.className).toContain('md:grid-cols-2');
  });
});
