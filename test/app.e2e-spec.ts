import { Test, TestingModule } from '@nestjs/testing';
import { ValidationPipe } from '@nestjs/common';
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify';
import * as request from 'supertest';
import { AppModule } from './../src/app.module';

describe('Taskflow API (e2e)', () => {
  let app: NestFastifyApplication;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication<NestFastifyApplication>(
      new FastifyAdapter(),
    );
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    await app.init();
    await app.getHttpAdapter().getInstance().ready();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /auth/register returns JWT', () => {
    const email = `e2e-${Date.now()}@example.com`;
    return request(app.getHttpServer())
      .post('/auth/register')
      .send({
        email,
        password: 'password123',
        fullName: 'E2E User',
      })
      .expect(201)
      .expect((res) => {
        const body = res.body as {
          access_token?: string;
          user?: { email: string };
        };
        expect(body.access_token).toBeDefined();
        expect(body.user?.email).toBe(email);
      });
  });
});
