<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Column;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class ColumnController extends Controller
{
    protected function checkManagerAccess(Request $request, Board $board)
    {
        $role = $board->team->users()->where('users.id', $request->user()->id)->first()?->pivot->role;
        if (!in_array($role, ['owner', 'manager'])) {
            abort(403, '소유자나 매니저만 컬럼을 관리할 수 있습니다.');
        }
    }

    /**
     * 새 컬럼 생성
     */
    public function store(Request $request, Board $board): JsonResponse
    {
        $this->checkManagerAccess($request, $board);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        // 현재 보드의 가장 큰 order 값을 찾아 +1 적용
        $maxOrder = $board->columns()->max('order') ?? 0;
        $validated['order'] = $maxOrder + 1;

        $column = $board->columns()->create($validated);

        return response()->json($column, 201);
    }

    /**
     * 컬럼 수정
     */
    public function update(Request $request, Column $column): JsonResponse
    {
        $this->checkManagerAccess($request, $column->board);

        $validated = $request->validate([
            'name' => 'sometimes|required|string|max:255',
            'order' => 'sometimes|required|integer|min:0',
        ]);

        $column->update($validated);

        return response()->json($column);
    }

    /**
     * 컬럼 삭제
     */
    public function destroy(Request $request, Column $column): JsonResponse
    {
        $this->checkManagerAccess($request, $column->board);

        $column->delete();

        return response()->json(['message' => '컬럼이 삭제되었습니다.']);
    }
}
