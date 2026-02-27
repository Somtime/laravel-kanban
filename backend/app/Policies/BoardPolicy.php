<?php

namespace App\Policies;

use App\Models\Board;
use App\Models\User;
use App\Models\Team;

class BoardPolicy
{
    /**
     * 보드 목록 열람 권한 (팀 멤버인지 확인)
     */
    public function viewAny(User $user, Team $team): bool
    {
        return $team->users()->where('users.id', $user->id)->exists();
    }

    /**
     * 보드 상세 열람 권한 (팀 멤버인지 확인)
     */
    public function view(User $user, Board $board): bool
    {
        return $this->viewAny($user, $board->team);
    }

    /**
     * 새 보드 생성 권한 (팀의 owner 또는 manager인지 확인)
     */
    public function create(User $user, Team $team): bool
    {
        $role = $team->users()->where('users.id', $user->id)->first()?->pivot->role;
        return in_array($role, ['owner', 'manager']);
    }

    /**
     * 보드 수정 권한 (팀의 owner 또는 manager인지 확인)
     */
    public function update(User $user, Board $board): bool
    {
        return $this->create($user, $board->team);
    }

    /**
     * 보드 삭제 권한 (팀의 owner 또는 manager인지 확인)
     */
    public function delete(User $user, Board $board): bool
    {
        return $this->create($user, $board->team);
    }
}
