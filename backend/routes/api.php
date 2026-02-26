<?php

use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
|
| 기능별로 라우트 파일을 분리하여 관리합니다.
| - api/auth.php : 인증 관련 (회원가입, 로그인, 로그아웃)
| - api/user.php : 유저 관련 (인증 필요)
|
*/

// 인증 라우트: /api/auth/*
Route::prefix('auth')->group(base_path('routes/api/auth.php'));

// 유저 라우트: /api/user (인증 필요)
Route::middleware('auth:sanctum')->group(base_path('routes/api/user.php'));

// 팀 라우트: /api/teams (인증 필요)
Route::middleware('auth:sanctum')->prefix('teams')->group(base_path('routes/api/team.php'));

// 칸반 라우트 (보드, 컬럼, 태스크): /api (인증 필요)
Route::middleware('auth:sanctum')->group(base_path('routes/api/kanban.php'));
