// in frontend/src/pages/LoginPage.tsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Box, Button, TextField, Typography, Alert, Paper } from '@mui/material';
import * as api from '../services/api';

export const LoginPage: React.FC = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('password'); // 開發方便，預設密碼
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setLoading(true);
        setError('');

        try {
            const response = await api.login(username, password);
            const { access_token } = response.data;

            if (access_token) {
                // 登入成功
                localStorage.setItem('access_token', access_token);
                // 導向到報表頁面
                navigate('/reports');
            }
        } catch (err) {
            // 登入失敗
            setError('帳號或密碼錯誤，請再試一次。');
            console.error('Login failed:', err);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh',
        }}>
            <Paper component="form" onSubmit={handleSubmit} elevation={3} sx={{
                padding: 4,
                display: 'flex',
                flexDirection: 'column',
                gap: 2,
                width: '100%',
                maxWidth: '400px',
            }}>
                <Typography variant="h4" component="h1" gutterBottom>
                    出缺勤管理系統登入
                </Typography>

                {error && <Alert severity="error">{error}</Alert>}

                <TextField
                    label="使用者名稱"
                    variant="outlined"
                    required
                    fullWidth
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                />
                <TextField
                    label="密碼"
                    type="password"
                    variant="outlined"
                    required
                    fullWidth
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                />
                <Button
                    type="submit"
                    variant="contained"
                    fullWidth
                    size="large"
                    disabled={loading}
                >
                    {loading ? '登入中...' : '登入'}
                </Button>
            </Paper>
        </Box>
    );
};