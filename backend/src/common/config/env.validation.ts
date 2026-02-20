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
  CORS_ORIGIN: string = process.env.FRONTEND_URL;

  // Rate Limiting
  @IsNumber()
  @Min(1)
  THROTTLE_TTL: number = 60;

  @IsNumber()
  @Min(1)
  THROTTLE_LIMIT: number = 100;
}

export function validate(config: Record<string, unknown>) {
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
