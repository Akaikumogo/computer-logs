import { ApiProperty } from '@nestjs/swagger';
import { EmployeeResponseDto } from './employee-response.dto';

export class PaginationMetaDto {
  @ApiProperty({
    description: 'Total number of employees matching the filters',
    example: 150,
  })
  total: number;

  @ApiProperty({
    description: 'Current page number',
    example: 1,
  })
  page: number;

  @ApiProperty({
    description: 'Number of items per page',
    example: 20,
  })
  limit: number;

  @ApiProperty({
    description: 'Total number of pages',
    example: 8,
  })
  pages: number;

  @ApiProperty({
    description: 'Number of items on current page',
    example: 20,
  })
  count: number;

  @ApiProperty({
    description: 'Whether there is a next page',
    example: true,
  })
  hasNext: boolean;

  @ApiProperty({
    description: 'Whether there is a previous page',
    example: false,
  })
  hasPrev: boolean;
}

export class EmployeeListResponseDto {
  @ApiProperty({
    description: 'Array of employees matching the filters',
    type: [EmployeeResponseDto],
  })
  data: EmployeeResponseDto[];

  @ApiProperty({
    description: 'Pagination metadata',
    type: PaginationMetaDto,
  })
  meta: PaginationMetaDto;

  @ApiProperty({
    description: 'Applied filters summary',
    example: {
      status: 'active',
      department: 'IT Department',
      search: 'developer',
    },
  })
  filters: Record<string, any>;
}
