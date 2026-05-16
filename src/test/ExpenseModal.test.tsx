/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import ExpenseModal from '@/components/expenses/ExpenseModal';

describe('ExpenseModal Validation and Submit', () => {
  const onCloseMock = vi.fn();
  const onSubmitMock = vi.fn();
  
  const mockCategories = [
    { id: 'cat-1', name: 'Food', user_id: 'user-1', created_at: '2026-01-01', updated_at: '2026-01-01' },
    { id: 'cat-2', name: 'Rent', user_id: 'user-1', created_at: '2026-01-01', updated_at: '2026-01-01' },
  ];

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('renders and populates default values when open', () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        categories={mockCategories}
      />
    );

    expect(screen.getByText(/add new expense/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/category/i)).toHaveValue('cat-1'); // Auto-selects first category
    expect(screen.getByLabelText(/cur/i)).toHaveValue('IDR');
  });

  it('validates amount input is numeric and greater than zero', async () => {
    render(
      <ExpenseModal
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        categories={mockCategories}
      />
    );

    const amountInput = screen.getByLabelText(/amount/i);
    // const submitButton = screen.getByRole('button', { name: /save expense/i });

    // Zero or negative amount test
    fireEvent.change(amountInput, { target: { value: '0' } });
    fireEvent.click(submitButton);

    const errorAlert = await screen.findByText(/please enter a valid amount greater than zero/i);
    expect(errorAlert).toBeInTheDocument();
    expect(onSubmitMock).not.toHaveBeenCalled();

    // Invalid characters / NaN input test
    fireEvent.change(amountInput, { target: { value: '-15000' } });
    fireEvent.click(submitButton);
    expect(screen.getByText(/please enter a valid amount greater than zero/i)).toBeInTheDocument();
    expect(onSubmitMock).not.toHaveBeenCalled();
  });

  it('successfully submits clean payload on valid inputs', async () => {
    onSubmitMock.mockResolvedValueOnce({});
    render(
      <ExpenseModal
        isOpen={true}
        onClose={onCloseMock}
        onSubmit={onSubmitMock}
        categories={mockCategories}
      />
    );

    const amountInput = screen.getByLabelText(/amount/i);
    const merchantInput = screen.getByLabelText(/merchant/i);
    const noteInput = screen.getByLabelText(/note/i);
    const dateInput = screen.getByLabelText(/date/i);
    const submitButton = screen.getByRole('button', { name: /save expense/i });

    // Change form fields
    fireEvent.change(amountInput, { target: { value: '45000' } });
    fireEvent.change(merchantInput, { target: { value: 'Starbucks' } });
    fireEvent.change(noteInput, { target: { value: 'Latte meeting' } });
    fireEvent.change(dateInput, { target: { value: '2026-05-14' } });
    
    fireEvent.click(submitButton);

    await waitFor(() => {
      expect(onSubmitMock).toHaveBeenCalledWith({
        category_id: 'cat-1',
        amount: '45000',
        currency: 'IDR',
        occurred_on: '2026-05-14',
        merchant: 'Starbucks',
        note: 'Latte meeting',
        payment_method: 'Cash',
      });
    });

    expect(onCloseMock).toHaveBeenCalled(); // Closed on successful save
  });
});
