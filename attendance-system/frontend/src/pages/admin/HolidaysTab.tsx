// src/pages/admin/HolidaysTab.tsx
import React, { useState, useEffect } from 'react';
import { 
  Box, Button, Paper, Dialog, DialogActions, DialogContent, DialogTitle,
  FormControl, InputLabel, MenuItem, Select, Alert, Typography,
  IconButton
} from '@mui/material';
import type { SelectChangeEvent } from '@mui/material/Select';
import ArrowBackIcon from '@mui/icons-material/ArrowBack';
import { DateCalendar } from '@mui/x-date-pickers/DateCalendar';
import { LocalizationProvider } from '@mui/x-date-pickers/LocalizationProvider';
import { AdapterDayjs } from '@mui/x-date-pickers/AdapterDayjs';
import dayjs, { Dayjs } from 'dayjs';
import * as api from '../../services/api';
import './HolidayCalendar.css';

// 解析月份名稱為月份索引 (0-11)
// eslint-disable-next-line @typescript-eslint/no-unused-vars
const parseMonth = (monthName: string): number => {
  const months: { [key: string]: number } = {
    'january': 0, 'jan': 0, '一月': 0,
    'february': 1, 'feb': 1, '二月': 1,
    'march': 2, 'mar': 2, '三月': 2,
    'april': 3, 'apr': 3, '四月': 3,
    'may': 4, '五月': 4,
    'june': 5, 'jun': 5, '六月': 5,
    'july': 6, 'jul': 6, '七月': 6,
    'august': 7, 'aug': 7, '八月': 7,
    'september': 8, 'sep': 8, 'sept': 8, '九月': 8,
    'october': 9, 'oct': 9, '十月': 9,
    'november': 10, 'nov': 10, '十一月': 10,
    'december': 11, 'dec': 11, '十二月': 11
  };
  
  const normalizedMonth = monthName.toLowerCase().trim();
  return months[normalizedMonth] !== undefined ? months[normalizedMonth] : -1;
};

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

