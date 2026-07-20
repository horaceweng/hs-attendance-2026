// src/hooks/useCrudResource.ts
// 抽出 admin 各分頁重複出現的「列表 + 新增/編輯對話框 + 刪除」樣板邏輯。
// 呼叫端傳入對應資源的 fetch/create/update/delete 函式（通常來自 services/api.ts），
// 由本 hook 統一管理 data/loading/error/對話框開關/表單狀態。
import { useCallback, useEffect, useState } from 'react';
import type { AxiosResponse } from 'axios';

export interface UseCrudResourceOptions<T, F> {
  /** 取得完整列表 */
  fetchFn: () => Promise<AxiosResponse<T[]>>;
  /** 新增一筆資料 */
  createFn: (data: F) => Promise<AxiosResponse<T>>;
  /** 更新既有資料 */
  updateFn: (id: number, data: F) => Promise<AxiosResponse<T>>;
  /** 刪除一筆資料 */
  deleteFn: (id: number) => Promise<AxiosResponse<unknown>>;
  /** 從資料項目取出主鍵 */
  getId: (item: T) => number;
  /** 新增對話框開啟時預設帶入的表單內容 */
  emptyFormData: F;
  /** 編輯對話框開啟時，將既有資料轉換為表單內容 */
  toFormData: (item: T) => F;
  /** 各階段錯誤訊息，可依資源自訂文字 */
  fetchErrorMessage?: string;
  submitErrorMessage?: string;
  deleteErrorMessage?: string;
  deleteConfirmMessage?: string;
}

export function useCrudResource<T, F>(options: UseCrudResourceOptions<T, F>) {
  const {
    fetchFn,
    createFn,
    updateFn,
    deleteFn,
    getId,
    emptyFormData,
    toFormData,
    fetchErrorMessage = '獲取資料失敗',
    submitErrorMessage = '提交失敗',
    deleteErrorMessage = '刪除失敗',
    deleteConfirmMessage = '確定要刪除嗎?',
  } = options;

  const [data, setData] = useState<T[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 對話框狀態
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentItem, setCurrentItem] = useState<T | null>(null);

  // 表單狀態
  const [formData, setFormData] = useState<F>(emptyFormData);

  const fetchAll = useCallback(async () => {
    setLoading(true);
    try {
      const response = await fetchFn();
      setData(response.data);
      setError(null);
    } catch (err) {
      setError(fetchErrorMessage);
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [fetchFn, fetchErrorMessage]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  const openCreate = useCallback(() => {
    setCurrentItem(null);
    setFormData(emptyFormData);
    setDialogOpen(true);
  }, [emptyFormData]);

  const openEdit = useCallback((item: T) => {
    setCurrentItem(item);
    setFormData(toFormData(item));
    setDialogOpen(true);
  }, [toFormData]);

  const closeDialog = useCallback(() => {
    setDialogOpen(false);
  }, []);

  const submit = useCallback(async () => {
    try {
      if (currentItem) {
        await updateFn(getId(currentItem), formData);
      } else {
        await createFn(formData);
      }

      setDialogOpen(false);
      await fetchAll(); // 重新獲取數據
      setError(null);
    } catch (err) {
      setError(submitErrorMessage);
      console.error(err);
    }
  }, [currentItem, formData, createFn, updateFn, getId, fetchAll, submitErrorMessage]);

  const remove = useCallback(async (item: T) => {
    if (!window.confirm(deleteConfirmMessage)) {
      return;
    }

    try {
      await deleteFn(getId(item));
      await fetchAll(); // 重新獲取數據
      setError(null);
    } catch (err) {
      setError(deleteErrorMessage);
      console.error(err);
    }
  }, [deleteFn, getId, fetchAll, deleteConfirmMessage, deleteErrorMessage]);

  return {
    data,
    loading,
    error,
    setError,
    dialogOpen,
    currentItem,
    formData,
    setFormData,
    fetchAll,
    openCreate,
    openEdit,
    closeDialog,
    submit,
    remove,
  };
}
