import { Test, TestingModule } from '@nestjs/testing';
import { LeaveTypesController } from './leave-types.controller';
import { LeaveTypesService } from './leave-types.service';
import { CreateLeaveTypeDto, UpdateLeaveTypeDto } from './dto/leave-type.dto';

const mockLeaveTypesService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
};

describe('LeaveTypesController', () => {
  let controller: LeaveTypesController;
  let service: LeaveTypesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [LeaveTypesController],
      providers: [{ provide: LeaveTypesService, useValue: mockLeaveTypesService }],
    }).compile();

    controller = module.get<LeaveTypesController>(LeaveTypesController);
    service = module.get<LeaveTypesService>(LeaveTypesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAll delegates to the service', () => {
    const expected = [{ id: 1, name: 'Sick Leave' }];
    mockLeaveTypesService.findAll.mockReturnValue(expected);

    const result = controller.findAll();

    expect(service.findAll).toHaveBeenCalled();
    expect(result).toEqual(expected);
  });

  it('create delegates to the service with the dto', () => {
    const dto: CreateLeaveTypeDto = { name: 'Sick Leave' };
    const expected = { id: 1, ...dto };
    mockLeaveTypesService.create.mockReturnValue(expected);

    const result = controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('update delegates to the service with numeric id and dto', () => {
    const dto: UpdateLeaveTypeDto = { name: 'Personal Leave' };
    const expected = { id: 1, ...dto };
    mockLeaveTypesService.update.mockReturnValue(expected);

    const result = controller.update('1', dto);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(expected);
  });

  it('remove delegates to the service with numeric id', () => {
    const expected = { id: 1 };
    mockLeaveTypesService.remove.mockReturnValue(expected);

    const result = controller.remove('1');

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });
});
