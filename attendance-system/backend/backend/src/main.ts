// in backend/src/main.ts --- 完整修正版

import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common'; // <-- 1. 確定有導入 ValidationPipe
import { BooleanTransformInterceptor } from './common/interceptors/boolean-transform.interceptor';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);

  app.enableCors();
  
  // Register the boolean transform interceptor
  app.useGlobalInterceptors(new BooleanTransformInterceptor());

  // *** 我們要將這行程式碼加在這裡 ***
  // 在 app 監聽請求之前，註冊一個全域的 ValidationPipe
  app.useGlobalPipes(new ValidationPipe({
    transform: true, // 啟用自動型別轉換，這樣 @Transform 才會生效
    transformOptions: { enableImplicitConversion: true }, // 啟用隱式轉換
  }));

  await app.listen(3001);
}
bootstrap();