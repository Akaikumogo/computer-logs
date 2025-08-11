import { Test, TestingModule } from '@nestjs/testing';
import { ComputersController } from './computers.controller';

describe('ComputersController', () => {
  let controller: ComputersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ComputersController],
    }).compile();

    controller = module.get<ComputersController>(ComputersController);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });
});
