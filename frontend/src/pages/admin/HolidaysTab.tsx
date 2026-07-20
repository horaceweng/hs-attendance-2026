// src/pages/admin/HolidaysTab.tsx
import React, { useState, useEffect } from 'react';
import {
  Box, Button, Paper, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, Alert, Typography,
  IconButton, CircularProgress
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { PickersDay } from '@mui/x-date-pickers/PickersDay';
import type { PickersDayProps } from '@mui/x-date-pickers/PickersDay';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import * as api from '../../services/api';

interface Holiday {
  id: number;
  date: string;
  description: string;
  seasonId: number;
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

/**
 * 判斷指定日期是否為假日，優先順序如下：
 * 1. 使用者在假日設定對話框中尚未送出的暫存修改（modifiedDates）
 * 2. 資料庫中的假日紀錄（holidays）
 * 3. 預設規則：星期六、日為假日
 *
 * 這是整份元件唯一的假日判斷邏輯來源，供日期格子的樣式呈現與
 * 使用者互動（選取、切換狀態）共用，避免各處重複實作。
 */
const resolveHolidayStatus = (
  dateString: string,
  holidays: Holiday[],
  modifiedDates: Record<string, boolean>
): boolean => {
  if (dateString in modifiedDates) {
    return modifiedDates[dateString];
  }

  if (holidays.some((h) => h.date === dateString)) {
    return true;
  }

  const dayOfWeek = dayjs(dateString).day();
  return dayOfWeek === 0 || dayOfWeek === 6;
};

interface HolidayPickersDayProps extends PickersDayProps {
  // 透過 slotProps.day 傳入，因此設為選填，避免與 MUI 內建的 PickersDayProps 型別衝突。
  holidays?: Holiday[];
  modifiedDates?: Record<string, boolean>;
}

// 自訂日期格子元件：以 MUI 的 sx 呈現假日樣式，取代直接操作 DOM 的作法。
// 月份／年份切換時，MUI 會以新的 day 重新渲染此元件，樣式因此會自動更新。
const HolidayPickersDay: React.FC<HolidayPickersDayProps> = (props) => {
  const { holidays = [], modifiedDates = {}, day, ...pickersDayProps } = props;
  const isHoliday = resolveHolidayStatus(dayjs(day).format('YYYY-MM-DD'), holidays, modifiedDates);

  return (
    <PickersDay
      {...pickersDayProps}
      day={day}
      sx={(theme) => ({
        ...(isHoliday && {
          color: theme.palette.mode === 'dark' ? '#ff6060' : '#d50000',
          fontWeight: 700,
          '&:hover': {
            backgroundColor: 'rgba(213, 0, 0, 0.08)',
          },
          '&.Mui-selected': {
            color: theme.palette.primary.contrastText,
            backgroundColor: theme.palette.primary.main,
          },
        }),
      })}
    />
  );
};

const HolidaysTab: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [modifiedDates, setModifiedDates] = useState<Record<string, boolean>>({});

  // 從API獲取資料
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        const [seasonsRes, holidaysRes] = await Promise.all([
          api.getSeasons(),
          api.getHolidays()
        ]);

        setSeasons(seasonsRes.data);
        setHolidays(holidaysRes.data);

        if (seasonsRes.data.length > 0) {
          setCurrentSeason(seasonsRes.data[0].id);
        }
      } catch (err) {
        setError("獲取資料失敗");
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  const handleSeasonChange = (e: SelectChangeEvent) => {
    const seasonId = parseInt(e.target.value);
    setCurrentSeason(seasonId);
  };

  const openHolidayCalendar = () => {
    setModifiedDates({}); // 重置本次對話框中的暫存修改
    setDialogOpen(true);
  };

  const handleDateSelection = (date: Dayjs | null) => {
    setSelectedDate(date);
  };

  // 切換目前選取日期的假日狀態，暫存於 modifiedDates，待按下「完成」時一併送出
  const handleToggleHolidayStatus = () => {
    if (!selectedDate) return;

    const dateString = selectedDate.format('YYYY-MM-DD');
    const currentStatus = resolveHolidayStatus(dateString, holidays, modifiedDates);

    setModifiedDates(prev => ({
      ...prev,
      [dateString]: !currentStatus,
    }));
  };

  const handleSubmitHolidays = async () => {
    try {
      const currentSeasonObj = seasons.find(s => s.id === currentSeason);
      if (!currentSeasonObj) {
        setError("請先選擇學季");
        return;
      }

      const createPromises = [];
      const deletePromises = [];

      // 處理每個使用者修改過的日期
      for (const [dateString, isHoliday] of Object.entries(modifiedDates)) {
        const existingHoliday = holidays.find(h => h.date === dateString);
        const dayOfWeek = dayjs(dateString).day();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;

        if (isHoliday) {
          // 標記為假日：若不是週末且資料庫中尚無紀錄，需新增
          if (!existingHoliday && !isWeekend) {
            createPromises.push(
              api.createHoliday({
                date: dateString,
                description: `假日 ${dateString}`,
                seasonId: currentSeason
              })
            );
          }
          // 週末預設即為假日，不需寫入資料庫
        } else {
          // 標記為上課日
          if (existingHoliday) {
            // 資料庫中原本存在假日紀錄，需刪除以恢復為上課日
            deletePromises.push(
              api.deleteHoliday(existingHoliday.id)
            );
          } else if (isWeekend) {
            // 週末預設為假日，若要改為上課日，需新增一筆標記紀錄
            createPromises.push(
              api.createHoliday({
                date: dateString,
                description: `工作日（原為週末）`,
                seasonId: currentSeason
              })
            );
          }
        }
      }

      if (createPromises.length > 0 || deletePromises.length > 0) {
        await Promise.all([...createPromises, ...deletePromises]);

        // 刷新假日列表
        const response = await api.getHolidays();
        setHolidays(response.data);
      }

      setDialogOpen(false);
      setModifiedDates({});
    } catch (err) {
      setError("保存假日設定失敗");
      console.error(err);
    }
  };

  const currentSeasonObj = seasons.find(s => s.id === currentSeason);
  const holidaysInCurrentSeason = currentSeason === 0
    ? holidays
    : holidays.filter(h => h.seasonId === currentSeason);

  if (isLoading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
        <CircularProgress />
      </Box>
    );
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 3 }}>
        <Typography variant="h6" component="h2">假日管理</Typography>
        <Button variant="contained" onClick={openHolidayCalendar}>
          設定假日
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}

      <Box sx={{ mb: 3 }}>
        <FormControl sx={{ minWidth: 200 }}>
          <InputLabel>選擇學季</InputLabel>
          <Select
            value={currentSeason.toString()}
            label="選擇學季"
            onChange={handleSeasonChange}
          >
            <MenuItem value="0">全部學季</MenuItem>
            {seasons.map((season) => (
              <MenuItem key={season.id} value={season.id.toString()}>
                {season.name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
      </Box>

      <Paper sx={{ p: 2 }}>
        <Typography variant="h6" gutterBottom>
          {currentSeason === 0 ? '所有假日' : `${currentSeasonObj?.name || ''} 假日清單`}
        </Typography>
        <Typography variant="body1" gutterBottom>
          資料庫假日: {holidaysInCurrentSeason.length} 個 (不包括週末默認假日)
        </Typography>
        <Typography variant="body2" color="text.secondary" gutterBottom>
          注意：星期六日為默認假日，不計入此總數。
        </Typography>
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 2 }}>
          {holidaysInCurrentSeason.map(holiday => (
            <Paper
              key={holiday.id}
              elevation={2}
              sx={{
                p: 2,
                width: { xs: '100%', sm: 'calc(50% - 8px)', md: 'calc(33% - 8px)', lg: 'calc(25% - 8px)' },
                display: 'flex',
                justifyContent: 'space-between',
                color: 'error.main'
              }}
            >
              <Typography>{holiday.date}</Typography>
              <Typography>{holiday.description}</Typography>
            </Paper>
          ))}
        </Box>
      </Paper>

      <Dialog
        open={dialogOpen}
        onClose={() => setDialogOpen(false)}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle sx={{ display: 'flex', alignItems: 'center' }}>
          <IconButton
            edge="start"
            color="inherit"
            onClick={() => setDialogOpen(false)}
            aria-label="close"
          >
            <ArrowBackIcon />
          </IconButton>
          設定假日
        </DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 2 }}>
            <Alert severity="warning" sx={{ mb: 2 }}>
              <strong>星期六、日默認為假日</strong>（日期數字已顯示為紅色）
            </Alert>
            <Alert severity="info" sx={{ mb: 2 }}>
              點擊日期選取後，可使用變更按鈕切換假日狀態。紅色數字表示假日，黑色數字表示上課日。
            </Alert>
            <LocalizationProvider dateAdapter={AdapterDayjs}>
              <Box
                data-testid="holiday-calendar"
                sx={{
                  border: '1px solid #ddd',
                  borderRadius: 1,
                  padding: 2,
                  backgroundColor: '#f9f9f9',
                }}
              >
                <DateCalendar
                  value={selectedDate}
                  onChange={handleDateSelection}
                  slots={{ day: HolidayPickersDay }}
                  slotProps={{
                    // HolidayPickersDay 需要額外的 holidays / modifiedDates 資料，
                    // 這兩個屬性不在 MUI 內建的 PickersDayProps 型別中，故需斷言。
                    day: {
                      holidays,
                      modifiedDates,
                    } as Partial<HolidayPickersDayProps>,
                  }}
                  sx={{
                    '& .MuiPickersDay-root': {
                      borderRadius: '50%',
                      margin: '2px',
                      transition: 'all 0.2s ease-in-out',
                    },
                    '& .Mui-selected': {
                      backgroundColor: 'primary.main',
                      color: 'white !important',
                      transform: 'scale(1.05)',
                      zIndex: 10,
                      position: 'relative',
                    },
                  }}
                />
              </Box>
            </LocalizationProvider>
            {selectedDate && (
              <Box sx={{ mt: 2, p: 2, border: '1px solid #ddd', borderRadius: 1 }}>
                <Typography variant="body1">
                  選擇日期: {selectedDate.format('YYYY-MM-DD')}
                </Typography>
                {(() => {
                  const dateString = selectedDate.format('YYYY-MM-DD');
                  const currentStatus = resolveHolidayStatus(dateString, holidays, modifiedDates);
                  const dayOfWeek = selectedDate.day();
                  const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
                  const dayTypeName = isWeekend ? '週末' : '工作日';

                  return (
                    <>
                      <Typography variant="body2">
                        日期類型: {dayTypeName} (星期{['日', '一', '二', '三', '四', '五', '六'][dayOfWeek]})
                      </Typography>
                      <Typography variant="body2" sx={{ color: currentStatus ? 'error.main' : 'success.main', fontWeight: 'bold' }}>
                        當前狀態: {currentStatus ? '假日' : '上課日'}
                      </Typography>
                      <Button
                        variant="contained"
                        color={currentStatus ? "primary" : "error"}
                        sx={{ mt: 1 }}
                        onClick={handleToggleHolidayStatus}
                      >
                        {currentStatus ? '變更為上課日' : '變更為假日'}
                      </Button>
                    </>
                  );
                })()}
              </Box>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDialogOpen(false)}>取消</Button>
          <Button onClick={handleSubmitHolidays} variant="contained" color="primary">
            完成
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default HolidaysTab;
