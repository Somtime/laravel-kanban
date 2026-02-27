<?php

namespace App\Repositories;

use App\Models\Column;
use App\Models\Task;

class TaskRepository
{
    /**
     * 특정 컬럼의 태스크 중 가장 큰 정렬 순서값 가져오기
     */
    public function getMaxOrder(Column $column): int
    {
        return $column->tasks()->max('order') ?? 0;
    }

    /**
     * 태스크 생성
     */
    public function createTask(Column $column, array $data): Task
    {
        return $column->tasks()->create($data);
    }

    /**
     * 태스크 수정
     */
    public function updateTask(Task $task, array $data): bool
    {
        return $task->update($data);
    }

    /**
     * 태스크 삭제
     */
    public function deleteTask(Task $task): ?bool
    {
        return $task->delete();
    }

    /**
     * 드래그 앤 드롭 이동 시 관련된 다른 태스크들의 순서를 재정렬
     */
    public function reorderTasksForMove(Task $task, int $oldColumnId, int $oldOrder, int $newColumnId, int $newOrder): void
    {
        if ($oldColumnId === $newColumnId) {
            // 같은 컬럼 안에서 순서 변경
            if ($newOrder > $oldOrder) {
                Task::where('column_id', $oldColumnId)
                    ->whereBetween('order', [$oldOrder + 1, $newOrder])
                    ->decrement('order');
            } else {
                Task::where('column_id', $oldColumnId)
                    ->whereBetween('order', [$newOrder, $oldOrder - 1])
                    ->increment('order');
            }
        } else {
            // 다른 컬럼으로 이동
            // 1. 기존 컬럼에서 뒤에 있는 태스크들 순서 당기기
            Task::where('column_id', $oldColumnId)
                ->where('order', '>', $oldOrder)
                ->decrement('order');
            
            // 2. 새 컬럼에서 이동할 위치 뒤에 있는 태스크들 순서 밀기
            Task::where('column_id', $newColumnId)
                ->where('order', '>=', $newOrder)
                ->increment('order');
            
            $task->column_id = $newColumnId;
        }
        
        // 이동 대상 태스크 업데이트
        $task->order = $newOrder;
        $task->save();
    }
}
