<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Column;
use App\Services\ColumnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ColumnController extends Controller
{
    public function __construct(
        protected ColumnService $columnService
    ) {}

    /**
     * 새 컬럼 생성
     */
    public function store(Request $request, Board $board): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $column = $this->columnService->createColumn($board, $request->user(), $validated);

        return response()->json($column, 201);
    }

    /**
     * 컬럼 수정
     */
    public function update(Request $request, Column $column): JsonResponse
    {
        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'order' => 'sometimes|required|integer|min:0',
        ]);

        $updatedColumn = $this->columnService->updateColumn($column, $request->user(), $validated);

        return response()->json($updatedColumn);
    }

    /**
     * 컬럼 삭제
     */
    public function destroy(Request $request, Column $column): JsonResponse
    {
        $this->columnService->deleteColumn($column, $request->user());

        return response()->json(['message' => '컬럼이 삭제되었습니다.']);
    }
}
