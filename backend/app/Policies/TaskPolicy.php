<?php

namespace App\Policies;

use App\Models\Task;
use App\Models\User;
use App\Models\Column;

class TaskPolicy
{
    /**
     * 태스크 생성 권한 (해당 보드 팀의 멤버인지 확인)
     */
    public function create(User $user, Column $column): bool
    {
        return $column->board->team->users()->where('users.id', $user->id)->exists();
    }

    /**
     * 태스크 수정 권한 (해당 보드 팀의 멤버인지 확인)
     */
    public function update(User $user, Task $task): bool
    {
        return $this->create($user, $task->column);
    }

    /**
     * 태스크 이동 권한
     */
    public function move(User $user, Task $task): bool
    {
        return $this->create($user, $task->column);
    }

    /**
     * 태스크 삭제 권한
     */
    public function delete(User $user, Task $task): bool
    {
        return $this->create($user, $task->column);
    }
}
