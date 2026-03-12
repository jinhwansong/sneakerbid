import { describe, it, expect } from 'vitest';
import { render } from '@testing-library/react';
import { Skeleton } from '@/components/common/Skeleton';

describe('Skeleton', () => {
  it('기본적으로 rect variant로 렌더링한다', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('rounded');
    expect(el).toHaveClass('animate-pulse');
  });

  it('circle variant면 rounded-full을 적용한다', () => {
    const { container } = render(<Skeleton variant="circle" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('rounded-full');
  });

  it('기본적으로 aria-hidden이 true이다', () => {
    const { container } = render(<Skeleton />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveAttribute('aria-hidden', 'true');
  });

  it('ariaHidden이 false면 aria-hidden을 적용하지 않는다', () => {
    const { container } = render(<Skeleton ariaHidden={false} />);
    const el = container.firstChild as HTMLElement;
    expect(el).not.toHaveAttribute('aria-hidden');
  });

  it('className을 병합한다', () => {
    const { container } = render(<Skeleton className="custom-class" />);
    const el = container.firstChild as HTMLElement;
    expect(el).toHaveClass('custom-class');
  });
});
