import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { MongooseModule } from '@nestjs/mongoose';
import { JwtService } from '@nestjs/jwt';
import { Model } from 'mongoose';
import { getModelToken } from '@nestjs/mongoose';
import * as request from 'supertest';

export class TestUtils {
  static async createTestApp(module: any): Promise<INestApplication> {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: '.env.test',
        }),
        MongooseModule.forRoot(
          process.env.MONGODB_TEST_URI || 'mongodb://localhost:27017/test',
        ),
        module,
      ],
    }).compile();

    const app = moduleFixture.createNestApplication();
    await app.init();
    return app;
  }

  static async cleanupDatabase(
    app: INestApplication,
    models: string[],
  ): Promise<void> {
    for (const modelName of models) {
      const model = app.get<Model<any>>(getModelToken(modelName));
      await model.deleteMany({});
    }
  }

  static generateTestUser(overrides: Partial<any> = {}) {
    return {
      username: 'testuser',
      email: 'test@example.com',
      password: 'TestPassword123!',
      firstName: 'Test',
      lastName: 'User',
      phone: '+1234567890',
      role: 'EMPLOYEE',
      isActive: true,
      ...overrides,
    };
  }

  static generateTestEmployee(overrides: Partial<any> = {}) {
    return {
      employeeId: 'EMP001',
      firstName: 'Test',
      lastName: 'Employee',
      email: 'employee@example.com',
      phone: '+1234567890',
      department: 'IT',
      position: 'Developer',
      hireDate: new Date(),
      isActive: true,
      ...overrides,
    };
  }

  static async authenticateUser(
    app: INestApplication,
    userData: any,
  ): Promise<string> {
    const response = await request(app.getHttpServer())
      .post('/auth/login')
      .send({
        username: userData.username,
        password: userData.password,
      });

    return response.body.access_token;
  }

  static createAuthHeaders(token: string) {
    return {
      Authorization: `Bearer ${token}`,
    };
  }

  static async waitForCondition(
    condition: () => Promise<boolean>,
    timeout: number = 5000,
    interval: number = 100,
  ): Promise<void> {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      if (await condition()) {
        return;
      }
      await new Promise((resolve) => setTimeout(resolve, interval));
    }

    throw new Error(`Condition not met within ${timeout}ms`);
  }
}
