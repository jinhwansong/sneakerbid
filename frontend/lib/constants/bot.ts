/** 봇 타입별 역할·특성 설명 (관리자 페이지용) */
export const BOT_TYPE_INFO: Record<
  string,
  { label: string; description: string }
> = {
  AGGRESSIVE: {
    label: '공격형',
    description:
      '높은 입찰가로 적극적으로 경쟁. 일일 8~15만원 충전.',
  },
  CALCULATED: {
    label: '계산형',
    description:
      '신중하게 가격대를 계산해 입찰. 일일 5~12만원 충전.',
  },
  EMOTIONAL: {
    label: '감정형',
    description:
      '중간 수준의 입찰로 참여. 일일 4~10만원 충전.',
  },
  FOLLOWER: {
    label: '추종형',
    description:
      '다른 입찰자를 따라가는 패턴. 일일 5~11만원 충전.',
  },
  TROLL: {
    label: '트롤형',
    description:
      '저가 입찰로 시장에 참여. 일일 2~6만원 충전.',
  },
};

export function getBotTypeInfo(type: string) {
  return (
    BOT_TYPE_INFO[type] ?? {
      label: type,
      description: '자동 입찰 봇. 낙찰 시 경매를 재등록합니다.',
    }
  );
}
