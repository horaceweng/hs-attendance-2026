import { ClassAccessGuard } from './class-access.guard';

// Provide a minimal mock PrismaService for the guard constructor in tests
const mockPrismaService = {} as any;

describe('ClassAccessGuard', () => {
  it('should be defined', () => {
    expect(new ClassAccessGuard(mockPrismaService)).toBeDefined();
  });
});
