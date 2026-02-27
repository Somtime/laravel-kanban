<?php

namespace App\Services;

use App\Models\Board;
use App\Models\Column;
use App\Models\Task;
use App\Models\User;
use App\Repositories\TaskRepository;
use Illuminate\Support\Facades\DB;

class TaskService
{
    public function __construct(
        protected TaskRepository $taskRepository
    ) {}

    /**
     * 팀 멤버 접근 권한 검사
     */
    public function checkTeamMemberAccess(Board $board, User $user): void
    {
        $exists = $board->team->users()->where('users.id', $user->id)->exists();
        if (!$exists) {
            abort(403, '팀 멤버만 태스크를 제어할 수 있습니다.');
        }
    }

    /**
     * 새 태스크 생성
     */
    public function createTask(Column $column, User $user, array $data): Task
    {
        $this->checkTeamMemberAccess($column->board, $user);

        $maxOrder = $this->taskRepository->getMaxOrder($column);
        $data['order'] = $maxOrder + 1;
        $data['creator_id'] = $user->id;

        return $this->taskRepository->createTask($column, $data);
    }

    /**
     * 태스크 수정
     */
    public function updateTask(Task $task, User $user, array $data): Task
    {
        $this->checkTeamMemberAccess($task->column->board, $user);

        $this->taskRepository->updateTask($task, $data);

        return $task->fresh();
    }

    /**
     * 태스크 삭제
     */
    public function deleteTask(Task $task, User $user): void
    {
        $this->checkTeamMemberAccess($task->column->board, $user);

        $this->taskRepository->deleteTask($task);
    }

    /**
     * 태스크 드래그 앤 드롭 이동
     */
    public function moveTask(Task $task, User $user, int $newColumnId, int $newOrder): Task
    {
        $this->checkTeamMemberAccess($task->column->board, $user);

        $oldColumnId = (int)$task->column_id;
        $oldOrder = (int)$task->order;

        if ($newColumnId === $oldColumnId && $newOrder === $oldOrder) {
            return $task; // 변경사항 없음
        }

        // 복잡한 다중 수정 작업이므로 Transaction 보장
        DB::transaction(function () use ($task, $oldColumnId, $oldOrder, $newColumnId, $newOrder) {
            $this->taskRepository->reorderTasksForMove($task, $oldColumnId, $oldOrder, $newColumnId, $newOrder);
        });

        return $task->fresh();
    }
}
