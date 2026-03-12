import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import PaymentFlowModal from '@/components/common/PaymentFlowModal';

vi.mock('@/store/useToastStore', () => ({
  useToastStore: () => ({ showToast: vi.fn() }),
}));

describe('PaymentFlowModal', () => {
  it('isOpen이 false면 null을 반환한다', () => {
    const { container } = render(
      <PaymentFlowModal
        isOpen={false}
        onClose={vi.fn()}
        price={100000}
        modelName="Nike Dunk"
        onConfirm={vi.fn()}
      />
    );
    expect(container.firstChild).toBeNull();
  });

  it('isOpen이 true면 모달을 렌더링한다', () => {
    render(
      <PaymentFlowModal
        isOpen={true}
        onClose={vi.fn()}
        price={100000}
        modelName="Nike Dunk"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByText('Nike Dunk')).toBeInTheDocument();
    expect(screen.getByText(/100,000/)).toBeInTheDocument();
  });
});
