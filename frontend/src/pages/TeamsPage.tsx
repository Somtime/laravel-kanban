import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { teamsApi } from '@/api/teams';
import type { Team } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';

export function TeamsPage() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [teams, setTeams] = useState<Team[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // 새 팀 생성 상태
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [newTeamName, setNewTeamName] = useState('');
  const [newTeamDesc, setNewTeamDesc] = useState('');

  const loadTeams = async () => {
    setIsLoading(true);
    try {
      // BE API (getTeams) 는 파라미터를 받지 않게 설계됨 (토큰 기반 자가식별)
      const data = await teamsApi.getTeams();
      setTeams(data);
    } catch (error) {
      console.error('Failed to load teams', error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      loadTeams();
    }
  }, [user]);

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTeamName.trim() || !user) return;

    try {
      await teamsApi.createTeam(newTeamName, newTeamDesc); // BE 명세: name, description만 전달
      setIsDialogOpen(false);
      setNewTeamName('');
      setNewTeamDesc('');
      await loadTeams(); // 리스트 갱신
    } catch (error) {
      console.error('Failed to create team', error);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-8 p-8">
      <header className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">내 팀 목록</h1>
          <p className="text-muted-foreground">소속된 팀을 확인하거나 새로운 팀을 생성하세요.</p>
        </div>
        
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button>새 팀 생성</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>새로운 팀 만들기</DialogTitle>
              <DialogDescription>
                협업할 새로운 공간을 생성합니다.
              </DialogDescription>
            </DialogHeader>
            <form onSubmit={handleCreateTeam}>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="name">팀 이름</Label>
                  <Input 
                    id="name" 
                    value={newTeamName} 
                    onChange={e => setNewTeamName(e.target.value)} 
                    placeholder="예: 프론트엔드 개발팀" 
                    required 
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="desc">팀 설명 (선택)</Label>
                  <Input 
                    id="desc" 
                    value={newTeamDesc} 
                    onChange={e => setNewTeamDesc(e.target.value)} 
                    placeholder="팀의 주요 목표 등" 
                  />
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>취소</Button>
                <Button type="submit">생성하기</Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>
      </header>

      {isLoading ? (
        <div className="flex h-40 items-center justify-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
        </div>
      ) : teams.length === 0 ? (
        <Card className="flex h-40 flex-col items-center justify-center bg-muted/20">
          <p className="text-muted-foreground">아직 소속된 팀이 없습니다.</p>
        </Card>
      ) : (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {teams.map((team) => {
            // BE API는 다대다 pivot 테이블 정보를 반환하므로 team.users 안에 들어있을 것으로 가정
            const members = team.users || [];
            const myMemberInfo = members.find(m => m.id === user?.id);
            const myRole = myMemberInfo?.pivot?.role;
            const roleBadgeColor = myRole === 'owner' ? 'bg-indigo-100 text-indigo-700' : 
                                   myRole === 'manager' ? 'bg-amber-100 text-amber-700' : 'bg-slate-100 text-slate-700';

            return (
              <Card key={team.id} className="flex flex-col hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="truncate">{team.name}</CardTitle>
                    {myRole && (
                      <span className={`text-xs px-2 py-1 rounded-full font-medium ${roleBadgeColor}`}>
                        {myRole.toUpperCase()}
                      </span>
                    )}
                  </div>
                  <CardDescription className="line-clamp-2 min-h-[40px]">
                    {team.description || '설명이 없습니다.'}
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex-1">
                  <div className="flex items-center space-x-2 text-sm text-muted-foreground">
                    <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
                    <span>팀원 {members.length}명</span>
                  </div>
                </CardContent>
                <CardFooter className="flex space-x-2">
                  <Button variant="default" className="flex-1" onClick={() => navigate(`/teams/${team.id}/board`)}>
                    보드 입장
                  </Button>
                  <Button variant="outline" className="flex-1" onClick={() => navigate(`/teams/${team.id}/members`)}>
                    멤버 관리
                  </Button>
                </CardFooter>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
