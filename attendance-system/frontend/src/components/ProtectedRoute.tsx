// in frontend/src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';

export const ProtectedRoute: React.FC = () => {
    const token = localStorage.getItem('access_token');

    if (!token) {
        // 如果沒有 token，重定向到登入頁面
        return <Navigate to="/login" replace />;
    }

    // 如果有 token，則渲染該路由下的子元件 (例如報表頁、點名頁等)
    return <Outlet />;
};