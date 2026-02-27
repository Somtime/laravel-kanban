<?php

namespace App\DTO;

readonly class ColumnUpdateDTO
{
    public function __construct(
        public ?string $name = null,
        public ?int $order = null,
    ) {}

    public function toArray(): array
    {
        return array_filter([
            'name' => $this->name,
            'order' => $this->order,
        ], fn($value) => $value !== null);
    }
}
