// in frontend/src/pages/AttendancePage.tsx --- 修正後版本

import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography, CircularProgress, Alert, TableContainer, Paper, Table, TableHead, TableRow, TableCell, TableBody } from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select'; // <-- 修正後的正確匯入路徑
import * as api from '../services/api';

interface Class { id: number; name: string; }
interface AttendanceRecord {
  studentId: number;
  studentName: string;
  status: string;
}

// 取得今天的日期字串 'YYYY-MM-DD'
const getTodayString = () => new Date().toISOString().split('T')[0];

export const AttendancePage: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [attendanceData, setAttendanceData] = useState<AttendanceRecord[]>([]);
    const [originalAttendanceMap, setOriginalAttendanceMap] = useState<Map<number, string>>(new Map());
    
    const [selectedClass, setSelectedClass] = useState('');
    const [selectedDate, setSelectedDate] = useState(getTodayString());

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        api.getClasses().then(res => setClasses(res.data)).catch(() => setError('無法載入班級資料'));
    }, []);

    const fetchAttendanceData = async () => {
        if (!selectedClass || !selectedDate) return;
        try {
            setLoading(true);
            setError('');
            setSuccess('');
            const res = await api.getAttendanceForClass(Number(selectedClass), selectedDate);
            setAttendanceData(res.data);
            // snapshot original statuses so we only submit changed items later
            const origMap = new Map<number, string>(res.data.map((r: AttendanceRecord) => [r.studentId, r.status]));
            setOriginalAttendanceMap(origMap);
            setLoading(false);
        } catch (err) {
            setError('無法載入學生出缺勤資料');
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchAttendanceData();
    }, [selectedClass, selectedDate]);

    const handleStatusChange = (studentId: number, newStatus: string) => {
        setAttendanceData(prevData =>
            prevData.map(record => 
                record.studentId === studentId ? { ...record, status: newStatus } : record
            )
        );
    };

    const handleSubmit = async () => {
        try {
            setLoading(true);
            setError('');
            setSuccess('');
            
            // Submit only records whose status changed compared to the original snapshot
            // and are not 'on_leave'. This preserves the original design (don't create
            // implicit 'present' records) while allowing explicit edits like absent->present.
            const recordsToSubmit = attendanceData
                .filter(record => {
                    const orig = originalAttendanceMap.get(record.studentId) || 'present';
                    // skip unchanged
                    if (record.status === orig) return false;
                    // always skip on_leave to avoid overwriting leave requests
                    if (record.status === 'on_leave') return false;
                    return true;
                })
                .map(({ studentId, status }) => ({ studentId, status }));

            await api.submitAttendance(Number(selectedClass), {
                attendanceDate: selectedDate,
                records: recordsToSubmit,
            });

            setSuccess('出缺勤紀錄已成功儲存！');
            setLoading(false);
        } catch(err) {
            setError('儲存失敗，請稍後再試。');
            setLoading(false);
        }
    };

    return (
        <Box sx={{ mt: 3, maxWidth: 800, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>每日出缺勤登記</Typography>
            
            <Box sx={{ display: 'flex', gap: 2, mb: 2 }}>
                <FormControl sx={{ minWidth: 200 }}>
                    <InputLabel>選擇班級</InputLabel>
                    <Select value={selectedClass} label="選擇班級" onChange={(e) => setSelectedClass(e.target.value)}>
                        {classes.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                    </Select>
                </FormControl>
                <TextField
                    label="選擇日期"
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    InputLabelProps={{ shrink: true }}
                />
            </Box>
            
            {error && <Alert severity="error" sx={{mb: 2}}>{error}</Alert>}
            {success && <Alert severity="success" sx={{mb: 2}}>{success}</Alert>}

            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow>
                            <TableCell>學生姓名</TableCell>
                            <TableCell align="right">出缺勤狀態</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {loading ? (
                            <TableRow><TableCell colSpan={2} align="center"><CircularProgress /></TableCell></TableRow>
                        ) : (
                            attendanceData.map((record) => (
                                <TableRow key={record.studentId}>
                                    <TableCell component="th" scope="row">{record.studentName}</TableCell>
                                    <TableCell align="right">
                                        {record.status === 'on_leave' ? (
                                            <Typography variant="body2" color="text.secondary">已請假</Typography>
                                        ) : (
                                            <FormControl size="small" sx={{minWidth: 120}}>
                                                <Select
                                                    value={record.status}
                                                    onChange={(e: SelectChangeEvent) => handleStatusChange(record.studentId, e.target.value)}
                                                >
                                                    <MenuItem value="present">出席</MenuItem>
                                                    <MenuItem value="absent">缺席</MenuItem>
                                                    <MenuItem value="late">遲到</MenuItem>
                                                    <MenuItem value="leave_early">早退</MenuItem>
                                                </Select>
                                            </FormControl>
                                        )}
                                    </TableCell>
                                </TableRow>
                            ))
                        )}
                    </TableBody>
                </Table>
            </TableContainer>

             <Button onClick={handleSubmit} variant="contained" fullWidth sx={{ mt: 3 }} disabled={loading || !selectedClass}>
                {loading ? <CircularProgress size={24} /> : '儲存本日紀錄'}
            </Button>
        </Box>
    );
};