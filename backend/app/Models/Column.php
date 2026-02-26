<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Column extends Model
{
    use HasFactory;

    protected $fillable = [
        'board_id',
        'name',
        'order',
    ];

    /**
     * 컬럼이 포함된 보드.
     */
    public function board()
    {
        return $this->belongsTo(Board::class);
    }

    /**
     * 컬럼 내의 태스크 목록. 순서(order)대로 정렬.
     */
    public function tasks()
    {
        return $this->hasMany(Task::class)->orderBy('order');
    }
}
