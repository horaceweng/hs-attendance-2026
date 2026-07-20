// src/components/admin/CrudDialog.tsx
// 各 admin 分頁共用的新增/編輯對話框外殼：標題、開關、確認/取消按鈕由本元件處理，
// 表單內容差異很大，一律以 children 傳入。
import React from 'react';
import {
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
} from '@mui/material';
import type { DialogProps } from '@mui/material/Dialog';

export interface CrudDialogProps {
  open: boolean;
  title: React.ReactNode;
  onClose: () => void;
  onSubmit: () => void;
  submitDisabled?: boolean;
  submitLabel?: string;
  cancelLabel?: string;
  maxWidth?: DialogProps['maxWidth'];
  fullWidth?: boolean;
  children: React.ReactNode;
}

function CrudDialog({
  open,
  title,
  onClose,
  onSubmit,
  submitDisabled = false,
  submitLabel = '提交',
  cancelLabel = '取消',
  maxWidth = 'sm',
  fullWidth = true,
  children,
}: CrudDialogProps) {
  return (
    <Dialog open={open} onClose={onClose} maxWidth={maxWidth} fullWidth={fullWidth}>
      <DialogTitle>{title}</DialogTitle>
      <DialogContent>{children}</DialogContent>
      <DialogActions>
        <Button onClick={onClose}>{cancelLabel}</Button>
        <Button onClick={onSubmit} variant="contained" disabled={submitDisabled}>
          {submitLabel}
        </Button>
      </DialogActions>
    </Dialog>
  );
}

export default CrudDialog;
