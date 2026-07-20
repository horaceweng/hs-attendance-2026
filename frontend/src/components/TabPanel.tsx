// src/components/TabPanel.tsx
// AdminPage 與 PersonnelManagementTab 都各自定義了一份幾乎相同的 TabPanel / a11yProps，
// 抽到這裡共用。用 prefix 區分不同頁面產生的 DOM id，避免同一頁面出現重複 id。
import React from 'react';
import { Box } from '@mui/material';

export interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
  /** 用於產生 DOM id 的前綴，同一頁面內有多組 Tabs 時用來避免 id 重複 */
  prefix?: string;
}

export function TabPanel(props: TabPanelProps) {
  const { children, value, index, prefix = 'tab', ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`${prefix}panel-${index}`}
      aria-labelledby={`${prefix}-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

export function a11yProps(prefix: string, index: number) {
  return {
    id: `${prefix}-${index}`,
    'aria-controls': `${prefix}panel-${index}`,
  };
}
