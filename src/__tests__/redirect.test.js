import React from 'react';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';

const SignedInRedirect = require('../components/Login/SignedInRedirect').default;

const at = (props) => render(
  <MemoryRouter initialEntries={['/login']}>
    <Routes>
      <Route path="/login" element={<SignedInRedirect {...props} />} />
      <Route path="/dashboardadmin" element={<p>ADMIN PAGE</p>} />
      <Route path="/dashboard" element={<p>STUDENT PAGE</p>} />
    </Routes>
  </MemoryRouter>,
);

describe('where a signed-in person lands after /login', () => {
  test('waits for the admin check instead of guessing', () => {
    at({ adminChecked: false, isAdmin: false });
    expect(screen.queryByText('ADMIN PAGE')).toBeNull();
    expect(screen.queryByText('STUDENT PAGE')).toBeNull();
  });
  test('verified admin goes to the admin dashboard', () => {
    at({ adminChecked: true, isAdmin: true });
    expect(screen.getByText('ADMIN PAGE')).toBeTruthy();
  });
  test('everyone else goes to the student dashboard', () => {
    at({ adminChecked: true, isAdmin: false });
    expect(screen.getByText('STUDENT PAGE')).toBeTruthy();
  });
});
