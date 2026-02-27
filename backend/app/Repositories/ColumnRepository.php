<?php

namespace App\Repositories;

use App\Models\Board;
use App\Models\Column;

class ColumnRepository
{
    /**
     * 특정 보드의 컬럼 중 가장 큰 정렬 순서값 가져오기
     */
    public function getMaxOrder(Board $board): int
    {
        return $board->columns()->max('order') ?? 0;
    }

    /**
     * 새 컬럼 생성
     */
    public function createColumn(Board $board, array $data): Column
    {
        return $board->columns()->create($data);
    }

    /**
     * 컬럼 수정
     */
    public function updateColumn(Column $column, array $data): bool
    {
        return $column->update($data);
    }

    /**
     * 컬럼 삭제
     */
    public function deleteColumn(Column $column): ?bool
    {
        return $column->delete();
    }
}
