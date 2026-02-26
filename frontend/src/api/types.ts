// src/api/types.ts

// 사용자
export interface User {
  id: number;
  name: string;
  email: string;
}

// 팀 / 역할
export type Role = 'owner' | 'manager' | 'member';

export interface TeamMember extends User {
  pivot: {
    role: Role;
  };
}

export interface Team {
  id: number;
  name: string;
  description: string;
  created_at: string;
  updated_at: string;
  users?: TeamMember[]; // BE 응답에서 members 대신 `users` 관계를 사용할 수 있습니다.
}

// 칸반
export interface Task {
  id: number; // BE id
  column_id: number;
  title: string;
  description: string | null;
  creator_id: number;
  assignee_id: number | null;
  order: number;
  // 관계형 데이터가 같이 올 수 있음
  creator?: Pick<User, 'id' | 'name' | 'email'>;
  assignee?: Pick<User, 'id' | 'name' | 'email'>;
}

export interface ColumnResponse {
  id: number;
  board_id: number;
  name: string;
  order: number;
  tasks: Task[]; // 중첩 응답
}

export interface Board {
  id: number;
  team_id: number;
  name: string;
  columns?: ColumnResponse[]; // 중첩 응답
}
