import { Test, TestingModule } from '@nestjs/testing';
import { AcademicService } from './academic.service';
import { PrismaService } from '../prisma/prisma.service';

const mockPrismaService = {
  academicYear: {
    findMany: jest.fn(),
  },
};

describe('AcademicService', () => {
  let service: AcademicService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        AcademicService,
        { provide: PrismaService, useValue: mockPrismaService },
      ],
    }).compile();

    service = module.get<AcademicService>(AcademicService);

    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  const makeYear = (overrides: { id: number; year: number; startDate: Date; endDate: Date }) => ({
    name: `${overrides.year} 學年`,
    isActive: false,
    createdAt: new Date('2020-01-01'),
    updatedAt: new Date('2020-01-01'),
    ...overrides,
  });

  const years = [
    makeYear({ id: 2, year: 2026, startDate: new Date('2026-08-01'), endDate: new Date('2027-07-31') }),
    makeYear({ id: 1, year: 2025, startDate: new Date('2025-08-01'), endDate: new Date('2026-07-31') }),
  ];

  describe('getAcademicYearForDate', () => {
    it('回傳涵蓋指定日期的學年（使用傳入的快取，不查詢資料庫）', async () => {
      const result = await service.getAcademicYearForDate(new Date('2026-01-15'), years);

      expect(result).toEqual(years[1]); // 2025 學年涵蓋到 2026-07-31
      expect(mockPrismaService.academicYear.findMany).not.toHaveBeenCalled();
    });

    it('當日期落在兩個學年之間的斷檔時，回傳 null', async () => {
      const gappedYears = [
        makeYear({ id: 1, year: 2024, startDate: new Date('2024-08-01'), endDate: new Date('2024-12-31') }),
        makeYear({ id: 2, year: 2025, startDate: new Date('2025-08-01'), endDate: new Date('2026-07-31') }),
      ];

      const result = await service.getAcademicYearForDate(new Date('2025-03-01'), gappedYears);

      expect(result).toBeNull();
    });

    it('沒有提供快取時，會透過 buildAcademicYearLookup 即時查詢資料庫', async () => {
      mockPrismaService.academicYear.findMany.mockResolvedValue(years);

      const result = await service.getAcademicYearForDate(new Date('2026-01-15'));

      expect(mockPrismaService.academicYear.findMany).toHaveBeenCalledTimes(1);
      expect(result).toEqual(years[1]);
    });
  });

  describe('resolveEnrollment', () => {
    it('找到對應學年的 enrollment 時直接回傳', async () => {
      const student = {
        enrollments: [
          { schoolYear: 2024, createdAt: new Date('2024-08-01') },
          { schoolYear: 2025, createdAt: new Date('2025-08-01') },
        ],
      };

      const result = await service.resolveEnrollment(student, new Date('2026-01-15'), years);

      expect(result).toEqual(student.enrollments[1]); // schoolYear 2025 對應涵蓋該日期的學年
    });

    it('fallback：找不到學年時（斷檔），改用 createdAt 最新的 enrollment', async () => {
      const gappedYears = [
        makeYear({ id: 1, year: 2024, startDate: new Date('2024-08-01'), endDate: new Date('2024-12-31') }),
      ];
      const student = {
        enrollments: [
          { schoolYear: 1, createdAt: new Date('2024-01-01') },
          { schoolYear: 2, createdAt: new Date('2025-06-01') }, // 最新
        ],
      };

      const result = await service.resolveEnrollment(student, new Date('2025-03-01'), gappedYears);

      expect(result).toEqual(student.enrollments[1]);
    });

    it('fallback：找到學年但沒有符合 schoolYear 的 enrollment 時，改用 createdAt 最新的一筆', async () => {
      const student = {
        enrollments: [
          { schoolYear: 1999, createdAt: new Date('2020-01-01') },
          { schoolYear: 2000, createdAt: new Date('2021-01-01') }, // 最新
        ],
      };

      const result = await service.resolveEnrollment(student, new Date('2026-01-15'), years);

      expect(result).toEqual(student.enrollments[1]);
    });

    it('學生完全沒有任何註冊紀錄時回傳 null', async () => {
      const student = { enrollments: [] };

      const result = await service.resolveEnrollment(student, new Date('2026-01-15'), years);

      expect(result).toBeNull();
    });
  });
});
