import { useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import api from '../services/api';
import { 
  FolderKanban, 
  CheckCircle2, 
  Clock, 
  AlertCircle,
  TrendingUp,
  Calendar,
  Plus,
  ArrowRight
} from 'lucide-react';
import { format, isPast, parseISO } from 'date-fns';
import { Link } from 'react-router-dom';

const StatCard = ({ title, value, icon, color, trend }) => (
  <div className="glass-card animate-slide-up">
    <div className="flex justify-between items-start mb-4">
      <div>
        <p className="text-muted text-sm font-medium mb-1">{title}</p>
        <h3 className="text-3xl font-bold">{value}</h3>
      </div>
      <div className="p-3 rounded-xl" style={{ backgroundColor: `${color}20`, color: color }}>
        {icon}
      </div>
    </div>
    {trend && (
      <div className="flex items-center gap-1 text-sm text-muted">
        <TrendingUp size={14} style={{ color: 'var(--success)' }} />
        <span>{trend}</span>
      </div>
    )}
  </div>
);

const ActivityChart = ({ stats }) => {
  const total = (stats.completed_tasks || 0) + (stats.in_progress_tasks || 0) + ((stats.total_tasks || 0) - (stats.completed_tasks || 0) - (stats.in_progress_tasks || 0));
  const completedPct = total ? ((stats.completed_tasks || 0) / total) * 100 : 0;
  const inProgressPct = total ? ((stats.in_progress_tasks || 0) / total) * 100 : 0;
  const todoPct = total ? 100 - completedPct - inProgressPct : 100;

  return (
    <div className="mb-6">
      <div className="flex justify-between text-xs text-muted mb-2">
        <span>Task Distribution</span>
        <span>{total} Total</span>
      </div>
      <div className="w-full h-3 rounded-full flex overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
        <div style={{ width: `${completedPct}%`, backgroundColor: 'var(--success)', transition: 'width 1s ease-out' }} title={`Completed: ${stats.completed_tasks}`}></div>
        <div style={{ width: `${inProgressPct}%`, backgroundColor: 'var(--warning)', transition: 'width 1s ease-out' }} title={`In Progress: ${stats.in_progress_tasks}`}></div>
        <div style={{ width: `${todoPct}%`, backgroundColor: 'var(--text-tertiary)', transition: 'width 1s ease-out' }} title={`To Do`}></div>
      </div>
      <div className="flex gap-4 mt-3 text-xs">
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-success"></div> Done</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-warning"></div> In Progress</div>
        <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full" style={{backgroundColor: 'var(--text-tertiary)'}}></div> To Do</div>
      </div>
    </div>
  );
};

const Dashboard = () => {
  const { user } = useAuth();
  const [data, setData] = useState({
    stats: {},
    recent_tasks: [],
    top_projects: [],
    weekly_activity: []
  });
  const [loading, setLoading] = useState(true);
  const [quickTaskTitle, setQuickTaskTitle] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchDashboard = async () => {
    try {
      const response = await api.get('/dashboard/stats');
      setData(response.data);
    } catch (error) {
      console.error("Failed to fetch dashboard data", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboard();
  }, []);

  const handleQuickAdd = async (e) => {
    e.preventDefault();
    if (!quickTaskTitle.trim() || data.top_projects.length === 0) return;
    
    setIsSubmitting(true);
    try {
      await api.post('/tasks', {
        title: quickTaskTitle,
        project_id: data.top_projects[0].id, // Add to first project by default
        status: 'todo',
        priority: 'medium'
      });
      setQuickTaskTitle('');
      fetchDashboard();
    } catch (error) {
      console.error("Failed to quick add task", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  const { stats, recent_tasks, top_projects } = data;

  // Separate tasks into upcoming deadlines vs recently active
  const upcomingDeadlines = recent_tasks
    .filter(t => t.due_date && !isPast(parseISO(t.due_date)) && t.status !== 'done')
    .sort((a, b) => new Date(a.due_date) - new Date(b.due_date))
    .slice(0, 3);
    
  const generalRecentTasks = recent_tasks.filter(t => !upcomingDeadlines.find(u => u.id === t.id)).slice(0, 4);

  return (
    <div className="animate-fade-in pb-10">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Hello, {user?.name.split(' ')[0]} 👋</h1>
          <p className="text-muted">Here's what's happening with your projects today.</p>
        </div>
        <div className="text-right">
          <p className="text-sm font-medium bg-white bg-opacity-5 px-4 py-2 rounded-full border border-white border-opacity-10 shadow-sm">
            {format(new Date(), 'EEEE, MMMM d, yyyy')}
          </p>
        </div>
      </header>

      {/* Stats Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1.5rem', marginBottom: '2.5rem' }}>
        <StatCard 
          title="Total Projects" 
          value={stats.total_projects || 0} 
          icon={<FolderKanban size={24} />} 
          color="var(--accent-primary)" 
        />
        <StatCard 
          title="Completed Tasks" 
          value={stats.completed_tasks || 0} 
          icon={<CheckCircle2 size={24} />} 
          color="var(--success)" 
          trend={`${stats.completion_rate || 0}% completion rate`}
        />
        <StatCard 
          title="In Progress" 
          value={stats.in_progress_tasks || 0} 
          icon={<Clock size={24} />} 
          color="var(--warning)" 
        />
        <StatCard 
          title="Overdue Tasks" 
          value={stats.overdue_tasks || 0} 
          icon={<AlertCircle size={24} />} 
          color="var(--danger)" 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(350px, 1fr))', gap: '2rem' }}>
        
        {/* Left Column: Tasks & Deadlines */}
        <div className="flex-col gap-6">
          
          {/* Quick Add Task */}
          <div className="glass-panel p-5 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-accent-primary opacity-10 rounded-full blur-3xl -mr-10 -mt-10"></div>
            <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Plus size={18} className="text-accent-primary" /> Quick Add Task
            </h3>
            <form onSubmit={handleQuickAdd} className="flex gap-2">
              <input 
                type="text" 
                placeholder="What needs to be done?" 
                className="input-field" 
                style={{ marginBottom: 0, backgroundColor: 'rgba(0,0,0,0.4)' }}
                value={quickTaskTitle}
                onChange={e => setQuickTaskTitle(e.target.value)}
                disabled={top_projects.length === 0}
              />
              <button 
                type="submit" 
                className="btn btn-primary" 
                disabled={isSubmitting || top_projects.length === 0 || !quickTaskTitle.trim()}
              >
                Add
              </button>
            </form>
            {top_projects.length === 0 && (
              <p className="text-xs text-warning mt-2">You need to create a project first.</p>
            )}
          </div>

          {/* Upcoming Deadlines */}
          {upcomingDeadlines.length > 0 && (
            <div className="glass-panel p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-lg font-bold flex items-center gap-2">
                  <Calendar size={18} className="text-warning" /> Upcoming Deadlines
                </h3>
              </div>
              <div className="flex-col gap-3">
                {upcomingDeadlines.map(task => (
                  <div key={task.id} className="p-3 rounded-xl border border-red-900 border-opacity-30 bg-red-900 bg-opacity-10 flex justify-between items-center">
                    <div>
                      <p className="font-semibold text-sm mb-1">{task.title}</p>
                      <span className="badge" style={{ backgroundColor: `${task.project?.color}20`, color: task.project?.color }}>
                        {task.project?.name}
                      </span>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-bold text-danger mb-1">{format(new Date(task.due_date), 'MMM d, yyyy')}</p>
                      <p className="text-[10px] text-muted uppercase tracking-wider">{task.priority} Priority</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Recent Tasks */}
          <div className="glass-panel p-6">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-bold">Recent Activity</h3>
              <Link to="/tasks" className="text-sm flex items-center gap-1 hover:text-accent-primary transition-colors" style={{ color: 'var(--text-secondary)' }}>
                View All <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="flex-col gap-3">
              {generalRecentTasks.length > 0 ? (
                generalRecentTasks.map(task => (
                  <div key={task.id} className="p-4 rounded-xl flex items-center justify-between hover:bg-white hover:bg-opacity-5 transition-colors" style={{ border: '1px solid var(--glass-border)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full shadow-lg" style={{ 
                        backgroundColor: task.status === 'done' ? 'var(--success)' : 
                                        task.status === 'in_progress' ? 'var(--warning)' : 
                                        'var(--text-tertiary)',
                        boxShadow: `0 0 8px ${task.status === 'done' ? 'var(--success)' : task.status === 'in_progress' ? 'var(--warning)' : 'var(--text-tertiary)'}`
                      }}></div>
                      <div>
                        <p className="font-medium text-sm mb-1">{task.title}</p>
                        <div className="flex items-center gap-2 text-xs text-muted">
                          <span className="badge text-[10px]" style={{ backgroundColor: `${task.project?.color}15`, color: task.project?.color }}>
                            {task.project?.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="text-[10px] font-bold uppercase px-2 py-1 rounded tracking-wider" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                      {task.status.replace('_', ' ')}
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted bg-black bg-opacity-20 rounded-xl">
                  <p>No recent activity found.</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column: Projects & Productivity */}
        <div className="flex-col gap-6">
          
          {/* Top Projects */}
          <div className="glass-panel p-6 relative">
            <ActivityChart stats={stats} />
            
            <div className="flex justify-between items-center mb-6 mt-8">
              <h3 className="text-lg font-bold">Top Projects</h3>
              <Link to="/projects" className="text-sm flex items-center gap-1 hover:text-accent-primary transition-colors" style={{ color: 'var(--text-secondary)' }}>
                Manage <ArrowRight size={14} />
              </Link>
            </div>
            
            <div className="flex-col gap-5">
              {top_projects.length > 0 ? (
                top_projects.map(project => (
                  <div key={project.id} className="group">
                    <div className="flex justify-between items-center mb-2">
                      <div className="flex items-center gap-3 text-sm font-medium">
                        <div className="w-8 h-8 rounded-lg flex items-center justify-center bg-opacity-20" style={{ backgroundColor: `${project.color}20`, color: project.color }}>
                          <FolderKanban size={16} />
                        </div>
                        {project.name}
                      </div>
                      <span className="text-xs font-bold bg-white bg-opacity-5 px-2 py-1 rounded">{project.progress}%</span>
                    </div>
                    <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <div 
                        className="h-full rounded-full transition-all duration-1000 relative" 
                        style={{ 
                          width: `${project.progress}%`, 
                          backgroundColor: project.color,
                          boxShadow: `0 0 10px ${project.color}80` 
                        }}
                      >
                        <div className="absolute inset-0 bg-white opacity-20 w-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-2">
                      <p className="text-[10px] text-muted">
                        {project.completed_task_count} of {project.task_count} tasks completed
                      </p>
                    </div>
                  </div>
                ))
              ) : (
                <div className="text-center py-8 text-muted bg-black bg-opacity-20 rounded-xl">
                  <p>Create a project to see progress.</p>
                </div>
              )}
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
