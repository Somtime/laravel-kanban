<?php

use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;
use Symfony\Component\HttpKernel\Exception\NotFoundHttpException;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        api: __DIR__.'/../routes/api.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        //
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        // 1. Form Request 등에서 터진 Validation 오류 (422) 포맷팅
        $exceptions->render(function (ValidationException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'error' => '입력값이 올바르지 않습니다.',
                    'errors' => $e->errors(),
                    'code' => 422
                ], 422);
            }
        });

        // 2. 모델을 찾지 못했을 때 (404) 포맷팅
        $exceptions->render(function (NotFoundHttpException $e, Request $request) {
            if ($request->is('api/*')) {
                return response()->json([
                    'error' => '요청하신 데이터를 찾을 수 없습니다.',
                    'code' => 404
                ], 404);
            }
        });

        // 3. 그 외 기본 Exception 처리
        $exceptions->render(function (Throwable $e, Request $request) {
            if ($request->is('api/*')) {
                // 커스텀 예외(UnauthorizedAccessException 등) 자체 render가 있다면 그것이 우선 동작하도록 둡니다.
                // 그 외 걸러지지 않은 일반 서버 에러(500) 등에 대한 포맷 지정
                $statusCode = method_exists($e, 'getStatusCode') ? $e->getStatusCode() : 500;
                
                return response()->json([
                    'error' => $e->getMessage() ?: '서버 내부 오류가 발생했습니다.',
                    'code' => $statusCode
                ], $statusCode);
            }
        });
    })->create();
