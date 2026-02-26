import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { client } from '@/api/client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useState } from 'react';

export function DashboardPage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    setIsLoggingOut(true);
    try {
      await client.post('/api/auth/logout');
    } catch (error) {
      console.error('Logout failed on server:', error);
    } finally {
      logout();
      navigate('/login', { replace: true });
      setIsLoggingOut(false);
    }
  };

  return (
    <div className="min-h-screen bg-muted/40 p-8">
      <div className="mx-auto max-w-4xl space-y-8">
        <header className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">대시보드</h1>
            <p className="text-muted-foreground">환영합니다, {user?.name}님!</p>
          </div>
          <Button variant="outline" onClick={handleLogout} disabled={isLoggingOut}>
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </Button>
        </header>

        <Card>
          <CardHeader>
            <CardTitle>내 정보</CardTitle>
            <CardDescription>현재 로그인된 계정의 정보입니다.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-muted-foreground">이름</p>
                <p className="text-base">{user?.name}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-muted-foreground">이메일</p>
                <p className="text-base">{user?.email}</p>
              </div>
              <div className="space-y-1">
                <p className="text-sm font-medium leading-none text-muted-foreground">가입일</p>
                <p className="text-base">
                  {user?.created_at ? new Date(user.created_at).toLocaleDateString('ko-KR') : '-'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
