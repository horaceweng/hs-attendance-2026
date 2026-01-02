// src/pages/admin/PersonnelManagementTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  TextField,
  Tab,
  Tabs,
  IconButton,
  Tooltip,
  CircularProgress,
  Alert
} from '@mui/material';
import DeleteIcon from '@mui/icons-material/Delete';
import PersonAddIcon from '@mui/icons-material/PersonAdd';
import { getTeachers, getGASpecialists, createTeacher, createGASpecialist, deleteUser } from '../../services/api';

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
      id={`personnel-tabpanel-${index}`}
      aria-labelledby={`personnel-tab-${index}`}
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

interface User {
  id: number;
  name: string;
}

const PersonnelManagementTab: React.FC = () => {
  const [tabValue, setTabValue] = useState(0);
  const [teachers, setTeachers] = useState<User[]>([]);
  const [gaSpecialists, setGaSpecialists] = useState<User[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newUserName, setNewUserName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [deleteConfirmDialogOpen, setDeleteConfirmDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<User | null>(null);

  const loadPersonnel = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const [teachersRes, gaSpecialistsRes] = await Promise.all([
        getTeachers(),
        getGASpecialists()
      ]);
      setTeachers(teachersRes.data);
      setGaSpecialists(gaSpecialistsRes.data);
    } catch (err) {
      console.error('Failed to load personnel data:', err);
      setError('加載人員資料失敗');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadPersonnel();
  }, []);

  const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
    setTabValue(newValue);
  };

  const handleAddClick = () => {
    setNewUserName('');
    setIsAddDialogOpen(true);
  };

  const handleDialogClose = () => {
    setIsAddDialogOpen(false);
  };

  const handleAddUser = async () => {
    if (!newUserName.trim()) {
      setError('姓名不能為空');
      return;
    }
    
    setIsLoading(true);
    setError(null);
    
    try {
      if (tabValue === 0) { // Teachers tab
        await createTeacher({ name: newUserName.trim() });
        setSuccessMessage(`已成功新增導師 ${newUserName}`);
      } else { // GA Specialists tab
        await createGASpecialist({ name: newUserName.trim() });
        setSuccessMessage(`已成功新增行政老師 ${newUserName}`);
      }
      
      setIsAddDialogOpen(false);
      await loadPersonnel(); // Reload the lists
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err) {
      console.error('Failed to add user:', err);
      setError('新增人員失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteClick = (user: User) => {
    setUserToDelete(user);
    setDeleteConfirmDialogOpen(true);
  };

  const handleDeleteConfirm = async () => {
    if (!userToDelete) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      await deleteUser(userToDelete.id);
      setSuccessMessage(`已成功刪除 ${userToDelete.name}`);
      
      setDeleteConfirmDialogOpen(false);
      setUserToDelete(null);
      await loadPersonnel(); // Reload the lists
      
      // Auto-clear success message after 3 seconds
      setTimeout(() => {
        setSuccessMessage(null);
      }, 3000);
    } catch (err: any) {
      console.error('Failed to delete user:', err);
      setError(err.response?.data?.message || '刪除人員失敗');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteCancel = () => {
    setDeleteConfirmDialogOpen(false);
    setUserToDelete(null);
  };

  return (
    <Box>
      <Box sx={{ mb: 3, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography variant="h5">人員管理</Typography>
        <Button 
          variant="contained" 
          color="primary" 
          startIcon={<PersonAddIcon />}
          onClick={handleAddClick}
          disabled={isLoading}
        >
          新增{tabValue === 0 ? '導師' : '行政老師'}
        </Button>
      </Box>

      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

      {successMessage && (
        <Alert severity="success" sx={{ mb: 2 }}>
          {successMessage}
        </Alert>
      )}

      <Paper sx={{ width: '100%', mb: 2 }}>
        <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
          <Tabs value={tabValue} onChange={handleTabChange} aria-label="personnel tabs">
            <Tab label="導師" />
            <Tab label="行政老師" />
          </Tabs>
        </Box>

        <TabPanel value={tabValue} index={0}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>編號</TableCell>
                    <TableCell>姓名</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {teachers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">無導師資料</TableCell>
                    </TableRow>
                  ) : (
                    teachers.map((teacher) => (
                      <TableRow key={teacher.id}>
                        <TableCell>{teacher.id}</TableCell>
                        <TableCell>{teacher.name}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="刪除">
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteClick(teacher)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>

        <TabPanel value={tabValue} index={1}>
          {isLoading ? (
            <Box display="flex" justifyContent="center" p={3}>
              <CircularProgress />
            </Box>
          ) : (
            <TableContainer>
              <Table>
                <TableHead>
                  <TableRow>
                    <TableCell>編號</TableCell>
                    <TableCell>姓名</TableCell>
                    <TableCell align="right">操作</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {gaSpecialists.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} align="center">無行政老師資料</TableCell>
                    </TableRow>
                  ) : (
                    gaSpecialists.map((gaSpecialist) => (
                      <TableRow key={gaSpecialist.id}>
                        <TableCell>{gaSpecialist.id}</TableCell>
                        <TableCell>{gaSpecialist.name}</TableCell>
                        <TableCell align="right">
                          <Tooltip title="刪除">
                            <IconButton 
                              color="error"
                              onClick={() => handleDeleteClick(gaSpecialist)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </Tooltip>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          )}
        </TabPanel>
      </Paper>

      {/* Add User Dialog */}
      <Dialog open={isAddDialogOpen} onClose={handleDialogClose}>
        <DialogTitle>新增{tabValue === 0 ? '導師' : '行政老師'}</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            id="name"
            label="姓名"
            type="text"
            fullWidth
            variant="outlined"
            value={newUserName}
            onChange={(e) => setNewUserName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDialogClose}>取消</Button>
          <Button 
            onClick={handleAddUser} 
            variant="contained" 
            color="primary"
            disabled={isLoading || !newUserName.trim()}
          >
            {isLoading ? <CircularProgress size={24} /> : '新增'}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <Dialog open={deleteConfirmDialogOpen} onClose={handleDeleteCancel}>
        <DialogTitle>確認刪除</DialogTitle>
        <DialogContent>
          <Typography>
            確定要刪除 {userToDelete?.name} 嗎？此操作無法復原。
          </Typography>
          <Typography variant="caption" color="error" sx={{ mt: 1, display: 'block' }}>
            注意：如果此用戶已經有相關記錄（如班級指派、出缺勤記錄、請假單），則無法刪除。
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleDeleteCancel}>取消</Button>
          <Button 
            onClick={handleDeleteConfirm} 
            variant="contained" 
            color="error"
            disabled={isLoading}
          >
            {isLoading ? <CircularProgress size={24} /> : '刪除'}
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default PersonnelManagementTab;