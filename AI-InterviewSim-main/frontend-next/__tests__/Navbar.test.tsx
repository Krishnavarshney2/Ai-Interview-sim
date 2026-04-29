import { render, screen, fireEvent } from '@testing-library/react';
import Navbar from '../components/Navbar';

// Mock next/navigation
jest.mock('next/navigation', () => ({
  usePathname: () => '/dashboard',
}));

// Mock AuthContext
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({
    user: { email: 'test@example.com' },
    signOut: jest.fn(),
  }),
}));

describe('Navbar Component', () => {
  it('renders brand logo', () => {
    render(<Navbar />);
    expect(screen.getByText('Luminal AI')).toBeInTheDocument();
  });

  it('renders navigation items', () => {
    render(<Navbar />);
    expect(screen.getByText('Dashboard')).toBeInTheDocument();
    expect(screen.getByText('Practice')).toBeInTheDocument();
  });

  it('shows user email when logged in', () => {
    render(<Navbar />);
    expect(screen.getByText('test@example.com')).toBeInTheDocument();
  });

  it('has start interview button', () => {
    render(<Navbar />);
    expect(screen.getByText('Start Interview')).toBeInTheDocument();
  });
});
