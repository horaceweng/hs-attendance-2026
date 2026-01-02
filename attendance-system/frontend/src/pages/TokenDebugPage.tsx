import React, { useState, useEffect } from 'react';
import { Box, Typography, Paper, Button, Alert, CircularProgress, Divider } from '@mui/material';
import { jwtDecode } from 'jwt-decode';
import { getCurrentUser } from '../services/auth';

interface DecodedToken {
  exp: number;
  sub: number;
  username: string;
  role: string;
  iat: number;
}

export const TokenDebugPage: React.FC = () => {
  const [token, setToken] = useState<string | null>(null);
  const [decodedToken, setDecodedToken] = useState<DecodedToken | null>(null);
  const [apiUser, setApiUser] = useState<any>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    refreshTokenInfo();
    fetchUserFromApi();
  }, []);

  const refreshTokenInfo = () => {
    const storedToken = localStorage.getItem('access_token');
    setToken(storedToken);

    if (storedToken) {
      try {
  const decoded = jwtDecode(storedToken) as DecodedToken;
        setDecodedToken(decoded);
        setError(null);
      } catch (err) {
        setError('無法解析 JWT 令牌。可能是無效的令牌格式。');
        console.error('Token decode error:', err);
      }
    } else {
      setError('未找到 access_token。請先登入。');
    }
  };

  const fetchUserFromApi = async () => {
    setApiLoading(true);
    setApiError(null);
    try {
      const user = await getCurrentUser();
      setApiUser(user);
    } catch (err) {
      setApiError('從 API 獲取用戶信息失敗。可能是未授權或者伺服器錯誤。');
      console.error('API error:', err);
    } finally {
      setApiLoading(false);
    }
  };

  const refreshAllData = () => {
    refreshTokenInfo();
    fetchUserFromApi();
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString();
  };

  return (
    <Box sx={{ mt: 3, maxWidth: 800, mx: 'auto' }}>
      <Typography variant="h4" gutterBottom>用戶授權偵錯工具</Typography>
      
      <Button 
        variant="contained" 
        color="primary" 
        onClick={refreshAllData}
        sx={{ mb: 2 }}
      >
        重新獲取所有資訊
      </Button>
      
      {error && <Alert severity="error" sx={{ mb: 2 }}>{error}</Alert>}
      
      {decodedToken && (
        <Paper sx={{ p: 3, mb: 3 }}>
          <Typography variant="h6" gutterBottom>前端存儲的令牌內容</Typography>
          
          <Typography variant="subtitle1" sx={{ mt: 2 }}>
            <strong>用戶 ID：</strong> {decodedToken.sub}
          </Typography>
          
          <Typography variant="subtitle1">
            <strong>用戶名：</strong> {decodedToken.username}
          </Typography>
          
          <Typography variant="subtitle1">
            <strong>角色：</strong> {decodedToken.role}
          </Typography>
          
          <Typography variant="subtitle1">
            <strong>簽發時間：</strong> {formatDate(decodedToken.iat)}
          </Typography>
          
          <Typography variant="subtitle1">
            <strong>過期時間：</strong> {formatDate(decodedToken.exp)}
          </Typography>
          
          <Typography variant="subtitle1">
            <strong>是否已過期：</strong> {Date.now() > decodedToken.exp * 1000 ? '已過期' : '有效'}
          </Typography>
        </Paper>
      )}
      
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>後端 API 獲取的用戶資訊</Typography>
        
        {apiLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 2 }}>
            <CircularProgress />
          </Box>
        ) : apiError ? (
          <Alert severity="error">{apiError}</Alert>
        ) : apiUser ? (
          <Box>
            <Typography variant="subtitle1">
              <strong>用戶 ID：</strong> {apiUser.id}
            </Typography>
            <Typography variant="subtitle1">
              <strong>用戶名：</strong> {apiUser.name}
            </Typography>
            <Typography variant="subtitle1">
              <strong>角色：</strong> {apiUser.role}
            </Typography>
            <Divider sx={{ my: 2 }} />
            <Typography variant="subtitle1">
              <strong>能否訪問管理頁面：</strong> {apiUser.role === 'GA_specialist' ? '是' : '否'}
            </Typography>
          </Box>
        ) : (
          <Typography>尚未獲取到用戶資訊</Typography>
        )}
      </Paper>
      
      {token && (
        <Paper sx={{ p: 3, mt: 3, overflow: 'auto' }}>
          <Typography variant="h6" gutterBottom>原始令牌</Typography>
          <Typography component="pre" sx={{ fontSize: '0.8rem', wordBreak: 'break-all' }}>
            {token}
          </Typography>
        </Paper>
      )}
    </Box>
  );
};