import { useState, useRef } from 'react';
import { Search, Bell, Plus, Filter, MoreVertical, LayoutGrid, List, CheckSquare, Calendar, Folder, X, Edit, Trash2 } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';
import toast from 'react-hot-toast';

const INITIAL_TASKS: any[] = [];

const INITIAL_TEAM = [
    { id: 1, name: 'Julian Peters', role: 'Creative Director', avatar: 'https://i.pravatar.cc/150?img=15', locked: false },
    { id: 2, name: 'Quốc Huy', role: 'Video Editor', avatar: 'https://i.pravatar.cc/150?img=11', locked: false },
    { id: 3, name: 'Minh Anh', role: 'Account Manager', avatar: 'https://i.pravatar.cc/150?img=5', locked: false },
    { id: 4, name: 'Hoàng Nam', role: 'Graphic Designer', avatar: 'https://i.pravatar.cc/150?img=8', locked: false },
    { id: 5, name: 'Thùy Linh', role: 'Content Writer', avatar: '', locked: true }, // Empty avatar for locked state
];

export default function Projects() {
    const [activeTab, setActiveTab] = useState('Phân công');
    const [tasks, setTasks] = useLocalStorage('smiley_projects_tasks_multi', INITIAL_TASKS);
    const [team] = useLocalStorage('smiley_projects_team', INITIAL_TEAM);
    const [files, setFiles] = useLocalStorage('smiley_projects_files', [] as any[]);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewFile, setPreviewFile] = useState<any>(null);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            const uploadedFiles = Array.from(e.target.files);
            
            const filePromises = uploadedFiles.map(f => {
                return new Promise<any>((resolve) => {
                    const isImage = f.type.startsWith('image/');
                    const isSmallEnoughForStorage = f.size < 3 * 1024 * 1024; // 3MB limit
                    
                    if (isImage && isSmallEnoughForStorage) {
                        const reader = new FileReader();
                        reader.onload = (event) => {
                            resolve({
                                id: Date.now() + Math.random(),
                                name: f.name,
                                size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                                type: f.type || 'Không xác định',
                                date: new Date().toLocaleDateString('vi-VN'),
                                data: event.target?.result // Base64 string
                            });
                        };
                        reader.readAsDataURL(f);
                    } else {
                        resolve({
                            id: Date.now() + Math.random(),
                            name: f.name,
                            size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                            type: f.type || 'Không xác định',
                            date: new Date().toLocaleDateString('vi-VN'),
                            data: null
                        });
                    }
                });
            });

            const newFiles = await Promise.all(filePromises);
            setFiles([...newFiles, ...files]);
            e.target.value = '';
        }
    };

    const handleDeleteFile = (id: number) => {
        if (confirm('Bạn có chắc chắn muốn xóa tệp này?')) {
            setFiles(files.filter((f: any) => f.id !== id));
        }
    };
    
    const [taskSearch, setTaskSearch] = useState('');
    const [teamSearch, setTeamSearch] = useState('');
    
    // Modal state
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [editingTask, setEditingTask] = useState<any>(null);
    const [formData, setFormData] = useState({
        title: '', type: 'THIẾT KẾ', status: 'CHƯA BẮT ĐẦU', deadline: ''
    });

    const filteredTasks = tasks.filter((t: any) => t.title.toLowerCase().includes(taskSearch.toLowerCase()));
    const filteredTeam = team.filter((m: any) => m.name.toLowerCase().includes(teamSearch.toLowerCase()));

    const handleDragStart = (e: React.DragEvent, member: any) => {
        if (member.locked) return;
        e.dataTransfer.setData('memberId', member.id.toString());
    };

    const handleDrop = (e: React.DragEvent, taskId: number) => {
        e.preventDefault();
        const memberId = e.dataTransfer.getData('memberId');
        if (!memberId) return;

        const member = team.find((m: any) => m.id.toString() === memberId);
        if (member) {
            setTasks(tasks.map((t: any) => {
                if (t.id === taskId) {
                    const currentAssignees = t.assignees || (t.assignee ? [t.assignee] : []);
                    if (currentAssignees.some((a: any) => a.id === member.id)) return t;
                    return { ...t, assignees: [...currentAssignees, { id: member.id, name: member.name, avatar: member.avatar }] };
                }
                return t;
            }));
        }
    };

    const handleDragOver = (e: React.DragEvent) => {
        e.preventDefault(); // allow dropping
    };

    const openModal = (task: any = null) => {
        setEditingTask(task);
        if (task) {
            setFormData({
                title: task.title,
                type: task.type,
                status: task.status,
                deadline: task.deadline
            });
        } else {
            setFormData({
                title: '',
                type: 'THIẾT KẾ',
                status: 'CHƯA BẮT ĐẦU',
                deadline: ''
            });
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingTask(null);
    };

    const handleSaveTask = () => {
        if (!formData.title) {
            toast.error('Vui lòng nhập tên công việc!');
            return;
        }
        
        let typeColor = '#4F46E5';
        if (formData.type === 'MEDIA') typeColor = '#8B5CF6';
        if (formData.type === 'CONTENT') typeColor = '#10B981';
        if (formData.type === 'MARKETING') typeColor = '#EC4899';

        let statusColor = '#F59E0B'; // CHƯA BẮT ĐẦU
        if (formData.status === 'ĐANG LÀM') statusColor = '#ff7d0d';
        if (formData.status === 'HOÀN THÀNH') statusColor = '#10B981';
        if (formData.status === 'NHÁP') statusColor = '#6B7280';

        if (editingTask) {
            setTasks(tasks.map((t: any) => 
                t.id === editingTask.id 
                ? { ...t, ...formData, typeColor, statusColor }
                : t
            ));
        } else {
            setTasks([...tasks, {
                id: Date.now(),
                ...formData,
                typeColor,
                statusColor,
                assignees: []
            }]);
        }
        closeModal();
    };

    const handleDeleteTask = (id: number) => {
        if (confirm("Bạn có chắc chắn muốn xóa công việc này?")) {
            setTasks(tasks.filter((t: any) => t.id !== id));
            if (editingTask && editingTask.id === id) closeModal();
        }
    };

    const handleRemoveAssignee = (taskId: number, memberId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        setTasks(tasks.map((t: any) => 
            t.id === taskId ? { ...t, assignees: (t.assignees || []).filter((a: any) => a.id !== memberId) } : t
        ));
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-surface)' }}>

            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        <span>Dự án</span>
                        <span>›</span>
                        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{activeTab === 'Tài liệu' ? 'Tài liệu dự án' : 'Phân chia công việc'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{activeTab === 'Tài liệu' ? 'Quản lý Dữ liệu Dự án' : 'Phân chia công việc'}</h2>
                        {activeTab === 'Tài liệu' ? (
                            <span style={{ backgroundColor: '#FFF7ED', color: '#ff7d0d', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>ĐANG HOẠT ĐỘNG</span>
                        ) : (
                            <span style={{ backgroundColor: '#FFE4D6', color: '#ff7d0d', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>CHIẾN DỊCH TET HOLIDAY</span>
                        )}
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                        <input
                            type="text"
                            placeholder="Tìm tên công việc..."
                            value={taskSearch}
                            onChange={(e) => setTaskSearch(e.target.value)}
                            style={{
                                width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '2rem', border: '1px solid var(--color-border)', backgroundColor: '#F9FAFB', outline: 'none', fontSize: '0.9rem'
                            }}
                        />
                    </div>
                    <button style={{ width: '40px', height: '40px', borderRadius: '50%', border: '1px solid var(--color-border)', backgroundColor: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
                        <Bell size={18} color="var(--color-text)" />
                    </button>
                    <img src="https://i.pravatar.cc/150?img=1" alt="User" style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
                </div>
            </div>

            {/* Navigation Tabs */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '0 2rem', borderBottom: '1px solid var(--color-border)', backgroundColor: 'white' }}>
                <div style={{ display: 'flex' }}>
                    {[
                        { id: 'Chế độ Bảng', icon: LayoutGrid }, { id: 'Phân công', icon: CheckSquare },
                        { id: 'Danh sách', icon: List }, { id: 'Tiến độ', icon: Calendar }, { id: 'Tài liệu', icon: Folder }
                    ].map(tab => (
                        <button
                            key={tab.id}
                            onClick={() => setActiveTab(tab.id)}
                            style={{
                                display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '1.25rem 1rem', border: 'none', background: 'transparent',
                                color: activeTab === tab.id ? '#ff7d0d' : 'var(--color-text-light)', fontWeight: activeTab === tab.id ? 700 : 500, fontSize: '0.9rem', cursor: 'pointer',
                                borderBottom: activeTab === tab.id ? '2px solid #ff7d0d' : '2px solid transparent', position: 'relative', top: '1px'
                            }}
                        >
                            <tab.icon size={16} />
                            {tab.id}
                        </button>
                    ))}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    {activeTab !== 'Tài liệu' && (
                        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', background: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                            <Filter size={16} /> Lọc nhân sự
                        </button>
                    )}
                    {activeTab === 'Tài liệu' ? (
                        <>
                            <input 
                                type="file" 
                                multiple 
                                ref={fileInputRef} 
                                style={{ display: 'none' }} 
                                onChange={handleFileUpload} 
                            />
                            <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', background: '#ff7d0d', color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                Tải lên tài liệu
                            </button>
                        </>
                    ) : (
                        <button onClick={() => openModal()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', background: '#ff7d0d', color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
                            <Plus size={18} /> Thêm công việc
                        </button>
                    )}
                </div>
            </div>

            {/* Main Content Area */}
            <div style={{ display: 'flex', flex: 1, backgroundColor: '#F9FAFB', overflow: 'hidden' }}>

                {activeTab !== 'Tài liệu' ? (
                    <>
                        {/* Tasks List (Left Side) */}
                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)', letterSpacing: '1px', marginBottom: '1.5rem', textTransform: 'uppercase' }}>
                                Các đầu việc cần phân công
                            </h3>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
                                {filteredTasks.map((task: any) => (
                                    <div key={task.id} style={{
                                        backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem',
                                        border: '1px solid var(--color-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)',
                                        ...(task.status === 'ĐANG LÀM' ? { borderColor: '#ff7d0d', boxShadow: '0 4px 12px rgba(255,125,13,0.1)' } : {})
                                    }}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{task.title}</h4>
                                                <button onClick={() => openModal(task)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', outline: 'none', padding: '0.2rem' }}>
                                                    <Edit size={16} />
                                                </button>
                                            </div>
                                            <span style={{ backgroundColor: `${task.typeColor}15`, color: task.typeColor, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px' }}>
                                                {task.type}
                                            </span>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>
                                                Người thực hiện
                                            </div>
                                            <div
                                                onDrop={(e) => handleDrop(e, task.id)}
                                                onDragOver={handleDragOver}
                                                style={{
                                                    display: 'flex', alignItems: 'center', justifyContent: 'flex-start',
                                                    padding: '0.75rem 1rem', minHeight: '60px', flexWrap: 'wrap', gap: '0.5rem',
                                                    backgroundColor: (task.assignees && task.assignees.length > 0) ? 'transparent' : '#F3F4F6',
                                                    border: (task.assignees && task.assignees.length > 0) ? '1px solid var(--color-border)' : '1px dashed #D1D5DB',
                                                    borderRadius: '0.5rem', cursor: 'grab'
                                                }}
                                            >
                                                {task.assignees && task.assignees.length > 0 ? (
                                                    <div style={{ display: 'flex', alignItems: 'center', flexWrap: 'wrap', gap: '0.5rem', width: '100%' }}>
                                                        {task.assignees.map((a: any) => (
                                                            <div key={a.id} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', backgroundColor: '#F9FAFB', border: '1px solid var(--color-border)', borderRadius: '2rem', padding: '0.25rem 0.5rem 0.25rem 0.25rem' }}>
                                                                {a.avatar ? (
                                                                    <img src={a.avatar} alt="Assignee" style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
                                                                ) : (
                                                                    <div style={{ width: '28px', height: '28px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>{a.name.charAt(0)}</div>
                                                                )}
                                                                <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{a.name}</span>
                                                                <button onClick={(e) => handleRemoveAssignee(task.id, a.id, e)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', marginLeft: '0.25rem' }} title="Gỡ">
                                                                    <X size={12} />
                                                                </button>
                                                            </div>
                                                        ))}
                                                        <div style={{ color: 'var(--color-text-light)', fontSize: '0.8rem', marginLeft: 'auto', fontStyle: 'italic' }}>(+ Kéo thả thêm)</div>
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9CA3AF', width: '100%' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                                            <Plus size={16} />
                                                        </div>
                                                        <span style={{ fontSize: '0.9rem' }}>Chưa có người phụ trách (Kéo thả vào đây)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Hạn chót</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}>
                                                    <Calendar size={14} color="var(--color-danger)" />
                                                    {task.deadline || 'Chưa định'}
                                                </div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Trạng thái</div>
                                                <span style={{ color: task.statusColor, fontWeight: 800, fontSize: '0.75rem' }}>{task.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}

                                {filteredTasks.length === 0 && (
                                    <div style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '2rem' }}>Không tìm thấy công việc nào.</div>
                                )}
                            </div>
                        </div>

                        {/* Team Members List (Right Side) */}
                        <div style={{ width: '350px', backgroundColor: 'white', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '0.5px', marginBottom: '1.25rem', textTransform: 'uppercase' }}>Danh sách nhân sự</h3>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                                    <input
                                        type="text"
                                        placeholder="Tìm nhân sự..."
                                        value={teamSearch}
                                        onChange={(e) => setTeamSearch(e.target.value)}
                                        style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#F3F4F6', outline: 'none', fontSize: '0.85rem' }}
                                    />
                                </div>
                            </div>

                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {filteredTeam.map((member: any) => (
                                        <div 
                                            key={member.id} 
                                            draggable={!member.locked}
                                            onDragStart={(e) => handleDragStart(e, member)}
                                            style={{
                                                display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--color-border)',
                                                borderRadius: '0.75rem', backgroundColor: 'white', cursor: member.locked ? 'not-allowed' : 'grab', opacity: member.locked ? 0.6 : 1, boxShadow: '0 2px 4px rgba(0,0,0,0.02)'
                                            }}
                                        >
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {member.avatar ? (
                                                    <img src={member.avatar} alt={member.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover', pointerEvents: 'none' }} />
                                                ) : (
                                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{member.name.charAt(0)}</div>
                                                )}
                                                <div style={{ pointerEvents: 'none' }}>
                                                    <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{member.name}</div>
                                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{member.role}</div>
                                                </div>
                                            </div>
                                            {member.locked ? (
                                                <div style={{ color: '#D1D5DB' }}><svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"></rect><path d="M7 11V7a5 5 0 0 1 10 0v4"></path></svg></div>
                                            ) : (
                                                <div style={{ color: 'var(--color-border)' }}><MoreVertical size={16} /></div>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            <div style={{ padding: '1.5rem', backgroundColor: '#F9FAFB', borderTop: '1px solid var(--color-border)', fontSize: '0.75rem', color: 'var(--color-text-light)', fontStyle: 'italic', textAlign: 'center' }}>
                                * Kéo nhân sự từ danh sách này và thả vào ô "Người thực hiện" trong thẻ công việc để phân công nhanh.
                            </div>
                        </div>
                    </>
                ) : (
                    /* Documents View Template (Unchanged) */
                    <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                        <div style={{ marginBottom: '2.5rem' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)', letterSpacing: '1px', marginBottom: '1.25rem', textTransform: 'uppercase' }}>
                                Thư mục công việc
                            </h3>
                            <div style={{ display: 'flex', gap: '1rem', overflowX: 'auto', paddingBottom: '0.5rem' }}>
                                {[
                                    { name: 'Thiết kế Banner', files: 12, size: '45.2 MB', color: '#ff7d0d' },
                                    { name: 'Phân tích đối thủ', files: 5, size: '12.8 MB', color: '#1E40AF' },
                                    { name: 'Video Testimonial', files: 8, size: '1.2 GB', color: '#FF5722' }
                                ].map((folder, i) => (
                                    <div key={i} style={{ minWidth: '220px', backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.25rem', border: '1px solid var(--color-border)', cursor: 'pointer', boxShadow: '0 2px 4px rgba(0,0,0,0.02)' }}>
                                        <div style={{ color: folder.color, marginBottom: '1rem' }}><svg width="28" height="28" viewBox="0 0 24 24" fill="currentColor"><path d="M22 19a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h5l2 3h9a2 2 0 0 1 2 2z"></path></svg></div>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)', marginBottom: '0.25rem' }}>{folder.name}</div>
                                        <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>{folder.files} tệp • {folder.size}</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                        <div>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)', letterSpacing: '1px', marginBottom: '1.25rem', textTransform: 'uppercase' }}>
                                Tệp cá nhân / Tải lên gần đây
                            </h3>
                            
                            {files.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                    {files.map((file: any) => (
                                        <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: file.data ? 'pointer' : 'default' }} onClick={() => file.data && setPreviewFile(file)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                                {file.data ? (
                                                    <img src={file.data} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '0.5rem', objectFit: 'cover' }} />
                                                ) : (
                                                    <div style={{ backgroundColor: '#F3F4F6', padding: '0.75rem', borderRadius: '0.5rem', color: '#ff7d0d', display: 'flex' }}>
                                                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M13 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9z"></path><polyline points="13 2 13 9 20 9"></polyline></svg>
                                                    </div>
                                                )}
                                                <div style={{ overflow: 'hidden' }}>
                                                    <div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }} title={file.name}>{file.name}</div>
                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.2rem' }}>{file.size} • Upload: {file.date}</div>
                                                </div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.5rem' }} title="Xóa tệp">
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)', backgroundColor: '#F9FAFB', border: '1px dashed var(--color-border)', borderRadius: '1rem' }}>
                                    <div style={{ marginBottom: '1rem', color: '#D1D5DB', display: 'flex', justifyContent: 'center' }}>
                                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path><polyline points="17 8 12 3 7 8"></polyline><line x1="12" y1="3" x2="12" y2="15"></line></svg>
                                    </div>
                                    <div>Chưa có tệp nào được tải lên. Bạn hãy nhấn "Tải lên tài liệu" để bắt đầu nhé.</div>
                                </div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Add/Edit Task Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeModal}>
                    <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingTask ? 'Chỉnh sửa Công việc' : 'Thêm Công việc mới'}</h3>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}><X size={20} /></button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Tên công việc *</label>
                                <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Nhập tên công việc..." />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Phân loại</label>
                                    <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }}>
                                        <option value="THIẾT KẾ">THIẾT KẾ</option>
                                        <option value="MEDIA">MEDIA</option>
                                        <option value="CONTENT">CONTENT</option>
                                        <option value="MARKETING">MARKETING</option>
                                    </select>
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Trạng thái</label>
                                    <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }}>
                                        <option value="CHƯA BẮT ĐẦU">CHƯA BẮT ĐẦU</option>
                                        <option value="NHÁP">NHÁP</option>
                                        <option value="ĐANG LÀM">ĐANG LÀM</option>
                                        <option value="HOÀN THÀNH">HOÀN THÀNH</option>
                                    </select>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Hạn chót</label>
                                <input type="text" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="VD: 30/10/2023" />
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button onClick={handleSaveTask} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#ff7d0d', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Lưu công việc</button>
                            {editingTask && (
                                <button onClick={() => handleDeleteTask(editingTask.id)} style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Trash2 size={18} />
                                </button>
                            )}
                        </div>

                    </div>
                </div>
            )}

            {/* Preview Modal */}
            {previewFile && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.7)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setPreviewFile(null)}>
                    <div style={{ position: 'relative', width: '90%', maxWidth: '900px', maxHeight: '90vh', backgroundColor: 'transparent', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ width: '100%', display: 'flex', justifyContent: 'space-between', alignItems: 'center', backgroundColor: 'white', padding: '1rem 1.5rem', borderRadius: '0.75rem' }}>
                            <div style={{ fontWeight: 600, color: 'var(--color-text)' }}>{previewFile.name}</div>
                            <button onClick={() => setPreviewFile(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: '0.2rem' }}><X size={20} /></button>
                        </div>
                        <img src={previewFile.data} alt={previewFile.name} style={{ maxWidth: '100%', maxHeight: 'calc(90vh - 80px)', objectFit: 'contain', borderRadius: '0.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)' }} />
                    </div>
                </div>
            )}
        </div>
    );
}

