import { Logger, ValidationPipe } from '@nestjs/common';
import { NestFactory } from '@nestjs/core';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { AppModule } from './app.module';

async function bootstrap() {
  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter(),
  );
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: true,
      transform: true,
    }),
  );

  const swaggerConfig = new DocumentBuilder()
    .setTitle('Taskflow API')
    .setDescription(
      'Jira-lite backend: projects, tasks, workflow, comments, activity logs. ' +
        'Use **Authorize** with a JWT from `POST /auth/register` or `POST /auth/login`.',
    )
    .setVersion('1.0')
    .addBearerAuth(
      { type: 'http', scheme: 'bearer', bearerFormat: 'JWT' },
      'access-token',
    )
    .build();
  const document = SwaggerModule.createDocument(app, swaggerConfig);
  SwaggerModule.setup('api', app, document, {
    customSiteTitle: 'Taskflow API',
    jsonDocumentUrl: '/openapi.json',
    swaggerOptions: {
      persistAuthorization: true,
      displayRequestDuration: true,
    },
  });

  const fastify = app.getHttpAdapter().getInstance();
  fastify.get('/', async (_req, reply) => reply.redirect('/api'));
  fastify.get('/docs', async (_req, reply) => reply.redirect('/api'));

  const port = Number(process.env.PORT ?? 3000);
  const host = '0.0.0.0';
  await app.listen(port, host);

  const open = host === '0.0.0.0' ? 'localhost' : host;
  Logger.log(`Swagger UI: http://${open}:${port}/api `);

}

void bootstrap();
