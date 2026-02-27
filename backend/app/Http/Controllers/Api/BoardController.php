<?php

namespace App\Http\Controllers\Api;

use App\DTO\BoardCreateDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreBoardRequest;
use App\Models\Board;
use App\Models\Team;
use App\Services\BoardService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class BoardController extends Controller
{
    public function __construct(
        protected BoardService $boardService
    ) {}

    /**
     * 해당 팀의 보드 목록
     */
    public function index(Request $request, Team $team): JsonResponse
    {
        $this->boardService->checkMemberAccess($team, $request->user());

        return response()->json($team->boards);
    }

    /**
     * 새 보드 생성
     */
    public function store(StoreBoardRequest $request, Team $team): JsonResponse
    {
        $dto = new BoardCreateDTO($request->validated('name'));
        $board = $this->boardService->createBoard($team, $request->user(), $dto);

        return response()->json($board, 201);
    }

    /**
     * 보드 상세 조회 (columns, tasks 중첩 로드)
     */
    public function show(Request $request, Board $board): JsonResponse
    {
        $this->boardService->checkMemberAccess($board->team, $request->user());

        // 컬럼과 컬럼 안의 태스크를 한 번에 불러옴
        // 관계에 설정된 orderBy('order')가 자동으로 적용됨.
        $board->load('columns.tasks');

        return response()->json($board);
    }
}
