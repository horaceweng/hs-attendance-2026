// src/pages/admin/ClassManagementTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Button,
  TextField,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Alert,
  Typography
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import * as api from '../../services/api';

interface ClassData {
  id: number;
  name: string;
  description: string;
}

interface Teacher {
  id: number;
  name: string;
}

interface TeacherAssignment {
  id: number;
  teacherId: number;
  classId: number;
  schoolYear: string;
  startDate: string | null;
  endDate: string | null;
  isActive: boolean;
  notes: string | null;
  teacher: {
    name: string;
  };
}

const ClassManagementTab: React.FC = () => {
  const [classes, setClasses] = useState<ClassData[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classTeachers, setClassTeachers] = useState<TeacherAssignment[]>([]);
  // 用於存儲每個班級的當前導師
  const [classTeachersMap, setClassTeachersMap] = useState<Record<number, TeacherAssignment[]>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 對話框狀態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [currentClass, setCurrentClass] = useState<ClassData | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });
  
  // 導師表單狀態
  const [teacherFormData, setTeacherFormData] = useState({
    teacherId: '',
    schoolYear: new Date().getFullYear().toString(),
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    notes: ''
  });

  // 從API獲取資料
  const fetchClasses = async () => {
    setLoading(true);
    try {
      const response = await api.getClasses();
      const classesList = response.data;
      setClasses(classesList);
      
      // 獲取每個班級的當前導師
      const teachersMap: Record<number, TeacherAssignment[]> = {};
      
      // 這裡可能需要優化，以避免大量API請求
      for (const classItem of classesList) {
        try {
          const teachersResponse = await api.getClassTeachers(classItem.id);
          teachersMap[classItem.id] = teachersResponse.data;
          console.log(`班級 ${classItem.id} (${classItem.name}) 導師資料:`, teachersResponse.data);
        } catch (err) {
          console.error(`獲取班級 ${classItem.id} 的導師資料失敗`, err);
        }
      }
      
      setClassTeachersMap(teachersMap);
      setError(null);
    } catch (err) {
      setError("獲取班級資料失敗");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  // 獲取老師列表
  const fetchTeachers = async () => {
    try {
      const response = await api.getTeachers();
      setTeachers(response.data);
    } catch (err) {
      console.error("獲取老師資料失敗", err);
    }
  };
  
  // 不再需要單獨的 fetchClassTeachers 函數

  useEffect(() => {
    fetchClasses();
    fetchTeachers();
    
    console.log("初始化時載入班級和導師資料");
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };
  
  const handleTeacherFormChange = (e: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
    const name = e.target.name as string;
    const value = e.target.value;
    setTeacherFormData({
      ...teacherFormData,
      [name]: name === 'isActive' ? (value === 'true') : value
    });
  };
  
  const handleTeacherSubmit = async () => {
    if (!currentClass) {
      setError("無班級被選擇");
      return;
    }
    
    try {
      const data = {
        classId: currentClass.id,
        teacherId: Number(teacherFormData.teacherId),
        schoolYear: teacherFormData.schoolYear,
        startDate: teacherFormData.startDate || null,
        endDate: teacherFormData.endDate || null,
        isActive: teacherFormData.isActive,
        notes: teacherFormData.notes || null
      };
      
      await api.assignTeacherToClass(data);
      
      // 重新獲取班級導師資料
      const response = await api.getClassTeachers(currentClass.id);
      setClassTeachers(response.data);
      
      // 更新 classTeachersMap
      setClassTeachersMap(prev => ({
        ...prev,
        [currentClass.id]: response.data
      }));
      
      setError(null);
      
      // 清空表單
      setTeacherFormData({
        teacherId: '',
        schoolYear: new Date().getFullYear().toString(),
        startDate: new Date().toISOString().split('T')[0],
        endDate: '',
        isActive: true,
        notes: ''
      });
      
      // 關閉對話框
      setTeacherDialogOpen(false);
    } catch (err) {
      setError("指派導師失敗");
      console.error(err);
    }
  };

  const openAddDialog = () => {
    setCurrentClass(null);
    setFormData({
      name: '',
      description: ''
    });
    setDialogOpen(true);
  };
  
  const openEditDialog = (classData: ClassData) => {
    setCurrentClass(classData);
    setFormData({
      name: classData.name,
      description: classData.description
    });
    setDialogOpen(true);
  };
  
  const openAssignTeacherDialog = async (classData: ClassData) => {
    setCurrentClass(classData);
    setTeacherFormData({
      teacherId: '',
      schoolYear: new Date().getFullYear().toString(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      notes: ''
    });
    
    // 获取该班级的现有导师
    try {
      const response = await api.getClassTeachers(classData.id);
      setClassTeachers(response.data);
      
      // 更新 classTeachersMap
      setClassTeachersMap(prev => ({
        ...prev,
        [classData.id]: response.data
      }));
    } catch (err) {
      console.error(`獲取班級 ${classData.id} 的導師資料失敗`, err);
      setError(`獲取班級 ${classData.id} 的導師資料失敗`);
    }
    
    setTeacherDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (currentClass) {
        // 編輯班級
        await api.updateClass(currentClass.id, formData);
      } else {
        // 新增班級
        await api.createClass(formData);
      }
      
      setDialogOpen(false);
      fetchClasses(); // 重新獲取數據
      setError(null);
    } catch (err) {
      setError("提交失敗");
      console.error(err);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!window.confirm("確定要刪除此班級嗎?")) {
      return;
    }
    
    try {
      await api.deleteClass(id);
      fetchClasses(); // 重新獲取數據
      setError(null);
    } catch (err) {
      setError("刪除失敗");
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">班級管理</Typography>
          <Button variant="contained" onClick={openAddDialog}>
            新增班級
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          在此頁面管理班級並指派導師。點擊「指派導師」按鈕可以為班級分配老師，或查看現有導師分配。
        </Typography>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>班級名稱</TableCell>
              <TableCell>描述</TableCell>
              <TableCell>現任導師</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">載入中...</TableCell>
              </TableRow>
            ) : classes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">尚無班級資料</TableCell>
              </TableRow>
            ) : (
              classes.map((classItem) => (
                <TableRow key={classItem.id}>
                  <TableCell>{classItem.name}</TableCell>
                  <TableCell>{classItem.description}</TableCell>
                  <TableCell>
                    {classTeachersMap[classItem.id]?.some(teacher => teacher.isActive) ? 
                      classTeachersMap[classItem.id]
                        .filter(teacher => teacher.isActive)
                        .map(teacher => teacher.teacher.name).join(", ") : 
                      <Typography color="text.secondary">未指派</Typography>
                    }
                  </TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(classItem)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(classItem.id)}>
                      <DeleteIcon />
                    </IconButton>
                    <Button 
                      size="small" 
                      onClick={() => openAssignTeacherDialog(classItem)}
                      sx={{ ml: 1 }}
                    >
                      指派導師
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* 新增/編輯班級對話框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentClass ? '編輯班級' : '新增班級'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              id="class-name"
              fullWidth
              label="班級名稱"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
            <TextField
              id="class-description"
              fullWidth
              label="描述"
              name="description"
              value={formData.description}
              onChange={handleFormChange}
              multiline
              rows={3}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button onClick={handleSubmit} variant="contained" disabled={!formData.name.trim()}>
            提交
          </Button>
        </DialogActions>
      </Dialog>

      {/* 指派導師對話框 */}
      <Dialog open={teacherDialogOpen} onClose={() => setTeacherDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {currentClass ? `班級「${currentClass.name}」的導師分配` : '導師分配'}
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2, mb: 3 }}>
            <Typography variant="h6" gutterBottom>目前導師分配</Typography>
            {classTeachers.length === 0 ? (
              <Alert severity="info">目前沒有導師分配</Alert>
            ) : (
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>導師姓名</TableCell>
                      <TableCell>學年</TableCell>
                      <TableCell>開始日期</TableCell>
                      <TableCell>結束日期</TableCell>
                      <TableCell>狀態</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {classTeachers.map((assignment) => (
                      <TableRow key={assignment.id}>
                        <TableCell>{assignment.teacher.name}</TableCell>
                        <TableCell>{assignment.schoolYear}</TableCell>
                        <TableCell>
                          {assignment.startDate ? new Date(assignment.startDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          {assignment.endDate ? new Date(assignment.endDate).toLocaleDateString() : '—'}
                        </TableCell>
                        <TableCell>
                          {assignment.isActive ? 
                            <Typography color="success.main">生效中</Typography> : 
                            <Typography color="text.secondary">已結束</Typography>}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </TableContainer>
            )}
          </Box>
          
          <Typography variant="h6" gutterBottom sx={{ mt: 3 }}>新增導師分配</Typography>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            <TextField
              id="teacher-id"
              select
              fullWidth
              label="導師"
              name="teacherId"
              value={teacherFormData.teacherId}
              onChange={handleTeacherFormChange}
              SelectProps={{ native: true }}
              required
            >
              <option value="">請選擇導師</option>
              {teachers && teachers.length > 0 ? (
                teachers.map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>{teacher.name}</option>
                ))
              ) : (
                <option value="" disabled>沒有可用的導師</option>
              )}
            </TextField>
            
            <TextField
              id="school-year"
              fullWidth
              label="學年"
              name="schoolYear"
              value={teacherFormData.schoolYear}
              onChange={handleTeacherFormChange}
              required
            />
            
            <TextField
              id="start-date"
              fullWidth
              type="date"
              label="開始日期"
              name="startDate"
              InputLabelProps={{ shrink: true }}
              value={teacherFormData.startDate}
              onChange={handleTeacherFormChange}
              required
            />
            
            <TextField
              id="end-date"
              fullWidth
              type="date"
              label="結束日期"
              name="endDate"
              InputLabelProps={{ shrink: true }}
              value={teacherFormData.endDate}
              onChange={handleTeacherFormChange}
              helperText="如果未指定，則視為無限期"
            />
            
            <TextField
              id="notes"
              fullWidth
              label="備註"
              name="notes"
              value={teacherFormData.notes}
              onChange={handleTeacherFormChange}
              multiline
              rows={2}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setTeacherDialogOpen(false)}>取消</Button>
          <Button onClick={handleTeacherSubmit} variant="contained" disabled={!teacherFormData.teacherId}>
            提交
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default ClassManagementTab;