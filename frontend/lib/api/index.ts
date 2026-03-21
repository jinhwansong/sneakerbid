import { auth } from './auth';
import { admin } from './admin';
import { auctions } from './auctions';
import { orders } from './orders';
import { users } from './users';
import { wishlist } from './wishlist';
import { apiClient } from './client';

export const api = {
  auth,
  admin,
  auctions,
  orders,
  users,
  wishlist,

  /** 이미지 업로드 (FormData). 반환: { url: string } */
  uploadImage: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.postForm<{ url: string }>('/upload/image', formData);
  },

  /** 이미지 삭제 (orphan 정리용). url은 uploadImage 반환값 */
  deleteImage: (url: string) =>
    apiClient.post<{ ok: boolean }>('/upload/delete', { url }),
};
