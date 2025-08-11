import { Test, TestingModule } from '@nestjs/testing';
import { ComputersService } from './computers.service';

describe('ComputersService', () => {
  let service: ComputersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ComputersService],
    }).compile();

    service = module.get<ComputersService>(ComputersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });
});
