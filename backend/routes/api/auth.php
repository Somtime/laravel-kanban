<?php

use App\Http\Controllers\Api\AuthController;
use Illuminate\Support\Facades\Route;

// 인증 라우트 (토큰 불필요)
Route::post('/register', [AuthController::class, 'register']);
Route::post('/login', [AuthController::class, 'login']);

// 로그아웃 (토큰 필요)
Route::post('/logout', [AuthController::class, 'logout'])->middleware('auth:sanctum');
