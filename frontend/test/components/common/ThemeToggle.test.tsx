import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import ThemeToggle from '@/components/common/ThemeToggle';

const mockSetTheme = vi.fn();
vi.mock('next-themes', () => ({
  useTheme: () => ({
    theme: 'light',
    setTheme: mockSetTheme,
  }),
}));

vi.mock('@/hooks/useIsMounted', () => ({
  useIsMounted: () => true,
}));

describe('ThemeToggle', () => {
  beforeEach(() => {
    mockSetTheme.mockClear();
  });

  it('마운트되면 토글 버튼을 표시한다', () => {
    render(<ThemeToggle />);
    expect(screen.getByRole('button', { name: '테마 토글' })).toBeInTheDocument();
  });

  it('클릭 시 setTheme을 호출한다', () => {
    render(<ThemeToggle />);
    fireEvent.click(screen.getByRole('button', { name: '테마 토글' }));
    expect(mockSetTheme).toHaveBeenCalledWith('dark');
  });
});
