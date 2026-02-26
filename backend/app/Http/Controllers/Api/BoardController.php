<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Board;
use App\Models\Team;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BoardController extends Controller
{
    /**
     * 해당 팀의 보드 목록
     */
    public function index(Request $request, Team $team): JsonResponse
    {
        // 팀 접근 권한은 앞서 TeamPolicy의 view 재활용
        if (!$team->users()->where('users.id', $request->user()->id)->exists()) {
            abort(403, '권한이 없습니다.');
        }

        return response()->json($team->boards);
    }

    /**
     * 새 보드 생성
     */
    public function store(Request $request, Team $team): JsonResponse
    {
        $role = $team->users()->where('users.id', $request->user()->id)->first()?->pivot->role;
        if (!in_array($role, ['owner', 'manager'])) {
            abort(403, '팀 소유자나 매니저만 보드를 생성할 수 있습니다.');
        }

        $validated = $request->validate([
            'name' => 'required|string|max:255',
        ]);

        $board = $team->boards()->create($validated);

        return response()->json($board, 201);
    }

    /**
     * 보드 상세 조회 (columns, tasks 중첩 로드)
     */
    public function show(Request $request, Board $board): JsonResponse
    {
        if (!$board->team->users()->where('users.id', $request->user()->id)->exists()) {
            abort(403, '권한이 없습니다.');
        }

        // 컬럼과 컬럼 안의 태스크를 한 번에 불러옴
        // 관계에 설정된 orderBy('order')가 자동으로 적용됨.
        $board->load('columns.tasks');

        return response()->json($board);
    }
}
