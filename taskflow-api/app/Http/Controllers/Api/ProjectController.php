<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Project;
use Illuminate\Http\Request;

class ProjectController extends Controller
{
    public function index(Request $request)
    {
        $projects = $request->user()
            ->projects()
            ->withCount(['tasks', 'tasks as completed_task_count' => fn($q) => $q->where('status', 'done')])
            ->latest()
            ->get()
            ->map(function ($project) {
                $total    = $project->tasks_count;
                $done     = $project->completed_task_count;
                $progress = $total > 0 ? (int) round(($done / $total) * 100) : 0;

                return array_merge($project->toArray(), [
                    'task_count'            => $total,
                    'completed_task_count'  => $done,
                    'progress'              => $progress,
                ]);
            });

        return response()->json($projects);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'name'        => 'required|string|max:255',
            'description' => 'nullable|string',
            'color'       => 'nullable|string|max:7',
            'icon'        => 'nullable|string|max:50',
            'status'      => 'nullable|in:active,completed,archived',
            'deadline'    => 'nullable|date',
        ]);

        $project = $request->user()->projects()->create($data);

        return response()->json([
            'message' => 'Project created',
            'project' => array_merge($project->toArray(), [
                'task_count'           => 0,
                'completed_task_count' => 0,
                'progress'             => 0,
            ]),
        ], 201);
    }

    public function show(Request $request, Project $project)
    {
        $this->authorize('view', $project);
        $project->load('tasks');
        return response()->json($project);
    }

    public function update(Request $request, Project $project)
    {
        $this->authorize('update', $project);

        $data = $request->validate([
            'name'        => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'color'       => 'nullable|string|max:7',
            'icon'        => 'nullable|string|max:50',
            'status'      => 'nullable|in:active,completed,archived',
            'deadline'    => 'nullable|date',
        ]);

        $project->update($data);

        return response()->json([
            'message' => 'Project updated',
            'project' => $project->fresh(),
        ]);
    }

    public function destroy(Request $request, Project $project)
    {
        $this->authorize('delete', $project);
        $project->delete();

        return response()->json(['message' => 'Project deleted']);
    }
}
