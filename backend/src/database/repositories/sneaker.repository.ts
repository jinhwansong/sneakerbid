import { Injectable } from '@nestjs/common';
import { DatabaseService } from '@/database/database.service';

export interface SneakerSeedInsert {
  id: string;
  modelName: string;
  brand: string;
  colorway: string | null;
  description: string | null;
  imageUrl: string;
  styleCode: string;
}

@Injectable()
export class SneakerRepository {
  constructor(private readonly db: DatabaseService) {}

  async findIdByStyleCode(styleCode: string): Promise<string | null> {
    const rows = await this.db.query<{ id: string }>(
      `SELECT id FROM "Sneaker" WHERE "styleCode" = $1 LIMIT 1`,
      [styleCode],
    );
    return rows[0]?.id ?? null;
  }

  async insertSeedRow(row: SneakerSeedInsert): Promise<void> {
    await this.db.query(
      `INSERT INTO "Sneaker" (id, "modelName", brand, colorway, description, "imageUrl", "popularityScore", "styleCode", "createdAt", "updatedAt")
       VALUES ($1, $2, $3, $4, $5, $6, 100, $7, CURRENT_TIMESTAMP, CURRENT_TIMESTAMP)`,
      [
        row.id,
        row.modelName,
        row.brand,
        row.colorway,
        row.description,
        row.imageUrl,
        row.styleCode,
      ],
    );
  }
}
