// in frontend/src/services/api.ts --- COMPLETE AND CORRECTED

import axios from 'axios';

// Allow overriding the API base URL via Vite env var when building/deploying.
// In development this falls back to http://localhost:3001
const baseURL = (import.meta.env && import.meta.env.VITE_API_BASE_URL) || 'http://localhost:3001';

const apiClient = axios.create({
  baseURL,
});

apiClient.interceptors.request.use((config) => {
  const token = localStorage.getItem('access_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Handle auth errors globally: if backend returns 401/403, clear token and redirect to login
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    // If there's no response/config, just propagate the error
    const status = error?.response?.status;
    const reqUrl: string = error?.config?.url || '';

    // Don't trigger redirect for authentication endpoints themselves
    if (reqUrl.includes('/auth/login') || reqUrl.includes('/auth/refresh')) {
      return Promise.reject(error);
    }

    if (status === 401 || status === 403) {
      // clear stored auth tokens
      localStorage.removeItem('access_token');
      localStorage.removeItem('refresh_token');

      // preserve current location to return after login
      try {
        const current = window.location.pathname + window.location.search;
        const loginUrl = `/login?returnUrl=${encodeURIComponent(current)}`;
        // use replace to avoid adding a history entry
        window.location.replace(loginUrl);
      } catch (e) {
        // fallback to simple redirect
        window.location.href = '/login';
      }
    }

    return Promise.reject(error);
  }
);

// 統一處理查詢參數的輔助函式
const buildQueryParams = (params: any) => {
  const queryParams = new URLSearchParams();
  for (const key in params) {
    if (params[key]) {
      if (Array.isArray(params[key]) && params[key].length > 0) {
        queryParams.append(key, params[key].join(','));
      } else if (!Array.isArray(params[key])) {
        queryParams.append(key, params[key]);
      }
    }
  }
  return queryParams.toString();
}

// --- 核心 API ---
// 修改後：
export const login = (username: string, password: string) => apiClient.post('/auth/login', { username, password });
export const getCurrentUser = () => apiClient.get('/auth/me');
export const getClasses = () => apiClient.get('/classes');
export const getStudentsByClass = (classId: number) => apiClient.get(`/students/class/${classId}`);
export const createLeaveRequest = (data: any) => apiClient.post('/leaves', data);
export const getLeaveTypes = () => apiClient.get('/leave-types');

// --- 【補回】每日出缺勤登記用的 API 函式 ---
export const getAttendanceForClass = (classId: number, date: string) => {
    return apiClient.get(`/attendance/class/${classId}`, { params: { date } });
};
export const submitAttendance = (classId: number, data: any) => {
    return apiClient.post(`/attendance/class/${classId}`, data);
};

// --- 報表 API ---
export const getAttendanceReport = (params: any) => {
    const queryString = buildQueryParams(params);
    return apiClient.get(`/reports/attendance?${queryString}`);
};

export const getPendingLeavesReport = (params: any) => {
    const queryString = buildQueryParams(params);
    return apiClient.get(`/reports/pending-leaves?${queryString}`);
};

export const getUnresolvedAbsencesReport = (params: any) => {
    const queryString = buildQueryParams(params);
    return apiClient.get(`/reports/unresolved-absences?${queryString}`);
};

export const approveLeaveRequest = (leaveId: number) => {
    return apiClient.patch(`/leaves/${leaveId}/approve`);
};

export const rejectLeaveRequest = (leaveId: number, reason?: string) => {
    return apiClient.patch(`/leaves/${leaveId}/reject`, reason ? { reason } : {});
};

// --- 統計報表 API ---
export const getStatisticsReport = (params: any) => {
    const queryString = buildQueryParams(params);
    return apiClient.get(`/statistics/report?${queryString}`);
};

// --- 管理 API ---
// 班級管理
export const createClass = (data: any) => apiClient.post('/classes', data);
export const updateClass = (id: number, data: any) => apiClient.put(`/classes/${id}`, data);
export const deleteClass = (id: number) => apiClient.delete(`/classes/${id}`);
export const getTeachers = () => apiClient.get('/users/teachers');
export const getGASpecialists = () => apiClient.get('/users/ga-specialists');
export const createTeacher = (data: { name: string }) => apiClient.post('/users/teacher', data);
export const createGASpecialist = (data: { name: string }) => apiClient.post('/users/ga-specialist', data);
export const deleteUser = (id: number) => apiClient.delete(`/users/${id}`);
export const assignTeacherToClass = (data: any) => apiClient.post('/classes/assign-teacher', data);
export const getClassTeachers = (classId: number) => apiClient.get(`/classes/${classId}/teachers`);

// 假別管理
export const createLeaveType = (data: any) => apiClient.post('/leave-types', data);
export const updateLeaveType = (id: number, data: any) => apiClient.put(`/leave-types/${id}`, data);
export const deleteLeaveType = (id: number) => apiClient.delete(`/leave-types/${id}`);

// 學年管理
export const getAcademicYears = () => apiClient.get('/academic/years');
export const createAcademicYear = (data: any) => apiClient.post('/academic/years', data);
export const updateAcademicYear = (id: number, data: any) => apiClient.put(`/academic/years/${id}`, data);
export const deleteAcademicYear = (id: number) => apiClient.delete(`/academic/years/${id}`);
export const promoteStudents = (academicYearId: number) => apiClient.post(`/academic/years/${academicYearId}/promote`);

// 學季管理
export const getSeasons = () => apiClient.get('/academic/seasons');
export const getSeason = (id: number) => apiClient.get(`/academic/seasons/${id}`);
export const createSeason = (data: any) => apiClient.post('/academic/seasons', data);
export const updateSeason = (id: number, data: any) => apiClient.put(`/academic/seasons/${id}`, data);
export const deleteSeason = (id: number) => apiClient.delete(`/academic/seasons/${id}`);

// 假日管理
export const getHolidays = (seasonId?: number) => {
  const params = seasonId ? `?seasonId=${seasonId}` : '';
  return apiClient.get(`/academic/holidays${params}`);
};
export const createHoliday = (data: any) => apiClient.post('/academic/holidays', data);
export const deleteHoliday = (id: number) => apiClient.delete(`/academic/holidays/${id}`);

// 學生管理
export const getStudents = (params?: any) => {
  const queryString = params ? buildQueryParams(params) : '';
  return apiClient.get(`/students${queryString ? '?' + queryString : ''}`);
};
export const createStudent = (data: any) => apiClient.post('/students', data);
export const updateStudent = (id: number, data: any) => apiClient.put(`/students/${id}`, data);
export const deleteStudent = (id: number) => apiClient.delete(`/students/${id}`);

// 學生班級註冊管理
export const createStudentEnrollment = (data: any) => apiClient.post('/students/enrollments', data);
export const updateStudentEnrollment = (id: number, data: any) => apiClient.put(`/students/enrollments/${id}`, data);
export const getStudentEnrollments = (studentId: number) => apiClient.get(`/students/${studentId}/enrollments`);