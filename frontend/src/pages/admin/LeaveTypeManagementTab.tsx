// src/pages/admin/LeaveTypeManagementTab.tsx
import React from 'react';
import {
  Box,
  Button,
  TextField,
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

interface LeaveType {
  id: number;
  name: string;
  description: string;
}

interface LeaveTypeFormData {
  name: string;
  description: string;
}

const emptyFormData: LeaveTypeFormData = {
  name: '',
  description: ''
};

const LeaveTypeManagementTab: React.FC = () => {
  const {
    data: leaveTypes,
    loading,
    error,
    dialogOpen,
    currentItem: currentLeaveType,
    formData,
    setFormData,
    openCreate,
    openEdit,
    closeDialog,
    submit,
    remove,
  } = useCrudResource<LeaveType, LeaveTypeFormData>({
    fetchFn: api.getLeaveTypes,
    createFn: api.createLeaveType,
    updateFn: api.updateLeaveType,
    deleteFn: api.deleteLeaveType,
    getId: (item) => item.id,
    emptyFormData,
    toFormData: (item) => ({ name: item.name, description: item.description }),
    fetchErrorMessage: '獲取假別資料失敗',
    submitErrorMessage: '提交失敗',
    deleteErrorMessage: '刪除失敗',
    deleteConfirmMessage: '確定要刪除此假別嗎?',
  });

  const handleFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value
    });
  };

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">假別管理</Typography>
        <Button variant="contained" onClick={openCreate}>
          新增假別
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <CrudTable<LeaveType>
        columns={[
          { header: '假別名稱', render: (leaveType) => leaveType.name },
          { header: '描述', render: (leaveType) => leaveType.description },
        ]}
        data={leaveTypes}
        loading={loading}
        getRowKey={(leaveType) => leaveType.id}
        emptyMessage="尚無假別資料"
        renderActions={(leaveType) => (
          <>
            <IconButton size="small" onClick={() => openEdit(leaveType)}>
              <EditIcon />
            </IconButton>
            <IconButton size="small" onClick={() => remove(leaveType)}>
              <DeleteIcon />
            </IconButton>
          </>
        )}
      />

      {/* 新增/編輯假別對話框 */}
      <CrudDialog
        open={dialogOpen}
        title={currentLeaveType ? '編輯假別' : '新增假別'}
        onClose={closeDialog}
        onSubmit={submit}
        submitDisabled={!formData.name.trim()}
      >
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
      </CrudDialog>
    </Box>
  );
};

export default LeaveTypeManagementTab;
