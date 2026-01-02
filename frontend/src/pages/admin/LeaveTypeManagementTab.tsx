// src/pages/admin/LeaveTypeManagementTab.tsx
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

interface LeaveType {
  id: number;
  name: string;
  description: string;
}

const LeaveTypeManagementTab: React.FC = () => {
  const [leaveTypes, setLeaveTypes] = useState<LeaveType[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 對話框狀態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentLeaveType, setCurrentLeaveType] = useState<LeaveType | null>(null);
  
  // 表單狀態
  const [formData, setFormData] = useState({
    name: '',
    description: ''
  });

  // 從API獲取資料
  const fetchLeaveTypes = async () => {
    setLoading(true);
    try {
      const response = await api.getLeaveTypes();
      setLeaveTypes(response.data);
      setError(null);
    } catch (err) {
      setError("獲取假別資料失敗");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLeaveTypes();
  }, []);

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  const openAddDialog = () => {
    setCurrentLeaveType(null);
    setFormData({
      name: '',
      description: ''
    });
    setDialogOpen(true);
  };
  
  const openEditDialog = (leaveType: LeaveType) => {
    setCurrentLeaveType(leaveType);
    setFormData({
      name: leaveType.name,
      description: leaveType.description
    });
    setDialogOpen(true);
  };

  const handleSubmit = async () => {
    try {
      if (currentLeaveType) {
        // 編輯假別
        await api.updateLeaveType(currentLeaveType.id, formData);
      } else {
        // 新增假別
        await api.createLeaveType(formData);
      }
      
      setDialogOpen(false);
      fetchLeaveTypes(); // 重新獲取數據
      setError(null);
    } catch (err) {
      setError("提交失敗");
      console.error(err);
    }
  };
  
  const handleDelete = async (id: number) => {
    if (!window.confirm("確定要刪除此假別嗎?")) {
      return;
    }
    
    try {
      await api.deleteLeaveType(id);
      fetchLeaveTypes(); // 重新獲取數據
      setError(null);
    } catch (err) {
      setError("刪除失敗");
      console.error(err);
    }
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">假別管理</Typography>
        <Button variant="contained" onClick={openAddDialog}>
          新增假別
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      <TableContainer component={Paper}>
        <Table>
          <TableHead>
            <TableRow>
              <TableCell>假別名稱</TableCell>
              <TableCell>描述</TableCell>
              <TableCell align="right">操作</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={3} align="center">載入中...</TableCell>
              </TableRow>
            ) : leaveTypes.length === 0 ? (
              <TableRow>
                <TableCell colSpan={3} align="center">尚無假別資料</TableCell>
              </TableRow>
            ) : (
              leaveTypes.map((leaveType) => (
                <TableRow key={leaveType.id}>
                  <TableCell>{leaveType.name}</TableCell>
                  <TableCell>{leaveType.description}</TableCell>
                  <TableCell align="right">
                    <IconButton size="small" onClick={() => openEditDialog(leaveType)}>
                      <EditIcon />
                    </IconButton>
                    <IconButton size="small" onClick={() => handleDelete(leaveType.id)}>
                      <DeleteIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </TableContainer>
      
      {/* 新增/編輯假別對話框 */}
      <Dialog open={dialogOpen} onClose={() => setDialogOpen(false)} maxWidth="sm" fullWidth>
        <DialogTitle>{currentLeaveType ? '編輯假別' : '新增假別'}</DialogTitle>
        <DialogContent>
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2, mt: 1 }}>
            <TextField
              id="leave-type-name"
              fullWidth
              label="假別名稱"
              name="name"
              value={formData.name}
              onChange={handleFormChange}
              required
            />
            <TextField
              id="leave-type-description"
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
    </Box>
  );
};

export default LeaveTypeManagementTab;