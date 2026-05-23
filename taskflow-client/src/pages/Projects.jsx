import { useState, useEffect, useMemo } from 'react';
import api from '../services/api';
import { Plus, Folder, Edit2, Trash2, LayoutGrid, List, Search } from 'lucide-react';
import { Link } from 'react-router-dom';

const Projects = () => {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [viewMode, setViewMode] = useState('grid');
  const [searchQuery, setSearchQuery] = useState('');
  
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    color: '#818CF8'
  });

  const colors = ['#818CF8', '#C084FC', '#F472B6', '#F87171', '#FBBF24', '#34D399', '#60A5FA'];

  useEffect(() => {
    fetchProjects();
  }, []);

  const fetchProjects = async () => {
    try {
      const response = await api.get('/projects');
      setProjects(response.data);
    } catch (error) {
      console.error("Failed to fetch projects", error);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (editingId) {
        await api.put(`/projects/${editingId}`, formData);
      } else {
        await api.post('/projects', formData);
      }
      setIsModalOpen(false);
      setEditingId(null);
      setFormData({ name: '', description: '', color: '#818CF8' });
      fetchProjects();
    } catch (error) {
      console.error("Failed to save project", error);
    }
  };

  const handleEdit = (project) => {
    setFormData({
      name: project.name,
      description: project.description || '',
      color: project.color
    });
    setEditingId(project.id);
    setIsModalOpen(true);
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this project? All tasks inside will be deleted.")) {
      try {
        await api.delete(`/projects/${id}`);
        fetchProjects();
      } catch (error) {
        console.error("Failed to delete project", error);
      }
    }
  };

  const filteredProjects = useMemo(() => {
    return projects.filter(p => p.name.toLowerCase().includes(searchQuery.toLowerCase()));
  }, [projects, searchQuery]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full w-full">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-accent-primary"></div>
      </div>
    );
  }

  return (
    <div className="animate-fade-in pb-10">
      <header className="mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold mb-2">Projects</h1>
          <p className="text-muted">Manage your workspaces and projects.</p>
        </div>
        <div className="flex items-center gap-4 w-full md:w-auto">
          <div className="search-bar w-full md:w-auto">
            <Search size={16} className="text-muted" />
            <input 
              type="text" 
              placeholder="Search projects..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          
          <div className="flex bg-black bg-opacity-20 rounded-full p-1 border border-white border-opacity-5">
            <button 
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'grid' ? 'bg-white bg-opacity-10 text-white shadow' : 'text-muted hover:text-white'}`}
              onClick={() => setViewMode('grid')}
            >
              <LayoutGrid size={16} />
            </button>
            <button 
              className={`p-1.5 rounded-full transition-colors ${viewMode === 'list' ? 'bg-white bg-opacity-10 text-white shadow' : 'text-muted hover:text-white'}`}
              onClick={() => setViewMode('list')}
            >
              <List size={16} />
            </button>
          </div>

          <button 
            className="btn btn-primary whitespace-nowrap"
            onClick={() => {
              setEditingId(null);
              setFormData({ name: '', description: '', color: '#818CF8' });
              setIsModalOpen(true);
            }}
          >
            <Plus size={18} /> New Project
          </button>
        </div>
      </header>

      {filteredProjects.length === 0 ? (
        <div className="text-center py-20 text-muted glass-panel">
          <Folder size={48} className="mx-auto mb-4 opacity-20" />
          <h3 className="text-xl font-bold text-white mb-2">No projects found</h3>
          <p>Try adjusting your search or create a new project.</p>
        </div>
      ) : (
        <div 
          style={{ 
            display: viewMode === 'grid' ? 'grid' : 'flex', 
            gridTemplateColumns: viewMode === 'grid' ? 'repeat(auto-fill, minmax(320px, 1fr))' : 'none', 
            flexDirection: viewMode === 'list' ? 'column' : 'none',
            gap: '1.5rem' 
          }}
        >
          {filteredProjects.map(project => (
            <div key={project.id} className="glass-card flex flex-col justify-between group" style={{ minHeight: viewMode === 'grid' ? '220px' : 'auto' }}>
              <div className={viewMode === 'list' ? "flex justify-between items-center w-full gap-6" : ""}>
                <div className={viewMode === 'list' ? "flex items-center gap-4 flex-1" : "mb-4"}>
                  <div className={`p-3 rounded-xl flex items-center justify-center ${viewMode === 'list' ? '' : 'mb-4 inline-flex'}`} style={{ backgroundColor: `${project.color}15`, color: project.color }}>
                    <Folder size={viewMode === 'list' ? 20 : 24} />
                  </div>
                  <div className={viewMode === 'list' ? "flex-1" : ""}>
                    <div className="flex justify-between items-start">
                      <Link to={`/projects/${project.id}/tasks`} className="block">
                        <h3 className="text-xl font-bold mb-1 hover:text-accent-primary transition-colors">{project.name}</h3>
                      </Link>
                      
                      {viewMode === 'grid' && (
                        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                          <button className="btn-icon" onClick={() => handleEdit(project)}>
                            <Edit2 size={16} />
                          </button>
                          <button className="btn-icon text-danger hover:text-danger" onClick={() => handleDelete(project.id)}>
                            <Trash2 size={16} />
                          </button>
                        </div>
                      )}
                    </div>
                    <p className={`text-sm text-muted line-clamp-2 ${viewMode === 'grid' ? 'mb-4' : 'max-w-md'}`} style={{ minHeight: viewMode === 'grid' ? '40px' : 'auto' }}>
                      {project.description || "No description provided."}
                    </p>
                  </div>
                </div>
                
                <div className={viewMode === 'list' ? "flex items-center gap-8 w-1/3 min-w-[250px]" : "mt-auto"}>
                  <div className="w-full">
                    <div className="flex justify-between items-center mb-2">
                      <span className="text-xs font-medium text-muted">Progress</span>
                      <span className="text-xs font-bold px-2 py-0.5 rounded bg-white bg-opacity-5">{project.progress}%</span>
                    </div>
                    <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }}>
                      <div 
                        className="h-full rounded-full transition-all duration-1000 relative" 
                        style={{ width: `${project.progress}%`, backgroundColor: project.color }}
                      >
                        <div className="absolute inset-0 bg-white opacity-20 w-full animate-pulse"></div>
                      </div>
                    </div>
                    <div className="flex justify-between mt-3 text-[10px] text-muted uppercase tracking-wider font-semibold">
                      <span>{project.task_count} Tasks</span>
                      <span>{project.completed_task_count} Done</span>
                    </div>
                  </div>

                  {viewMode === 'list' && (
                    <div className="flex gap-1">
                      <button className="btn-icon bg-white bg-opacity-5 hover:bg-opacity-10" onClick={() => handleEdit(project)}>
                        <Edit2 size={16} />
                      </button>
                      <button className="btn-icon text-danger bg-red-500 bg-opacity-10 hover:bg-opacity-20" onClick={() => handleDelete(project.id)}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {isModalOpen && (
        <div className="slide-over-overlay" onClick={(e) => e.target.className === 'slide-over-overlay' && setIsModalOpen(false)}>
          <div className="slide-over-panel">
            <div className="slide-over-header">
              <h2 className="text-xl font-bold">{editingId ? 'Edit Project' : 'New Project'}</h2>
              <button className="btn-icon" onClick={() => setIsModalOpen(false)}>×</button>
            </div>
            
            <div className="slide-over-body">
              <form id="project-form" onSubmit={handleSubmit}>
                <div className="input-group">
                  <label className="input-label">Project Name</label>
                  <input 
                    type="text" 
                    className="input-field" 
                    value={formData.name}
                    onChange={(e) => setFormData({...formData, name: e.target.value})}
                    required
                    placeholder="e.g. Website Redesign"
                  />
                </div>
                <div className="input-group">
                  <label className="input-label">Description</label>
                  <textarea 
                    className="input-field" 
                    rows="4"
                    value={formData.description}
                    onChange={(e) => setFormData({...formData, description: e.target.value})}
                    placeholder="What is this project about?"
                  ></textarea>
                </div>
                <div className="input-group">
                  <label className="input-label">Project Color</label>
                  <div className="flex flex-wrap gap-3 p-4 rounded-xl bg-black bg-opacity-20 border border-white border-opacity-5">
                    {colors.map(c => (
                      <button
                        key={c}
                        type="button"
                        className="w-8 h-8 rounded-full flex items-center justify-center cursor-pointer transition-transform hover:scale-110"
                        style={{ 
                          backgroundColor: c, 
                          border: formData.color === c ? '2px solid white' : 'none',
                          boxShadow: formData.color === c ? `0 0 15px ${c}80` : 'none'
                        }}
                        onClick={() => setFormData({...formData, color: c})}
                      />
                    ))}
                  </div>
                </div>
              </form>
            </div>
            
            <div className="slide-over-footer">
              <button type="button" className="btn btn-secondary" onClick={() => setIsModalOpen(false)}>Cancel</button>
              <button type="submit" form="project-form" className="btn btn-primary">{editingId ? 'Save Changes' : 'Create Project'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
