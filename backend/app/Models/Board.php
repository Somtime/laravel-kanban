<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Board extends Model
{
    use HasFactory;

    protected $fillable = [
        'team_id',
        'name',
    ];

    /**
     * 보드가 속한 팀.
     */
    public function team()
    {
        return $this->belongsTo(Team::class);
    }

    /**
     * 보드 내의 컬럼 목록. 순서(order)대로 정렬.
     */
    public function columns()
    {
        return $this->hasMany(Column::class)->orderBy('order');
    }
}