const HolidaysTab: React.FC = () => {
  const [holidays, setHolidays] = useState<Holiday[]>([]);
  const [seasons, setSeasons] = useState<Season[]>([]);
  const [, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [currentSeason, setCurrentSeason] = useState<number>(0);
  const [selectedDate, setSelectedDate] = useState<Dayjs | null>(dayjs());
  const [modifiedDates, setModifiedDates] = useState<{ [key: string]: boolean }>({});

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
    console.log('正在開啟假日日曆對話框...');
    setModifiedDates({}); // 重置修改的日期
    setDialogOpen(true);
    
    // 多次應用樣式，確保樣式被正確應用
    setTimeout(() => applyHolidayStyles(), 100);
    setTimeout(() => applyHolidayStyles(), 300);
    setTimeout(() => applyHolidayStyles(), 600);
    setTimeout(() => applyHolidayStyles(), 1000);
    
    // 檢查樣式應用情況，在控制台顯示詳細診斷信息
    setTimeout(() => {
      console.log('%c===== 假日樣式診斷 =====', 'color: blue; font-weight: bold; font-size: 14px;');
      
      // 檢查是否有節點實際使用了 holiday-date 類
      const holidayNodes = document.querySelectorAll('.holiday-date');
      console.log(`%c找到 ${holidayNodes.length} 個帶有 holiday-date 類的元素`, 'color: green');
      
      // 檢查是否有節點使用了 data-weekend 屬性
      const weekendNodes = document.querySelectorAll('[data-weekend="true"]');
      console.log(`%c找到 ${weekendNodes.length} 個帶有 data-weekend="true" 屬性的元素`, 'color: green');
      
      // 檢查計算後的樣式
      if (holidayNodes.length > 0) {
        const testNode = holidayNodes[0];
        const computedStyle = window.getComputedStyle(testNode);
        console.log('%c假日節點計算後的樣式:', 'font-weight: bold; color: purple', {
          color: computedStyle.color,
          backgroundColor: computedStyle.backgroundColor,
          fontWeight: computedStyle.fontWeight,
          textShadow: computedStyle.textShadow,
          transform: computedStyle.transform,
          boxShadow: computedStyle.boxShadow
        });
        
        // 檢查是否有紅色
        const hasRed = computedStyle.color.includes('rgb(213') || 
                       computedStyle.color.includes('rgb(255') || 
                       computedStyle.color.includes('rgb(229');
        console.log(`%c節點文字顏色是否為紅色: ${hasRed ? '是 ✓' : '否 ✗'}`, 
                   hasRed ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
      } else {
        console.log('%c警告: 未找到假日節點，無法檢查樣式', 'color: orange; font-weight: bold');
      }
      
      // 檢查是否存在樣式元素
      const styleElements = document.querySelectorAll('style');
      console.log(`頁面中有 ${styleElements.length} 個 <style> 元素`);
      
      // 查找我們添加的特定樣式元素
      const holidayStyleElement = document.getElementById('holiday-override-styles');
      console.log(`%c專用假日樣式元素是否存在: ${holidayStyleElement ? '是 ✓' : '否 ✗'}`,
                 holidayStyleElement ? 'color: green; font-weight: bold' : 'color: red; font-weight: bold');
      
      // 檢查 MUI 主題
      const isDarkMode = document.body.classList.contains('MuiDarkTheme') ||
                      document.body.classList.contains('dark-theme') ||
                      document.documentElement.classList.contains('dark-mode') ||
                      document.querySelector('html')?.getAttribute('data-mui-color-scheme') === 'dark' ||
                      window.matchMedia('(prefers-color-scheme: dark)').matches;
      console.log(`當前主題模式: ${isDarkMode ? '深色' : '淺色'}`);
      
      // 強制再次應用樣式
      console.log('%c嘗試強制再次應用樣式...', 'color: blue');
      setTimeout(applyHolidayStyles, 10);
      setTimeout(applyHolidayStyles, 500);
      
      console.log('%c===== 診斷結束 =====', 'color: blue; font-weight: bold; font-size: 14px;');
    }, 1500);
  };

  // 只处理日期选择，不改变状态
  const handleDateSelection = (date: Dayjs | null) => {
    setSelectedDate(date);
    if (!date) return;
    
    try {
      const dateString = date.format('YYYY-MM-DD');
      console.log(`选择日期: ${dateString}`);
      
      // 只记录日期选择，不改变状态
      const dayOfWeek = date.day();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isInHolidays = holidays.some(h => h.date === dateString);
      const currentModifiedState = dateString in modifiedDates ? modifiedDates[dateString] : null;
      
      // 仅计算当前状态用于显示
      let currentStatus = false;
      if (currentModifiedState !== null) {
        currentStatus = currentModifiedState;
        console.log(`日期 ${dateString} 已被用户修改为: ${currentStatus ? '假日' : '上课日'}`);
      } else {
        currentStatus = isInHolidays || isWeekend;
        
        if (isWeekend) {
          console.log(`日期 ${dateString} 是周末 (${dayOfWeek === 0 ? '周日' : '周六'})`);
        }
        
        if (isInHolidays) {
          console.log(`日期 ${dateString} 在系统假日列表中`);
        }
      }
      
      console.log(`日期 ${dateString} 当前状态: ${currentStatus ? '假日' : '上课日'} (周末: ${isWeekend}, 系统假日: ${isInHolidays}, 用户修改: ${currentModifiedState !== null})`);
    } catch (err) {
      console.error('处理日期选择时出错:', err);
    }
  };
  
  // 新增函数：处理日期状态变更按钮点击
  const handleToggleHolidayStatus = () => {
    if (!selectedDate) return;
    
    try {
      const dateString = selectedDate.format('YYYY-MM-DD');
      console.log(`变更日期状态: ${dateString}`);
      
      // 获取日期当前的假日状态
      const dayOfWeek = selectedDate.day();
      const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
      const isInHolidays = holidays.some(h => h.date === dateString);
      const currentModifiedState = dateString in modifiedDates ? modifiedDates[dateString] : null;
      
      // 计算当前状态（考虑所有因素）
      let currentStatus = false;
      if (currentModifiedState !== null) {
        // 如果已被修改，使用修改后的状态
        currentStatus = currentModifiedState;
      } else {
        // 否则使用默认状态（周末或系统假日）
        currentStatus = isInHolidays || isWeekend;
      }
      
      // 切换状态并更新修改列表
      const newStatus = !currentStatus;
      console.log(`将日期 ${dateString} 修改为: ${newStatus ? '假日' : '上课日'}`);
      
      setModifiedDates(prev => ({
        ...prev,
        [dateString]: newStatus,
      }));
      
      // 立即应用样式更新
      setTimeout(() => {
        applyHolidayStyles();
        console.log(`已为 ${dateString} 应用新样式: ${newStatus ? '假日' : '上课日'}`);
      }, 10);
    } catch (err) {
      console.error('处理日期状态变更时出错:', err);
    }
  };

  const isHolidayDate = (dateString: string) => {
    // 标准化日期格式为 YYYY-MM-DD
    let standardDate = dateString;
    try {
      if (dateString.includes('/')) {
        const parts = dateString.split('/');
        standardDate = `${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`;
      }
      
      // 确保日期有效
      if (!dayjs(standardDate).isValid()) {
        console.error(`Invalid date: ${dateString}`);
        return false;
      }
    } catch (err) {
      console.error(`Error processing date: ${dateString}`, err);
      return false;
    }
    
    // 检查是否在用户修改的日期中
    if (standardDate in modifiedDates) {
      console.log(`Date ${standardDate} is modified: ${modifiedDates[standardDate]}`);
      return modifiedDates[standardDate];
    }
    
    // 检查是否在系统假日列表中
    const isInHolidays = holidays.some(h => h.date === standardDate);
    if (isInHolidays) {
      console.log(`Date ${standardDate} is in holidays list`);
      return true;
    }
    
    // 检查是否为周末（周六或周日）
    const dayOfWeek = dayjs(standardDate).day();
    const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0 是周日，6 是周六
    
    console.log(`Date ${standardDate} weekend status: day=${dayOfWeek}, isWeekend=${isWeekend}`);
    
    // 周末为假日
    return isWeekend;
  };

  const handleSubmitHolidays = async () => {
    try {
      // 查找选定的学季
      const currentSeasonObj = seasons.find(s => s.id === currentSeason);
      if (!currentSeasonObj) {
        setError("請先選擇學季");
        return;
      }

      console.log(`Submitting holiday changes for season: ${currentSeasonObj.name}`);
      console.log('Modified dates:', modifiedDates);
      
      const createPromises = [];
      const deletePromises = [];

      // 处理每个修改过的日期
      for (const [dateString, isHoliday] of Object.entries(modifiedDates)) {
        console.log(`Processing date ${dateString}, holiday status: ${isHoliday}`);
        const existingHoliday = holidays.find(h => h.date === dateString);
        const dayOfWeek = dayjs(dateString).day();
        const isWeekend = dayOfWeek === 0 || dayOfWeek === 6;
        
        if (isHoliday) {
          // 如果标记为假日
          if (!existingHoliday && !isWeekend) {
            // 如果不是周末且不在假日列表中，创建新假日
            console.log(`Creating new holiday for ${dateString} (not a weekend)`);
            createPromises.push(
              api.createHoliday({
                date: dateString,
                description: `假日 ${dateString}`,
                seasonId: currentSeason
              })
            );
          }
          // 周末不需要添加到数据库，因为它们默认就是假日
        } else {
          // 如果标记为非假日
          if (existingHoliday) {
            // 如果在数据库中存在，删除它
            console.log(`Deleting existing holiday for ${dateString}`);
            deletePromises.push(
              api.deleteHoliday(existingHoliday.id)
            );
          } else if (isWeekend) {
            // 如果是周末，但被标记为非假日，需要添加一个特殊标记
            // 这里我们可以添加一个描述为"工作日"的假日记录，表示这个周末需要上课
            console.log(`Creating override for weekend ${dateString} to mark as working day`);
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

      // 执行所有API调用
      if (createPromises.length > 0 || deletePromises.length > 0) {
        console.log(`Executing ${createPromises.length} creations and ${deletePromises.length} deletions`);
        await Promise.all([...createPromises, ...deletePromises]);
        
        // 刷新假日列表
        const response = await api.getHolidays();
        setHolidays(response.data);
      } else {
        console.log('No changes to submit');
      }
      
      setDialogOpen(false);
      setModifiedDates({});
    } catch (err) {
      setError("保存假日設定失敗");
      console.error(err);
    }
  };

  // 使用更直接强力的样式应用方式
  const applyHolidayStyles = () => {
    // 防止重复应用样式 - 使用状态标记
    if ((window as any).__applyingStyles) {
      return;
    }
    
    (window as any).__applyingStyles = true;
    console.log('應用假日樣式 (強化版)...');
    
    try {
      // 尝试寻找日期按钮 - 使用更多选择器确保捕获所有可能的日期按钮
      const allButtons = Array.from(
        document.querySelectorAll(
          '.MuiPickersDay-root, .MuiPickersDay-dayWithMargin, button[role="gridcell"], .MuiButtonBase-root[role="gridcell"], td[role="cell"] button'
        )
      );
      
      if (allButtons.length === 0) {
        console.warn('未找到日期按鈕，嘗試使用其他選擇器');
        const calendarContainer = document.querySelector('.holiday-calendar-container') || document.body;
        // 再次尝试查找，使用更通用的选择器
        const moreButtons = Array.from(
          calendarContainer.querySelectorAll('button')
        ).filter(btn => {
          const label = btn.getAttribute('aria-label');
          return label && (label.match(/\d{4}-\d{2}-\d{2}/) || label.match(/\d{1,2}\/\d{1,2}\/\d{4}/));
        });
        
        if (moreButtons.length === 0) {
          console.error('無法找到任何日期按鈕，樣式無法應用');
          return;
        }
        
        console.log(`找到 ${moreButtons.length} 個日期按鈕（使用備用選擇器）`);
        // 将找到的按钮添加到处理列表中
        allButtons.push(...moreButtons);
      }
      
      // 计数器
      let processedCount = 0;
      let holidayCount = 0;
      let weekendCount = 0;
      
      // 先查找當前主題模式，以應用適當的顏色
      // 檢查多種可能的深色模式標記
      const isDarkMode = document.body.classList.contains('MuiDarkTheme') || 
                      document.body.classList.contains('dark-theme') || 
                      document.body.classList.contains('darkTheme') || 
                      document.documentElement.classList.contains('dark-mode') || 
                      document.documentElement.classList.contains('darkMode') || 
                      document.querySelector('html')?.getAttribute('data-mui-color-scheme') === 'dark' ||
                      document.querySelector('html')?.getAttribute('data-theme') === 'dark' ||
                      window.matchMedia('(prefers-color-scheme: dark)').matches ||
                      // 檢查背景顏色是否為深色
                      (window.getComputedStyle(document.body).backgroundColor !== 'rgb(255, 255, 255)' &&
                        window.getComputedStyle(document.body).backgroundColor.match(/rgb\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)/i) &&
                        parseInt(RegExp.$1) + parseInt(RegExp.$2) + parseInt(RegExp.$3) < 384);
      
      console.log(`已檢測到主題模式: ${isDarkMode ? '深色' : '淺色'}`);
      
      console.log(`當前主題模式: ${isDarkMode ? '深色' : '淺色'}`);
      
      // 定义基于主题的样式
      const holidayTextColor = isDarkMode ? '#ff6060' : '#d50000';
      const holidayBgColor = isDarkMode ? 'rgba(33, 33, 33, 0.8)' : '#fff';
      const holidayShadowColor = isDarkMode ? 'rgba(255, 96, 96, 0.5)' : 'rgba(213, 0, 0, 0.5)';
      
      const regularTextColor = isDarkMode ? '#ffffff' : 'rgba(0, 0, 0, 0.87)';
      const regularBgColor = isDarkMode ? 'transparent' : 'transparent';
      
      allButtons.forEach((button) => {
        const ariaLabel = button.getAttribute('aria-label');
        if (!ariaLabel) {
          return;
        }
        
        try {
          // 从 aria-label 提取日期字符串
          const dateMatch = ariaLabel.match(/\d{4}-\d{2}-\d{2}/) || 
                          ariaLabel.match(/\d{1,2}\/\d{1,2}\/\d{4}/);
          
          // 嘗試使用多種方式解析日期
          let dateObj;
                    
          if (!dateMatch) {
            // 嘗試解析 '25 May 2025' 這樣的格式
            const dateParts = ariaLabel.split(',')[0].trim().split(' ');
            if (dateParts.length >= 3) {
              const day = parseInt(dateParts[0].replace(/[^0-9]/g, ''));
              const month = parseMonth(dateParts[1]);
              const year = parseInt(dateParts[2]);
              if (!isNaN(day) && month !== -1 && !isNaN(year)) {
                dateObj = dayjs().year(year).month(month).date(day);
              }
            }
            
            if (!dateObj || !dateObj.isValid()) {
              return;
            }
          } else {
            const dateText = dateMatch[0];
            if (dateText.includes('/')) {
              // 处理美式日期格式 MM/DD/YYYY
              const parts = dateText.split('/');
              dateObj = dayjs(`${parts[2]}-${parts[0].padStart(2, '0')}-${parts[1].padStart(2, '0')}`);
            } else {
              // 处理标准格式 YYYY-MM-DD
              dateObj = dayjs(dateText);
            }
          }
          
          if (!dateObj.isValid()) {
            return;
          }
          
          // 获取日期信息
          const standardDate = dateObj.format('YYYY-MM-DD');
          const dayOfWeek = dateObj.day();
          const isWeekend = dayOfWeek === 0 || dayOfWeek === 6; // 0是周日，6是周六
          
          processedCount++;
          
          // 使用更强的方法完全重置和清除现有样式
          const htmlButton = button as HTMLElement;
          
          // 1. 移除所有内联样式
          htmlButton.setAttribute('style', '');
          
          // 2. 移除和添加适当的类
          htmlButton.classList.remove('holiday-date');
          htmlButton.removeAttribute('data-weekend');
          
          // 获取假日状态
          let isHoliday = false;
          
          // 首先检查是否有用户修改
          if (standardDate in modifiedDates) {
            isHoliday = modifiedDates[standardDate];
          } else {
            // 否则按照默认规则判断：周末(0,6)为假日
            const isInHolidays = holidays.some(h => h.date === standardDate);
            isHoliday = isInHolidays || isWeekend;
          }
          
          // 直接使用内联样式并设置数据属性，确保最高优先级
          if (isHoliday) {
            if (isWeekend) {
              htmlButton.setAttribute('data-weekend', 'true');
              weekendCount++;
            } else {
              htmlButton.classList.add('holiday-date');
            }
            
            // 直接设置样式属性，使用大量 !important 确保覆盖其他样式
            // 使用更強烈的樣式
            htmlButton.style.cssText = `
              background-color: ${holidayBgColor} !important; 
              color: ${holidayTextColor} !important;
              font-weight: 900 !important;
              box-shadow: 0 0 0 3px ${holidayShadowColor} !important;
              text-shadow: 0 0 3px ${holidayShadowColor} !important;
              transform: scale(1.15) !important;
              position: relative !important;
              z-index: 5 !important;
              border-radius: 50% !important;
            `;
            
            // 使用额外的技术添加样式 - 针对不同的 React 渲染器
            const originalDisplay = htmlButton.style.display;
            htmlButton.style.display = 'none';
            setTimeout(() => { htmlButton.style.display = originalDisplay; }, 5);
            
            holidayCount++;
          } else {
            // 非假日，设置为默认样式
            htmlButton.style.cssText = `
              background-color: ${regularBgColor} !important;
              color: ${regularTextColor} !important;
              font-weight: normal !important;
              transform: scale(1) !important;
              box-shadow: none !important;
              text-shadow: none !important;
            `;
          }
          
          // 确保样式不被框架覆盖 - 使用多个延迟的样式重新应用
          setTimeout(() => {
            if (isHoliday) {
              // 使用 setProperty 可以加入 !important 標記，更強力地覆蓋樣式
              htmlButton.style.setProperty('color', holidayTextColor, 'important');
              htmlButton.style.setProperty('font-weight', '900', 'important');
              htmlButton.style.setProperty('text-shadow', `0 0 3px ${holidayShadowColor}`, 'important');
              htmlButton.style.setProperty('transform', 'scale(1.15)', 'important');
              htmlButton.style.setProperty('box-shadow', `0 0 0 3px ${holidayShadowColor}`, 'important');
            }
          }, 50);
          
          // 再次應用樣式，確保在任何情況下都能生效
          setTimeout(() => {
            if (isHoliday && htmlButton) {
              htmlButton.style.setProperty('color', holidayTextColor, 'important');
            }
          }, 200);
        } catch (err) {
          console.error('处理日期按钮时出错:', err);
        }
      });
      
      console.log(`應用樣式到 ${processedCount} 個日期，其中假日 ${holidayCount} 個（包括週末 ${weekendCount} 個）`);
      
      // 添加一个全局样式表，使用最高的选择器特异性
      const styleId = 'holiday-override-styles';
      let styleElement = document.getElementById(styleId) as HTMLStyleElement;
      
      if (!styleElement) {
        styleElement = document.createElement('style');
        styleElement.id = styleId;
        document.head.appendChild(styleElement);
      }
      
      styleElement.textContent = `
        /* 全局假日样式覆盖 - 使用最高特異性和強大的視覺效果 */
        html body .MuiPickersDay-root[data-weekend="true"],
        html body .holiday-calendar-container .MuiPickersDay-root[data-weekend="true"],
        html body button.holiday-date,
        html body .holiday-calendar-container button.holiday-date,
        html body td[role="cell"] button.holiday-date,
        html body td[role="cell"] button[data-weekend="true"],
        html body div[role="presentation"] button.holiday-date,
        html body div[role="presentation"] button[data-weekend="true"] {
          color: ${holidayTextColor} !important;
          font-weight: 900 !important;
          text-shadow: 0 0 3px ${holidayShadowColor} !important;
          transform: scale(1.15) !important;
          box-shadow: 0 0 0 3px ${holidayShadowColor} !important;
          background-color: ${holidayBgColor} !important;
          position: relative !important;
          z-index: 5 !important;
          border-radius: 50% !important;
        }
        
        /* 確保所有日期按鈕都有正確的基本樣式 */
        html body .MuiPickersDay-root,
        html body button[role="gridcell"],
        html body td[role="cell"] button {
          transition: all 0.2s ease-in-out !important;
          position: relative !important;
          border-radius: 50% !important;
        }
      `;
    } finally {
      // 解除标记，允许下次调用
      setTimeout(() => {
        (window as any).__applyingStyles = false;
      }, 100);
    }
  };

  // 更強的樣式實施策略，使用多種技術確保樣式生效
  useEffect(() => {
    if (!dialogOpen) return;

    console.log('設置強制樣式實施機制（增強版）');
    
    // 創建一個標記 CSS 類，以確認樣式已被應用
    const applyStyleMarker = () => {
      // 添加一個全局類來標記樣式已應用
      const markerClass = 'holiday-styles-applied';
      if (!document.body.classList.contains(markerClass)) {
        document.body.classList.add(markerClass);
      }
    };
    
    // 創建一個 MutationObserver 觀察DOM變化
    const observer = new MutationObserver((mutations) => {
      // 檢查是否有相關變化
      const shouldApplyStyles = mutations.some(mutation => {
        // 如果是節點添加/刪除
        if (mutation.type === 'childList') {
          return true;
        }
        // 如果是屬性變化，且是我們關注的屬性
        if (mutation.type === 'attributes') {
          const attr = mutation.attributeName;
          return attr === 'class' || attr === 'style' || attr === 'aria-selected';
        }
        return false;
      });
      
      if (shouldApplyStyles) {
        // 如果檢測到DOM變化，立即應用樣式
        setTimeout(applyHolidayStyles, 10);
      }
    });
    
    // 監控多個可能包含日曆的容器
    const possibleContainers = [
      '.MuiDateCalendar-root', 
      '.MuiPickersCalendar-root',
      '[role="grid"]',
      '.holiday-calendar-container',
      '.MuiDialogContent-root'
    ];
    
    // 找到所有匹配的容器並監控它們
    possibleContainers.forEach(selector => {
      const container = document.querySelector(selector);
      if (container) {
        observer.observe(container, { 
          childList: true, 
          subtree: true,
          attributes: true,
          attributeFilter: ['class', 'style', 'aria-selected']
        });
        console.log(`已監控容器: ${selector}`);
      }
    });
    
    // 立即應用樣式
    applyHolidayStyles();
    applyStyleMarker();
    
    // 設置多個定時器，反復應用樣式，確保它們始終生效
    const timers = [
      setTimeout(applyHolidayStyles, 50),
      setTimeout(applyHolidayStyles, 100),
      setTimeout(applyHolidayStyles, 250),
      setTimeout(applyHolidayStyles, 500),
      setTimeout(applyHolidayStyles, 1000),
      setTimeout(applyHolidayStyles, 2000)
    ];
    
    // 監聽月份和年份切換
    const handleViewChange = () => {
      console.log('視圖變化，重新應用樣式');
      // 多次應用樣式，確保它們生效
      setTimeout(applyHolidayStyles, 10);
      setTimeout(applyHolidayStyles, 50);
      setTimeout(applyHolidayStyles, 100);
      setTimeout(applyHolidayStyles, 300);
    };
    
    // 尋找並監聽所有可能的導航按鈕
    const navigationButtonSelectors = [
      '.MuiPickersArrowSwitcher-button', 
      '.MuiPickersCalendarHeader-switchViewButton',
      '.MuiPickersArrowSwitcher-root button',
      '[aria-label*="Previous"]',
      '[aria-label*="Next"]',
      '[aria-label*="calendar view"]'
    ];
    
    // 為所有導航按鈕添加事件監聽器
    const navigationButtons = Array.from(
      document.querySelectorAll(navigationButtonSelectors.join(', '))
    );
    
    navigationButtons.forEach(button => {
      button.addEventListener('click', handleViewChange);
    });
    
    // 添加日曆視圖變更事件監聽器
    window.addEventListener('resize', applyHolidayStyles);
    
    // 添加滾動事件監聽器（可能觸發懶加載元素的顯示）
    document.addEventListener('scroll', () => {
      setTimeout(applyHolidayStyles, 100);
    });
    
    // 清理函數
    return () => {
      observer.disconnect();
      timers.forEach(clearTimeout);
      navigationButtons.forEach(button => {
        button.removeEventListener('click', handleViewChange);
      });
      window.removeEventListener('resize', applyHolidayStyles);
      document.removeEventListener('scroll', () => {
        setTimeout(applyHolidayStyles, 100);
      });
    };
  }, [dialogOpen, holidays, modifiedDates]);

  const currentSeasonObj = seasons.find(s => s.id === currentSeason);
  const holidaysInCurrentSeason = currentSeason === 0 
    ? holidays 
    : holidays.filter(h => h.seasonId === currentSeason);

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
                className="holiday-calendar-container"
                id="holiday-calendar-container"
                data-testid="holiday-calendar"
                sx={{ 
                  border: '1px solid #ddd', 
                  borderRadius: 1, 
                  padding: 2,
                  backgroundColor: '#f9f9f9',
                  '& .holiday-date, & [data-weekend="true"]': {
                    color: '#d50000 !important',
                    fontWeight: 700,
                    textShadow: '0 0 2px rgba(213, 0, 0, 0.4)',
                    transform: 'scale(1.1)'
                  }
                }}
              >
                <style dangerouslySetInnerHTML={{
                  __html: `
                    /* 強制重置所有日期按鈕樣式 - 添加更高特異性選擇器 */
                    html body .MuiPickersDay-root,
                    html body .MuiPickersDay-dayWithMargin,
                    html body .MuiButtonBase-root[role="gridcell"],
                    html body button[role="gridcell"],
                    html body td[role="cell"] button {
                      background-color: transparent !important;
                      color: rgba(0, 0, 0, 0.87) !important;
                      font-weight: normal !important;
                      transition: all 0.2s ease-in-out !important;
                      transform: scale(1) !important;
                    }
                    
                    /* 假日和週末樣式 - 極大增強紅色數字效果 */
                    html body .holiday-date,
                    html body button.holiday-date,
                    html body .MuiPickersDay-root.holiday-date,
                    html body button[role="gridcell"].holiday-date,
                    html body [data-weekend="true"],
                    html body button[data-weekend="true"],
                    html body .MuiPickersDay-root[data-weekend="true"],
                    html body button[role="gridcell"][data-weekend="true"],
                    html body td[role="cell"] button.holiday-date,
                    html body td[role="cell"] button[data-weekend="true"] {
                      background-color: #fff !important;
                      color: #d50000 !important;
                      font-weight: 700 !important;
                      box-shadow: 0 0 0 2px rgba(213, 0, 0, 0.5) !important;
                      text-shadow: 0 0 2px rgba(213, 0, 0, 0.4) !important;
                      transform: scale(1.1) !important;
                      position: relative !important;
                      z-index: 5 !important;
                    }
                    
                    /* 選中日期樣式 - 使用最高優先級覆蓋其他樣式 */
                    html body .MuiPickersDay-root.Mui-selected,
                    html body button[role="gridcell"].Mui-selected,
                    html body td[role="cell"] button.Mui-selected {
                      background-color: #1976d2 !important;
                      color: white !important;
                      font-weight: bold !important;
                      z-index: 10 !important;
                      position: relative !important;
                      text-shadow: none !important;
                      box-shadow: 0 0 0 2px rgba(25, 118, 210, 0.7) !important;
                    }
                    
                    /* 懸停效果 */
                    html body .holiday-date:hover,
                    html body button.holiday-date:hover,
                    html body [data-weekend="true"]:hover,
                    html body button[data-weekend="true"]:hover {
                      background-color: rgba(213, 0, 0, 0.1) !important;
                    }
                    
                    /* 確保所有按鈕都有動畫效果 */
                    html body .MuiPickersDay-root,
                    html body button[role="gridcell"],
                    html body td[role="cell"] button {
                      transition: all 0.2s ease-in-out !important;
                    }
                    
                    /* 深色模式適配 */
                    @media (prefers-color-scheme: dark) {
                      html body .holiday-date,
                      html body button.holiday-date,
                      html body [data-weekend="true"],
                      html body button[data-weekend="true"],
                      html body td[role="cell"] button.holiday-date,
                      html body td[role="cell"] button[data-weekend="true"] {
                        color: #ff6060 !important;
                        background-color: rgba(33, 33, 33, 0.8) !important;
                        box-shadow: 0 0 0 2px rgba(255, 96, 96, 0.5) !important;
                      }
                    }
                  `
                }} />
                
                <DateCalendar 
                  value={selectedDate} 
                  onChange={handleDateSelection}
                  renderLoading={() => <Typography>載入中...</Typography>}
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
                    // 直接添加假日样式 - 使用更強的紅色和更明顯的效果
                    '& .holiday-date, & [data-weekend="true"]': {
                      backgroundColor: '#fff !important',
                      color: '#d50000 !important',
                      fontWeight: '700 !important',
                      textShadow: '0 0 2px rgba(213, 0, 0, 0.4) !important',
                      transform: 'scale(1.1) !important',
                      boxShadow: '0 0 0 2px rgba(213, 0, 0, 0.5) !important',
                      zIndex: 5,
                      position: 'relative'
                    }
                  }}
                  onMonthChange={() => {
                    // 月份变化时应用样式（使用多个延迟保证应用成功）
                    setTimeout(applyHolidayStyles, 50);
                    setTimeout(applyHolidayStyles, 200);
                    setTimeout(applyHolidayStyles, 500);
                  }}
                  onYearChange={() => {
                    // 年份变化时应用样式（使用多个延迟保证应用成功）
                    setTimeout(applyHolidayStyles, 50);
                    setTimeout(applyHolidayStyles, 200);
                    setTimeout(applyHolidayStyles, 500);
                  }}
                  slotProps={{
                    day: {
                      // 为每个日期应用自定义样式
                      sx: {
                        '&.holiday-date, &[data-weekend="true"]': {
                          backgroundColor: '#fff !important',
                          color: '#e53935 !important',
                          fontWeight: 'bold !important',
                          textShadow: '0 0 1px rgba(244, 67, 54, 0.3)',
                          transform: 'scale(1.05)'
                        },
                        '&:hover': {
                          backgroundColor: '#f5f5f5'
                        },
                        '&.holiday-date:hover, &[data-weekend="true"]:hover': {
                          backgroundColor: 'rgba(244, 67, 54, 0.08) !important'
                        }
                      }
                    }
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
                  // 获取当前日期的状态，确保显示正确
                  const dateString = selectedDate.format('YYYY-MM-DD');
                  const currentStatus = isHolidayDate(dateString);
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