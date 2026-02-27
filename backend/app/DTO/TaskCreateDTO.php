<?php

namespace App\DTO;

readonly class TaskCreateDTO
{
    public function __construct(
        public string $title,
        public ?string $description = null,
        public ?int $assignee_id = null,
    ) {}

    public function toArray(): array
    {
        return [
            'title' => $this->title,
            'description' => $this->description,
            'assignee_id' => $this->assignee_id,
        ];
    }
}
