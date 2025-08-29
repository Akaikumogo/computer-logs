import { ApiProperty } from '@nestjs/swagger';

export class DepartmentStatsDto {
  @ApiProperty({
    description: 'Department name',
    example: 'IT Department',
  })
  department: string;

  @ApiProperty({
    description: 'Total employees in department',
    example: 25,
  })
  totalEmployees: number;

  @ApiProperty({
    description: 'Active employees in department',
    example: 23,
  })
  activeEmployees: number;

  @ApiProperty({
    description: 'Inactive employees in department',
    example: 2,
  })
  inactiveEmployees: number;

  @ApiProperty({
    description: 'Average salary in department',
    example: 1500,
  })
  averageSalary: number;
}

export class PositionStatsDto {
  @ApiProperty({
    description: 'Position title',
    example: 'Frontend Developer',
  })
  position: string;

  @ApiProperty({
    description: 'Number of employees in this position',
    example: 8,
  })
  count: number;

  @ApiProperty({
    description: 'Average salary for this position',
    example: 1800,
  })
  averageSalary: number;
}

export class HrStatisticsDto {
  @ApiProperty({
    description: 'Total number of employees',
    example: 150,
  })
  totalEmployees: number;

  @ApiProperty({
    description: 'Active employees count',
    example: 142,
  })
  activeEmployees: number;

  @ApiProperty({
    description: 'Inactive employees count',
    example: 8,
  })
  inactiveEmployees: number;

  @ApiProperty({
    description: 'Soft-deleted employees count',
    example: 5,
  })
  deletedEmployees: number;

  @ApiProperty({
    description: 'Employees with user accounts',
    example: 135,
  })
  employeesWithAccounts: number;

  @ApiProperty({
    description: 'Employees without user accounts',
    example: 15,
  })
  employeesWithoutAccounts: number;

  @ApiProperty({
    description: 'Employees with assigned workplaces',
    example: 120,
  })
  employeesWithWorkplaces: number;

  @ApiProperty({
    description: 'Employees without assigned workplaces',
    example: 30,
  })
  employeesWithoutWorkplaces: number;

  @ApiProperty({
    description: 'Total departments',
    example: 12,
  })
  totalDepartments: number;

  @ApiProperty({
    description: 'Total positions',
    example: 25,
  })
  totalPositions: number;

  @ApiProperty({
    description: 'Average salary across all employees',
    example: 1650,
  })
  averageSalary: number;

  @ApiProperty({
    description: 'Total salary budget',
    example: 247500,
  })
  totalSalaryBudget: number;

  @ApiProperty({
    description: 'Department breakdown statistics',
    type: [DepartmentStatsDto],
  })
  departmentStats: DepartmentStatsDto[];

  @ApiProperty({
    description: 'Top positions by employee count',
    type: [PositionStatsDto],
  })
  topPositions: PositionStatsDto[];

  @ApiProperty({
    description: 'Recent hires (last 30 days)',
    example: 8,
  })
  recentHires: number;

  @ApiProperty({
    description: 'Employees with temporary passwords',
    example: 12,
  })
  employeesWithTempPasswords: number;
}
