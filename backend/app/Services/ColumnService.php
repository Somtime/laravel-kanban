<?php

namespace App\Services;

use App\Models\Board;
use App\Models\Column;
use App\Models\User;
use App\Repositories\ColumnRepository;

class ColumnService
{
    public function __construct(
        protected ColumnRepository $columnRepository
    ) {}

    /**
     * 컬럼 관리 권한 (팀 소유자 또는 매니저) 검사
     */
    public function checkManagerAccess(Board $board, User $user): void
    {
        $role = $board->team->users()->where('users.id', $user->id)->first()?->pivot->role;
        if (!in_array($role, ['owner', 'manager'])) {
            abort(403, '소유자나 매니저만 컬럼을 관리할 수 있습니다.');
        }
    }

    /**
     * 새 컬럼 생성
     */
    public function createColumn(Board $board, User $user, array $data): Column
    {
        $this->checkManagerAccess($board, $user);

        // 현재 보드의 가장 큰 order 값을 찾아 +1 적용
        $maxOrder = $this->columnRepository->getMaxOrder($board);
        $data['order'] = $maxOrder + 1;

        return $this->columnRepository->createColumn($board, $data);
    }

    /**
     * 컬럼 수정
     */
    public function updateColumn(Column $column, User $user, array $data): Column
    {
        $this->checkManagerAccess($column->board, $user);

        $this->columnRepository->updateColumn($column, $data);

        // 변경된 내용을 다시 모델에 반영하여 리턴
        return $column->fresh();
    }

    /**
     * 컬럼 삭제
     */
    public function deleteColumn(Column $column, User $user): void
    {
        $this->checkManagerAccess($column->board, $user);

        $this->columnRepository->deleteColumn($column);
    }
}
