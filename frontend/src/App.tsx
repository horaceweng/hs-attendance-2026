// in frontend/src/App.tsx --- THEME-AWARE VERSION

import React from 'react';
import { BrowserRouter, Routes, Route, Link, Navigate } from 'react-router-dom';
import { Box, AppBar, Toolbar, Button, useMediaQuery, createTheme, ThemeProvider, CssBaseline } from '@mui/material';
import { LeaveRequestPage } from './pages/LeaveRequestPage';
import { AttendancePage } from './pages/AttendancePage';
import { ReportPage } from './pages/ReportPage';
import { StatisticsReportPage } from './pages/StatisticsReportPage';
import { LoginPage } from './pages/LoginPage';
import { AdminPage } from './pages/AdminPage';
import { TokenDebugPage } from './pages/TokenDebugPage';
import { ProtectedRoute } from './components/ProtectedRoute';
import { getDesignTokens } from './theme'; // <-- 導入我們的主題設定
import { getUserRole } from './services/auth'; // <-- 導入使用者角色函數

const Navigation = () => {
  const userRole = getUserRole();
  
  return (
    <AppBar position="static">
      <Toolbar>
        <Button color="inherit" component={Link} to="/reports">出缺勤報表</Button>
        <Button color="inherit" component={Link} to="/statistics">統計報表</Button>
        <Button color="inherit" component={Link} to="/attendance">每日點名</Button>
        <Button color="inherit" component={Link} to="/leave-request">請假登記</Button>
        {userRole === 'GA_specialist' && (
          <Button color="inherit" component={Link} to="/admin">系統管理</Button>
        )}
        <Button color="inherit" component={Link} to="/debug-token" sx={{ ml: 'auto' }}>查看登入狀態</Button>
      </Toolbar>
    </AppBar>
  );
};

function App() {
  // 1. 使用 MUI 的 useMediaQuery 來自動偵測使用者是否偏好深色模式
  const prefersDarkMode = useMediaQuery('(prefers-color-scheme: dark)');

  // 2. 根據偵測結果，動態建立對應的主題
  //    useMemo 用於效能優化，確保主題不會在每次渲染時都重新計算
  const theme = React.useMemo(
    () => createTheme(getDesignTokens(prefersDarkMode ? 'dark' : 'light')),
    [prefersDarkMode],
  );

  return (
    // 3. 使用 ThemeProvider 將我們建立的主題應用到整個應用程式
    <ThemeProvider theme={theme}>
      {/* 4. CssBaseline 是關鍵！它會設定好基礎樣式，例如根據主題自動切換背景色和文字顏色 */}
      <CssBaseline />
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route 
              path="/*" 
              element={
                <Box>
                  <Navigation />
                  <Box component="main" sx={{ p: 3 }}>
                    <Routes>
                      <Route path="reports" element={<ReportPage />} />
                      <Route path="statistics" element={<StatisticsReportPage />} />
                      <Route path="attendance" element={<AttendancePage />} />
                      <Route path="leave-request" element={<LeaveRequestPage />} />
                      <Route path="admin" element={<AdminPage />} />
                      <Route path="debug-token" element={<TokenDebugPage />} />
                      <Route index element={<Navigate to="/reports" replace />} />
                    </Routes>
                  </Box>
                </Box>
              } 
            />
          </Route>
        </Routes>
      </BrowserRouter>
    </ThemeProvider>
  );
}

export default App;