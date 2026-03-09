import { plainToInstance } from 'class-transformer';
import {
  IsEnum,
  IsNumber,
  IsString,
  validateSync,
  Min,
  Max,
} from 'class-validator';

enum Environment {
  Development = 'development',
  Production = 'production',
  Test = 'test',
}

class EnvironmentVariables {
  @IsEnum(Environment)
  NODE_ENV: Environment = Environment.Development;

  @IsNumber()
  @Min(1)
  @Max(65535)
  PORT: number = Number(process.env.PORT);

  @IsString()
  APP_NAME: string = process.env.APP_NAME;

  @IsString()
  APP_VERSION: string = '1.0.0';

  // CORS
  @IsString()
  CORS_ORIGIN: string;

  // Rate Limiting
  @IsNumber()
  @Min(1)
  THROTTLE_TTL: number = 60;

  @IsNumber()
  @Min(1)
  THROTTLE_LIMIT: number = 100;

  // Database (Supabase)
  @IsString()
  SUPABASE_URL: string = process.env.SUPABASE_URL ?? '';

  @IsString()
  SUPABASE_SERVICE_ROLE_KEY: string =
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? '';

  @IsString()
  DATABASE_URL: string = process.env.DATABASE_URL ?? '';
}

export function validate(config: Record<string, unknown>) {
  // CORS_ORIGIN이 없으면 FRONTEND_URL 사용 (env 키 불일치 대응)
  const corsOrigin =
    config.CORS_ORIGIN ?? config.FRONTEND_URL ?? process.env.FRONTEND_URL;
  if (corsOrigin) {
    config = { ...config, CORS_ORIGIN: corsOrigin };
  }
  const validatedConfig = plainToInstance(EnvironmentVariables, config, {
    enableImplicitConversion: true,
  });

  const errors = validateSync(validatedConfig, {
    skipMissingProperties: false,
  });

  if (errors.length > 0) {
    throw new Error(errors.toString());
  }

  return validatedConfig;
}
