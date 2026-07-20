// ProtectedRoute 的回歸測試：涵蓋「無 token」「token 過期」「token 有效」三種情境，
// 對應先前修復過的行為 —— 過期 token 必須清除 localStorage 並導向 /login。
import { describe, it, expect, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';

// 建立一個「格式正確」的假 JWT（不需要真實簽章，jwtDecode 只會解碼 payload 部分），
// 讓測試可以直接控制 exp 欄位，而不必 mock jwt-decode 套件本身。
function createToken(payload: Record<string, unknown>): string {
  const encode = (obj: unknown) =>
    btoa(JSON.stringify(obj)).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  return `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode(payload)}.signature`;
}

function renderProtectedRoute(initialEntries: string[] = ['/protected']) {
  return render(
    <MemoryRouter initialEntries={initialEntries}>
      <Routes>
        <Route path="/login" element={<div>Login Page</div>} />
        <Route element={<ProtectedRoute />}>
          <Route path="/protected" element={<div>Secret Content</div>} />
        </Route>
      </Routes>
    </MemoryRouter>,
  );
}

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('redirects to /login when there is no access token', () => {
    renderProtectedRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
  });

  it('redirects to /login and clears stored tokens when the token is expired', () => {
    const nowInSeconds = Date.now() / 1000;
    localStorage.setItem('access_token', createToken({ exp: nowInSeconds - 3600 }));
    localStorage.setItem('refresh_token', 'some-refresh-token');

    renderProtectedRoute();

    expect(screen.getByText('Login Page')).toBeInTheDocument();
    expect(screen.queryByText('Secret Content')).not.toBeInTheDocument();
    expect(localStorage.getItem('access_token')).toBeNull();
    expect(localStorage.getItem('refresh_token')).toBeNull();
  });

  it('renders the nested route content when the token is valid', () => {
    const nowInSeconds = Date.now() / 1000;
    localStorage.setItem('access_token', createToken({ exp: nowInSeconds + 3600 }));

    renderProtectedRoute();

    expect(screen.getByText('Secret Content')).toBeInTheDocument();
    expect(screen.queryByText('Login Page')).not.toBeInTheDocument();
  });
});
