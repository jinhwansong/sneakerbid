import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import Dropdown from '@/components/common/Dropdown';

const options = [
  { label: '옵션1', value: 'opt1' },
  { label: '옵션2', value: 'opt2' },
  { label: '옵션3', value: 'opt3' },
];

describe('Dropdown', () => {
  it('선택된 옵션 라벨을 표시한다', () => {
    render(
      <Dropdown options={options} value="opt2" onSelect={vi.fn()} />
    );
    const trigger = screen.getAllByRole('button', { name: /옵션2/ })[0];
    expect(trigger).toHaveTextContent('옵션2');
  });

  it('value에 해당하는 옵션이 없으면 "선택"을 표시한다', () => {
    render(
      <Dropdown options={options} value="unknown" onSelect={vi.fn()} />
    );
    expect(screen.getByRole('button', { name: /선택/ })).toBeInTheDocument();
  });

  it('옵션 선택 시 onSelect를 호출한다', () => {
    const onSelect = vi.fn();
    render(
      <Dropdown options={options} value="opt1" onSelect={onSelect} />
    );

    const trigger = screen.getAllByRole('button', { name: /옵션1/ })[0];
    expect(trigger).toHaveAttribute('aria-expanded', 'false');
    fireEvent.click(trigger);
    expect(trigger).toHaveAttribute('aria-expanded', 'true');

    const opt2Button = screen.getByRole('button', { name: '옵션2' });
    fireEvent.click(opt2Button);

    expect(onSelect).toHaveBeenCalledWith('opt2');
  });
});
