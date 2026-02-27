<?php

namespace App\DTO;

readonly class TaskUpdateDTO
{
    public function __construct(
        public ?string $title = null,
        public ?string $description = null,
        public ?int $assignee_id = null,
    ) {}

    public function toArray(): array
    {
        // 업데이트 시 필터 처리를 통해 null이 아닌 값들만 채움
        return array_filter([
            'title' => $this->title,
            'description' => $this->description,
            'assignee_id' => $this->assignee_id,
        ], fn($value) => $value !== null);
    }
}
