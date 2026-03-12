import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button, ButtonLink } from '@/components/common/Button';

vi.mock('next/link', () => ({
  default: ({
    children,
    href,
    ...props
  }: {
    children: React.ReactNode;
    href: string;
  }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

describe('Button', () => {
  it('children을 렌더링한다', () => {
    render(<Button>클릭</Button>);
    expect(screen.getByRole('button', { name: '클릭' })).toBeInTheDocument();
  });

  it('클릭 시 onClick이 호출된다', () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>클릭</Button>);
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it('disabled면 클릭이 무시된다', () => {
    const onClick = vi.fn();
    render(
      <Button disabled onClick={onClick}>
        클릭
      </Button>
    );
    fireEvent.click(screen.getByRole('button'));
    expect(onClick).not.toHaveBeenCalled();
  });

  it('variant에 따라 다른 스타일을 적용한다', () => {
    const { rerender } = render(<Button variant="primary">Primary</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-text-main');

    rerender(<Button variant="ghost">Ghost</Button>);
    expect(screen.getByRole('button')).toHaveClass('bg-transparent');
  });

  it('size에 따라 다른 크기를 적용한다', () => {
    render(<Button size="lg">Large</Button>);
    expect(screen.getByRole('button')).toHaveClass('px-6', 'py-3.5');
  });
});

describe('ButtonLink', () => {
  it('href로 링크를 렌더링한다', () => {
    render(
      <ButtonLink href="/test">
        링크
      </ButtonLink>
    );
    const link = screen.getByRole('link', { name: '링크' });
    expect(link).toHaveAttribute('href', '/test');
  });
});
