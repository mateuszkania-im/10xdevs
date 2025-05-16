import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { userEvent } from '@testing-library/user-event';

// Przykładowy komponent do testowania - normalnie zaimportowalibyśmy istniejący komponent
const Button = ({ children, onClick }: { children: React.ReactNode; onClick?: () => void }) => {
  return (
    <button onClick={onClick} className="px-4 py-2 bg-blue-500 text-white rounded">
      {children}
    </button>
  );
};

describe('Button', () => {
  it('renders correctly', () => {
    render(<Button>Kliknij mnie</Button>);
    expect(screen.getByText('Kliknij mnie')).toBeInTheDocument();
  });

  it('calls onClick handler when clicked', async () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Kliknij mnie</Button>);
    
    await userEvent.click(screen.getByText('Kliknij mnie'));
    
    expect(handleClick).toHaveBeenCalledTimes(1);
  });
}); 