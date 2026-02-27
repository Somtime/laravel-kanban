<?php

namespace App\Http\Controllers\Api;

use App\DTO\ColumnCreateDTO;
use App\DTO\ColumnUpdateDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreColumnRequest;
use App\Http\Requests\UpdateColumnRequest;
use App\Models\Board;
use App\Models\Column;
use App\Services\ColumnService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group 컬럼 관리 (Columns)
 *
 * 보드 내의 칸반 컬럼(Column)을 생성, 수정, 삭제하는 API입니다.
 */
class ColumnController extends Controller
{
    public function __construct(
        protected ColumnService $columnService
    ) {}

    /**
     * 새 컬럼 생성
     * 
     * 특정 보드 하위에 새로운 컬럼(예: To Do, In Progress)을 생성합니다.
     * 보드 관리자(owner/manager) 권한이 필요합니다.
     */
    public function store(StoreColumnRequest $request, Board $board): JsonResponse
    {
        $dto = new ColumnCreateDTO($request->validated('name'));
        $column = $this->columnService->createColumn($board, $request->user(), $dto);

        return response()->json($column, 201);
    }

    /**
     * 컬럼 내용 및 순서 수정
     * 
     * 컬럼의 이름이나 순서(order)를 변경합니다.
     */
    public function update(UpdateColumnRequest $request, Column $column): JsonResponse
    {
        $validated = $request->validated();

        $dto = new ColumnUpdateDTO(
            name: $validated['name'] ?? null,
            order: $validated['order'] ?? null
        );

        $updatedColumn = $this->columnService->updateColumn($column, $request->user(), $dto);

        return response()->json($updatedColumn);
    }

    /**
     * 컬럼 삭제
     * 
     * 컬럼을 삭제합니다. 내부의 태스크들도 함께 처리(또는 삭제)될 수 있습니다.
     */
    public function destroy(Request $request, Column $column): JsonResponse
    {
        $this->columnService->deleteColumn($column, $request->user());

        return response()->json(['message' => '컬럼이 삭제되었습니다.']);
    }
}
