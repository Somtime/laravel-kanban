<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Http\Requests\Team\StoreTeamRequest;
use App\Http\Requests\Team\UpdateTeamRoleRequest;
use App\Models\Team;
use App\Models\User;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Foundation\Auth\Access\AuthorizesRequests;

class TeamController extends Controller
{
    use AuthorizesRequests;

    /**
     * 내(토큰 소유자)가 속한 팀 목록 조회
     */
    public function index(Request $request): JsonResponse
    {
        $teams = $request->user()->teams()->with('users')->get();
        return response()->json($teams);
    }

    /**
     * 새 팀 생성 (생성자는 자동으로 owner 발탁)
     */
    public function store(StoreTeamRequest $request): JsonResponse
    {
        return DB::transaction(function () use ($request) {
            $team = Team::create($request->validated());
            $team->users()->attach($request->user()->id, ['role' => 'owner']);

            return response()->json($team->load('users'), 201);
        });
    }

    /**
     * 특정 팀의 상세 정보 (팀원 목록, 계급 포함)
     */
    public function show(Team $team): JsonResponse
    {
        $this->authorize('view', $team);
        
        return response()->json($team->load('users'));
    }

    /**
     * 팀원 초대
     */
    public function addMember(Request $request, Team $team): JsonResponse
    {
        if ($request->user()->cannot('addMember', $team)) {
            return response()->json(['message' => '초대 권한이 없습니다. (Owner 또는 Manager만 가능)'], 403);
        }
        
        $request->validate([
            'email' => 'required|email',
            'role' => 'nullable|string|in:owner,manager,member'
        ]);

        $user = User::where('email', $request->email)->first();
        
        if (!$user) {
            return response()->json(['message' => '해당 이메일을 가진 사용자를 찾을 수 없습니다.'], 404);
        }
        
        if ($team->users()->where('users.id', $user->id)->exists()) {
            return response()->json(['message' => '이미 팀에 소속된 멤버입니다.'], 409);
        }

        $role = $request->input('role', 'member');
        $team->users()->attach($user->id, ['role' => $role]);

        return response()->json([
            'message' => '팀원이 성공적으로 초대되었습니다.',
            'user' => [
                'id' => $user->id,
                'name' => $user->name,
                'email' => $user->email,
                'pivot' => [
                    'role' => $role
                ]
            ]
        ], 201);
    }

    /**
     * 팀원의 역할(role) 변경 (상위 계급자만 가능)
     */
    public function updateRole(UpdateTeamRoleRequest $request, Team $team, User $user): JsonResponse
    {
        $this->authorize('updateRole', [$team, $user]);

        $team->users()->updateExistingPivot($user->id, [
            'role' => $request->role,
        ]);

        return response()->json(['message' => '역할이 변경되었습니다.', 'team' => $team->load('users')]);
    }

    /**
     * 팀원 방출 (상위 계급자만 가능)
     */
    public function removeMember(Team $team, User $user): JsonResponse
    {
        $this->authorize('removeMember', [$team, $user]);

        $team->users()->detach($user->id);

        return response()->json(['message' => '팀원을 방출했습니다.', 'team' => $team->load('users')]);
    }
}
