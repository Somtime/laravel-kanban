import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '@/contexts/AuthContext';
import { teamsApi } from '@/api/teams';
import type { Team, Role } from '@/api/types';
import { Button } from '@/components/ui/button';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuTrigger,
  DropdownMenuSeparator
} from '@/components/ui/dropdown-menu';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Label } from '@/components/ui/label';

export function TeamMembersPage() {
  const { teamId } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();
  
  const [team, setTeam] = useState<Team | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // 초대 모달 상태
  const [isInviteOpen, setIsInviteOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');
  const [inviteRole, setInviteRole] = useState<Role>('member');
  const [isInviting, setIsInviting] = useState(false);

  useEffect(() => {
    const loadTeam = async () => {
      setIsLoading(true);
      try {
        const data = await teamsApi.getTeam(Number(teamId));
        if (!data) {
          navigate('/teams', { replace: true });
          return;
        }
        setTeam(data);
      } catch (error) {
        console.error('Failed to load team', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    if (teamId) {
      loadTeam();
    }
  }, [teamId, navigate]);

  if (isLoading || !team) {
    return (
      <div className="flex h-64 items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent"></div>
      </div>
    );
  }

  const members = team.users || [];
  const myMemberInfo = members.find(m => m.id === user?.id);
  const myRole = myMemberInfo?.pivot?.role;
  const isOwner = myRole === 'owner';
  const isManager = myRole === 'manager';
  const canManageRoles = isOwner || isManager;

  const handleUpdateRole = async (memberId: number, newRole: Role) => {
    const roleWeight: Record<string, number> = { owner: 3, manager: 2, member: 1 };
    const currentMyWeight = myRole ? roleWeight[myRole] : 0;
    const nextRoleWeight = roleWeight[newRole] || 0;
    
    if (currentMyWeight < nextRoleWeight) {
      alert('경고: 자신의 계급보다 높은 계급을 부여할 수 없습니다.');
      return;
    }

    try {
      await teamsApi.updateMemberRole(team.id, memberId, newRole);
      setTeam(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users?.map(m => m.id === memberId ? { ...m, pivot: { ...m.pivot, role: newRole } } : m)
        };
      });
    } catch (e) {
      console.error('권한 업데이트 실패:', e);
    }
  };

  const handleRemoveMember = async (memberId: number) => {
    const targetUser = members.find(m => m.id === memberId);
    const roleWeight: Record<string, number> = { owner: 3, manager: 2, member: 1 };
    const currentMyWeight = myRole ? roleWeight[myRole] : 0;
    const targetWeight = roleWeight[targetUser?.pivot?.role as string] || 0;

    if (currentMyWeight < targetWeight) {
      alert('경고: 자신보다 상위 계급인 팀원을 방출할 수 없습니다.');
      return;
    }

    if (!confirm('정말 이 멤버를 팀에서 제외할까요?')) return;
    try {
      await teamsApi.removeMember(team.id, memberId);
      setTeam(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          users: prev.users?.filter(m => m.id !== memberId)
        };
      });
    } catch (e) {
      console.error('멤버 제외 실패:', e);
    }
  };

  const handleInviteMember = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;

    setIsInviting(true);
    try {
      await teamsApi.addMember(team.id, inviteEmail, inviteRole);
      // 초대 후 전체 재조회 (새 유저 정보 등 확보를 위해)
      const data = await teamsApi.getTeam(team.id);
      setTeam(data);
      
      setIsInviteOpen(false);
      setInviteEmail('');
      setInviteRole('member');
    } catch (error) {
      console.error('팀원 초대 실패', error);
      alert('초대 실패: 유저를 찾을 수 없거나 이미 팀원입니다.');
    } finally {
      setIsInviting(false);
    }
  };

  return (
    <div className="mx-auto max-w-4xl p-8 space-y-8">
      <header className="flex items-center space-x-4">
        <Button variant="outline" onClick={() => navigate('/teams')}>← 돌아가기</Button>
        <div>
          <h1 className="text-3xl font-bold tracking-tight">{team.name} - 멤버 관리</h1>
          <p className="text-muted-foreground">{team.description}</p>
        </div>
      </header>

      <Card>
        <CardHeader>
          <div className="flex justify-between items-center">
            <div>
              <CardTitle>팀원 목록</CardTitle>
              <CardDescription>총 {members.length}명의 멤버가 있습니다.</CardDescription>
            </div>
            {canManageRoles && (
              <Dialog open={isInviteOpen} onOpenChange={setIsInviteOpen}>
                <DialogTrigger asChild>
                  <Button>초대하기</Button>
                </DialogTrigger>
                <DialogContent>
                  <form onSubmit={handleInviteMember}>
                    <DialogHeader>
                      <DialogTitle>팀원 초대</DialogTitle>
                      <DialogDescription>
                        함께 협업할 구성원의 이메일 주소를 입력하세요.
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <Label htmlFor="email">이메일 계정</Label>
                        <Input 
                          id="email" 
                          type="email" 
                          placeholder="user@example.com" 
                          value={inviteEmail} 
                          onChange={(e) => setInviteEmail(e.target.value)}
                          required 
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>초대 권한 (역할)</Label>
                        <Select value={inviteRole} onValueChange={(val: Role) => setInviteRole(val)}>
                          <SelectTrigger>
                            <SelectValue placeholder="역할 선택" />
                          </SelectTrigger>
                          <SelectContent>
                            {isOwner && <SelectItem value="manager">관리자 (Manager)</SelectItem>}
                            <SelectItem value="member">일반 (Member)</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" type="button" onClick={() => setIsInviteOpen(false)}>취소</Button>
                      <Button type="submit" disabled={isInviting}>
                        {isInviting ? '요청 중...' : '초대 보내기'}
                      </Button>
                    </DialogFooter>
                  </form>
                </DialogContent>
              </Dialog>
            )}
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {members.map((member) => {
              const roleDisplay = 
                member.pivot.role === 'owner' ? '소유자 (Owner)' : 
                member.pivot.role === 'manager' ? '관리자 (Manager)' : '일반 (Member)';
              
              const roleColor = 
                member.pivot.role === 'owner' ? 'bg-indigo-100 text-indigo-700 hover:bg-indigo-100' : 
                member.pivot.role === 'manager' ? 'bg-amber-100 text-amber-700 hover:bg-amber-100' : 'bg-slate-100 text-slate-700 hover:bg-slate-100';

              // 계급 가중치 부여 (Owner=3, Manager=2, Member=1)
              const roleWeight: Record<string, number> = { owner: 3, manager: 2, member: 1 };
              const myWeight = myRole ? roleWeight[myRole] : 0;
              const targetWeight = roleWeight[member.pivot.role] || 0;

              // Owner, Manager만 타인 조작 가능
              // 동급이거나 하급자인 경우(내 등급이 크거나 같을 때) 조작 가능. 본인은 본인 수정 불가
              const canModifyThisUser = canManageRoles && user?.id !== member.id && (myWeight >= targetWeight);

              return (
                <div key={member.id} className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div className="flex items-center space-x-4">
                    <Avatar>
                      <AvatarFallback className="bg-primary/10 text-primary">
                        {member.name.substring(0, 2).toUpperCase()}
                      </AvatarFallback>
                    </Avatar>
                    <div>
                      <p className="text-sm font-medium leading-none">{member.name}</p>
                      <p className="text-sm text-muted-foreground">{member.email}</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className={roleColor}>
                      {roleDisplay}
                    </Badge>

                    {canModifyThisUser ? (
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="sm">관리</Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'owner')} disabled={myWeight < 3}>
                            이 역할을 소유자(Owner)로
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'manager')} disabled={myWeight < 2}>
                            이 역할을 관리자(Manager)로
                          </DropdownMenuItem>
                          <DropdownMenuItem onClick={() => handleUpdateRole(member.id, 'member')} disabled={myWeight < 1}>
                            이 역할을 일반(Member)로
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem className="text-destructive focus:text-destructive" onClick={() => handleRemoveMember(member.id)}>
                            팀에서 제외
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    ) : (
                      <div className="w-[52px]"></div> /* Placeholder to keep UI aligned */
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
