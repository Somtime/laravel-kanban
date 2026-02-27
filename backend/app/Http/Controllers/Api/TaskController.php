<?php

namespace App\Http\Controllers\Api;

use App\DTO\TaskCreateDTO;
use App\DTO\TaskUpdateDTO;
use App\DTO\TaskMoveDTO;
use App\Http\Controllers\Controller;
use App\Http\Requests\StoreTaskRequest;
use App\Http\Requests\UpdateTaskRequest;
use App\Http\Requests\MoveTaskRequest;
use App\Models\Column;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * @group 태스크 관리 (Tasks)
 *
 * 칸반 보드의 핵심인 태스크(카드)를 생성, 수정, 삭제 및 이동 처리하는 API입니다.
 */
class TaskController extends Controller
{
    public function __construct(
        protected TaskService $taskService
    ) {}

    /**
     * 새 태스크 생성
     * 
     * 지정된 컬럼 하위에 새로운 태스크를 생성합니다. 담당자(assignee_id)를 지정할 수 있습니다.
     */
    public function store(StoreTaskRequest $request, Column $column): JsonResponse
    {
        $validated = $request->validated();

        $dto = new TaskCreateDTO(
            title: $validated['title'],
            description: $validated['description'] ?? null,
            assignee_id: $validated['assignee_id'] ?? null
        );

        $task = $this->taskService->createTask($column, $request->user(), $dto);

        return response()->json($task->load('assignee'), 201);
    }

    /**
     * 태스크 내용 수정
     * 
     * 태스크의 제목, 상세 설명, 그리고 담당자 정보를 업데이트합니다.
     */
    public function update(UpdateTaskRequest $request, Task $task): JsonResponse
    {
        $validated = $request->validated();

        $dto = new TaskUpdateDTO(
            title: $validated['title'] ?? null,
            description: $validated['description'] ?? null,
            assignee_id: $validated['assignee_id'] ?? null
        );

        $updatedTask = $this->taskService->updateTask($task, $request->user(), $dto);

        return response()->json($updatedTask->load('assignee'));
    }

    /**
     * 태스크 삭제
     * 
     * 불필요해진 태스크를 시스템에서 삭제합니다.
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->taskService->deleteTask($task, $request->user());

        return response()->json(['message' => '태스크가 삭제되었습니다.']);
    }

    /**
     * 태스크 이동 (Drag & Drop)
     * 
     * 태스크를 다른 컬럼으로 이동시키거나, 동일 컬럼 내에서 순서(order)를 재배치합니다.
     * 트랜잭션을 통해 다른 태스크들의 순서도 자동으로 조정됩니다.
     */
    public function move(MoveTaskRequest $request, Task $task): JsonResponse
    {
        $validated = $request->validated();

        $dto = new TaskMoveDTO(
            column_id: (int)$validated['column_id'],
            order: (int)$validated['order']
        );

        $movedTask = $this->taskService->moveTask($task, $request->user(), $dto);

        return response()->json($movedTask->load('assignee'));
    }
}
