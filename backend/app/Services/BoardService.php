<?php

namespace App\Services;

use App\DTO\BoardCreateDTO;
use App\Models\Team;
use App\Models\User;
use App\Models\Board;
use App\Repositories\BoardRepository;

class BoardService
{
    public function __construct(
        protected BoardRepository $boardRepository
    ) {}

    /**
     * 팀 멤버 접근 권한 검사
     */
    public function checkMemberAccess(Team $team, User $user): void
    {
        if (!$team->users()->where('users.id', $user->id)->exists()) {
            abort(403, '권한이 없습니다.');
        }
    }

    /**
     * 팀 매니저 이상 권한 검사
     */
    public function checkManagerAccess(Team $team, User $user): void
    {
        $role = $team->users()->where('users.id', $user->id)->first()?->pivot->role;
        if (!in_array($role, ['owner', 'manager'])) {
            abort(403, '팀 소유자나 매니저만 보드를 관리할 수 있습니다.');
        }
    }

    /**
     * 보드 생성 로직
     */
    public function createBoard(Team $team, User $user, BoardCreateDTO $dto): Board
    {
        $this->checkManagerAccess($team, $user);
        return $this->boardRepository->createBoard($team, $dto->toArray());
    }
}
