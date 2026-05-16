/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import RetirementPage from '@/app/retirement/page';
import { retirementApiClient } from '@/lib/api-client';

// Mock AuthContext, AuthGuard, and Layouts to focus purely on RetirementPage logic
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: () => ({
    isAuthenticated: true,
    isLoading: false,
  }),
}));

vi.mock('@/components/AuthGuard', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

vi.mock('@/components/layout/DashboardLayout', () => ({
  default: ({ children }: { children: React.ReactNode }) => <>{children}</>,
}));

// Mock API Client methods
vi.mock('@/lib/api-client', async (importOriginal) => {
  const actual = await importOriginal() as Record<string, any>;
  return {
    ...actual,
    retirementApiClient: {
      listPlans: vi.fn(),
      createPlan: vi.fn(),
      updatePlan: vi.fn(),
      compute: vi.fn(),
    },
  };
});

describe('RetirementPlanner Calculation & Output Rendering', () => {
  const mockResults = {
    fi_number: '1500000000',
    projected_corpus_at_retirement: '2000000000',
    required_monthly_contribution: '3000000',
    years_to_retirement: 30,
    scenarios: [
      {
        scenario_name: 'Conservative Growth',
        risk_profile: 'low',
        expected_return_rate: 0.06,
        inflation_rate: 0.04,
        projected_corpus_at_retirement: '1200000000',
        required_monthly_contribution: '4500000',
      },
      {
        scenario_name: 'High Growth',
        risk_profile: 'high',
        expected_return_rate: 0.12,
        inflation_rate: 0.04,
        projected_corpus_at_retirement: '4000000000',
        required_monthly_contribution: '1500000',
      },
    ],
  };

  beforeEach(() => {
    vi.clearAllMocks();
    // Default behaviour: No initial saved plans
    vi.mocked(retirementApiClient.listPlans).mockResolvedValue({ data: [] } as any);
  });

  it('renders simulator form correctly after syncing bootstrap state', async () => {
    render(<RetirementPage />);

    // Syncing state renders initially
    expect(screen.getByText(/syncing scenarios/i)).toBeInTheDocument();

    // Form inputs appear once listPlans resolves
    await waitFor(() => {
      expect(screen.queryByText(/syncing scenarios/i)).not.toBeInTheDocument();
    });

    expect(screen.getByText(/scenario simulator/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/current age/i)).toHaveValue(25);
    expect(screen.getByLabelText(/target retirement age/i)).toHaveValue(55);
  });

  it('validates target retirement age must exceed current age', async () => {
    render(<RetirementPage />);

    await waitFor(() => {
      expect(screen.queryByText(/syncing scenarios/i)).not.toBeInTheDocument();
    });

    const currentAgeInput = screen.getByLabelText(/current age/i);
    const targetAgeInput = screen.getByLabelText(/target retirement age/i);
    // const computeBtn = screen.getByRole('button', { name: /compute projections/i });

    const form = currentAgeInput.closest('form')!;
    fireEvent.change(currentAgeInput, { target: { value: 35 } });
    fireEvent.change(targetAgeInput, { target: { value: 30 } });
    fireEvent.submit(form);

    const errorMsg = await screen.findByText(/target retirement age must exceed your current age/i);
    expect(errorMsg).toBeInTheDocument();
    expect(retirementApiClient.createPlan).not.toHaveBeenCalled();
  });

  it('successfully calculates and renders FIRE target outputs and risk scenarios', async () => {
    vi.mocked(retirementApiClient.createPlan).mockResolvedValue({ data: { id: 'new-plan-id' } } as any);
    vi.mocked(retirementApiClient.compute).mockResolvedValue({ data: mockResults } as any);

    render(<RetirementPage />);

    await waitFor(() => {
      expect(screen.queryByText(/syncing scenarios/i)).not.toBeInTheDocument();
    });

    const currentAgeInput = screen.getByLabelText(/current age/i);
    const targetAgeInput = screen.getByLabelText(/target retirement age/i);
    const annualExpenseInput = screen.getByLabelText(/estimated annual expense/i);
    const computeBtn = screen.getByRole('button', { name: /compute projections/i });

    // Set valid simulation values
    fireEvent.change(currentAgeInput, { target: { value: 30 } });
    fireEvent.change(targetAgeInput, { target: { value: 60 } });
    fireEvent.change(annualExpenseInput, { target: { value: '100000000' } });
    fireEvent.click(computeBtn);

    // 1. Wait for calculation completion
    await waitFor(() => {
      expect(retirementApiClient.createPlan).toHaveBeenCalled();
      expect(retirementApiClient.compute).toHaveBeenCalledWith('new-plan-id');
    });

    // 2. Verify output components render correctly
    expect(screen.getByText(/fire independence target/i)).toBeInTheDocument();
    
    // Check localized currency text formatting: IDR formatting has period grouping
    // Example format for 1500000000 is Rp1.500.000.000 (using non-breaking spaces often, so we do substring or partial matches)
    expect(screen.getByText(/Rp.*1\.500\.000\.000/i)).toBeInTheDocument();

    // Verify meta-data sub-items
    expect(screen.getByText(/30 years/i)).toBeInTheDocument(); // years_to_retirement

    // Verify scenario grid components render
    expect(screen.getByText(/tiered multi-risk scenarios/i)).toBeInTheDocument();
    expect(screen.getByText(/conservative growth/i)).toBeInTheDocument();
    expect(screen.getByText(/high growth/i)).toBeInTheDocument();
    expect(screen.getByText(/low risk/i)).toBeInTheDocument();
    expect(screen.getByText(/high risk/i)).toBeInTheDocument();
  });
});
