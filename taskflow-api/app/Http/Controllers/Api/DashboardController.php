<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

class DashboardController extends Controller
{
    public function stats(Request $request)
    {
        $userId = $request->user()->id;

        $totalProjects   = Project::where('user_id', $userId)->count();
        $activeProjects  = Project::where('user_id', $userId)->where('status', 'active')->count();
        $totalTasks      = Task::where('user_id', $userId)->count();
        $completedTasks  = Task::where('user_id', $userId)->where('status', 'done')->count();
        $inProgressTasks = Task::where('user_id', $userId)->where('status', 'in_progress')->count();
        $todoTasks       = Task::where('user_id', $userId)->where('status', 'todo')->count();
        $overdueTasks    = Task::where('user_id', $userId)
            ->where('status', '!=', 'done')
            ->whereNotNull('due_date')
            ->where('due_date', '<', now()->toDateString())
            ->count();

        // Recent tasks (latest 5)
        $recentTasks = Task::where('user_id', $userId)
            ->with('project:id,name,color')
            ->latest()
            ->take(5)
            ->get()
            ->map(fn($t) => array_merge($t->toArray(), ['is_overdue' => $t->is_overdue]));

        // Weekly activity (tasks created/completed per day for last 7 days)
        $weeklyCreated = Task::where('user_id', $userId)
            ->where('created_at', '>=', now()->subDays(6)->startOfDay())
            ->select(DB::raw('DATE(created_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $weeklyCompleted = Task::where('user_id', $userId)
            ->where('status', 'done')
            ->where('completed_at', '>=', now()->subDays(6)->startOfDay())
            ->select(DB::raw('DATE(completed_at) as date'), DB::raw('count(*) as count'))
            ->groupBy('date')
            ->orderBy('date')
            ->get()
            ->keyBy('date');

        $weeklyActivity = [];
        for ($i = 6; $i >= 0; $i--) {
            $date = now()->subDays($i)->toDateString();
            $weeklyActivity[] = [
                'date'      => $date,
                'day'       => now()->subDays($i)->format('D'),
                'created'   => $weeklyCreated[$date]->count ?? 0,
                'completed' => $weeklyCompleted[$date]->count ?? 0,
            ];
        }

        // Top projects by task count
        $topProjects = Project::where('user_id', $userId)
            ->withCount(['tasks', 'tasks as done_count' => fn($q) => $q->where('status', 'done')])
            ->orderByDesc('tasks_count')
            ->take(4)
            ->get()
            ->map(function ($p) {
                $total    = $p->tasks_count;
                $done     = $p->done_count;
                return [
                    'id'       => $p->id,
                    'name'     => $p->name,
                    'color'    => $p->color,
                    'icon'     => $p->icon,
                    'total'    => $total,
                    'done'     => $done,
                    'progress' => $total > 0 ? (int) round(($done / $total) * 100) : 0,
                ];
            });

        return response()->json([
            'stats' => [
                'total_projects'    => $totalProjects,
                'active_projects'   => $activeProjects,
                'total_tasks'       => $totalTasks,
                'completed_tasks'   => $completedTasks,
                'in_progress_tasks' => $inProgressTasks,
                'todo_tasks'        => $todoTasks,
                'overdue_tasks'     => $overdueTasks,
                'completion_rate'   => $totalTasks > 0 ? round(($completedTasks / $totalTasks) * 100) : 0,
            ],
            'recent_tasks'    => $recentTasks,
            'weekly_activity' => $weeklyActivity,
            'top_projects'    => $topProjects,
        ]);
    }
}
