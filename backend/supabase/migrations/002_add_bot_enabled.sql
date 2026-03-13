-- Bot on/off 관리용 enabled 컬럼 추가 (기본값 true = 기존 봇 동작 유지)
ALTER TABLE "Bot" ADD COLUMN IF NOT EXISTS "enabled" BOOLEAN NOT NULL DEFAULT true;
