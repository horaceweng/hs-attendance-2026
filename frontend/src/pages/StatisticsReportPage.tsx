// src/pages/StatisticsReportPage.tsx
import React, { useState, useEffect } from 'react';
import { Box, FormControl, InputLabel, MenuItem, Select, Typography, CircularProgress, Alert, Paper, TableContainer, Table, TableHead, TableRow, TableCell, TableBody, Button, Card, CardContent } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import * as api from '../services/api';
import { formatAcademicYear } from '../utils/dateUtils';

const GRADE_OPTIONS = Array.from({ length: 12 }, (_, i) => String(i + 1));
const TERMS = [
  { value: 'first', label: '第一學期 (秋+冬)' },
  { value: 'second', label: '第二學期 (春+夏)' }
];
const SEASONS = [
  { value: 'fall', label: '秋季' },
  { value: 'winter', label: '冬季' },
  { value: 'spring', label: '春季' },
  { value: 'summer', label: '夏季' }
];

export const StatisticsReportPage: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<{id: number, year: number, name: string}[]>([]);
  const [students, setStudents] = useState<{id: number, name: string, studentId: string}[]>([]);
  const [selectedClass, setSelectedClass] = useState<string>('');
  const [classes, setClasses] = useState<{id: number, name: string}[]>([]);
  
  const [filters, setFilters] = useState({
    academicYear: '',
    term: '',
    semester: '',
    grades: [] as string[],
    studentId: ''
  });
  const [reportData, setReportData] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isReportGenerated, setIsReportGenerated] = useState(false);
  
  // 獲取學年度和班級資料
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [yearsRes, classesRes] = await Promise.all([
          api.getAcademicYears(),
          api.getClasses()
        ]);
        
        setAcademicYears(yearsRes.data || []);
        setClasses(classesRes.data || []);
        
        // 如果有學年度資料，默認選擇第一個
        if (yearsRes.data && yearsRes.data.length > 0) {
          setFilters(prev => ({
            ...prev,
            academicYear: String(yearsRes.data[0].year)
          }));
        }
      } catch (err) {
        setError('載入學年度和班級資料失敗');
        console.error(err);
      }
    };
    
    fetchInitialData();
  }, []);
  
  // 當選擇班級變更時，加載該班級的學生
  useEffect(() => {
    const fetchStudents = async () => {
      if (selectedClass) {
        try {
          const response = await api.getStudentsByClass(Number(selectedClass));
          setStudents(response.data || []);
          // 重設學生ID篩選條件
          setFilters(prev => ({ ...prev, studentId: '' }));
        } catch (err) {
          console.error('載入學生資料失敗:', err);
        }
      } else {
        setStudents([]);
      }
    };
    
    fetchStudents();
  }, [selectedClass]);



  const handleSelectChange = (event: SelectChangeEvent) => {
    const { name, value } = event.target;
    setFilters(prev => ({ ...prev, [name as string]: value }));
  };

  const generateReport = async () => {
    setLoading(true);
    setError('');
    setReportData([]);
    setIsReportGenerated(true);
    
    try {
      // 將篩選條件轉換為API參數
      const apiParams = {
        academicYear: filters.academicYear || undefined,
        term: filters.term || undefined,
        semester: filters.semester || undefined,
        grades: filters.grades.length > 0 ? filters.grades : undefined,
        studentId: filters.studentId ? parseInt(filters.studentId, 10) : undefined
      };
      
      const res = await api.getStatisticsReport(apiParams);
      setReportData(res?.data || []);
    } catch (err: any) {
      setError('產生報表失敗');
      console.error("API 請求失敗:", err.response?.data || err.message);
    } finally {
      setLoading(false);
    }
  };

  // 將請假時數格式化為易讀形式
  const formatLeaveHours = (leaveData: { 
    approved: { days: number; hours: number };
    pending: { days: number; hours: number };
    rejected: { days: number; hours: number };
    total: { days: number; hours: number };
  }) => {
    if (!leaveData) return '0天';
    
    const formatSubData = (data: { days: number; hours: number }) => {
      let result = '';
      if (data.days > 0) {
        result += `${data.days}天`;
      }
      if (data.hours > 0) {
        result += `${data.days > 0 ? ' ' : ''}${data.hours}小時`;
      }
      return result || '0';
    };
    
    return (
      <>
        <div><strong>總計：</strong>{formatSubData(leaveData.total)}</div>
        <div><small>已核准：{formatSubData(leaveData.approved)}</small></div>
        {leaveData.pending.days > 0 || leaveData.pending.hours > 0 ? (
          <div><small>待審核：{formatSubData(leaveData.pending)}</small></div>
        ) : null}
        {leaveData.rejected.days > 0 || leaveData.rejected.hours > 0 ? (
          <div><small>已拒絕：{formatSubData(leaveData.rejected)}</small></div>
        ) : null}
      </>
    );
  };

  // 渲染統計報表表格
  // 計算有效出席率
  const calculateEffectiveAttendanceRate = (student: any): string => {
    // 如果總天數為0，則返回N/A
    if (student.totalDays <= 0) return 'N/A';
    
    // 計算所有請假總天數（含所有假別和狀態）
    let totalLeaveDays = 0;
    
    // 加總所有假別的總請假天數（包含approved, pending, rejected）
    Object.values(student.leaveTypeCounts).forEach((leaveData: any) => {
      // 將所有請假天數和小時數轉換為總天數
      totalLeaveDays += leaveData.total.days + (leaveData.total.hours / 8);
    });
    
    // 計算有效出席天數 = 總天數 - 缺席天數 - 總請假天數
    const effectiveAttendanceDays = student.totalDays - student.absentDays - totalLeaveDays;
    
    // 計算有效出席率 = 有效出席天數 / 總天數
    const rate = (effectiveAttendanceDays / student.totalDays) * 100;
    
    // 確保不會出現負數的出席率
    const finalRate = Math.max(0, rate);
    
    return `${finalRate.toFixed(2)}%`;
  };

  const renderStatisticsTable = () => {
    // 獲取所有假別類型
    const allLeaveTypes = new Set<string>();
    reportData.forEach(student => {
      Object.keys(student.leaveTypeCounts).forEach(type => allLeaveTypes.add(type));
    });
    const leaveTypes = Array.from(allLeaveTypes);
    
    return (
      <>
        <TableContainer component={Paper}>
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>年級</TableCell>
                <TableCell>班級</TableCell>
                <TableCell>學生姓名</TableCell>
                {leaveTypes.map(type => (
                  <TableCell key={type}>{type}</TableCell>
                ))}
                <TableCell>遲到次數</TableCell>
                <TableCell>早退次數</TableCell>
                <TableCell>缺席天數</TableCell>
                <TableCell>出席率</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {reportData.map((row) => (
                <TableRow key={row.studentId}>
                  <TableCell>{row.grade}</TableCell>
                  <TableCell>{row.className}</TableCell>
                  <TableCell>{row.studentName}</TableCell>
                  
                  {/* 每種假別都有專門的格子 */}
                  {leaveTypes.map(type => (
                    <TableCell key={type}>
                      {row.leaveTypeCounts[type] ? formatLeaveHours(row.leaveTypeCounts[type]) : '-'}
                    </TableCell>
                  ))}
                  
                  <TableCell>{row.lateDays}</TableCell>
                  <TableCell>{row.leaveEarlyDays}</TableCell>
                  <TableCell>{row.absentDays}</TableCell>
                  <TableCell>
                    {calculateEffectiveAttendanceRate(row)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        
        {leaveTypes.length > 0 && (
          <Box sx={{ mt: 2, mb: 4 }}>
            <Typography variant="h6" gutterBottom>假別說明</Typography>
            <Paper sx={{ p: 2 }}>
              {leaveTypes.map(type => (
                <Typography key={type} variant="body2" sx={{ mb: 1 }}>
                  • {type}: 顯示請假天數和小時數
                </Typography>
              ))}
            </Paper>
          </Box>
        )}
      </>
    );
  };
  
  // 渲染統計圖表卡片
  const renderStatisticsCards = () => {
    if (reportData.length === 0) return null;
    
    // 計算總體統計
    const totalStudents = reportData.length;
    
    // 收集所有假別統計
    const leaveTypeStats: { 
      [type: string]: {
        approved: { days: number; hours: number };
        pending: { days: number; hours: number };
        rejected: { days: number; hours: number };
        total: { days: number; hours: number };
      }
    } = {};
    
    reportData.forEach(student => {
      Object.entries(student.leaveTypeCounts).forEach(([type, data]: [string, any]) => {
        if (!leaveTypeStats[type]) {
          leaveTypeStats[type] = {
            approved: { days: 0, hours: 0 },
            pending: { days: 0, hours: 0 },
            rejected: { days: 0, hours: 0 },
            total: { days: 0, hours: 0 }
          };
        }
        
        // 累加各狀態的請假天數和時數
        const statuses = ['approved', 'pending', 'rejected', 'total'] as const;
        
        statuses.forEach(status => {
          leaveTypeStats[type][status].days += data[status].days;
          leaveTypeStats[type][status].hours += data[status].hours;
          
          // 將小時數轉換為天數（如果超過8小時）
          if (leaveTypeStats[type][status].hours >= 8) {
            const additionalDays = Math.floor(leaveTypeStats[type][status].hours / 8);
            leaveTypeStats[type][status].days += additionalDays;
            leaveTypeStats[type][status].hours %= 8;
          }
        });
      });
    });
    
    // 計算總請假天數 (所有狀態)
    const totalLeaves = Object.values(leaveTypeStats).reduce((sum, data) => {
      return sum + data.total.days + (data.total.hours / 8);
    }, 0);
    
    const totalLates = reportData.reduce((sum, student) => sum + student.lateDays, 0);
    const totalAbsents = reportData.reduce((sum, student) => sum + student.absentDays, 0);
    
    // 先顯示基本統計卡片
    return (
      <>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>學生數</Typography>
                <Typography variant="h4">{totalStudents}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>總請假天數</Typography>
                <Typography variant="h4">{totalLeaves.toFixed(1)}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>總遲到次數</Typography>
                <Typography variant="h4">{totalLates}</Typography>
              </CardContent>
            </Card>
          </Box>
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(25% - 18px)' } }}>
            <Card>
              <CardContent>
                <Typography variant="h6" gutterBottom>總缺席天數</Typography>
                <Typography variant="h4">{totalAbsents}</Typography>
              </CardContent>
            </Card>
          </Box>
        </Box>
        
        {/* 各假別統計卡片 */}
        {Object.keys(leaveTypeStats).length > 0 && (
          <>
            <Typography variant="h5" sx={{ mb: 2, mt: 4 }}>假別統計明細</Typography>
            <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3, mb: 4 }}>
              {Object.entries(leaveTypeStats).map(([type, data]) => (
                <Box key={type} sx={{ width: { xs: '100%', md: 'calc(50% - 12px)', lg: 'calc(33.33% - 16px)' } }}>
                  <Card sx={{ height: '100%' }}>
                    <CardContent>
                      <Typography variant="h6" gutterBottom>{type}</Typography>
                      
                      {/* 已核准 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">已核准:</Typography>
                        <Typography variant="body1" color="success.main">
                          {data.approved.days > 0 ? `${data.approved.days}天` : ''}
                          {data.approved.hours > 0 ? `${data.approved.days > 0 ? ' ' : ''}${data.approved.hours}小時` : ''}
                          {data.approved.days === 0 && data.approved.hours === 0 ? '0' : ''}
                        </Typography>
                      </Box>
                      
                      {/* 待審核 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">待審核:</Typography>
                        <Typography variant="body1" color="warning.main">
                          {data.pending.days > 0 ? `${data.pending.days}天` : ''}
                          {data.pending.hours > 0 ? `${data.pending.days > 0 ? ' ' : ''}${data.pending.hours}小時` : ''}
                          {data.pending.days === 0 && data.pending.hours === 0 ? '0' : ''}
                        </Typography>
                      </Box>
                      
                      {/* 已拒絕 */}
                      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 1 }}>
                        <Typography variant="body2" color="text.secondary">已拒絕:</Typography>
                        <Typography variant="body1" color="error.main">
                          {data.rejected.days > 0 ? `${data.rejected.days}天` : ''}
                          {data.rejected.hours > 0 ? `${data.rejected.days > 0 ? ' ' : ''}${data.rejected.hours}小時` : ''}
                          {data.rejected.days === 0 && data.rejected.hours === 0 ? '0' : ''}
                        </Typography>
                      </Box>
                      
                      {/* 總計 */}
                      <Box sx={{ mt: 2, pt: 1, borderTop: '1px solid #eee' }}>
                        <Typography variant="subtitle1" fontWeight="bold" sx={{ display: 'flex', justifyContent: 'space-between' }}>
                          <span>總計:</span>
                          <span>
                            {data.total.days > 0 ? `${data.total.days}天` : ''}
                            {data.total.hours > 0 ? `${data.total.days > 0 ? ' ' : ''}${data.total.hours}小時` : ''}
                            {data.total.days === 0 && data.total.hours === 0 ? '0' : ''}
                          </span>
                        </Typography>
                      </Box>
                    </CardContent>
                  </Card>
                </Box>
              ))}
            </Box>
          </>
        )}
      </>
    );
  };

  // 渲染報表內容
  const renderReportContent = () => {
    if (!isReportGenerated) return null;
    if (loading) return <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}><CircularProgress /></Box>;
    if (reportData.length === 0) return <Alert severity="info" sx={{mt: 2}}>查無資料</Alert>;
    
    return (
      <Box>
        {renderStatisticsCards()}
        {renderStatisticsTable()}
      </Box>
    );
  };

  return (
    <Box sx={{ mt: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>出缺勤統計報表</Typography>
      
      <Paper sx={{ p: 3, mb: 4 }}>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 3 }}>
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <FormControl fullWidth>
              <InputLabel>學年度</InputLabel>
              <Select
                name="academicYear"
                value={filters.academicYear}
                label="學年度"
                onChange={handleSelectChange}
              >
                {academicYears.length > 0 ? (
                  academicYears.map(year => (
                    <MenuItem key={year.id} value={year.year.toString()}>
                      {formatAcademicYear(year.year)}
                    </MenuItem>
                  ))
                ) : (
                  <MenuItem value="" disabled>無學年度資料</MenuItem>
                )}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <FormControl fullWidth>
              <InputLabel>學期</InputLabel>
              <Select
                name="term"
                value={filters.term}
                label="學期"
                onChange={handleSelectChange}
              >
                <MenuItem value=""><em>全部</em></MenuItem>
                {TERMS.map(term => (
                  <MenuItem key={term.value} value={term.value}>{term.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(33.33% - 16px)' } }}>
            <FormControl fullWidth>
              <InputLabel>學季</InputLabel>
              <Select
                name="semester"
                value={filters.semester}
                label="學季"
                onChange={handleSelectChange}
              >
                <MenuItem value=""><em>全部</em></MenuItem>
                {SEASONS.map(season => (
                  <MenuItem key={season.value} value={season.value}>{season.label}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <FormControl fullWidth>
              <InputLabel>年級</InputLabel>
              <Select
                multiple
                name="grades"
                value={filters.grades}
                label="年級"
                onChange={(e) => setFilters({ ...filters, grades: e.target.value as string[] })}
              >
                {GRADE_OPTIONS.map(grade => (
                  <MenuItem key={grade} value={grade}>{grade}年級</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(50% - 12px)' } }}>
            <FormControl fullWidth>
              <InputLabel>班級 (選填)</InputLabel>
              <Select
                name="classId"
                value={selectedClass}
                label="班級 (選填)"
                onChange={(e) => setSelectedClass(e.target.value)}
              >
                <MenuItem value=""><em>請選擇班級</em></MenuItem>
                {classes.map(classItem => (
                  <MenuItem key={classItem.id} value={classItem.id}>{classItem.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: { xs: '100%', md: 'calc(100% - 0px)' } }}>
            <FormControl fullWidth disabled={!selectedClass}>
              <InputLabel>學生 (選填)</InputLabel>
              <Select
                name="studentId"
                value={filters.studentId}
                label="學生 (選填)"
                onChange={(e) => setFilters(prev => ({ ...prev, studentId: e.target.value }))}
              >
                <MenuItem value=""><em>請選擇學生</em></MenuItem>
                {students.map(student => (
                  <MenuItem key={student.id} value={student.id}>{student.name} ({student.studentId})</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
          
          <Box sx={{ width: '100%', display: 'flex', justifyContent: 'center', mt: 2 }}>
            <Button 
              onClick={generateReport} 
              variant="contained" 
              disabled={loading} 
              size="large"
              sx={{ px: 4 }}
            >
              產生統計報表
            </Button>
          </Box>
        </Box>
      </Paper>
      
      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}
      
      {renderReportContent()}
    </Box>
  );
};