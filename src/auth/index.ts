// Entities
export {
  User,
  UserDocument,
  UserRole,
  UserSchema,
} from './entities/user.entity';

// DTOs
export { LoginDto, RegisterDto, AuthResponseDto } from './dto/auth.dto';

// Guards
export { JwtAuthGuard } from './guards/jwt-auth.guard';
export { LocalAuthGuard } from './guards/local-auth.guard';
export { RolesGuard } from './guards/roles.guard';

// Decorators
export { Roles } from './decorators/roles.decorator';
export { CurrentUser } from './decorators/current-user.decorator';

// Strategies
export { JwtStrategy } from './strategies/jwt.strategy';
export { LocalStrategy } from './strategies/local.strategy';

// Services
export { AuthService } from './auth.service';

// Module
export { AuthModule } from './auth.module';
