export type BotProfile = {
  id: string;
  nickname: string;
  type: 'AGGRESSIVE' | 'CALCULATED' | 'EMOTIONAL' | 'FOLLOWER' | 'TROLL';
  budget: number;
  riskTolerance: number; // 1~10
  bidUnit: number; // 기본 입찰 단위
  maxBidMultiplier: number; // 시작가 대비 몇 배까지 허용
  activityStartHour: number;
  activityEndHour: number;
  favoriteBrands: string[];
  chatStyle: string[];
};
