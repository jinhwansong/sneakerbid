/** multer memoryStorage 업로드 파일 (buffer 포함) */
export interface MemoryMulterFile {
  fieldname: string;
  originalname: string;
  encoding: string;
  mimetype: string;
  size: number;
  buffer: Buffer;
}

/** upload.service 전용 - upload.types와 동일 구조  */
export interface UploadFile {
  buffer: Buffer;
  mimetype: string;
  size: number;
  originalname: string;
}
