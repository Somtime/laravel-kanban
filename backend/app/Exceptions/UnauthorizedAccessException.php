<?php

namespace App\Exceptions;

use Exception;
use Illuminate\Http\JsonResponse;

class UnauthorizedAccessException extends Exception
{
    /**
     * Report the exception.
     */
    public function report(): void
    {
        // 로깅이 필요한 경우 여기에 기록합니다.
    }

    /**
     * Render the exception into an HTTP response.
     */
    public function render($request): JsonResponse
    {
        return response()->json([
            'error' => $this->getMessage() ?: '권한이 없습니다.',
            'code' => 403
        ], 403);
    }
}
