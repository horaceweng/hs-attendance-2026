// Vitest 全域測試設定：引入 @testing-library/jest-dom 的 matcher（如
// toBeInTheDocument、toHaveTextContent 等），讓 expect() 斷言更貼近 DOM 語意。
// 使用 /vitest 子路徑可自動將型別擴充到 vitest 的 expect 上。
import '@testing-library/jest-dom/vitest';
import { afterEach } from 'vitest';
import { cleanup } from '@testing-library/react';

// 因為未啟用 vitest 的 globals 模式（避免 tsc/eslint 需額外設定 ambient types），
// @testing-library/react 無法自動偵測到全域 afterEach 來註冊卸載邏輯，
// 需要在這裡手動註冊，確保每個測試結束後都會卸載已渲染的元件，避免多個測試間 DOM 殘留。
afterEach(() => {
  cleanup();
});
