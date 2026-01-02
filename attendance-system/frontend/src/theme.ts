// in frontend/src/theme.ts
import type { PaletteMode } from '@mui/material';

// 這是一個函式，它會根據傳入的模式（'light' 或 'dark'）回傳對應的顏色主題設定
export const getDesignTokens = (mode: PaletteMode) => ({
  palette: {
    mode,
    ...(mode === 'light'
      // --- 淺色模式下的顏色設定 ---
      ? {
          primary: {
            main: '#1976d2', // 主要顏色 (例如按鈕)
          },
          background: {
            default: '#f4f6f8', // 頁面背景色
            paper: '#ffffff',   // 卡片、表格等元件的背景色
          },
        }
      // --- 深色模式下的顏色設定 ---
      : {
          primary: {
            main: '#90caf9', // 主要顏色
          },
          background: {
            default: '#121212', // 頁面背景色
            paper: '#1e1e1e',   // 卡片、表格等元件的背景色
          },
          text: {
            primary: '#ffffff', // 主要文字顏色
            secondary: '#b0b0b0',// 次要文字顏色
          }
        }),
  },
});