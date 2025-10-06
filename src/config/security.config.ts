import { ConfigService } from '@nestjs/config';

export const securityConfig = (configService: ConfigService) => ({
  // Rate limiting configuration
  rateLimit: {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: configService.get('RATE_LIMIT_MAX', 100), // limit each IP to 100 requests per windowMs
    message: 'Too many requests from this IP, please try again later.',
    standardHeaders: true,
    legacyHeaders: false,
  },

  // CORS configuration
  cors: {
    origin: configService.get('CORS_ORIGIN', 'http://45.138.158.1515173'),
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
  },

  // Helmet security headers
  helmet: {
    contentSecurityPolicy: {
      directives: {
        defaultSrc: ["'self'"],
        styleSrc: ["'self'", "'unsafe-inline'"],
        scriptSrc: ["'self'"],
        imgSrc: ["'self'", 'data:', 'https:'],
      },
    },
    crossOriginEmbedderPolicy: false,
  },

  // JWT configuration
  jwt: {
    secret: configService.get('JWT_SECRET'),
    expiresIn: configService.get('JWT_EXPIRES_IN', '24h'),
    refreshSecret: configService.get('JWT_REFRESH_SECRET'),
    refreshExpiresIn: configService.get('JWT_REFRESH_EXPIRES_IN', '7d'),
  },

  // Password policy
  passwordPolicy: {
    minLength: 8,
    requireUppercase: true,
    requireLowercase: true,
    requireNumbers: true,
    requireSpecialChars: true,
    maxAttempts: 5,
    lockoutTime: 15 * 60 * 1000, // 15 minutes
  },

  // Session configuration
  session: {
    secret: configService.get('SESSION_SECRET'),
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: configService.get('NODE_ENV') === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000, // 24 hours
    },
  },
});
