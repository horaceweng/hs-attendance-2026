// api.ts 內部的 buildQueryParams 是 #21 修復過的邏輯：
// 0、false 是「有效值」必須保留，undefined/null/空字串代表「未提供該篩選條件」必須排除。
// buildQueryParams 本身未 export，這裡透過會呼叫它的公開函式（getStatisticsReport /
// getStudents / getAttendanceReport）間接驗證其行為，並用 mock 掉的 axios client
// 攔截實際送出的查詢字串。
import { describe, it, expect, beforeEach, vi } from 'vitest';
import type { StatisticsReportParams, GetStudentsParams, AttendanceReportParams } from '../types/api-requests';

const { mockGet, mockCreate } = vi.hoisted(() => {
  const mockGet = vi.fn(() => Promise.resolve({ data: [] }));
  const mockCreate = vi.fn(() => ({
    get: mockGet,
    post: vi.fn(() => Promise.resolve({ data: {} })),
    put: vi.fn(() => Promise.resolve({ data: {} })),
    delete: vi.fn(() => Promise.resolve({ data: {} })),
    patch: vi.fn(() => Promise.resolve({ data: {} })),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }));
  return { mockGet, mockCreate };
});

vi.mock('axios', () => ({
  default: { create: mockCreate },
}));

// vi.mock 會被 vitest 提升到檔案最頂端執行，因此下方 import 拿到的 axios 已是 mock 版本
import { getStatisticsReport, getStudents, getAttendanceReport } from './api';

function parseCalledQuery(): URLSearchParams {
  const calledUrl = mockGet.mock.calls[0]?.[0] as string;
  const [, queryString = ''] = calledUrl.split('?');
  return new URLSearchParams(queryString);
}

describe('buildQueryParams (via api.ts 公開函式間接驗證)', () => {
  beforeEach(() => {
    mockGet.mockClear();
  });

  it('excludes undefined, null and empty-string values while keeping 0 as a valid value', () => {
    const params = {
      studentId: 0,
      academicYear: undefined,
      term: null,
      semester: '',
    } as unknown as StatisticsReportParams;

    getStatisticsReport(params);

    const query = parseCalledQuery();
    expect(query.get('studentId')).toBe('0');
    expect(query.has('academicYear')).toBe(false);
    expect(query.has('term')).toBe(false);
    expect(query.has('semester')).toBe(false);
  });

  it('keeps false as a valid boolean value', () => {
    const params: GetStudentsParams = { includeEnrollments: false, status: '' };

    getStudents(params);

    const query = parseCalledQuery();
    expect(query.get('includeEnrollments')).toBe('false');
    expect(query.has('status')).toBe(false);
  });

  it('joins non-empty arrays with commas and omits empty arrays', () => {
    const params: AttendanceReportParams = { grades: ['A', 'B'], statuses: [] };

    getAttendanceReport(params);

    const query = parseCalledQuery();
    expect(query.get('grades')).toBe('A,B');
    expect(query.has('statuses')).toBe(false);
  });

  it('builds an empty query string when every param is absent', () => {
    getStudents(undefined);

    expect(mockGet).toHaveBeenCalledWith('/students');
  });
});
