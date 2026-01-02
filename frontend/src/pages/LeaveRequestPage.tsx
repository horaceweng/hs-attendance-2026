// in frontend/src/pages/LeaveRequestPage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Button, FormControl, InputLabel, MenuItem, Select, TextField, Typography, CircularProgress, Alert, Checkbox, FormControlLabel } from '@mui/material';
import * as api from '../services/api';

// 假設從 API 拿到的資料型別
interface Class { id: number; name: string; }
interface Student { id: number; name: string; }
interface LeaveType { id: number; name: string; }

export const LeaveRequestPage: React.FC = () => {
    const [classes, setClasses] = useState<Class[]>([]);
    const [students, setStudents] = useState<Student[]>([]);
    const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);

    const [selectedClass, setSelectedClass] = useState('');
    const [selectedStudent, setSelectedStudent] = useState('');
    const [selectedLeaveType, setSelectedLeaveType] = useState('');
    const [startDate, setStartDate] = useState('');
    const [endDate, setEndDate] = useState('');
    const [startTime, setStartTime] = useState('');
    const [endTime, setEndTime] = useState('');
    const [isFullDay, setIsFullDay] = useState(true);
    const [reason, setReason] = useState('');

    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');

    useEffect(() => {
        // 載入班級和請假類別
        const loadInitialData = async () => {
            try {
                const [classRes, leaveTypeRes] = await Promise.all([
                    api.getClasses(),
                    api.getLeaveTypes(), // 記得在後端實作這個 API
                ]);
                setClasses(classRes.data);
                setLeaveTypes(leaveTypeRes.data);
            } catch (err) {
                setError('無法載入初始資料');
            }
        };
        loadInitialData();
    }, []);

    useEffect(() => {
        // 當班級改變時，載入該班級的學生
        if (selectedClass) {
            const loadStudents = async () => {
                try {
                    setLoading(true);
                    const res = await api.getStudentsByClass(Number(selectedClass));
                    setStudents(res.data);
                    setSelectedStudent(''); // 清空之前選的學生
                    setLoading(false);
                } catch (err) {
                    setError('無法載入學生資料');
                    setLoading(false);
                }
            };
            loadStudents();
        }
    }, [selectedClass]);

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');
        setSuccess('');

        if (!selectedStudent || !selectedLeaveType || !startDate || !endDate) {
            setError('所有必填欄位都必須填寫！');
            return;
        }

        const leaveData = {
            studentId: Number(selectedStudent),
            leaveTypeId: Number(selectedLeaveType),
            startDate,
            endDate,
            startTime: isFullDay ? null : startTime,
            endTime: isFullDay ? null : endTime,
            isFullDay,
            reason,
        };

        try {
            setLoading(true);
            await api.createLeaveRequest(leaveData);
            setSuccess('請假單已成功送出！');
            // 清空表單
            setSelectedStudent('');
            setSelectedLeaveType('');
            setStartDate('');
            setEndDate('');
            setStartTime('');
            setEndTime('');
            setIsFullDay(true);
            setReason('');
            setLoading(false);
        } catch (err) {
            setError('送出失敗，請稍後再試。');
            setLoading(false);
        }
    };

    return (
        <Box component="form" onSubmit={handleSubmit} sx={{ mt: 3, maxWidth: 500, mx: 'auto' }}>
            <Typography variant="h4" gutterBottom>請假登記</Typography>
            {error && <Alert severity="error">{error}</Alert>}
            {success && <Alert severity="success">{success}</Alert>}

            <FormControl fullWidth margin="normal">
                <InputLabel>班級</InputLabel>
                <Select value={selectedClass} label="班級" onChange={(e) => setSelectedClass(e.target.value)}>
                    {classes.map((c) => (<MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>))}
                </Select>
            </FormControl>

            <FormControl fullWidth margin="normal" disabled={!selectedClass || loading}>
                <InputLabel>學生</InputLabel>
                <Select value={selectedStudent} label="學生" onChange={(e) => setSelectedStudent(e.target.value)}>
                    {students.map((s) => (<MenuItem key={s.id} value={s.id}>{s.name}</MenuItem>))}
                </Select>
            </FormControl>

            <FormControl fullWidth margin="normal">
                <InputLabel>假別</InputLabel>
                <Select value={selectedLeaveType} label="假別" onChange={(e) => setSelectedLeaveType(e.target.value)}>
                     {leaveTypes.map((lt) => (<MenuItem key={lt.id} value={lt.id}>{lt.name}</MenuItem>))}
                </Select>
            </FormControl>

            <TextField
                label="開始日期"
                type="date"
                fullWidth
                margin="normal"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
            />
            
            <Box sx={{ mt: 2, mb: 1 }}>
                <FormControl component="fieldset">
                    <FormControlLabel
                        control={
                            <Checkbox
                                checked={isFullDay}
                                onChange={(e) => setIsFullDay(e.target.checked)}
                                name="fullday-checkbox"
                            />
                        }
                        label="整天請假"
                    />
                </FormControl>
            </Box>
            
            {!isFullDay && (
                <>
                    <TextField
                        label="起始時間"
                        type="time"
                        fullWidth
                        margin="normal"
                        value={startTime}
                        onChange={(e) => setStartTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 300 }} // 5分鐘間隔
                    />
                    <TextField
                        label="結束時間"
                        type="time"
                        fullWidth
                        margin="normal"
                        value={endTime}
                        onChange={(e) => setEndTime(e.target.value)}
                        InputLabelProps={{ shrink: true }}
                        inputProps={{ step: 300 }} // 5分鐘間隔
                    />
                </>
            )}
            
            <TextField
                label="結束日期"
                type="date"
                fullWidth
                margin="normal"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                InputLabelProps={{ shrink: true }}
            />
             <TextField
                label="事由"
                multiline
                rows={4}
                fullWidth
                margin="normal"
                value={reason}
                onChange={(e) => setReason(e.target.value)}
            />

            <Button type="submit" variant="contained" fullWidth sx={{ mt: 2 }} disabled={loading}>
                {loading ? <CircularProgress size={24} /> : '送出請假單'}
            </Button>
        </Box>
    );
};