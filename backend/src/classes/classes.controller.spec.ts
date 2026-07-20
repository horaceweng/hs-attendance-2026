import { Test, TestingModule } from '@nestjs/testing';
import { ClassesController } from './classes.controller';
import { ClassesService } from './classes.service';
import { CreateClassDto, UpdateClassDto } from './dto/class.dto';
import { AssignTeacherDto } from './dto/assign-teacher.dto';

const mockClassesService = {
  findAll: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getClassTeachers: jest.fn(),
  assignTeacher: jest.fn(),
};

describe('ClassesController', () => {
  let controller: ClassesController;
  let service: ClassesService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [ClassesController],
      providers: [{ provide: ClassesService, useValue: mockClassesService }],
    }).compile();

    controller = module.get<ClassesController>(ClassesController);
    service = module.get<ClassesService>(ClassesService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  const user = { userId: 1, role: 'GA_specialist' };

  it('findAll delegates to the service with req.user', () => {
    const req = { user };
    const expected = [{ id: 1, name: '1A' }];
    mockClassesService.findAll.mockReturnValue(expected);

    const result = controller.findAll(req);

    expect(service.findAll).toHaveBeenCalledWith(user);
    expect(result).toEqual(expected);
  });

  it('create delegates to the service with dto and req.user', () => {
    const dto: CreateClassDto = { name: '1A' };
    const req = { user };
    const expected = { id: 1, ...dto };
    mockClassesService.create.mockReturnValue(expected);

    const result = controller.create(dto, req);

    expect(service.create).toHaveBeenCalledWith(dto, user);
    expect(result).toEqual(expected);
  });

  it('update delegates to the service with numeric id, dto, and req.user', () => {
    const dto: UpdateClassDto = { name: '1B' };
    const req = { user };
    const expected = { id: 3, ...dto };
    mockClassesService.update.mockReturnValue(expected);

    const result = controller.update('3', dto, req);

    expect(service.update).toHaveBeenCalledWith(3, dto, user);
    expect(result).toEqual(expected);
  });

  it('remove delegates to the service with numeric id and req.user', () => {
    const req = { user };
    const expected = { id: 3 };
    mockClassesService.remove.mockReturnValue(expected);

    const result = controller.remove('3', req);

    expect(service.remove).toHaveBeenCalledWith(3, user);
    expect(result).toEqual(expected);
  });

  it('getClassTeachers delegates to the service with numeric id and req.user', () => {
    const req = { user };
    const expected = [{ teacherId: 5 }];
    mockClassesService.getClassTeachers.mockReturnValue(expected);

    const result = controller.getClassTeachers('3', req);

    expect(service.getClassTeachers).toHaveBeenCalledWith(3, user);
    expect(result).toEqual(expected);
  });

  it('assignTeacher delegates to the service with dto and req.user', () => {
    const dto: AssignTeacherDto = { classId: 1, teacherId: 2, schoolYear: '2026' };
    const req = { user };
    const expected = { id: 1, ...dto };
    mockClassesService.assignTeacher.mockReturnValue(expected);

    const result = controller.assignTeacher(dto, req);

    expect(service.assignTeacher).toHaveBeenCalledWith(dto, user);
    expect(result).toEqual(expected);
  });
});
