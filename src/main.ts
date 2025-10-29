process.env.TZ = 'Asia/Tashkent';
/* eslint-disable @typescript-eslint/no-floating-promises */
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { ConfigService } from '@nestjs/config';
import { ValidationPipe } from '@nestjs/common';
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const compression = require('compression');
// eslint-disable-next-line @typescript-eslint/no-require-imports, @typescript-eslint/no-unsafe-assignment
const helmet = require('helmet');

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    cors: {
      origin: '*', // Barcha origin'lardan ruxsat berish
      credentials: false, // credentials false bo'lishi kerak origin '*' bilan
      methods: '*', // Barcha metodlardan ruxsat
      allowedHeaders: '*', // Barcha header'lardan ruxsat
      exposedHeaders: '*', // Barcha exposed header'larga ruxsat
      preflightContinue: false,
      optionsSuccessStatus: 204,
    },
  });

  // Helmet sozlamalari CORS bilan ishlashi uchun
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(
    helmet({
      crossOriginEmbedderPolicy: false,
      crossOriginResourcePolicy: { policy: 'cross-origin' },
      contentSecurityPolicy: false, // CORS bilan muammo bo'lsa, false qilish mumkin
    }),
  );

  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use(compression({ threshold: 1024 }));

  // Disable ETag and set global no-cache headers to avoid 304
  // eslint-disable-next-line @typescript-eslint/no-unsafe-call
  app.use((req, res, next) => {
    // Disable etag generation
    // @ts-ignore
    res.app.set('etag', false);
    res.setHeader('Cache-Control', 'no-cache, no-store, must-revalidate');
    res.setHeader('Pragma', 'no-cache');
    res.setHeader('Expires', '0');
    next();
  });

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
  console.log(`🚀 Application is running on: http://localhost:${port}`);
  console.log(`📚 Swagger documentation: http://localhost:${port}/api`);
}
bootstrap();
