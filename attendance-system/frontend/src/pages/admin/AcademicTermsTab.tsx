// src/pages/admin/AcademicTermsTab.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Button, TextField, Paper, Table, TableBody, TableCell, TableContainer, 
  TableHead, TableRow, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, IconButton, Alert,
  Typography, Accordion, AccordionSummary, AccordionDetails, Grid
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import DeleteIcon from '@mui/icons-material/Delete';
import EditIcon from '@mui/icons-material/Edit';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import * as api from '../../services/api';

interface AcademicYear {
  id: number;
  year: number;
  name: string;
  startDate: string;
  endDate: string;
  isActive: boolean;
  autoPromoteStudents?: boolean; // 添加這個字段用於學生自動升級
}

interface Season {
  id: number;
  name: string;
  type: 'fall' | 'winter' | 'spring' | 'summer';
  startDate: string;
  endDate: string;
  academicYearId: number;
  isActive: boolean;
}

// Helper interface for grouped seasons
interface SeasonGroup {
  fall?: Season;
  winter?: Season;
  spring?: Season;
  summer?: Season;
}

const AcademicTermsTab: React.FC = () => {
  const [academicYears, setAcademicYears] = useState<AcademicYear[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  
  // Dialog states
  const [yearDialogOpen, setYearDialogOpen] = useState(false);
  const [seasonDialogOpen, setSeasonDialogOpen] = useState(false);
  const [currentYear, setCurrentYear] = useState<AcademicYear | null>(null);
  const [currentSeason, setCurrentSeason] = useState<Season | null>(null);
  const [seasonType, setSeasonType] = useState<'fall' | 'winter' | 'spring' | 'summer'>('fall');
  
  // Form states
  const [yearForm, setYearForm] = useState({
    year: new Date().getFullYear(),
    name: `${new Date().getFullYear()}-${new Date().getFullYear() + 1} 學年`,
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setFullYear(new Date().getFullYear() + 1)).toISOString().split('T')[0],
    isActive: true,
    autoPromoteStudents: false
  });
  
  const [seasonForm, setSeasonForm] = useState({
    name: '',
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date(new Date().setMonth(new Date().getMonth() + 3)).toISOString().split('T')[0],
    isActive: true
  });

  // Fetch data from API
  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [yearsRes, seasonsRes] = await Promise.all([
          api.getAcademicYears(),
          api.getSeasons()
        ]);
        
        // 確保 isActive 是布爾值
        const processedYears = Array.isArray(yearsRes.data) ? yearsRes.data.map(year => ({
          ...year,
          isActive: year.isActive === true || year.isActive === 1 || year.isActive === '1' || year.isActive === 'true'
        })) : [];
        
        console.log('原始學年數據:', yearsRes.data);
        console.log('處理後學年數據:', processedYears);
        
        setAcademicYears(processedYears);
        setSeasons(seasonsRes.data);
      } catch (err) {
        setError("獲取資料失敗");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Group seasons by academic year
  const groupedSeasons = academicYears.reduce<Record<number, SeasonGroup>>((acc, year) => {
    const yearSeasons = seasons.filter(s => s.academicYearId === year.id);
    
    acc[year.id] = {
      fall: yearSeasons.find(s => s.type === 'fall'),
      winter: yearSeasons.find(s => s.type === 'winter'),
      spring: yearSeasons.find(s => s.type === 'spring'),
      summer: yearSeasons.find(s => s.type === 'summer')
    };
    
    return acc;
  }, {});

  const handleYearFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    
    // 如果是修改學年欄位，自動更新名稱為對應的民國學年
    if (name === 'year') {
      const westernYear = parseInt(value);
      if (!isNaN(westernYear)) {
        const rocYear = toROCYear(westernYear);
        setYearForm({
          ...yearForm,
          year: westernYear,
          name: `${rocYear}學年`
        });
        return;
      }
    }
    
    // 其他欄位的一般處理
    setYearForm({
      ...yearForm,
      [name]: value
    });
  };
  
  const handleYearActivateChange = (e: SelectChangeEvent) => {
    setYearForm({
      ...yearForm,
      isActive: e.target.value === 'true'
    });
  };
  
  const handleSeasonFormChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setSeasonForm({
      ...seasonForm,
      [name]: value
    });
  };

  // 西元年轉民國年
  const toROCYear = (westernYear: number): number => {
    return westernYear - 1911;
  };

  const openAddYearDialog = () => {
    const currentYear = new Date().getFullYear();
    const rocYear = toROCYear(currentYear);
    
    setCurrentYear(null);
    setYearForm({
      year: currentYear,
      name: `${rocYear}學年`,
      startDate: new Date().toISOString().split('T')[0],
      endDate: new Date(new Date().setFullYear(currentYear + 1)).toISOString().split('T')[0],
      isActive: true,
      autoPromoteStudents: false
    });
    setYearDialogOpen(true);
  };
  
  const openEditYearDialog = (year: AcademicYear) => {
    // 確保日期格式是 YYYY-MM-DD
    const formatDate = (dateString: string) => {
      if (!dateString) return '';
      const date = new Date(dateString);
      return date.toISOString().split('T')[0];
    };

    setCurrentYear(year);
    setYearForm({
      year: year.year,
      name: year.name,
      startDate: formatDate(year.startDate),
      endDate: formatDate(year.endDate),
      isActive: year.isActive,
      autoPromoteStudents: false // 預設為 false，因為編輯現有學年時不應自動升級
    });
    setYearDialogOpen(true);
  };
  
  const openEditSeasonDialog = (year: AcademicYear, type: 'fall' | 'winter' | 'spring' | 'summer') => {
    const existingSeason = seasons.find(s => s.academicYearId === year.id && s.type === type);
    setCurrentYear(year);
    setSeasonType(type);
    
    // Determine default dates based on season type
    let defaultStartDate = new Date(year.startDate);
    let defaultEndDate = new Date(year.startDate);
    
    // Set season default dates
    switch(type) {
      case 'fall':
        // Fall is typically from August/September to November
        defaultStartDate = new Date(year.year, 7, 1); // August 1st
        defaultEndDate = new Date(year.year, 10, 30); // November 30th
        break;
      case 'winter':
        // Winter is typically from December to February
        defaultStartDate = new Date(year.year, 11, 1); // December 1st
        defaultEndDate = new Date(year.year + 1, 1, 28); // February 28th of next year
        break;
      case 'spring':
        // Spring is typically from March to May
        defaultStartDate = new Date(year.year + 1, 2, 1); // March 1st of next year
        defaultEndDate = new Date(year.year + 1, 4, 31); // May 31st of next year
        break;
      case 'summer':
        // Summer is typically from June to July
        defaultStartDate = new Date(year.year + 1, 5, 1); // June 1st of next year
        defaultEndDate = new Date(year.year + 1, 6, 31); // July 31st of next year
        break;
    }
    
    if (existingSeason) {
      setCurrentSeason(existingSeason);
      setSeasonForm({
        name: existingSeason.name,
        startDate: existingSeason.startDate,
        endDate: existingSeason.endDate,
        isActive: existingSeason.isActive
      });
    } else {
      setCurrentSeason(null);
      setSeasonForm({
        name: `${year.year} ${formatSeasonType(type)}學期`,
        startDate: defaultStartDate.toISOString().split('T')[0],
        endDate: defaultEndDate.toISOString().split('T')[0],
        isActive: true
      });
    }
    
    setSeasonDialogOpen(true);
  };

  const handleSubmitYear = async () => {
    try {
      let newYearId;
      
      if (currentYear) {
        // Edit existing year - only update isActive status
        const updateData = { 
          isActive: yearForm.isActive,
          startDate: yearForm.startDate,
          endDate: yearForm.endDate,
          year: yearForm.year,
          name: yearForm.name
        };
        await api.updateAcademicYear(currentYear.id, updateData);
        setAcademicYears(prev => prev.map(y => 
          y.id === currentYear.id ? { ...y, isActive: yearForm.isActive } : y
        ));
        newYearId = currentYear.id;
        
        // Show feedback based on the new status
        const message = yearForm.isActive ? "學年已設為啟用狀態" : "學年已設為停用狀態";
        
        // Update the UI to show a success message
        setSuccessMessage(message);
        setTimeout(() => setSuccessMessage(null), 3000);
      } else {
        // Create new year
        const { autoPromoteStudents, ...yearData } = yearForm;
        const res = await api.createAcademicYear(yearData);
        setAcademicYears(prev => [...prev, res.data]);
        newYearId = res.data.id;
        
        // 如果勾選了自動升級學生，則調用相應API
        if (autoPromoteStudents) {
          try {
            const promotionResult = await api.promoteStudents(newYearId);
            console.log('升級結果:', promotionResult.data);
            
            if (promotionResult.data && typeof promotionResult.data === 'object') {
              let message = '';
              
              if (promotionResult.data.success) {
                const { promoted, graduated } = promotionResult.data;
                message = `學生升級完成！${promoted} 名學生升至下一年級，${graduated} 名學生畢業。`;
              } else if (promotionResult.data.message) {
                message = `處理結果: ${promotionResult.data.message}`;
              } else if (promotionResult.data.promoted !== undefined && promotionResult.data.graduated !== undefined) {
                const { promoted, graduated } = promotionResult.data;
                message = `學生升級完成！${promoted} 名學生升至下一年級，${graduated} 名學生畢業。`;
              } else {
                message = '學生升級已完成，但未返回詳細結果';
              }
              
              setSuccessMessage(message);
              setTimeout(() => setSuccessMessage(null), 8000);
            } else {
              setSuccessMessage('學生升級已完成');
              setTimeout(() => setSuccessMessage(null), 5000);
            }
          } catch (error) {
            console.error('學生升級失敗:', error);
            setError('學生升級失敗，請檢查系統日誌');
            setTimeout(() => setError(null), 5000);
          }
        }
        
        // Automatically create 4 seasons for this academic year
        const seasonTypes: ('fall' | 'winter' | 'spring' | 'summer')[] = ['fall', 'winter', 'spring', 'summer'];
        const newSeasons: Season[] = [];
        
        for (const type of seasonTypes) {
          // Set season default dates
          let startDate = new Date(yearForm.startDate);
          let endDate = new Date(yearForm.startDate);
          
          switch(type) {
            case 'fall':
              startDate = new Date(yearForm.year, 7, 1);
              endDate = new Date(yearForm.year, 10, 30);
              break;
            case 'winter':
              startDate = new Date(yearForm.year, 11, 1);
              endDate = new Date(yearForm.year + 1, 1, 28);
              break;
            case 'spring':
              startDate = new Date(yearForm.year + 1, 2, 1);
              endDate = new Date(yearForm.year + 1, 4, 31);
              break;
            case 'summer':
              startDate = new Date(yearForm.year + 1, 5, 1);
              endDate = new Date(yearForm.year + 1, 6, 31);
              break;
          }
          
          // Create the season
          const seasonData = {
            name: `${yearForm.year} ${formatSeasonType(type)}學期`,
            type,
            startDate: startDate.toISOString().split('T')[0],
            endDate: endDate.toISOString().split('T')[0],
            academicYearId: newYearId,
            isActive: true
          };
          
          const newSeason = await api.createSeason(seasonData);
          newSeasons.push(newSeason.data);
        }
        
        setSeasons(prev => [...prev, ...newSeasons]);
      }
      
      setYearDialogOpen(false);
    } catch (err) {
      setError("提交失敗");
      console.error(err);
    }
  };
  
  const handleSubmitSeason = async () => {
    if (!currentYear) return;
    
    try {
      const seasonData = {
        ...seasonForm,
        type: seasonType,
        academicYearId: currentYear.id
      };
      
      if (currentSeason) {
        // Update existing season
        await api.updateSeason(currentSeason.id, seasonData);
        setSeasons(prev => prev.map(s => 
          s.id === currentSeason.id ? { ...s, ...seasonData, id: s.id } : s
        ));
      } else {
        // Create new season
        const res = await api.createSeason(seasonData);
        setSeasons(prev => [...prev, res.data]);
      }
      
      setSeasonDialogOpen(false);
    } catch (err) {
      setError("提交失敗");
      console.error(err);
    }
  };

  const handleDeleteYear = async (id: number) => {
    if (!window.confirm("確定要刪除此學年嗎? 這會連帶刪除相關的所有學季資料!")) {
      return;
    }
    
    try {
      await api.deleteAcademicYear(id);
      setAcademicYears(prev => prev.filter(y => y.id !== id));
      setSeasons(prev => prev.filter(s => s.academicYearId !== id));
    } catch (err) {
      setError("刪除失敗");
      console.error(err);
    }
  };

  // Convert season type to Chinese
  const formatSeasonType = (type: string) => {
    const types: Record<string, string> = {
      fall: '秋季',
      winter: '冬季',
      spring: '春季',
      summer: '夏季'
    };
    return types[type] || type;
  };
  
  // Get the semester name based on season type
  const getSemesterForSeason = (type: string) => {
    if (type === 'fall' || type === 'winter') {
      return '上學期 (第一學期)';
    } else {
      return '下學期 (第二學期)';
    }
  };

  // Render academic years and their seasons
  const renderAcademicYearsContent = () => (
    <Box>
      {academicYears.map((year) => (
        <Accordion key={year.id} defaultExpanded sx={{ mb: 2 }}>
          <AccordionSummary expandIcon={<ExpandMoreIcon />}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', width: '100%', alignItems: 'center' }}>
              <Typography variant="subtitle1" fontWeight="bold">
                {year.name} ({Boolean(year.isActive) ? '啟用中' : '已停用'})
              </Typography>
              <Box>
                <IconButton 
                  size="small" 
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation();
                    openEditYearDialog(year);
                  }}
                >
                  <EditIcon />
                </IconButton>
                <IconButton 
                  size="small" 
                  component="span"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteYear(year.id);
                  }}
                >
                  <DeleteIcon />
                </IconButton>
              </Box>
            </Box>
          </AccordionSummary>
          <AccordionDetails>
            <Box sx={{ mb: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                學年起始日: {year.startDate} | 學年結束日: {year.endDate}
              </Typography>
            </Box>
            
            <Box sx={{ mb: 3 }}>
              <Typography variant="subtitle2" gutterBottom>上學期 (第一學期)</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>學季</TableCell>
                      <TableCell>名稱</TableCell>
                      <TableCell>起始日</TableCell>
                      <TableCell>結束日</TableCell>
                      <TableCell>狀態</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['fall', 'winter'].map((type) => {
                      const season = groupedSeasons[year.id]?.[type as keyof SeasonGroup];
                      return (
                        <TableRow key={`${year.id}-${type}`}>
                          <TableCell>{formatSeasonType(type)}</TableCell>
                          <TableCell>{season?.name || '-'}</TableCell>
                          <TableCell>{season?.startDate || '-'}</TableCell>
                          <TableCell>{season?.endDate || '-'}</TableCell>
                          <TableCell>
                            {season ? (season.isActive ? '啟用' : '停用') : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => openEditSeasonDialog(year, type as 'fall' | 'winter')}
                            >
                              {season ? '編輯' : '設定'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
            
            <Box>
              <Typography variant="subtitle2" gutterBottom>下學期 (第二學期)</Typography>
              <TableContainer component={Paper}>
                <Table size="small">
                  <TableHead>
                    <TableRow>
                      <TableCell>學季</TableCell>
                      <TableCell>名稱</TableCell>
                      <TableCell>起始日</TableCell>
                      <TableCell>結束日</TableCell>
                      <TableCell>狀態</TableCell>
                      <TableCell align="right">操作</TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {['spring', 'summer'].map((type) => {
                      const season = groupedSeasons[year.id]?.[type as keyof SeasonGroup];
                      return (
                        <TableRow key={`${year.id}-${type}`}>
                          <TableCell>{formatSeasonType(type)}</TableCell>
                          <TableCell>{season?.name || '-'}</TableCell>
                          <TableCell>{season?.startDate || '-'}</TableCell>
                          <TableCell>{season?.endDate || '-'}</TableCell>
                          <TableCell>
                            {season ? (season.isActive ? '啟用' : '停用') : '-'}
                          </TableCell>
                          <TableCell align="right">
                            <Button 
                              size="small" 
                              variant="outlined"
                              onClick={() => openEditSeasonDialog(year, type as 'spring' | 'summer')}
                            >
                              {season ? '編輯' : '設定'}
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </TableContainer>
            </Box>
          </AccordionDetails>
        </Accordion>
      ))}
    </Box>
  );

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h5">學年學期管理</Typography>
        <Button variant="contained" onClick={openAddYearDialog}>
          新增學年
        </Button>
      </Box>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      {successMessage && <Alert severity="success" sx={{ mb: 2 }}>{successMessage}</Alert>}
      
      {loading ? (
        <Typography>載入中...</Typography>
      ) : academicYears.length === 0 ? (
        <Typography color="text.secondary">尚無學年資料</Typography>
      ) : (
        renderAcademicYearsContent()
      )}
      
      {/* 新增/編輯學年對話框 */}
      <Dialog 
        open={yearDialogOpen} 
        onClose={() => setYearDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>{currentYear ? '變更學年啟用狀態' : '新增學年'}</DialogTitle>
        <DialogContent>
          {currentYear && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              在編輯模式下，您只能更改學年的啟用狀態。其他資料將以唯讀方式顯示。
            </Typography>
          )}
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                fullWidth
                label="學年"
                name="year"
                type="number"
                value={yearForm.year}
                onChange={handleYearFormChange}
                helperText={currentYear ? "唯讀" : "請輸入西元年，例如：2025"}
                disabled={!!currentYear}
                InputProps={{
                  readOnly: !!currentYear
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                fullWidth
                label="名稱"
                name="name"
                value={yearForm.name}
                onChange={handleYearFormChange}
                helperText={currentYear ? "唯讀" : "將自動設為民國年，例如：114學年"}
                disabled={!!currentYear}
                InputProps={{
                  readOnly: !!currentYear
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                fullWidth
                label="開始日期"
                name="startDate"
                type="date"
                value={yearForm.startDate}
                onChange={handleYearFormChange}
                InputLabelProps={{ shrink: true }}
                helperText={currentYear ? "唯讀" : ""}
                disabled={!!currentYear}
                InputProps={{
                  readOnly: !!currentYear
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                fullWidth
                label="結束日期"
                name="endDate"
                type="date"
                value={yearForm.endDate}
                onChange={handleYearFormChange}
                InputLabelProps={{ shrink: true }}
                helperText={currentYear ? "唯讀" : ""}
                disabled={!!currentYear}
                InputProps={{
                  readOnly: !!currentYear
                }}
              />
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <FormControl fullWidth>
                <InputLabel>狀態</InputLabel>
                <Select
                  value={yearForm.isActive ? 'true' : 'false'}
                  label="狀態"
                  onChange={handleYearActivateChange}
                >
                  <MenuItem value="true">啟用</MenuItem>
                  <MenuItem value="false">停用</MenuItem>
                </Select>
                <Typography variant="caption" color="info.main" sx={{ mt: 1, display: 'block' }}>
                  {currentYear ? "唯一可編輯的欄位" : ""}
                </Typography>
              </FormControl>
            </Grid>
            {!currentYear && (
              <Grid sx={{ gridColumn: 'span 12' }}>
                <FormControl fullWidth>
                  <InputLabel>自動升級學生</InputLabel>
                  <Select
                    value={yearForm.autoPromoteStudents ? 'true' : 'false'}
                    label="自動升級學生"
                    onChange={(e) => {
                      setYearForm({
                        ...yearForm,
                        autoPromoteStudents: e.target.value === 'true'
                      });
                    }}
                  >
                    <MenuItem value="true">自動升級學生至下一年級</MenuItem>
                    <MenuItem value="false">不自動升級</MenuItem>
                  </Select>
                </FormControl>
              </Grid>
            )}
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setYearDialogOpen(false)}>取消</Button>
          <Button onClick={handleSubmitYear} variant="contained">提交</Button>
        </DialogActions>
      </Dialog>
      
      {/* 編輯學季對話框 */}
      <Dialog 
        open={seasonDialogOpen} 
        onClose={() => setSeasonDialogOpen(false)} 
        maxWidth="sm" 
        fullWidth
      >
        <DialogTitle>
          {currentYear?.name} - {formatSeasonType(seasonType)}學季設定
          <Typography variant="caption" display="block" color="text.secondary">
            {getSemesterForSeason(seasonType)}
          </Typography>
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <TextField
                fullWidth
                label="名稱"
                name="name"
                value={seasonForm.name}
                onChange={handleSeasonFormChange}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                fullWidth
                label="開始日期"
                name="startDate"
                type="date"
                value={seasonForm.startDate}
                onChange={handleSeasonFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid sx={{ gridColumn: { xs: 'span 12', sm: 'span 6' } }}>
              <TextField
                fullWidth
                label="結束日期"
                name="endDate"
                type="date"
                value={seasonForm.endDate}
                onChange={handleSeasonFormChange}
                InputLabelProps={{ shrink: true }}
              />
            </Grid>
            <Grid sx={{ gridColumn: 'span 12' }}>
              <FormControl fullWidth>
                <InputLabel>狀態</InputLabel>
                <Select
                  value={seasonForm.isActive ? 'true' : 'false'}
                  label="狀態"
                  onChange={(e) => setSeasonForm({
                    ...seasonForm,
                    isActive: e.target.value === 'true'
                  })}
                >
                  <MenuItem value="true">啟用</MenuItem>
                  <MenuItem value="false">停用</MenuItem>
                </Select>
              </FormControl>
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setSeasonDialogOpen(false)}>取消</Button>
          <Button onClick={handleSubmitSeason} variant="contained">提交</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default AcademicTermsTab;