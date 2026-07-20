// src/components/admin/CrudTable.tsx
// 各 admin 分頁共用的泛型表格：欄位定義（標題 + render function）由呼叫端提供，
// 本元件只負責處理 loading 骨架、空資料列，以及每列的操作按鈕（renderActions）。
import React from 'react';
import {
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
} from '@mui/material';

export interface CrudColumn<T> {
  header: string;
  align?: 'left' | 'right' | 'center';
  render: (item: T) => React.ReactNode;
}

export interface CrudTableProps<T> {
  columns: CrudColumn<T>[];
  data: T[];
  loading: boolean;
  getRowKey: (item: T) => React.Key;
  /** 每列的操作按鈕（例如編輯／刪除／其他自訂動作），不提供則不顯示操作欄 */
  renderActions?: (item: T) => React.ReactNode;
  actionsHeader?: string;
  emptyMessage?: string;
  loadingMessage?: string;
}

function CrudTable<T>({
  columns,
  data,
  loading,
  getRowKey,
  renderActions,
  actionsHeader = '操作',
  emptyMessage = '尚無資料',
  loadingMessage = '載入中...',
}: CrudTableProps<T>) {
  const columnCount = columns.length + (renderActions ? 1 : 0);

  return (
    <TableContainer component={Paper}>
      <Table>
        <TableHead>
          <TableRow>
            {columns.map((column, index) => (
              <TableCell key={index} align={column.align}>
                {column.header}
              </TableCell>
            ))}
            {renderActions && <TableCell align="right">{actionsHeader}</TableCell>}
          </TableRow>
        </TableHead>
        <TableBody>
          {loading ? (
            <TableRow>
              <TableCell colSpan={columnCount} align="center">
                {loadingMessage}
              </TableCell>
            </TableRow>
          ) : data.length === 0 ? (
            <TableRow>
              <TableCell colSpan={columnCount} align="center">
                {emptyMessage}
              </TableCell>
            </TableRow>
          ) : (
            data.map((item) => (
              <TableRow key={getRowKey(item)}>
                {columns.map((column, index) => (
                  <TableCell key={index} align={column.align}>
                    {column.render(item)}
                  </TableCell>
                ))}
                {renderActions && <TableCell align="right">{renderActions(item)}</TableCell>}
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </TableContainer>
  );
}

export default CrudTable;
