// in frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

// 允許的時鐘誤差(秒),避免因用戶端與伺服器時間些微不同步而誤判 token 已過期
const CLOCK_SKEW_TOLERANCE_SECONDS = 30;

interface DecodedAccessToken {
    exp?: number;
}

// 清除本地端儲存的驗證 token
const clearStoredTokens = () => {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
};

export const ProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
        // 如果沒有 token，重定向到登入頁面
        return <Navigate to="/login" replace />;
    }

    try {
        const decodedToken = jwtDecode(token) as DecodedAccessToken;
        const nowInSeconds = Date.now() / 1000;

        // 若 token 沒有 exp 欄位，或已超過容忍誤差後仍已過期，視為無效
        if (!decodedToken.exp || decodedToken.exp + CLOCK_SKEW_TOLERANCE_SECONDS < nowInSeconds) {
            clearStoredTokens();
            return <Navigate to="/login" replace />;
        }
    } catch {
        // token 格式錯誤或無法解碼，視為無效
        clearStoredTokens();
        return <Navigate to="/login" replace />;
    }

    // 驗證通過，則渲染該路由下的子元件 (例如報表頁、點名頁等)
    return <Outlet />;
};
