import { Test, TestingModule } from '@nestjs/testing';
import { StudentsController } from './students.controller';
import { StudentsService } from './students.service';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStudentDto, UpdateStudentDto } from './dto/student.dto';
import { CreateStudentEnrollmentDto, UpdateStudentEnrollmentDto } from './dto/student-enrollment.dto';
import { Gender, StudentStatus } from '@prisma/client';

// StudentsController 的 'class/:classId' 路由使用 ClassAccessGuard，
// 其建構子需要 PrismaService，因此提供最小 mock 讓 Nest 能解析。
const mockPrismaService = {} as any;

const mockStudentsService = {
  findAllByClass: jest.fn(),
  findAll: jest.fn(),
  findOne: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  remove: jest.fn(),
  getStudentEnrollments: jest.fn(),
  createStudentEnrollment: jest.fn(),
  updateStudentEnrollment: jest.fn(),
  removeStudentEnrollment: jest.fn(),
};

describe('StudentsController', () => {
  let controller: StudentsController;
  let service: StudentsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [StudentsController],
      providers: [
        { provide: StudentsService, useValue: mockStudentsService },
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    controller = module.get<StudentsController>(StudentsController);
    service = module.get<StudentsService>(StudentsService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  it('findAllByClass delegates to the service with the classId', () => {
    const expected = [{ id: 1, name: 'Alice' }];
    mockStudentsService.findAllByClass.mockReturnValue(expected);

    const result = controller.findAllByClass(1);

    expect(service.findAllByClass).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });

  it('findAll delegates to the service with status/includeEnrollments filters', () => {
    const expected = [{ id: 1, name: 'Alice' }];
    mockStudentsService.findAll.mockReturnValue(expected);

    const result = controller.findAll('active', true);

    expect(service.findAll).toHaveBeenCalledWith('active', true);
    expect(result).toEqual(expected);
  });

  it('findOne delegates to the service with the numeric id', () => {
    const expected = { id: 1, name: 'Alice' };
    mockStudentsService.findOne.mockReturnValue(expected);

    const result = controller.findOne(1);

    expect(service.findOne).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });

  it('create delegates to the service with the dto', () => {
    const dto: CreateStudentDto = {
      studentId: 'S001',
      name: 'Alice',
      birthday: '2015-01-01',
      gender: Gender.female,
      status: StudentStatus.active,
      enrollmentDate: '2026-09-01',
    };
    const expected = { id: 1, ...dto };
    mockStudentsService.create.mockReturnValue(expected);

    const result = controller.create(dto);

    expect(service.create).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('update delegates to the service with the numeric id and dto', () => {
    const dto: UpdateStudentDto = {
      name: 'Alice Updated',
      birthday: '2015-01-01',
      gender: Gender.female,
      status: StudentStatus.active,
      enrollmentDate: '2026-09-01',
    };
    const expected = { id: 1, ...dto };
    mockStudentsService.update.mockReturnValue(expected);

    const result = controller.update(1, dto);

    expect(service.update).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(expected);
  });

  it('remove delegates to the service with the numeric id', () => {
    const expected = { id: 1 };
    mockStudentsService.remove.mockReturnValue(expected);

    const result = controller.remove(1);

    expect(service.remove).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });

  it('getStudentEnrollments delegates to the service with the numeric id', () => {
    const expected = [{ id: 1, classId: 2 }];
    mockStudentsService.getStudentEnrollments.mockReturnValue(expected);

    const result = controller.getStudentEnrollments(1);

    expect(service.getStudentEnrollments).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });

  it('createStudentEnrollment delegates to the service with the dto', () => {
    const dto: CreateStudentEnrollmentDto = { studentId: 1, classId: 2, schoolYear: 2026 };
    const expected = { id: 1, ...dto };
    mockStudentsService.createStudentEnrollment.mockReturnValue(expected);

    const result = controller.createStudentEnrollment(dto);

    expect(service.createStudentEnrollment).toHaveBeenCalledWith(dto);
    expect(result).toEqual(expected);
  });

  it('updateStudentEnrollment delegates to the service with numeric id and dto', () => {
    const dto: UpdateStudentEnrollmentDto = { classId: 2, schoolYear: 2026 };
    const expected = { id: 1, ...dto };
    mockStudentsService.updateStudentEnrollment.mockReturnValue(expected);

    const result = controller.updateStudentEnrollment(1, dto);

    expect(service.updateStudentEnrollment).toHaveBeenCalledWith(1, dto);
    expect(result).toEqual(expected);
  });

  it('removeStudentEnrollment delegates to the service with the numeric id', () => {
    const expected = { id: 1 };
    mockStudentsService.removeStudentEnrollment.mockReturnValue(expected);

    const result = controller.removeStudentEnrollment(1);

    expect(service.removeStudentEnrollment).toHaveBeenCalledWith(1);
    expect(result).toEqual(expected);
  });
});
