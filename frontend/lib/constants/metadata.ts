import type { Metadata } from 'next';

const SITE_NAME = 'LaceUp';
const BASE_DESCRIPTION = '실시간 스니커즈 경매 플랫폼. Toss/KREAM 스타일의 경매 경험을 제공합니다.';

/** 기본 OG 이미지 (public/og.png 추가 권장: 1200x630) */
const OG_IMAGE = '/og.png';

export function createMetadata({
  title,
  description = BASE_DESCRIPTION,
  path = '',
  image = OG_IMAGE,
}: {
  title: string;
  description?: string;
  path?: string;
  image?: string;
}): Metadata {
  const baseUrl = (process.env.NEXT_PUBLIC_SITE_URL ?? 'https://laceup.example.com').replace(/\/$/, '');
  const url = path ? `${baseUrl}${path}` : baseUrl;
  const imageUrl = !image || image.startsWith('http')
    ? image
    : baseUrl + (image.startsWith('/') ? image : `/${image}`);

  return {
    title: `${title} | ${SITE_NAME}`,
    description,
    openGraph: {
      title: `${title} | ${SITE_NAME}`,
      description,
      url,
      siteName: SITE_NAME,
      images: [{ url: imageUrl, width: 1200, height: 630, alt: SITE_NAME }],
      locale: 'ko_KR',
      type: 'website',
    },
    twitter: {
      card: 'summary_large_image',
      title: `${title} | ${SITE_NAME}`,
      description,
      images: [imageUrl],
    },
  };
}
