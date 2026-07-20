declare module 'jwt-decode' {
  // 解碼後的 JWT payload（對應後端 AuthService.login 簽發的 payload，
  // 加上 jwt.sign 自動附加的 iat / exp 標準欄位）
  export interface DecodedToken {
    sub: number;
    username: string;
    role: string;
    iat: number;
    exp: number;
  }

  export function jwtDecode(token: string): DecodedToken;
  const _default: typeof jwtDecode;
  export default _default;
}
