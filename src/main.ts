/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { cors: true });

  // Global validation pipe with automatic trimming
  app.useGlobalPipes(
    new ValidationPipe({
      transform: true,
      whitelist: true,
      forbidNonWhitelisted: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );

  const configService = app.get(ConfigService);
  const port = configService.get<number>('port') || 3000;

  const config = new DocumentBuilder()
    .setTitle('Computer Logs API')
    .setDescription('Kompyuter loglarini saqlash va olish API')
    .setVersion('1.0')
    .addBearerAuth()
    .build();

  const document = SwaggerModule.createDocument(app, config);
  SwaggerModule.setup('akaikumogo/secret/api', app, document);

  await app.listen(port);
  console.log(`🚀 Application is running on: http://45.138.158.151${port}`);
  console.log(`📚 Swagger documentation: http://45.138.158.151${port}/api`);
}
bootstrap();
