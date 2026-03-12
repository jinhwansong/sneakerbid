import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Input, TextArea } from '@/components/common/Input';

describe('Input', () => {
  it('input을 렌더링한다', () => {
    render(<Input placeholder="입력" />);
    expect(screen.getByPlaceholderText('입력')).toBeInTheDocument();
  });

  it('label이 있으면 라벨을 표시한다', () => {
    render(<Input label="이름" />);
    expect(screen.getByLabelText('이름')).toBeInTheDocument();
  });

  it('required면 라벨에 *를 표시한다', () => {
    render(<Input label="필수" required />);
    expect(screen.getByText('*')).toBeInTheDocument();
  });

  it('error가 있으면 에러 메시지를 표시한다', () => {
    render(<Input error="필수 입력입니다" />);
    expect(screen.getByText('필수 입력입니다')).toBeInTheDocument();
  });

  it('suffix가 있으면 접미사를 표시한다', () => {
    render(<Input suffix="원" />);
    expect(screen.getByText('원')).toBeInTheDocument();
  });

  it('사용자 입력을 받는다', () => {
    render(<Input placeholder="입력" />);
    const input = screen.getByPlaceholderText('입력');
    fireEvent.change(input, { target: { value: '테스트' } });
    expect(input).toHaveValue('테스트');
  });
});

describe('TextArea', () => {
  it('textarea를 렌더링한다', () => {
    render(<TextArea placeholder="내용" />);
    expect(screen.getByPlaceholderText('내용')).toBeInTheDocument();
  });

  it('label이 있으면 라벨을 표시한다', () => {
    render(<TextArea label="설명" />);
    expect(screen.getByLabelText('설명')).toBeInTheDocument();
  });

  it('error가 있으면 에러 메시지를 표시한다', () => {
    render(<TextArea error="오류" />);
    expect(screen.getByText('오류')).toBeInTheDocument();
  });
});
