<?php

namespace App\Repositories;

use App\Models\Team;
use App\Models\Board;

class BoardRepository
{
    /**
     * 보드 생성
     */
    public function createBoard(Team $team, array $data): Board
    {
        return $team->boards()->create($data);
    }
}
