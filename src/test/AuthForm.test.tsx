/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react';
import { render, screen, fireEvent, waitFor, cleanup } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import LoginPage from '@/app/login/page';
import RegisterPage from '@/app/register/page';
import { useAuth } from '@/contexts/AuthContext';

// Mock useAuth hook
vi.mock('@/contexts/AuthContext', () => ({
  useAuth: vi.fn(),
}));

describe('Auth Forms Validation', () => {
  let loginMock: ReturnType<typeof vi.fn>;
  let registerMock: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    loginMock = vi.fn();
    registerMock = vi.fn();
    
    vi.mocked(useAuth).mockReturnValue({
      login: loginMock,
      register: registerMock,
      isAuthenticated: false,
      isLoading: false,
      user: null,
      logout: vi.fn(),
      refresh: vi.fn(),
    } as any);
  });

  afterEach(() => {
    cleanup();
  });

  it('LoginPage renders required inputs and handles validation guard', async () => {
    render(<LoginPage />);

    // Inputs render successfully
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);
    // const submitButton = screen.getByRole('button', { name: /sign in/i });

    expect(emailInput).toBeInTheDocument();
    expect(passwordInput).toBeInTheDocument();
    
    const form = emailInput.closest('form')!;
    fireEvent.change(emailInput, { target: { value: ' ' } }); // whitespace triggers empty trim
    fireEvent.change(passwordInput, { target: { value: '' } });
    fireEvent.submit(form);

    const errorAlert = await screen.findByText(/please fill in all required fields/i);
    expect(errorAlert).toBeInTheDocument();
    expect(loginMock).not.toHaveBeenCalled();
  });

  it('LoginPage successfully executes login on valid input', async () => {
    loginMock.mockResolvedValueOnce({});
    render(<LoginPage />);

    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    const form = emailInput.closest('form')!;
    fireEvent.change(emailInput, { target: { value: 'user@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'supersecret123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(loginMock).toHaveBeenCalledWith({
        email: 'user@example.com',
        password: 'supersecret123',
      });
    });
  });

  it('RegisterPage validates password length', async () => {
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    const form = nameInput.closest('form')!;
    fireEvent.change(nameInput, { target: { value: 'Agus' } });
    fireEvent.change(emailInput, { target: { value: 'agus@example.com' } });
    fireEvent.change(passwordInput, { target: { value: '1234567' } }); // Short password (< 8 chars)
    fireEvent.submit(form);

    const errorAlert = await screen.findByText(/password must be at least 8 characters long/i);
    expect(errorAlert).toBeInTheDocument();
    expect(registerMock).not.toHaveBeenCalled();
  });

  it('RegisterPage successfully executes register on valid inputs', async () => {
    registerMock.mockResolvedValueOnce({});
    render(<RegisterPage />);

    const nameInput = screen.getByLabelText(/full name/i);
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/^password$/i);

    const form = nameInput.closest('form')!;
    fireEvent.change(nameInput, { target: { value: 'John Doe' } });
    fireEvent.change(emailInput, { target: { value: 'john@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'strongpass123' } });
    fireEvent.submit(form);

    await waitFor(() => {
      expect(registerMock).toHaveBeenCalledWith({
        full_name: 'John Doe',
        email: 'john@example.com',
        password: 'strongpass123',
      });
    });
  });
});
