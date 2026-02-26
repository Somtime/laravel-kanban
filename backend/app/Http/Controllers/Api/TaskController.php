<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Column;
use App\Models\Task;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class TaskController extends Controller
{
    /**
     * 권한 확인 (해당 보드가 속한 팀의 멤버인지)
     */
    protected function checkTeamMemberAccess(Request $request, $board)
    {
        $exists = $board->team->users()->where('users.id', $request->user()->id)->exists();
        if (!$exists) {
            abort(403, '팀 멤버만 태스크를 제어할 수 있습니다.');
        }
    }

    /**
     * 새 태스크 생성
     */
    public function store(Request $request, Column $column): JsonResponse
    {
        $this->checkTeamMemberAccess($request, $column->board);

        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
        ]);

        $maxOrder = $column->tasks()->max('order') ?? 0;
        $validated['order'] = $maxOrder + 1;
        $validated['creator_id'] = $request->user()->id;

        $task = $column->tasks()->create($validated);

        return response()->json($task->load('assignee'), 201);
    }

    /**
     * 태스크 내용 수정 (제목, 설명, 담당자)
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $this->checkTeamMemberAccess($request, $task->column->board);

        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
        ]);

        $task->update($validated);

        return response()->json($task->load('assignee'));
    }

    /**
     * 태스크 삭제
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->checkTeamMemberAccess($request, $task->column->board);

        $task->delete();

        return response()->json(['message' => '태스크가 삭제되었습니다.']);
    }

    /**
     * 태스크 이동 (드래그 앤 드롭 재정렬 처리)
     */
    public function move(Request $request, Task $task): JsonResponse
    {
        $this->checkTeamMemberAccess($request, $task->column->board);

        $validated = $request->validate([
            'column_id' => 'required|exists:columns,id',
            'order' => 'required|integer|min:1',
        ]);

        $newColumnId = (int)$validated['column_id'];
        $newOrder = (int)$validated['order'];
        
        $oldColumnId = (int)$task->column_id;
        $oldOrder = (int)$task->order;

        if ($newColumnId === $oldColumnId && $newOrder === $oldOrder) {
            return response()->json($task); // 변경사항 없음
        }

        DB::transaction(function () use ($task, $oldColumnId, $oldOrder, $newColumnId, $newOrder) {
            if ($oldColumnId === $newColumnId) {
                // 같은 컬럼 안에서 순서 변경
                if ($newOrder > $oldOrder) {
                    Task::where('column_id', $oldColumnId)
                        ->whereBetween('order', [$oldOrder + 1, $newOrder])
                        ->decrement('order');
                } else {
                    Task::where('column_id', $oldColumnId)
                        ->whereBetween('order', [$newOrder, $oldOrder - 1])
                        ->increment('order');
                }
            } else {
                // 다른 컬럼으로 이동
                // 1. 기존 컬럼에서 뒤에 있는 태스크들 순서 당기기
                Task::where('column_id', $oldColumnId)
                    ->where('order', '>', $oldOrder)
                    ->decrement('order');
                
                // 2. 새 컬럼에서 이동할 위치 뒤에 있는 태스크들 순서 밀기
                Task::where('column_id', $newColumnId)
                    ->where('order', '>=', $newOrder)
                    ->increment('order');
                
                $task->column_id = $newColumnId;
            }
            
            // 이동할 태스크 업데이트
            $task->order = $newOrder;
            $task->save();
        });

        return response()->json($task->fresh());
    }
}
