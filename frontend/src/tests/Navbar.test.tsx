import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Navbar } from '../components/Navbar';

describe('Navbar Component', () => {
  it('renders branding and navigation tabs', () => {
    const setActiveTab = vi.fn();
    render(<Navbar activeTab="planner" setActiveTab={setActiveTab} activeDisruptionsCount={0} />);

    expect(screen.getByText('RouteWise')).toBeDefined();
    expect(screen.getByText('Journey Planner')).toBeDefined();
    expect(screen.getByText('Network Diagram')).toBeDefined();
    expect(screen.getByText('Disruptions')).toBeDefined();
    expect(screen.getByText('FLAT: DFA Explorer')).toBeDefined();
    expect(screen.getByText('COA: Pipeline Sim')).toBeDefined();
    expect(screen.getByText('All Lines Normal')).toBeDefined();
  });

  it('triggers setActiveTab when a navigation tab is clicked', () => {
    const setActiveTab = vi.fn();
    render(<Navbar activeTab="planner" setActiveTab={setActiveTab} activeDisruptionsCount={2} />);

    const dfaTab = screen.getByText('FLAT: DFA Explorer');
    fireEvent.click(dfaTab);

    expect(setActiveTab).toHaveBeenCalledWith('dfa');
    expect(screen.getByText('2 Active Disruptions')).toBeDefined();
  });
});
