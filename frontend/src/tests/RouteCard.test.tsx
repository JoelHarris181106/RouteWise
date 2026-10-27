import { render, screen } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { RouteCard } from '../components/RouteCard';
import { RouteOption } from '../types';

describe('RouteCard Component', () => {
  const mockRoute: RouteOption = {
    category: 'fastest',
    title: 'Fastest Journey',
    total_time_mins: 15,
    total_fare: 22.5,
    transfers_count: 1,
    total_distance_km: 8.4,
    stops_sequence: ['STN_CENTRAL', 'STN_TECH_PARK'],
    stops_names: ['Central Station', 'Tech Park Hub'],
    segments: [
      {
        segment_index: 1,
        from_stop_id: 'STN_CENTRAL',
        from_stop_name: 'Central Station',
        to_stop_id: 'STN_TECH_PARK',
        to_stop_name: 'Tech Park Hub',
        mode: 'metro',
        line_name: 'Metro Red (M1)',
        travel_time: 15,
        fare: 22.5,
        distance_km: 8.4,
      },
    ],
    lines_used: ['Metro Red (M1)'],
    explanation: 'Dijkstra shortest path by travel time.',
    is_feasible: true,
    coincides_with: [],
  };

  it('renders route duration, fare, and transfers correctly', () => {
    const handleSelect = vi.fn();
    render(<RouteCard route={mockRoute} isSelected={false} onSelect={handleSelect} />);

    expect(screen.getByText('Fastest Route')).toBeDefined();
    expect(screen.getByText('15')).toBeDefined();
    expect(screen.getByText('$22.50')).toBeDefined();
    expect(screen.getByText('1')).toBeDefined();
    expect(screen.getByText('Metro Red (M1)')).toBeDefined();
  });

  it('displays infeasible notice when route cannot be found', () => {
    const infeasibleRoute: RouteOption = {
      ...mockRoute,
      is_feasible: false,
      explanation: 'Destination unreachable due to active bridge disruption.',
    };
    render(<RouteCard route={infeasibleRoute} isSelected={false} onSelect={vi.fn()} />);

    expect(screen.getByText(/Unavailable/)).toBeDefined();
    expect(screen.getByText(/Destination unreachable/)).toBeDefined();
  });
});
