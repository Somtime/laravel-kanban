<?php

namespace App\Http\Controllers\Api;

use App\DTO\TaskCreateDTO;
use App\DTO\TaskUpdateDTO;
use App\DTO\TaskMoveDTO;
use App\Http\Controllers\Controller;
use App\Models\Column;
use App\Models\Task;
use App\Services\TaskService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function __construct(
        protected TaskService $taskService
    ) {}

    /**
     * 새 태스크 생성
     */
    public function store(Request $request, Column $column): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
        ]);

        $dto = new TaskCreateDTO(
            title: $validated['title'],
            description: $validated['description'] ?? null,
            assignee_id: $validated['assignee_id'] ?? null
        );

        $task = $this->taskService->createTask($column, $request->user(), $dto);

        return response()->json($task->load('assignee'), 201);
    }

    /**
     * 태스크 내용 수정 (제목, 설명, 담당자)
     */
    public function update(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'title' => 'sometimes|required|string|max:255',
            'description' => 'nullable|string',
            'assignee_id' => 'nullable|exists:users,id',
        ]);

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
     */
    public function destroy(Request $request, Task $task): JsonResponse
    {
        $this->taskService->deleteTask($task, $request->user());

        return response()->json(['message' => '태스크가 삭제되었습니다.']);
    }

    /**
     * 태스크 이동 (드래그 앤 드롭 재정렬 처리)
     */
    public function move(Request $request, Task $task): JsonResponse
    {
        $validated = $request->validate([
            'column_id' => 'required|exists:columns,id',
            'order' => 'required|integer|min:1',
        ]);

        $dto = new TaskMoveDTO(
            column_id: (int)$validated['column_id'],
            order: (int)$validated['order']
        );

        $movedTask = $this->taskService->moveTask($task, $request->user(), $dto);

        return response()->json($movedTask->load('assignee'));
    }
}
