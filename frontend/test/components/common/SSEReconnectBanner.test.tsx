import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import SSEReconnectBanner from '@/components/common/SSEReconnectBanner';
import { useSSEConnectionStore } from '@/store/useSSEConnectionStore';

describe('SSEReconnectBanner', () => {
  it('reconnectingCount가 0이면 렌더링하지 않는다', () => {
    useSSEConnectionStore.setState({ reconnectingCount: 0 });
    const { container } = render(<SSEReconnectBanner />);
    expect(container.firstChild).toBeNull();
  });

  it('reconnectingCount가 1 이상이면 배너를 표시한다', () => {
    useSSEConnectionStore.setState({ reconnectingCount: 1 });
    render(<SSEReconnectBanner />);
    expect(screen.getByText(/재연결 중/)).toBeInTheDocument();
  });
});
