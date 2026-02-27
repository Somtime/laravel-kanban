<?php

namespace App\Policies;

use App\Models\Column;
use App\Models\User;
use App\Models\Board;

class ColumnPolicy
{
    /**
     * 컬럼 생성 권한 (해당 보드 팀의 owner 또는 manager인지 확인)
     */
    public function create(User $user, Board $board): bool
    {
        $role = $board->team->users()->where('users.id', $user->id)->first()?->pivot->role;
        return in_array($role, ['owner', 'manager']);
    }

    /**
     * 컬럼 수정 권한
     */
    public function update(User $user, Column $column): bool
    {
        return $this->create($user, $column->board);
    }

    /**
     * 컬럼 삭제 권한
     */
    public function delete(User $user, Column $column): bool
    {
        return $this->create($user, $column->board);
    }
}
