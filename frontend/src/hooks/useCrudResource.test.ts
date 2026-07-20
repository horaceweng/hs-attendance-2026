// useCrudResource 抽出了 admin 各分頁共用的「列表 + 新增/編輯對話框 + 刪除」樣板邏輯（#26）。
// 這裡驗證幾個最容易在重構中壞掉的行為：
// - fetch 成功時填入 data、失敗時設定 error
// - openCreate / openEdit 是否正確設定 dialog 狀態與 formData
// - submit 是否依 currentItem 是否存在，分別呼叫 createFn 或 updateFn，並在成功後重新 fetch
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { act, renderHook, waitFor } from '@testing-library/react';
import type { AxiosResponse } from 'axios';
import { useCrudResource } from './useCrudResource';

interface Item {
  id: number;
  name: string;
}

interface ItemFormData {
  name: string;
}

function mockResponse<T>(data: T): AxiosResponse<T> {
  return { data } as AxiosResponse<T>;
}

const emptyFormData: ItemFormData = { name: '' };
const toFormData = (item: Item): ItemFormData => ({ name: item.name });
const getId = (item: Item) => item.id;

describe('useCrudResource', () => {
  beforeEach(() => {
    vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('populates data after a successful fetch', async () => {
    const items: Item[] = [{ id: 1, name: 'Alice' }];
    const fetchFn = vi.fn(() => Promise.resolve(mockResponse(items)));

    const { result } = renderHook(() =>
      useCrudResource<Item, ItemFormData>({
        fetchFn,
        createFn: vi.fn(),
        updateFn: vi.fn(),
        deleteFn: vi.fn(),
        getId,
        emptyFormData,
        toFormData,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual(items);
    expect(result.current.error).toBeNull();
  });

  it('sets an error message when fetch fails', async () => {
    const fetchFn = vi.fn(() => Promise.reject(new Error('network down')));

    const { result } = renderHook(() =>
      useCrudResource<Item, ItemFormData>({
        fetchFn,
        createFn: vi.fn(),
        updateFn: vi.fn(),
        deleteFn: vi.fn(),
        getId,
        emptyFormData,
        toFormData,
        fetchErrorMessage: '獲取項目失敗',
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    expect(result.current.data).toEqual([]);
    expect(result.current.error).toBe('獲取項目失敗');
  });

  it('openCreate opens the dialog with no current item and empty form data', async () => {
    const fetchFn = vi.fn(() => Promise.resolve(mockResponse<Item[]>([])));

    const { result } = renderHook(() =>
      useCrudResource<Item, ItemFormData>({
        fetchFn,
        createFn: vi.fn(),
        updateFn: vi.fn(),
        deleteFn: vi.fn(),
        getId,
        emptyFormData,
        toFormData,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.openCreate();
    });

    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.currentItem).toBeNull();
    expect(result.current.formData).toEqual(emptyFormData);
  });

  it('openEdit opens the dialog with the given item and its form data', async () => {
    const item: Item = { id: 42, name: 'Bob' };
    const fetchFn = vi.fn(() => Promise.resolve(mockResponse<Item[]>([item])));

    const { result } = renderHook(() =>
      useCrudResource<Item, ItemFormData>({
        fetchFn,
        createFn: vi.fn(),
        updateFn: vi.fn(),
        deleteFn: vi.fn(),
        getId,
        emptyFormData,
        toFormData,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));

    act(() => {
      result.current.openEdit(item);
    });

    expect(result.current.dialogOpen).toBe(true);
    expect(result.current.currentItem).toEqual(item);
    expect(result.current.formData).toEqual(toFormData(item));
  });

  it('submit calls createFn (not updateFn) when there is no current item, then refetches', async () => {
    const fetchFn = vi.fn(() => Promise.resolve(mockResponse<Item[]>([])));
    const createFn = vi.fn(() => Promise.resolve(mockResponse({ id: 1, name: 'New' })));
    const updateFn = vi.fn(() => Promise.resolve(mockResponse({ id: 1, name: 'New' })));

    const { result } = renderHook(() =>
      useCrudResource<Item, ItemFormData>({
        fetchFn,
        createFn,
        updateFn,
        deleteFn: vi.fn(),
        getId,
        emptyFormData,
        toFormData,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchFn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.openCreate();
    });
    act(() => {
      result.current.setFormData({ name: 'New Item' });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(createFn).toHaveBeenCalledWith({ name: 'New Item' });
    expect(updateFn).not.toHaveBeenCalled();
    expect(result.current.dialogOpen).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });

  it('submit calls updateFn (not createFn) when there is a current item, then refetches', async () => {
    const item: Item = { id: 7, name: 'Existing' };
    const fetchFn = vi.fn(() => Promise.resolve(mockResponse<Item[]>([item])));
    const createFn = vi.fn(() => Promise.resolve(mockResponse(item)));
    const updateFn = vi.fn(() => Promise.resolve(mockResponse(item)));

    const { result } = renderHook(() =>
      useCrudResource<Item, ItemFormData>({
        fetchFn,
        createFn,
        updateFn,
        deleteFn: vi.fn(),
        getId,
        emptyFormData,
        toFormData,
      }),
    );

    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(fetchFn).toHaveBeenCalledTimes(1);

    act(() => {
      result.current.openEdit(item);
    });
    act(() => {
      result.current.setFormData({ name: 'Updated Name' });
    });

    await act(async () => {
      await result.current.submit();
    });

    expect(updateFn).toHaveBeenCalledWith(item.id, { name: 'Updated Name' });
    expect(createFn).not.toHaveBeenCalled();
    expect(result.current.dialogOpen).toBe(false);
    expect(fetchFn).toHaveBeenCalledTimes(2);
  });
});
