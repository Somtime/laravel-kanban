import { client } from './client';
import type { Board, ColumnResponse, Task } from './types';

export const boardsApi = {
  // 팀의 모든 보드 가져오기
  getBoards: async (teamId: number): Promise<Board[]> => {
    return client.get(`/api/teams/${teamId}/boards`);
  },

  // 새 보드 생성
  createBoard: async (teamId: number, name: string): Promise<Board> => {
    return client.post(`/api/teams/${teamId}/boards`, { name });
  },

  // 보드 상세 조회 (내부 컬럼, 태스크 포함 중첩 JSON)
  getBoard: async (boardId: number): Promise<Board> => {
    return client.get(`/api/boards/${boardId}`);
  },

  // 컬럼 생성
  createColumn: async (boardId: number, name: string): Promise<ColumnResponse> => {
    return client.post(`/api/boards/${boardId}/columns`, { name });
  },

  // 컬럼 수정
  updateColumn: async (columnId: number, name: string): Promise<ColumnResponse> => {
    return client.put(`/api/columns/${columnId}`, { name });
  },

  // 컬럼 삭제
  deleteColumn: async (columnId: number): Promise<void> => {
    return client.delete(`/api/columns/${columnId}`);
  },

  // 태스크 생성
  createTask: async (columnId: number, title: string, description?: string): Promise<Task> => {
    return client.post(`/api/columns/${columnId}/tasks`, { title, description });
  },

  // 태스크 내용 수정
  updateTask: async (taskId: number, data: Partial<Task>): Promise<Task> => {
    return client.put(`/api/tasks/${taskId}`, data);
  },

  // 태스크 이동 (Reorder/Shift - 트랜잭션 핵심 API)
  moveTask: async (taskId: number, columnId: number, order: number): Promise<void> => {
    return client.put(`/api/tasks/${taskId}/move`, { column_id: columnId, order });
  },

  // 태스크 삭제
  deleteTask: async (taskId: number): Promise<void> => {
    return client.delete(`/api/tasks/${taskId}`);
  }
};
