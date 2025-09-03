// 인증 관련 유틸리티 함수들 (클라이언트 사이드)

export const authUtils = {
  // 로컬스토리지에서 토큰 가져오기
  getToken: () => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('token');
    }
    return null;
  },

  // 로컬스토리지에 토큰 저장
  setToken: (token: string) => {
    if (typeof window !== 'undefined') {
      localStorage.setItem('token', token);
    }
  },

  // 토큰 제거 (로그아웃)
  removeToken: () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('token');
    }
  },

  // 토큰에서 사용자 정보 추출
  getUserFromToken: (token?: string) => {
    const authToken = token || authUtils.getToken();
    if (!authToken) return null;

    try {
      const payload = JSON.parse(atob(authToken.split('.')[1]));
      return payload;
    } catch (error) {
      return null;
    }
  },

  // 로그인 상태 확인
  isLoggedIn: () => {
    const token = authUtils.getToken();
    if (!token) return false;

    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      return payload.exp > Date.now() / 1000;
    } catch (error) {
      return false;
    }
  },

  // API 요청 헤더 생성
  getAuthHeaders: () => {
    const token = authUtils.getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  }
};