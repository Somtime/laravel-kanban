<?php

use App\Http\Controllers\Api\UserController;
use Illuminate\Support\Facades\Route;

// 유저 관련 라우트 (모두 인증 필요)
Route::get('/user', [UserController::class, 'me']);
