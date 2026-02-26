<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Auth\RegisterRequest;
use App\Http\Requests\Auth\LoginRequest;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class AuthController extends Controller
{
    /**
     * 회원가입
     */
    public function register(RegisterRequest $request): JsonResponse
    {
        $user = User::create($request->validated());

        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => '회원가입이 완료되었습니다.',
            'user' => $user,
            'token' => $token,
        ], 201);
    }

    /**
     * 로그인
     */
    public function login(LoginRequest $request): JsonResponse
    {
        if (!Auth::attempt($request->validated())) {
            return response()->json([
                'message' => '이메일 또는 비밀번호가 올바르지 않습니다.',
            ], 401);
        }

        $user = Auth::user();
        $token = $user->createToken('auth-token')->plainTextToken;

        return response()->json([
            'message' => '로그인 성공',
            'user' => $user,
            'token' => $token,
        ]);
    }

    /**
     * 로그아웃
     */
    public function logout(Request $request): JsonResponse
    {
        // 현재 사용 중인 토큰만 삭제
        $request->user()->currentAccessToken()->delete();

        return response()->json([
            'message' => '로그아웃 되었습니다.',
        ]);
    }
}
