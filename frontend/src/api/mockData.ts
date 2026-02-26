// src/api/mockData.ts

export type Role = 'owner' | 'manager' | 'member';

export interface User {
  id: number;
  name: string;
  email: string;
}

export interface TeamMember extends User {
  role: Role;
}

export interface Team {
  id: number;
  name: string;
  description: string;
  members: TeamMember[];
}

// 초기 로컬스토리지 팀 세팅 헬퍼
export function getMockTeams(): Team[] {
  const stored = localStorage.getItem('mock_teams');
  if (stored) {
    return JSON.parse(stored);
  }
  
  // 기본 데이터
  const defaultTeams: Team[] = [
    {
      id: 1,
      name: "개발 1팀",
      description: "사내 주요 프로덕트 프론트엔드/백엔드 개발팀",
      members: [
        { id: 1, name: "test", email: "test@test.com", role: "owner" },
        { id: 2, name: "Alice", email: "alice@example.com", role: "manager" },
        { id: 3, name: "Bob", email: "bob@example.com", role: "member" },
      ]
    },
    {
      id: 2,
      name: "TF 기획팀",
      description: "신규 서비스 기획 TF",
      members: [
        { id: 4, name: "Charlie", email: "charlie@example.com", role: "owner" },
        { id: 1, name: "test", email: "test@test.com", role: "manager" },
      ]
    }
  ];
  
  localStorage.setItem('mock_teams', JSON.stringify(defaultTeams));
  return defaultTeams;
}

export function saveMockTeams(teams: Team[]) {
  localStorage.setItem('mock_teams', JSON.stringify(teams));
}
