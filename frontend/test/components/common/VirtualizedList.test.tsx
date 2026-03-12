import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import VirtualizedList from '@/components/common/VirtualizedList';

vi.mock('react-virtuoso', () => ({
  Virtuoso: ({ data, itemContent }: { data: unknown[]; itemContent: (i: number, item: unknown) => React.ReactNode }) => (
    <div data-testid="virtuoso">
      {data.map((item, i) => (
        <div key={i}>{itemContent(i, item)}</div>
      ))}
    </div>
  ),
}));

describe('VirtualizedList', () => {
  it('error가 있으면 에러 메시지를 표시한다', () => {
    render(
      <VirtualizedList
        data={[]}
        renderItem={() => null}
        error="로드 실패"
      />
    );
    expect(screen.getByText('로드 실패')).toBeInTheDocument();
  });

  it('data가 비어있고 loading이 false면 emptyText를 표시한다', () => {
    render(
      <VirtualizedList
        data={[]}
        renderItem={() => null}
        emptyText="데이터가 없습니다"
      />
    );
    expect(screen.getByText('데이터가 없습니다')).toBeInTheDocument();
  });

  it('data가 비어있고 loading이 true면 loadingText를 표시한다', () => {
    render(
      <VirtualizedList
        data={[]}
        renderItem={() => null}
        loading={true}
        loadingText="로딩 중"
      />
    );
    expect(screen.getByText('로딩 중')).toBeInTheDocument();
  });

  it('data가 있으면 renderItem으로 렌더링한다', () => {
    render(
      <VirtualizedList
        data={['a', 'b']}
        renderItem={(item) => <span>{item}</span>}
      />
    );
    expect(screen.getByTestId('virtuoso')).toBeInTheDocument();
  });
});
