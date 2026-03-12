import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '@/components/common/Select';

const options = [
  { label: '옵션1', value: 'opt1' },
  { label: '옵션2', value: 'opt2' },
  { label: '옵션3', value: 3 },
];

describe('Select', () => {
  it('선택된 옵션 라벨을 표시한다', () => {
    render(
      <Select
        options={options}
        value="opt2"
        onChange={vi.fn()}
      />
    );
    expect(screen.getByRole('button')).toHaveTextContent('옵션2');
  });

  it('선택 없으면 placeholder를 표시한다', () => {
    render(
      <Select
        options={options}
        value=""
        onChange={vi.fn()}
        placeholder="선택하세요"
      />
    );
    expect(screen.getByRole('button')).toHaveTextContent('선택하세요');
  });

  it('클릭 시 옵션 목록을 열고 선택 시 onChange를 호출한다', () => {
    const onChange = vi.fn();
    render(
      <Select options={options} value="opt1" onChange={onChange} />
    );

    fireEvent.click(screen.getByRole('button'));
    expect(screen.getByRole('button', { name: '옵션2' })).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: '옵션2' }));
    expect(onChange).toHaveBeenCalledWith('opt2');
  });

  it('label이 있으면 라벨을 표시한다', () => {
    render(
      <Select options={options} value="opt1" onChange={vi.fn()} label="브랜드" />
    );
    expect(screen.getByText('브랜드')).toBeInTheDocument();
  });

  it('error가 있으면 에러 메시지를 표시한다', () => {
    render(
      <Select
        options={options}
        value="opt1"
        onChange={vi.fn()}
        error="필수 선택입니다"
      />
    );
    expect(screen.getByText('필수 선택입니다')).toBeInTheDocument();
  });
});
