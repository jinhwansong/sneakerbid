import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import Toast from '@/components/common/Toast';

describe('Toast', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('isVisible이 true면 메시지를 표시한다', () => {
    render(
      <Toast
        message="저장되었습니다"
        isVisible={true}
        onClose={vi.fn()}
      />
    );
    expect(screen.getByText('저장되었습니다')).toBeInTheDocument();
  });

  it('isVisible이 false면 렌더링하지 않는다', () => {
    render(
      <Toast
        message="메시지"
        isVisible={false}
        onClose={vi.fn()}
      />
    );
    expect(screen.queryByText('메시지')).not.toBeInTheDocument();
  });

  it('duration 후 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(
      <Toast
        message="메시지"
        isVisible={true}
        onClose={onClose}
        duration={3000}
      />
    );

    vi.advanceTimersByTime(3000);

    expect(onClose).toHaveBeenCalled();
  });

  it('success 타입이면 CheckCircle 아이콘을 표시한다', () => {
    const { container } = render(
      <Toast
        message="성공"
        type="success"
        isVisible={true}
        onClose={vi.fn()}
      />
    );
    expect(container.querySelector('svg')).toBeInTheDocument();
  });
});
