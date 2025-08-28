import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../guards/jwt-auth.guard';
import { RolesGuard } from '../guards/roles.guard';
import { Roles } from '../decorators/roles.decorator';
import { CurrentUser } from '../decorators/current-user.decorator';
import { UserRole } from '../entities/user.entity';

@ApiTags('Protected Routes Example')
@Controller('protected')
@UseGuards(JwtAuthGuard, RolesGuard)
export class ProtectedRouteExampleController {
  @Get('user-only')
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Route accessible to all authenticated users' })
  async userOnlyRoute(@CurrentUser() user: any) {
    return {
      message: 'This route is accessible to all authenticated users',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  @Get('hr-only')
  @Roles(UserRole.HR, UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Route accessible only to HR and Admin users' })
  async hrOnlyRoute(@CurrentUser() user: any) {
    return {
      message: 'This route is accessible only to HR and Admin users',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }

  @Get('admin-only')
  @Roles(UserRole.ADMIN)
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Route accessible only to Admin users' })
  async adminOnlyRoute(@CurrentUser() user: any) {
    return {
      message: 'This route is accessible only to Admin users',
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    };
  }
}

/*
Usage Examples:

1. Basic Authentication (JWT required):
   @UseGuards(JwtAuthGuard)
   @Get('profile')
   async getProfile(@CurrentUser() user: any) { ... }

2. Role-based Authorization:
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(UserRole.ADMIN)
   @Post('admin-action')
   async adminAction() { ... }

3. Multiple Roles:
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(UserRole.HR, UserRole.ADMIN)
   @Get('hr-data')
   async getHrData() { ... }

4. Combining Guards:
   @UseGuards(JwtAuthGuard, RolesGuard)
   @Roles(UserRole.ADMIN)
   @Delete('user/:id')
   async deleteUser(@Param('id') id: string) { ... }
*/
