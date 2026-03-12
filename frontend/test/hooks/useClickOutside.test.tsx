import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { useRef } from 'react';
import { useClickOutside } from '../../hooks/useClickOutside';

function TestComponent({
  onOutside,
  eventType = 'mousedown',
}: {
  onOutside: () => void;
  eventType?: 'mousedown' | 'mouseup' | 'click';
}) {
  const ref = useRef<HTMLDivElement>(null);
  useClickOutside(ref, onOutside, eventType);
  return (
    <div>
      <div ref={ref} data-testid="inside">
        Inside
      </div>
      <div data-testid="outside">Outside</div>
    </div>
  );
}

describe('useClickOutside', () => {
  it('ref 밖을 클릭하면 callback이 호출된다', () => {
    const onOutside = vi.fn();
    render(<TestComponent onOutside={onOutside} />);

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onOutside).toHaveBeenCalledTimes(1);

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onOutside).toHaveBeenCalledTimes(2);
  });

  it('ref 안을 클릭하면 callback이 호출되지 않는다', () => {
    const onOutside = vi.fn();
    render(<TestComponent onOutside={onOutside} />);

    fireEvent.mouseDown(screen.getByTestId('inside'));
    expect(onOutside).not.toHaveBeenCalled();
  });

  it('eventType에 따라 다른 이벤트를 감지한다', () => {
    const onOutside = vi.fn();
    render(<TestComponent onOutside={onOutside} eventType="click" />);

    fireEvent.mouseDown(screen.getByTestId('outside'));
    expect(onOutside).not.toHaveBeenCalled();

    fireEvent.click(screen.getByTestId('outside'));
    expect(onOutside).toHaveBeenCalledTimes(1);
  });
});
