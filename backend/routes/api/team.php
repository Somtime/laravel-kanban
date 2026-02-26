<?php

use App\Http\Controllers\Api\TeamController;
use Illuminate\Support\Facades\Route;

Route::get('/', [TeamController::class, 'index']);
Route::post('/', [TeamController::class, 'store']);
Route::get('/{team}', [TeamController::class, 'show']);
Route::post('/{team}/members', [TeamController::class, 'addMember']);
Route::put('/{team}/members/{user}', [TeamController::class, 'updateRole']);
Route::delete('/{team}/members/{user}', [TeamController::class, 'removeMember']);
