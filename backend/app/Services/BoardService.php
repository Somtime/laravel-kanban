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
     * 보드 생성 로직
     */
    public function createBoard(Team $team, User $user, BoardCreateDTO $dto): Board
    {
        return $this->boardRepository->createBoard($team, $dto->toArray());
    }
}
