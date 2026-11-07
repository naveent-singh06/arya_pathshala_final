import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const mockEmail = jest.fn();
const mockPopup = jest.fn();
jest.mock('../firebase', () => ({ auth: { name: 'auth' }, firebaseConfigError: null }));
jest.mock('firebase/auth', () => ({
  GoogleAuthProvider: function GoogleAuthProvider() {},
  signInWithPopup: (...a) => mockPopup(...a),
  signInWithEmailAndPassword: (...a) => mockEmail(...a),
}));

const Login = require('../Login').default;
const { authErrorMessage } = require('../authErrors');

const show = () => render(<MemoryRouter><Login /></MemoryRouter>);
const fill = (email, pw) => {
  fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: email } });
  fireEvent.change(screen.getByLabelText(/password/i), { target: { value: pw } });
};

describe('Login', () => {
  beforeEach(() => { mockEmail.mockReset(); mockPopup.mockReset(); window.alert = jest.fn(); });

  test('email and password really call Firebase (no fake success alert)', async () => {
    mockEmail.mockResolvedValue({ user: { uid: 'u' } });
    show();
    fill(' kid@example.com ', 'secret1');
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));
    await waitFor(() => expect(mockEmail).toHaveBeenCalledWith({ name: 'auth' }, 'kid@example.com', 'secret1'));
    expect(window.alert).not.toHaveBeenCalled();
  });

  test('wrong credentials show a useful message, not a generic failure', async () => {
    mockEmail.mockRejectedValue({ code: 'auth/invalid-credential' });
    show();
    fill('a@b.co', 'bad');
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/not correct.*Google/i);
  });

  test('empty fields are rejected without calling Firebase', () => {
    show();
    fireEvent.click(screen.getByRole('button', { name: /^log in$/i }));
    expect(screen.getByRole('alert').textContent).toMatch(/enter your email/i);
    expect(mockEmail).not.toHaveBeenCalled();
  });

  test('Google sign-in uses the Firebase popup and explains an unauthorised domain', async () => {
    mockPopup.mockRejectedValue({ code: 'auth/unauthorized-domain' });
    show();
    fireEvent.click(screen.getByRole('button', { name: 'Google' }));
    expect((await screen.findByRole('alert')).textContent).toMatch(/Authorized domains/i);
    expect(mockPopup).toHaveBeenCalledTimes(1);
  });

  test('there is no role dropdown that could pretend to grant admin', () => {
    show();
    expect(screen.queryByLabelText(/log in as/i)).toBeNull();
  });

  test('a second click while signing in does not start another request', async () => {
    let finish;
    mockPopup.mockReturnValue(new Promise((r) => { finish = r; }));
    show();
    const btn = screen.getByRole('button', { name: 'Google' });
    fireEvent.click(btn);
    fireEvent.click(btn);
    expect(mockPopup).toHaveBeenCalledTimes(1);
    finish({});
  });
});

describe('error messages', () => {
  test('known codes are friendly, unknown codes keep the code for debugging', () => {
    expect(authErrorMessage({ code: 'auth/popup-blocked' })).toMatch(/pop-ups/i);
    expect(authErrorMessage({ code: 'auth/network-request-failed' })).toMatch(/internet/i);
    expect(authErrorMessage({ code: 'auth/weird' })).toMatch(/auth\/weird/);
    expect(authErrorMessage(null)).toMatch(/failed/i);
  });
});
