import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { BooleanTransformInterceptor } from './common/interceptors/boolean-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  // CORS 允許清單:讀取 FRONTEND_URL(逗號分隔多來源),未設定時預設本機開發前端
  const allowedOrigins = (process.env.FRONTEND_URL ?? 'http://localhost:5173')
    .split(',')
    .map((origin) => origin.trim())
    .filter((origin) => origin.length > 0);

  app.enableCors({
    origin: allowedOrigins,
    credentials: true,
  });

  // 註冊全域的 boolean 轉換攔截器
  app.useGlobalInterceptors(new BooleanTransformInterceptor());

  // 註冊全域的 ValidationPipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 啟用自動型別轉換,這樣 @Transform 才會生效
    transformOptions: { enableImplicitConversion: true }, // 啟用隱式轉換
    whitelist: true, // 自動剔除 DTO 未宣告的欄位(暫不啟用 forbidNonWhitelisted,避免既有前端多送欄位時直接 400)
  }));

  await app.listen(3001);
}
bootstrap();
