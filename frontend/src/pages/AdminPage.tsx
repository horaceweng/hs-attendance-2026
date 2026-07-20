// src/pages/AdminPage.tsx
import React, { useState, useEffect } from 'react';
import { Box, Tabs, Tab, Typography, Paper } from '@mui/material';
import { Navigate } from 'react-router-dom';
import { getUserRole } from '../services/auth';
import { TabPanel, a11yProps } from '../components/TabPanel';
import AcademicTermsTab from './admin/AcademicTermsTab';
import HolidaysTab from './admin/HolidaysTab';
import StudentManagementTab from './admin/StudentManagementTab';
import ClassManagementTab from './admin/ClassManagementTab';
import LeaveTypeManagementTab from './admin/LeaveTypeManagementTab';
import PersonnelManagementTab from './admin/PersonnelManagementTab';

const TAB_PREFIX = 'admin-tab';

export const AdminPage: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [userRole, setUserRole] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // 檢查用戶角色，僅允許 GA_specialist 進入此頁面
    const role = getUserRole();
    setUserRole(role);
    setIsLoading(false);
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  // 如果用戶不是管理員，重定向到報表頁面
  if (!isLoading && userRole !== 'GA_specialist') {
    return <Navigate to="/reports" replace />;
  }

  return (
    <Box sx={{ mt: 3, maxWidth: 1200, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>系統管理</Typography>
      
      <Paper sx={{ width: '100%' }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs 
            value={tabValue} 
            onChange={handleTabChange} 
            aria-label="管理員功能頁籤"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="學年學期管理" {...a11yProps(TAB_PREFIX, 0)} />
            <Tab label="假日管理" {...a11yProps(TAB_PREFIX, 1)} />
            <Tab label="學生管理" {...a11yProps(TAB_PREFIX, 2)} />
            <Tab label="班級管理" {...a11yProps(TAB_PREFIX, 3)} />
            <Tab label="假別管理" {...a11yProps(TAB_PREFIX, 4)} />
            <Tab label="人員管理" {...a11yProps(TAB_PREFIX, 5)} />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0} prefix={TAB_PREFIX}>
          <AcademicTermsTab />
        </TabPanel>

        <TabPanel value={tabValue} index={1} prefix={TAB_PREFIX}>
          <HolidaysTab />
        </TabPanel>

        <TabPanel value={tabValue} index={2} prefix={TAB_PREFIX}>
          <StudentManagementTab />
        </TabPanel>

        <TabPanel value={tabValue} index={3} prefix={TAB_PREFIX}>
          <ClassManagementTab />
        </TabPanel>

        <TabPanel value={tabValue} index={4} prefix={TAB_PREFIX}>
          <LeaveTypeManagementTab />
        </TabPanel>

        <TabPanel value={tabValue} index={5} prefix={TAB_PREFIX}>
          <PersonnelManagementTab />
        </TabPanel>
      </Paper>
    </Box>
  );
};