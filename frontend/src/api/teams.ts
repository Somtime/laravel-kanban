import { client } from './client';
import type { Team, Role } from './types';

// BE 호출용 실제 teamsApi 구현체
export const teamsApi = {
  // 사용자가 속한 팀 목록 가져오기
  getTeams: async (): Promise<Team[]> => {
    return client.get('/api/teams');
  },

  // 특정 팀 상세 정보 가져오기 (멤버, 계급 포함)
  getTeam: async (teamId: number): Promise<Team> => {
    return client.get(`/api/teams/${teamId}`);
  },

  // 팀 생성
  createTeam: async (name: string, description: string): Promise<Team> => {
    return client.post('/api/teams', { name, description });
  },

  // 팀원 권한 변경
  updateMemberRole: async (teamId: number, memberId: number, newRole: Role): Promise<void> => {
    return client.put(`/api/teams/${teamId}/members/${memberId}`, { role: newRole });
  },

  // 팀원 초대 (임시 - BE 명세에 따른 Payload 확정 필요)
  addMember: async (teamId: number, email: string, role: Role = 'member'): Promise<void> => {
    return client.post(`/api/teams/${teamId}/members`, { email, role });
  },

  // 팀원 방출 (삭제)
  removeMember: async (teamId: number, memberId: number): Promise<void> => {
    return client.delete(`/api/teams/${teamId}/members/${memberId}`);
  }
};
