<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Task extends Model
{
    use HasFactory;

    protected $fillable = [
        'column_id',
        'title',
        'description',
        'creator_id',
        'assignee_id',
        'order',
    ];

    /**
     * 태스크가 속한 컬럼.
     */
    public function column()
    {
        return $this->belongsTo(Column::class);
    }

    /**
     * 태스크 담당 유저.
     */
    public function assignee()
    {
        return $this->belongsTo(User::class, 'assignee_id');
    }

    /**
     * 태스크 생성 유저.
     */
    public function creator()
    {
        return $this->belongsTo(User::class, 'creator_id');
    }
}
