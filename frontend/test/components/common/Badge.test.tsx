import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import Badge from '@/components/common/Badge';

describe('Badge', () => {
  it('ongoing 상태면 "진행중"을 표시한다', () => {
    render(<Badge status="ongoing" />);
    expect(screen.getByText('진행중')).toBeInTheDocument();
  });

  it('ending_soon 상태면 "종료임박"을 표시한다', () => {
    render(<Badge status="ending_soon" />);
    expect(screen.getByText('종료임박')).toBeInTheDocument();
  });

  it('closed 상태면 "종료"를 표시한다', () => {
    render(<Badge status="closed" />);
    expect(screen.getByText('종료')).toBeInTheDocument();
  });

  it('failed 상태면 "유찰"을 표시한다', () => {
    render(<Badge status="failed" />);
    expect(screen.getByText('유찰')).toBeInTheDocument();
  });

  it('buy_now 상태면 "즉시구매"를 표시한다', () => {
    render(<Badge status="buy_now" />);
    expect(screen.getByText('즉시구매')).toBeInTheDocument();
  });
});
