import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import ConfirmModal from '@/components/common/ConfirmModal';

describe('ConfirmModal', () => {
  it('isOpen이 true면 모달을 렌더링한다', () => {
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        message="정말 삭제하시겠습니까?"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    expect(screen.getByText('정말 삭제하시겠습니까?')).toBeInTheDocument();
  });

  it('isOpen이 false면 렌더링하지 않는다', () => {
    render(
      <ConfirmModal
        isOpen={false}
        onClose={vi.fn()}
        message="메시지"
        onConfirm={vi.fn()}
      />
    );
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
  });

  it('취소 버튼 클릭 시 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        message="메시지"
        onConfirm={vi.fn()}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: '취소' }));
    expect(onClose).toHaveBeenCalled();
  });

  it('확인 버튼 클릭 시 onConfirm을 호출한다', async () => {
    const onConfirm = vi.fn().mockResolvedValue(undefined);
    render(
      <ConfirmModal
        isOpen={true}
        onClose={vi.fn()}
        message="메시지"
        onConfirm={onConfirm}
      />
    );
    await act(async () => {
      fireEvent.click(screen.getByRole('button', { name: '확인' }));
    });
    expect(onConfirm).toHaveBeenCalled();
  });

  it('Escape 키로 onClose를 호출한다', () => {
    const onClose = vi.fn();
    render(
      <ConfirmModal
        isOpen={true}
        onClose={onClose}
        message="메시지"
        onConfirm={vi.fn()}
      />
    );
    fireEvent.keyDown(document, { key: 'Escape' });
    expect(onClose).toHaveBeenCalled();
  });
});
