import { Module, OnModuleInit, Inject, Logger } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { MongooseModule, getConnectionToken } from '@nestjs/mongoose';
import { ConfigModule, ConfigService } from '@nestjs/config';
import { Connection } from 'mongoose';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { LocalStrategy } from './strategies/local.strategy';
import { User, UserSchema } from './entities/user.entity';
import { SeedSuperAdminService } from './seed-super-admin';

@Module({
  imports: [
    PassportModule,
    MongooseModule.forFeature([{ name: User.name, schema: UserSchema }]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET') || 'your-secret-key',
        signOptions: { expiresIn: '24h' },
      }),
      inject: [ConfigService],
    }),
  ],
  controllers: [AuthController],
  providers: [AuthService, JwtStrategy, LocalStrategy, SeedSuperAdminService],
  exports: [AuthService, SeedSuperAdminService],
})
export class AuthModule implements OnModuleInit {
  private readonly logger = new Logger(AuthModule.name);

  constructor(
    private readonly seedSuperAdminService: SeedSuperAdminService,
    @Inject(getConnectionToken()) private readonly connection: Connection,
  ) {}

  async onModuleInit() {
    // Create super admin account when module initializes
    await this.seedSuperAdminService.seedSuperAdmin();

    // Fix email index issue - make it sparse to allow multiple null values
    try {
      const db = this.connection.db;
      if (!db) {
        this.logger.warn(
          'Database connection not available, skipping email index fix',
        );
        return;
      }
      const usersCollection = db.collection('users');

      // Check if email_1 index exists and drop it if not sparse
      const indexes = await usersCollection.indexes();
      const emailIndex = indexes.find((idx) => idx.name === 'email_1');

      if (emailIndex) {
        // If index exists but is not sparse, drop and recreate as sparse
        if (!emailIndex.sparse) {
          this.logger.log(
            'Fixing email index: dropping non-sparse email_1 index...',
          );
          await usersCollection.dropIndex('email_1');
          await usersCollection.createIndex(
            { email: 1 },
            { unique: true, sparse: true },
          );
          this.logger.log(
            'Email index fixed: now sparse and allows multiple null values',
          );
        } else {
          this.logger.log('Email index is already sparse, no action needed');
        }
      } else {
        // Create sparse index if it doesn't exist
        await usersCollection.createIndex(
          { email: 1 },
          { unique: true, sparse: true },
        );
        this.logger.log('Email index created as sparse');
      }
    } catch (error) {
      // Ignore errors - might be connection issues or index already exists
      this.logger.warn(`Could not fix email index: ${error.message}`);
    }
  }
}
