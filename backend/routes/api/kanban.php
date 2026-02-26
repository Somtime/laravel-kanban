<?php

use App\Http\Controllers\Api\BoardController;
use App\Http\Controllers\Api\ColumnController;
use App\Http\Controllers\Api\TaskController;
use Illuminate\Support\Facades\Route;

// 보드 라우트
Route::get('teams/{team}/boards', [BoardController::class, 'index']);
Route::post('teams/{team}/boards', [BoardController::class, 'store']);
Route::get('boards/{board}', [BoardController::class, 'show']);

// 컬럼 라우트
Route::post('boards/{board}/columns', [ColumnController::class, 'store']);
Route::put('columns/{column}', [ColumnController::class, 'update']);
Route::delete('columns/{column}', [ColumnController::class, 'destroy']);

// 태스크 라우트
Route::post('columns/{column}/tasks', [TaskController::class, 'store']);
Route::put('tasks/{task}', [TaskController::class, 'update']);
Route::put('tasks/{task}/move', [TaskController::class, 'move']);
Route::delete('tasks/{task}', [TaskController::class, 'destroy']);
