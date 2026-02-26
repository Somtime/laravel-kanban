<?php

namespace App\Policies;

use App\Models\Team;
use App\Models\User;
use Illuminate\Auth\Access\Response;

class TeamPolicy
{
    /**
     * Determine whether the user can view the model.
     */
    public function view(User $user, Team $team): bool
    {
        return $team->users()->where('users.id', $user->id)->exists();
    }

    /**
     * Determine whether the user can add a member to the team.
     */
    public function addMember(User $user, Team $team): bool
    {
        $role = $team->users()->where('users.id', $user->id)->first()?->pivot->role;
        return in_array($role, ['owner', 'manager']);
    }

    /**
     * Determine whether the user can update the team role of another user.
     */
    public function updateRole(User $user, Team $team, User $targetUser): bool
    {
        return $this->canManageMember($user, $team, $targetUser);
    }

    /**
     * Determine whether the user can remove a member from the team.
     */
    public function removeMember(User $user, Team $team, User $targetUser): bool
    {
        return $this->canManageMember($user, $team, $targetUser);
    }

    /**
     * Helper to check hierarchy if user can manage targetUser in team.
     */
    protected function canManageMember(User $user, Team $team, User $targetUser): bool
    {
        $actorRole = $team->users()->where('users.id', $user->id)->first()?->pivot->role;
        $targetRole = $team->users()->where('users.id', $targetUser->id)->first()?->pivot->role;

        if (!$actorRole || !$targetRole) {
            return false;
        }

        if ($actorRole === 'owner') {
            return $targetRole !== 'owner'; // Owner can manage anyone except other owners
        }

        if ($actorRole === 'manager') {
            return $targetRole === 'member'; // Manager can only manage members
        }

        return false;
    }
}
