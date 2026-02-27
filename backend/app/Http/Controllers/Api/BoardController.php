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

/**
 * @group 보드 관리 (Boards)
 *
 * 팀 내의 칸반 보드를 관리하는 API입니다.
 */
class BoardController extends Controller
{
    public function __construct(
        protected BoardService $boardService
    ) {}

    /**
     * 보드 목록 조회
     * 
     * 특정 팀(Team)이 소유한 모든 보드의 목록을 반환합니다. 
     * 팀에 소속된 멤버만 조회할 수 있습니다.
     * 
     * @response {"id": 1, "team_id": 1, "name": "기획 보드", "created_at": "..."}
     */
    public function index(Request $request, Team $team): JsonResponse
    {
        $this->boardService->checkMemberAccess($team, $request->user());

        return response()->json($team->boards);
    }

    /**
     * 새 보드 생성
     * 
     * 해당 팀에 새로운 보드를 추가합니다. 
     * 팀의 owner 또는 manager 권한이 필요합니다.
     */
    public function store(StoreBoardRequest $request, Team $team): JsonResponse
    {
        $dto = new BoardCreateDTO($request->validated('name'));
        $board = $this->boardService->createBoard($team, $request->user(), $dto);

        return response()->json($board, 201);
    }

    /**
     * 보드 상세 조회
     * 
     * 특정 보드의 상세 정보와 더불어 내부의 컬럼(Columns) 및 태스크(Tasks)들을 
     * 중첩된(Nested) 형태로 한 번에 조회합니다.
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
