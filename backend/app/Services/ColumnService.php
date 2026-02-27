<?php

namespace App\Services;

use App\DTO\ColumnCreateDTO;
use App\DTO\ColumnUpdateDTO;
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
     * 새 컬럼 생성
     */
    public function createColumn(Board $board, User $user, ColumnCreateDTO $dto): Column
    {
        $maxOrder = $this->columnRepository->getMaxOrder($board);
        
        $data = $dto->toArray();
        $data['order'] = $maxOrder + 1;

        return $this->columnRepository->createColumn($board, $data);
    }

    /**
     * 컬럼 수정
     */
    public function updateColumn(Column $column, User $user, ColumnUpdateDTO $dto): Column
    {
        $this->columnRepository->updateColumn($column, $dto->toArray());

        // 변경된 내용을 다시 모델에 반영하여 리턴
        return $column->fresh();
    }

    /**
     * 컬럼 삭제
     */
    public function deleteColumn(Column $column, User $user): void
    {
        $this->columnRepository->deleteColumn($column);
    }
}
