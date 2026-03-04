/** multer memoryStorage 업로드 파일 (buffer 포함) */
export interface MemoryMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}
