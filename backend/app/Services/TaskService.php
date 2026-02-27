<?php

namespace App\Services;

use App\DTO\TaskCreateDTO;
use App\DTO\TaskUpdateDTO;
use App\DTO\TaskMoveDTO;
use App\Models\Board;
use App\Models\Column;
use App\Models\Task;
use App\Models\User;
use App\Repositories\TaskRepository;
use App\Exceptions\UnauthorizedAccessException;
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
            throw new UnauthorizedAccessException('팀 멤버만 태스크를 제어할 수 있습니다.');
        }
    }

    /**
     * 새 태스크 생성
     */
    public function createTask(Column $column, User $user, TaskCreateDTO $dto): Task
    {
        $this->checkTeamMemberAccess($column->board, $user);

        $maxOrder = $this->taskRepository->getMaxOrder($column);
        
        $data = $dto->toArray();
        $data['order'] = $maxOrder + 1;
        $data['creator_id'] = $user->id;

        return $this->taskRepository->createTask($column, $data);
    }

    /**
     * 태스크 수정
     */
    public function updateTask(Task $task, User $user, TaskUpdateDTO $dto): Task
    {
        $this->checkTeamMemberAccess($task->column->board, $user);

        $this->taskRepository->updateTask($task, $dto->toArray());

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
    public function moveTask(Task $task, User $user, TaskMoveDTO $dto): Task
    {
        $this->checkTeamMemberAccess($task->column->board, $user);

        $oldColumnId = (int)$task->column_id;
        $oldOrder = (int)$task->order;

        if ($dto->column_id === $oldColumnId && $dto->order === $oldOrder) {
            return $task; // 변경사항 없음
        }

        // 복잡한 다중 수정 작업이므로 Transaction 보장
        DB::transaction(function () use ($task, $oldColumnId, $oldOrder, $dto) {
            $this->taskRepository->reorderTasksForMove($task, $oldColumnId, $oldOrder, $dto->column_id, $dto->order);
        });

        return $task->fresh();
    }
}
