import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { DfaExplorer } from '../components/DfaExplorer';

// Mock the API client
vi.mock('../api/client', () => ({
  validateDfa: vi.fn().mockResolvedValue({
    input_code: 'ON_TIME',
    is_accepted: true,
    final_state: 'q_ACC_ON_TIME',
    visited_states: ['q0', 'q_O', 'q_ON', 'q_ON_', 'q_ON_T', 'q_ON_TI', 'q_ON_TIM', 'q_ACC_ON_TIME'],
    trace: [
      { step: 1, character: 'O', from_state: 'q0', to_state: 'q_O', valid_step: true },
      { step: 2, character: 'N', from_state: 'q_O', to_state: 'q_ON', valid_step: true },
    ],
    explanation: "Accepted: Input 'ON_TIME' completed execution in accepting state.",
    error_position: null,
    language_spec: 'L = { ON_TIME, DELAYED, CANCELLED, MAINTENANCE, DIVERTED }',
  }),
  fetchDfaSpec: vi.fn().mockResolvedValue({
    alphabet: ['A', 'C', 'D', 'E', 'I', 'L', 'M', 'N', 'O', 'R', 'T', 'V', 'Y', '_'],
    states: ['q0', 'q_ACC_ON_TIME', 'q_trap'],
    initial_state: 'q0',
    accepting_states: ['q_ACC_ON_TIME'],
    transition_table: {
      q0: { O: 'q_O', D: 'q_D' },
    },
    language_description: 'Formal language of transit status codes',
  }),
}));

describe('DfaExplorer Component', () => {
  it('renders formal 5-tuple specs and validation trace', async () => {
    render(<DfaExplorer />);

    expect(screen.getByText(/Deterministic Finite Automaton/)).toBeDefined();
    expect(screen.getByText('Validate Token')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('STATUS CODE ACCEPTED')).toBeDefined();
      expect(screen.getByText(/Final State: q_ACC_ON_TIME/)).toBeDefined();
    });
  });
});
