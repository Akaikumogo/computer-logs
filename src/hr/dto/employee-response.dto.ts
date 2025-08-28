import { ApiProperty } from '@nestjs/swagger';

export class EmployeeResponseDto {
  @ApiProperty()
  _id: string;

  @ApiProperty()
  fullName: string;

  @ApiProperty()
  position: string;

  @ApiProperty()
  department: string;

  @ApiProperty({ required: false })
  hireDate?: Date;

  @ApiProperty({ required: false })
  birthDate?: Date;

  @ApiProperty({ required: false })
  passportId?: string;

  @ApiProperty({ type: [String] })
  phones: string[];

  @ApiProperty()
  email: string;

  @ApiProperty({ required: false })
  address?: string;

  @ApiProperty({ required: false })
  salary?: number;

  @ApiProperty()
  status: 'active' | 'inactive';

  @ApiProperty({ type: [String], required: false })
  files?: string[];

  @ApiProperty()
  isDeleted: boolean;

  @ApiProperty({ required: false })
  deletedAt?: Date;

  @ApiProperty({ required: false })
  primaryWorkplaceId?: string;

  @ApiProperty({ required: false })
  userId?: string;

  @ApiProperty({ required: false })
  username?: string;

  @ApiProperty({ required: false })
  tempPassword?: string;

  @ApiProperty()
  createdAt: Date;

  @ApiProperty()
  updatedAt: Date;

  @ApiProperty({ required: false })
  userAccount?: {
    username: string;
    password: string;
    message: string;
  };
}
