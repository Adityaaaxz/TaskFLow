import { useState, useEffect, useMemo } from 'react';
import { useParams } from 'react-router-dom';
import api from '../services/api';
import { Plus, Check, Clock, Calendar, Edit2, Trash2, Search, Filter, AlertCircle, GripVertical } from 'lucide-react';
import { format } from 'date-fns';

const Tasks = ({ allTasks = false }) => {
  const { projectId } = useParams();
  const [tasks, setTasks] = useState([]);
  const [project, setProject] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [projectsList, setProjectsList] = useState([]);
  
  // Drag and drop state
  const [draggingTaskId, setDraggingTaskId] = useState(null);
  const [dragOverColumnId, setDragOverColumnId] = useState(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterPriority, setFilterPriority] = useState('all');
  
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    status: 'todo',
    priority: 'medium',
    due_date: '',
    project_id: projectId || ''
  });

  useEffect(() => {
    fetchData();
  }, [projectId, allTasks]);

  const fetchData = async () => {
    setLoading(true);
    try {
      if (allTasks) {
        const [tasksRes, projectsRes] = await Promise.all([
          api.get('/tasks'),
          api.get('/projects')
        ]);
        setTasks(tasksRes.data);
        setProjectsList(projectsRes.data);
        if (projectsRes.data.length > 0) {
          setFormData(prev => ({ ...prev, project_id: projectsRes.data[0].id }));
        }
      } else {
        const [tasksRes, projectRes] = await Promise.all([
          api.get(`/projects/${projectId}/tasks`),
          api.get(`/projects/${projectId}`)
        ]);
        setTasks(tasksRes.data);
        setProject(projectRes.data);
        setFormData(prev => ({ ...prev, project_id: projectId }));
      }
    } catch (error) {
      console.error("Failed to fetch data", error);
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (taskId, newStatus) => {
    try {
      // Optimistic update
      setTasks(tasks.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
      await api.patch(`/tasks/${taskId}/status`, { status: newStatus });
      fetchData(); // Refresh to get proper order and completed_at
    } catch (error) {
      console.error("Failed to update status", error);
      fetchData(); // Revert on error
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const dataToSubmit = { ...formData };
      if (!dataToSubmit.due_date) delete dataToSubmit.due_date;
      
      if (editingId) {
        await api.put(`/tasks/${editingId}`, dataToSubmit);
      } else {
        await api.post('/tasks', dataToSubmit);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ 
        title: '', description: '', status: 'todo', 
        priority: 'medium', due_date: '', project_id: projectId || projectsList[0]?.id 
      });
      fetchData();
    } catch (error) {
      console.error("Failed to save task", error);
    }
  };

  const handleEdit = (task) => {
    setFormData({
      title: task.title,
      description: task.description || '',
      status: task.status,
      priority: task.priority,
      due_date: task.due_date ? task.due_date.split('T')[0] : '',
      project_id: task.project_id
    });
    setEditingId(task.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this task?")) {
      try {
        await api.delete(`/tasks/${id}`);
        fetchData();
      } catch (error) {
        console.error("Failed to delete task", error);
      }
    }
  };

  // Drag and drop handlers
  const handleDragStart = (e, taskId) => {
    setDraggingTaskId(taskId);
    e.dataTransfer.effectAllowed = 'move';
    e.dataTransfer.setData('text/plain', taskId);
    // Slight delay to allow dragging image to generate
    setTimeout(() => {
      if (e.target instanceof HTMLElement) {
        e.target.classList.add('dragging');
      }
    }, 0);
  };

  const handleDragEnd = (e) => {
    setDraggingTaskId(null);
    setDragOverColumnId(null);
    if (e.target instanceof HTMLElement) {
      e.target.classList.remove('dragging');
    }
  };

  const handleDragOver = (e, columnId) => {
    e.preventDefault();
    setDragOverColumnId(columnId);
    e.dataTransfer.dropEffect = 'move';
  };

  const handleDrop = (e, columnId) => {
    e.preventDefault();
    setDragOverColumnId(null);
    const taskId = e.dataTransfer.getData('text/plain');
    
    if (taskId && draggingTaskId) {
      const task = tasks.find(t => t.id === parseInt(taskId));
      if (task && task.status !== columnId) {
        handleStatusChange(task.id, columnId);
      }
    }
    setDraggingTaskId(null);
  };

  // Filter tasks
  const filteredTasks = useMemo(() => {
    return tasks.filter(task => {
      const matchesSearch = task.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            (task.description && task.description.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesPriority = filterPriority === 'all' || task.priority === filterPriority;
      return matchesSearch && matchesPriority;
    });
  }, [tasks, searchQuery, filterPriority]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  const columns = [
    { id: 'todo', title: 'To Do', icon: <Clock size={18} className="text-muted" /> },
    { id: 'in_progress', title: 'In Progress', icon: <AlertCircle size={18} className="text-warning" /> },
    { id: 'done', title: 'Done', icon: <Check size={18} className="text-success" /> }
  ];

  return (
    <div className="animate-fade-in pb-10" style={{ height: 'calc(100vh - var(--header-height))', display: 'flex', flexDirection: 'column' }}>
      <header className="mb-6 flex flex-col md:flex-row justify-between items-start md:items-end flex-shrink-0 gap-4 pt-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">
            {allTasks ? 'My Tasks' : project?.name}
          </h1>
          <p className="text-muted">
            {allTasks ? 'All tasks across all your projects.' : project?.description || 'Manage tasks for this project.'}
          </p>
        </div>
        
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="search-bar">
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Filter tasks..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex bg-black bg-opacity-20 rounded-full p-1 border border-white border-opacity-5 relative group">
            <div className="p-1.5 flex items-center gap-1 text-muted cursor-pointer hover:text-white transition-colors">
              <Filter size={16} />
              <span className="text-xs font-medium mr-1 hidden sm:inline">Priority</span>
            </div>
            
            <div className="absolute top-full right-0 mt-2 bg-bg-secondary border border-glass-border rounded-lg shadow-xl p-2 hidden group-hover:flex flex-col gap-1 w-32 z-20">
              <button 
                className={`text-left text-xs px-3 py-2 rounded transition-colors ${filterPriority === 'all' ? 'bg-accent-primary bg-opacity-20 text-accent-primary' : 'hover:bg-white hover:bg-opacity-5'}`}
                onClick={() => setFilterPriority('all')}
              >All Priorities</button>
              <button 
                className={`text-left text-xs px-3 py-2 rounded transition-colors ${filterPriority === 'high' ? 'bg-red-500 bg-opacity-20 text-red-500' : 'hover:bg-white hover:bg-opacity-5'}`}
                onClick={() => setFilterPriority('high')}
              >High Priority</button>
              <button 
                className={`text-left text-xs px-3 py-2 rounded transition-colors ${filterPriority === 'medium' ? 'bg-yellow-500 bg-opacity-20 text-yellow-500' : 'hover:bg-white hover:bg-opacity-5'}`}
                onClick={() => setFilterPriority('medium')}
              >Medium Priority</button>
              <button 
                className={`text-left text-xs px-3 py-2 rounded transition-colors ${filterPriority === 'low' ? 'bg-blue-500 bg-opacity-20 text-blue-500' : 'hover:bg-white hover:bg-opacity-5'}`}
                onClick={() => setFilterPriority('low')}
              >Low Priority</button>
            </div>
          </div>

          <button 
            className="btn btn-primary whitespace-nowrap"
            onClick={() => {
              setEditingId(null);
              setFormData({ 
                title: '', description: '', status: 'todo', 
                priority: 'medium', due_date: '', project_id: projectId || (projectsList.length > 0 ? projectsList[0].id : '') 
              });
              setIsModalOpen(true);
            }}
            disabled={allTasks && projectsList.length === 0}
          >
            <Plus size={18} /> Add Task
          </button>
        </div>
      </header>

      {/* Kanban Board */}
      <div className="flex gap-6 overflow-x-auto pb-4 pt-2" style={{ flex: 1, minHeight: 0 }}>
        {columns.map(column => {
          const columnTasks = filteredTasks.filter(t => t.status === column.id);
          
          return (
            <div 
              key={column.id} 
              className={`kanban-column transition-colors ${dragOverColumnId === column.id ? 'drag-over' : ''}`}
              onDragOver={(e) => handleDragOver(e, column.id)}
              onDragLeave={() => setDragOverColumnId(null)}
              onDrop={(e) => handleDrop(e, column.id)}
            >
              <div className="kanban-header bg-black bg-opacity-20 flex-shrink-0">
                <div className="flex items-center gap-2 font-semibold">
                  {column.icon}
                  {column.title}
                </div>
                <span className="badge" style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>{columnTasks.length}</span>
              </div>
              
              <div className="kanban-body">
                {columnTasks.length === 0 ? (
                  <div className="text-center py-8 text-sm text-muted italic flex flex-col items-center justify-center h-full opacity-50">
                    <div className="p-3 bg-white bg-opacity-5 rounded-full mb-3 border border-white border-opacity-5 border-dashed">
                      <Check size={24} />
                    </div>
                    No tasks here
                    {dragOverColumnId === column.id && <div className="mt-2 text-accent-primary not-italic">Drop here!</div>}
                  </div>
                ) : (
                  columnTasks.map(task => (
                    <div 
                      key={task.id} 
                      className={`glass-card kanban-card p-4 relative group hover:border-accent-primary hover:border-opacity-30 ${draggingTaskId === task.id ? 'opacity-50 scale-95' : ''}`}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <div className="absolute top-4 right-2 text-muted opacity-0 group-hover:opacity-100 transition-opacity cursor-grab flex items-center justify-center w-6 h-6 hover:text-white">
                        <GripVertical size={14} />
                      </div>

                      <div className="flex justify-between items-start mb-2 pr-6">
                        <div className="flex gap-2">
                          {task.priority === 'high' && <span className="badge text-[10px] bg-red-500 bg-opacity-10 text-red-500 border border-red-500 border-opacity-20">High</span>}
                          {task.priority === 'medium' && <span className="badge text-[10px] bg-yellow-500 bg-opacity-10 text-yellow-500 border border-yellow-500 border-opacity-20">Med</span>}
                          {task.priority === 'low' && <span className="badge text-[10px] bg-blue-500 bg-opacity-10 text-blue-500 border border-blue-500 border-opacity-20">Low</span>}
                        </div>
                      </div>
                      
                      <h4 className="font-semibold text-[15px] mb-2 leading-tight pr-6">{task.title}</h4>
                      {task.description && <p className="text-xs text-muted mb-4 line-clamp-2">{task.description}</p>}
                      
                      <div className="flex justify-between items-center mt-auto pt-3 border-t border-white border-opacity-5">
                        {allTasks ? (
                          <span className="text-[10px] px-2 py-1 rounded font-medium" style={{ backgroundColor: `${task.project?.color}15`, color: task.project?.color }}>
                            {task.project?.name}
                          </span>
                        ) : <div></div>}
                        
                        {task.due_date && (
                          <div className={`flex items-center gap-1 text-[11px] font-medium ${task.is_overdue ? 'text-danger' : 'text-muted'}`}>
                            <Calendar size={12} />
                            {format(new Date(task.due_date), 'MMM d')}
                          </div>
                        )}
                      </div>

                      <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col gap-1 z-10">
                        <button onClick={() => handleEdit(task)} className="p-1.5 bg-black bg-opacity-50 backdrop-blur rounded shadow hover:text-accent-primary hover:bg-opacity-80 transition-all"><Edit2 size={12} /></button>
                        <button onClick={() => handleDelete(task.id)} className="p-1.5 bg-black bg-opacity-50 backdrop-blur rounded shadow text-danger hover:bg-opacity-80 transition-all"><Trash2 size={12} /></button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          );
        })}
      </div>

      {isModalOpen && (
        <div className="slide-over-overlay" onClick={(e) => e.target.className === 'slide-over-overlay' && setIsModalOpen(false)}>
          <div className="slide-over-panel">
            <div className="slide-over-header">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Task' : 'New Task'}</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="slide-over-body">
              <form id="task-form" onSubmit={handleSubmit}>
                {allTasks && (
                  <div className="input-group">
                    <label className="input-label">Project</label>
                    <select 
                      className="input-field" 
                      value={formData.project_id}
                      onChange={(e) => setFormData({...formData, project_id: e.target.value})}
                      required
                    >
                      {projectsList.map(p => (
                        <option key={p.id} value={p.id}>{p.name}</option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div className="input-group">
                  <label className="input-label">Title</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.title}
                    onChange={(e) => setFormData({...formData, title: e.target.value})}
                    required
                    placeholder="What needs to be done?"
                  />
                </div>
                
                <div className="input-group">
                  <label className="input-label">Description (Optional)</label>
                  <textarea 
                    className="input-field" 
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="Add details, links, or notes..."
                  ></textarea>
                </div>
                
                <div className="flex gap-4">
                  <div className="input-group w-full">
                    <label className="input-label">Status</label>
                    <select 
                      className="input-field"
                      value={formData.status}
                      onChange={(e) => setFormData({...formData, status: e.target.value})}
                    >
                      <option value="todo">To Do</option>
                      <option value="in_progress">In Progress</option>
                      <option value="done">Done</option>
                    </select>
                  </div>
                  
                  <div className="input-group w-full">
                    <label className="input-label">Priority</label>
                    <select 
                      className="input-field"
                      value={formData.priority}
                      onChange={(e) => setFormData({...formData, priority: e.target.value})}
                    >
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                    </select>
                  </div>
                </div>
                
                <div className="input-group">
                  <label className="input-label">Due Date (Optional)</label>
                  <input 
                    type="date" 
                    className="input-field" 
                    value={formData.due_date}
                    onChange={(e) => setFormData({...formData, due_date: e.target.value})}
                  />
                </div>
              </form>
            </div>
            
            <div className="slide-over-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" form="task-form" className="btn btn-primary">{editingId ? 'Save Changes' : 'Save Task'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Tasks;
