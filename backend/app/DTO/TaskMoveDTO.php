<?php

namespace App\DTO;

readonly class TaskMoveDTO
{
    public function __construct(
        public int $column_id,
        public int $order,
    ) {}
}
