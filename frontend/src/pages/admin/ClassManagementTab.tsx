// src/pages/admin/ClassManagementTab.tsx
import React, { useState, useEffect, useCallback } from 'react';
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
import { useCrudResource } from '../../hooks/useCrudResource';
import CrudTable from '../../components/admin/CrudTable';
import CrudDialog from '../../components/admin/CrudDialog';

interface ClassData {
  id: number;
  name: string;
  description: string;
}

interface ClassFormData {
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

const emptyFormData: ClassFormData = {
  name: '',
  description: ''
};

const ClassManagementTab: React.FC = () => {
  // 用於存儲每個班級的當前導師（班級列表以外的附加資料，隨班級列表一起刷新）
  const [classTeachersMap, setClassTeachersMap] = useState<Record<number, TeacherAssignment[]>>({});

  // 取得班級列表的同時，一併取得每個班級的導師分配資料，
  // 讓 useCrudResource 的 fetchAll（新增/編輯/刪除後都會重新呼叫）維持原本行為。
  const fetchClassesWithTeachers = useCallback(async () => {
    const response = await api.getClasses();
    const classesList: ClassData[] = response.data;

    const teachersMap: Record<number, TeacherAssignment[]> = {};
    for (const classItem of classesList) {
      try {
        const teachersResponse = await api.getClassTeachers(classItem.id);
        teachersMap[classItem.id] = teachersResponse.data;
      } catch (err) {
        console.error(`獲取班級 ${classItem.id} 的導師資料失敗`, err);
      }
    }
    setClassTeachersMap(teachersMap);

    return response;
  }, []);

  const {
    data: classes,
    loading,
    error,
    setError,
    dialogOpen,
    currentItem: currentClass,
    formData,
    setFormData,
    openCreate,
    openEdit,
    closeDialog,
    submit,
    remove,
  } = useCrudResource<ClassData, ClassFormData>({
    fetchFn: fetchClassesWithTeachers,
    createFn: api.createClass,
    updateFn: api.updateClass,
    deleteFn: api.deleteClass,
    getId: (item) => item.id,
    emptyFormData,
    toFormData: (item) => ({ name: item.name, description: item.description }),
    fetchErrorMessage: '獲取班級資料失敗',
    submitErrorMessage: '提交失敗',
    deleteErrorMessage: '刪除失敗',
    deleteConfirmMessage: '確定要刪除此班級嗎?',
  });

  // --- 指派導師：業務邏輯較獨特（需另外維護老師清單、現有分配、指派表單），保留原本作法 ---
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [classTeachers, setClassTeachers] = useState<TeacherAssignment[]>([]);
  const [teacherDialogOpen, setTeacherDialogOpen] = useState(false);
  const [classForAssignment, setClassForAssignment] = useState<ClassData | null>(null);

  const [teacherFormData, setTeacherFormData] = useState({
    teacherId: '',
    schoolYear: new Date().getFullYear().toString(),
    startDate: new Date().toISOString().split('T')[0],
    endDate: '',
    isActive: true,
    notes: ''
  });

  // 獲取老師列表
  const fetchTeachers = async () => {
    try {
      const response = await api.getTeachers();
      setTeachers(response.data);
    } catch (err) {
      console.error("獲取老師資料失敗", err);
    }
  };

  useEffect(() => {
    fetchTeachers();
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
    if (!classForAssignment) {
      setError("無班級被選擇");
      return;
    }

    try {
      const data = {
        classId: classForAssignment.id,
        teacherId: Number(teacherFormData.teacherId),
        schoolYear: teacherFormData.schoolYear,
        startDate: teacherFormData.startDate || null,
        endDate: teacherFormData.endDate || null,
        isActive: teacherFormData.isActive,
        notes: teacherFormData.notes || null
      };

      await api.assignTeacherToClass(data);

      // 重新獲取班級導師資料
      const response = await api.getClassTeachers(classForAssignment.id);
      setClassTeachers(response.data);

      // 更新 classTeachersMap
      setClassTeachersMap(prev => ({
        ...prev,
        [classForAssignment.id]: response.data
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

  const openAssignTeacherDialog = async (classData: ClassData) => {
    setClassForAssignment(classData);
    setTeacherFormData({
      teacherId: '',
      schoolYear: new Date().getFullYear().toString(),
      startDate: new Date().toISOString().split('T')[0],
      endDate: '',
      isActive: true,
      notes: ''
    });

    // 獲取該班級的現有導師
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

  return (
    <Box>
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mb: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Typography variant="h5">班級管理</Typography>
          <Button variant="contained" onClick={openCreate}>
            新增班級
          </Button>
        </Box>
        <Typography variant="body1" color="text.secondary">
          在此頁面管理班級並指派導師。點擊「指派導師」按鈕可以為班級分配老師，或查看現有導師分配。
        </Typography>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <CrudTable<ClassData>
        columns={[
          { header: '班級名稱', render: (classItem) => classItem.name },
          { header: '描述', render: (classItem) => classItem.description },
          {
            header: '現任導師',
            render: (classItem) =>
              classTeachersMap[classItem.id]?.some(teacher => teacher.isActive) ?
                classTeachersMap[classItem.id]
                  .filter(teacher => teacher.isActive)
                  .map(teacher => teacher.teacher.name).join(", ") :
                <Typography color="text.secondary">未指派</Typography>
          },
        ]}
        data={classes}
        loading={loading}
        getRowKey={(classItem) => classItem.id}
        emptyMessage="尚無班級資料"
        renderActions={(classItem) => (
          <>
            <IconButton size="small" onClick={() => openEdit(classItem)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => remove(classItem)}>
              <DeleteIcon />
            </IconButton>
            <Button
              size="small"
              onClick={() => openAssignTeacherDialog(classItem)}
              sx={{ ml: 1 }}
            >
              指派導師
            </Button>
          </>
        )}
      />

      {/* 新增/編輯班級對話框 */}
      <CrudDialog
        open={dialogOpen}
        title={currentClass ? '編輯班級' : '新增班級'}
        onClose={closeDialog}
        onSubmit={submit}
        submitDisabled={!formData.name.trim()}
      >
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
      </CrudDialog>

      {/* 指派導師對話框：業務邏輯特殊（現有分配列表 + 指派表單），維持原本自訂實作 */}
      <Dialog open={teacherDialogOpen} onClose={() => setTeacherDialogOpen(false)} maxWidth="md" fullWidth>
        <DialogTitle>
          {classForAssignment ? `班級「${classForAssignment.name}」的導師分配` : '導師分配'}
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
