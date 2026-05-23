<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\Task;
use App\Models\Project;
use Illuminate\Http\Request;

class TaskController extends Controller
{
    public function index(Request $request, Project $project)
    {
        $this->authorize('view', $project);

        $query = $project->tasks()->with('project:id,name,color');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        $sortBy  = $request->get('sort_by', 'position');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderBy($sortBy, $sortDir);

        $tasks = $query->get()->map(fn($t) => array_merge($t->toArray(), ['is_overdue' => $t->is_overdue]));

        return response()->json($tasks);
    }

    public function allTasks(Request $request)
    {
        $query = Task::query()
            ->where('user_id', $request->user()->id)
            ->with('project:id,name,color');

        if ($request->has('status')) {
            $query->where('status', $request->status);
        }

        if ($request->has('priority')) {
            $query->where('priority', $request->priority);
        }

        $sortBy  = $request->get('sort_by', 'due_date');
        $sortDir = $request->get('sort_dir', 'asc');
        $query->orderByRaw("CASE WHEN due_date IS NULL THEN 1 ELSE 0 END, {$sortBy} {$sortDir}");

        $tasks = $query->get()->map(fn($t) => array_merge($t->toArray(), ['is_overdue' => $t->is_overdue]));

        return response()->json($tasks);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'project_id'  => 'required|exists:projects,id',
            'title'       => 'required|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'nullable|in:todo,in_progress,done',
            'priority'    => 'nullable|in:low,medium,high',
            'label'       => 'nullable|string|max:100',
            'label_color' => 'nullable|string|max:7',
            'due_date'    => 'nullable|date',
        ]);

        $project = Project::findOrFail($data['project_id']);
        $this->authorize('view', $project);

        $data['user_id'] = $request->user()->id;
        $data['position'] = Task::where('project_id', $data['project_id'])
            ->where('status', $data['status'] ?? 'todo')
            ->max('position') + 1;

        if (($data['status'] ?? '') === 'done') {
            $data['completed_at'] = now();
        }

        $task = Task::create($data);
        $task->load('project:id,name,color');

        return response()->json([
            'message' => 'Task created',
            'task'    => array_merge($task->toArray(), ['is_overdue' => $task->is_overdue]),
        ], 201);
    }

    public function show(Task $task)
    {
        $this->authorize('view', $task->project);
        $task->load('project');
        return response()->json(array_merge($task->toArray(), ['is_overdue' => $task->is_overdue]));
    }

    public function update(Request $request, Task $task)
    {
        $this->authorize('view', $task->project);

        $data = $request->validate([
            'title'       => 'sometimes|string|max:255',
            'description' => 'nullable|string',
            'status'      => 'sometimes|in:todo,in_progress,done',
            'priority'    => 'sometimes|in:low,medium,high',
            'label'       => 'nullable|string|max:100',
            'label_color' => 'nullable|string|max:7',
            'due_date'    => 'nullable|date',
            'position'    => 'sometimes|integer',
            'project_id'  => 'sometimes|exists:projects,id',
        ]);

        if (isset($data['status']) && $data['status'] === 'done' && $task->status !== 'done') {
            $data['completed_at'] = now();
        } elseif (isset($data['status']) && $data['status'] !== 'done') {
            $data['completed_at'] = null;
        }

        $task->update($data);
        $task->load('project:id,name,color');

        return response()->json([
            'message' => 'Task updated',
            'task'    => array_merge($task->fresh()->toArray(), ['is_overdue' => $task->is_overdue]),
        ]);
    }

    public function updateStatus(Request $request, Task $task)
    {
        $this->authorize('view', $task->project);

        $data = $request->validate([
            'status' => 'required|in:todo,in_progress,done',
        ]);

        $data['completed_at'] = $data['status'] === 'done' ? now() : null;
        $task->update($data);

        return response()->json([
            'message' => 'Status updated',
            'task'    => array_merge($task->fresh()->toArray(), ['is_overdue' => $task->is_overdue]),
        ]);
    }

    public function destroy(Task $task)
    {
        $this->authorize('view', $task->project);
        $task->delete();

        return response()->json(['message' => 'Task deleted']);
    }
}
