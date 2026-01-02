// src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Paper, Alert } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { getUserRole } from '../services/auth';
import AcademicTermsTab from './admin/AcademicTermsTab';
import HolidaysTab from './admin/HolidaysTab';
import StudentManagementTab from './admin/StudentManagementTab';
import ClassManagementTab from './admin/ClassManagementTab';
import LeaveTypeManagementTab from './admin/LeaveTypeManagementTab';
import PersonnelManagementTab from './admin/PersonnelManagementTab';

interface TabPanelProps {
  children?: React.ReactNode;
  index: number;
  value: number;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`admin-tabpanel-${index}`}
      aria-labelledby={`admin-tab-${index}`}
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

function a11yProps(index: number) {
  return {
    id: `admin-tab-${index}`,
    'aria-controls': `admin-tabpanel-${index}`,
  };
}

export const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [debugInfo, setDebugInfo] = useState<string>('');

  useEffect(() => {
    // 檢查用戶角色，僅允許 GA_specialist 進入此頁面
    const role = getUserRole();
    setUserRole(role);
    setIsLoading(false);
    
    // 添加調試信息
    const token = localStorage.getItem('access_token');
    try {
      setDebugInfo(`Role from getUserRole: ${role}, Token exists: ${!!token}`);
      if (token) {
        console.log('Token exists in AdminPage:', token);
        console.log('User role in AdminPage:', role);
      }
    } catch (err) {
      console.error('Debug error:', err);
    }
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 如果用戶不是管理員，重定向到報表頁面
  if (!isLoading && userRole !== 'GA_specialist') {
    console.log(`Access denied to AdminPage. User role: ${userRole}`);
    return <Navigate to="/reports" replace />;
  }

  return (
    <Box sx={{ mt: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>系統管理</Typography>
      
      {debugInfo && (
        <Alert severity="info" sx={{ mb: 2 }}>
          調試信息: {debugInfo}
        </Alert>
      )}
      
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="管理員功能頁籤"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="學年學期管理" {...a11yProps(0)} />
            <Tab label="假日管理" {...a11yProps(1)} />
            <Tab label="學生管理" {...a11yProps(2)} />
            <Tab label="班級管理" {...a11yProps(3)} />
            <Tab label="假別管理" {...a11yProps(4)} />
            <Tab label="人員管理" {...a11yProps(5)} />
          </Tabs>
        </Box>
        
        <TabPanel value={tabValue} index={0}>
          <AcademicTermsTab />
        </TabPanel>
        
        <TabPanel value={tabValue} index={1}>
          <HolidaysTab />
        </TabPanel>
        
        <TabPanel value={tabValue} index={2}>
          <StudentManagementTab />
        </TabPanel>
        
        <TabPanel value={tabValue} index={3}>
          <ClassManagementTab />
        </TabPanel>
        
        <TabPanel value={tabValue} index={4}>
          <LeaveTypeManagementTab />
        </TabPanel>
        
        <TabPanel value={tabValue} index={5}>
          <PersonnelManagementTab />
        </TabPanel>
      </Paper>
    </Box>
  );
};