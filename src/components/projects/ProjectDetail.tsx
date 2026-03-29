import { useState, useRef, useEffect } from 'react';
import { Search, Bell, Plus, Filter, MoreVertical, LayoutGrid, List, CheckSquare, Calendar, Folder, X, Edit, Trash2, ArrowLeft, File } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../config/firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc, where } from 'firebase/firestore';


export default function ProjectDetail({ project, onBack }: { project: any, onBack: () => void }) {
    const [activeTab, setActiveTab] = useState('Phân công');
    const [tasks, setTasks] = useState<any[]>([]);
    const [team, setTeam] = useState<any[]>([]);
    const [files, setFiles] = useState<any[]>([]);
    const [isLoadingData, setIsLoadingData] = useState(true);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [previewFile, setPreviewFile] = useState<any>(null);

    useEffect(() => {
        const loadAllData = async () => {
            if(!project?.id) return;
            try {
                // Load Tasks - Filter by projectId
                const tasksQ = query(collection(db, 'project_tasks'), where('projectId', '==', String(project.id)));
                const tasksSnap = await getDocs(tasksQ);
                setTasks(tasksSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                
                // Load Team (Global)
                const teamQ = query(collection(db, 'employees'));
                const teamSnap = await getDocs(teamQ);
                const fetchedTeam = teamSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setTeam(fetchedTeam);

                // Load Files
                const filesQ = query(collection(db, 'project_files'), where('projectId', '==', String(project.id)));
                const filesSnap = await getDocs(filesQ);
                setFiles(filesSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                
            } catch (error) {
                console.error("Lỗi khi tải dữ liệu dự án:", error);
                toast.error("Lỗi tải chi tiết dự án");
            } finally {
                setIsLoadingData(false);
            }
        };
        loadAllData();
    }, [project.id]);

    const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files.length > 0) {
            toast.loading('Đang tải file lên Cloud...', { id: 'upload' });
            const uploadedFiles = Array.from(e.target.files);
            
            try {
                const filePromises = uploadedFiles.map(f => {
                    return new Promise<any>((resolve) => {
                        const isImage = f.type.startsWith('image/');
                        const isSmallEnoughForStorage = f.size < 3 * 1024 * 1024; // 3MB limit
                        
                        if (isImage && isSmallEnoughForStorage) {
                            const reader = new FileReader();
                            reader.onload = (event) => {
                                resolve({
                                    projectId: String(project.id),
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
                                projectId: String(project.id),
                                name: f.name,
                                size: (f.size / 1024 / 1024).toFixed(2) + ' MB',
                                type: f.type || 'Không xác định',
                                date: new Date().toLocaleDateString('vi-VN'),
                                data: null
                            });
                        }
                    });
                });

                const newFilesData = await Promise.all(filePromises);
                const successfulFiles = [];
                for (const fileData of newFilesData) {
                    const docRef = await addDoc(collection(db, 'project_files'), fileData);
                    successfulFiles.push({ id: docRef.id, ...fileData });
                }
                
                setFiles([...successfulFiles, ...files]);
                toast.success('Đã lưu file thành công!', { id: 'upload' });
            } catch (err: any) {
                console.error(err);
                toast.error('Lỗi upload file: ' + err.message, { id: 'upload' });
            }
            e.target.value = '';
        }
    };

    const handleDeleteFile = async (id: string) => {
        if (confirm('Bạn có chắc chắn muốn xóa tệp này trên Cloud?')) {
            toast.loading('Đang xóa...', { id: 'del-file' });
            try {
                await deleteDoc(doc(db, 'project_files', id));
                setFiles(files.filter((f: any) => f.id !== id));
                toast.success('Đã xóa tệp', { id: 'del-file' });
            } catch (err: any) {
                toast.error('Lỗi: ' + err.message, { id: 'del-file' });
            }
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

    const handleDrop = async (e: React.DragEvent, taskId: string) => {
        e.preventDefault();
        const memberId = e.dataTransfer.getData('memberId');
        if (!memberId) return;

        const member = team.find((m: any) => m.id.toString() === memberId);
        if (member) {
            const currentTask = tasks.find(t => t.id === taskId);
            if (!currentTask) return;
            const currentAssignees = currentTask.assignees || (currentTask.assignee ? [currentTask.assignee] : []);
            if (currentAssignees.some((a: any) => a.id === member.id)) return;
            
            const updatedAssignees = [...currentAssignees, { id: member.id, name: member.name, avatar: member.avatar }];
            try {
                await updateDoc(doc(db, 'project_tasks', String(taskId)), { assignees: updatedAssignees });
                setTasks(tasks.map((t: any) => t.id === taskId ? { ...t, assignees: updatedAssignees } : t));
            } catch (err: any) {
                console.error(err);
                toast.error("Lỗi cập nhật người thực hiện: " + err.message);
            }
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

    const handleSaveTask = async () => {
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

        toast.loading('Đang lưu công việc...', { id: 'save-task' });
        try {
            if (editingTask) {
                const updateData = { ...formData, typeColor, statusColor };
                await updateDoc(doc(db, 'project_tasks', String(editingTask.id)), updateData);
                setTasks(tasks.map((t: any) => t.id === editingTask.id ? { ...t, ...updateData } : t));
                toast.success('Cập nhật thành công', { id: 'save-task' });
            } else {
                const newTaskData = {
                    ...formData,
                    projectId: String(project.id),
                    typeColor,
                    statusColor,
                    assignees: []
                };
                const docRef = await addDoc(collection(db, 'project_tasks'), newTaskData);
                setTasks([...tasks, { id: docRef.id, ...newTaskData }]);
                toast.success('Đã thêm công việc mới', { id: 'save-task' });
            }
            closeModal();
        } catch (err: any) {
            console.error(err);
            toast.error('Lỗi: ' + err.message, { id: 'save-task' });
        }
    };

    const handleDeleteTask = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa công việc này khỏi Firebase?")) {
            toast.loading('Đang xóa...', { id: 'del-task' });
            try {
                await deleteDoc(doc(db, 'project_tasks', String(id)));
                setTasks(tasks.filter((t: any) => t.id !== id));
                if (editingTask && editingTask.id === id) closeModal();
                toast.success('Đã xóa', { id: 'del-task' });
            } catch (err: any) {
                toast.error('Lỗi: ' + err.message, { id: 'del-task' });
            }
        }
    };

    const handleRemoveAssignee = async (taskId: string, memberId: number, e: React.MouseEvent) => {
        e.stopPropagation();
        const currentTask = tasks.find(t => t.id === taskId);
        if (!currentTask) return;
        const remainingAssignees = (currentTask.assignees || []).filter((a: any) => a.id !== memberId);
        
        try {
            await updateDoc(doc(db, 'project_tasks', String(taskId)), { assignees: remainingAssignees });
            setTasks(tasks.map((t: any) => t.id === taskId ? { ...t, assignees: remainingAssignees } : t));
        } catch (err: any) {
            toast.error("Lỗi gỡ người thực hiện: " + err.message);
        }
    };

    return (
        <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: 'var(--color-surface)' }}>
            {/* Top Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1.25rem 2rem', borderBottom: '1px solid var(--color-border)' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-text-light)', fontSize: '0.9rem', marginBottom: '0.25rem' }}>
                        <button onClick={onBack} style={{ display: 'flex', alignItems: 'center', gap: '0.2rem', background: 'transparent', border: 'none', color: 'var(--color-primary)', fontWeight: 600, cursor: 'pointer', padding: 0, marginRight: '0.5rem' }} className="hover-text-primary">
                            <ArrowLeft size={16} /> Quay lại
                        </button>
                        <span>Dự án</span>
                        <span>›</span>
                        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{project.title}</span>
                        <span>›</span>
                        <span style={{ color: 'var(--color-text)', fontWeight: 600 }}>{activeTab === 'Tài liệu' ? 'Tài liệu dự án' : 'Phân chia công việc'}</span>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-text)' }}>{activeTab === 'Tài liệu' ? 'Quản lý Dữ liệu Dự án' : 'Phân chia công việc'}</h2>
                        <span style={{ backgroundColor: '#FFE4D6', color: '#ff7d0d', padding: '0.25rem 0.75rem', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 700, letterSpacing: '0.5px' }}>{project.status.toUpperCase()}</span>
                    </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ position: 'relative', width: '280px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                        <input type="text" placeholder="Tìm tên công việc..." value={taskSearch} onChange={(e) => setTaskSearch(e.target.value)} style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '2rem', border: '1px solid var(--color-border)', backgroundColor: '#F9FAFB', outline: 'none', fontSize: '0.9rem' }} />
                    </div>
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
                            <input type="file" multiple ref={fileInputRef} style={{ display: 'none' }} onChange={handleFileUpload} />
                            <button onClick={() => fileInputRef.current?.click()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.6rem 1.2rem', borderRadius: '0.5rem', border: 'none', background: '#ff7d0d', color: 'white', fontWeight: 600, fontSize: '0.9rem', cursor: 'pointer' }}>
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
                {activeTab === 'Tiến độ' ? (
                    <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)', letterSpacing: '1px', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Bảng Theo Dõi Tiến Độ Từng Đầu Mục</h3>
                        <div style={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                                <thead style={{ backgroundColor: '#F9FAFB', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                                    <tr>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Công việc</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Người thực hiện</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Hạn chót</th>
                                        <th style={{ padding: '1rem', textAlign: 'center', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Trạng thái</th>
                                        <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)', width: '25%' }}>Tiến độ</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredTasks.length === 0 ? (
                                        <tr>
                                            <td colSpan={5} style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Chưa có thể công việc nào</td>
                                        </tr>
                                    ) : filteredTasks.map((task: any) => {
                                        let progressPercent = 0;
                                        if (task.status === 'ĐANG LÀM') progressPercent = 50;
                                        if (task.status === 'HOÀN THÀNH') progressPercent = 100;
                                        
                                        return (
                                        <tr key={task.id} style={{ borderBottom: '1px solid var(--color-border)' }} className="hover-bg">
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem' }}>{task.title}</div>
                                                <span style={{ backgroundColor: `${task.typeColor}15`, color: task.typeColor, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800 }}>{task.type}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                    {task.assignees && task.assignees.length > 0 ? task.assignees.map((a: any, index: number) => (
                                                        <div key={a.id} style={{ position: 'relative', marginLeft: index > 0 ? '-10px' : '0', zIndex: 10 - index }} title={a.name}>
                                                            {a.avatar ? (
                                                                <img src={a.avatar} alt="Assignee" style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid white', objectFit: 'cover' }} />
                                                            ) : (
                                                                <div style={{ width: '32px', height: '32px', borderRadius: '50%', border: '2px solid white', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '0.8rem' }}>{a.name.charAt(0)}</div>
                                                            )}
                                                        </div>
                                                    )) : <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem' }}>Chưa phân công</span>}
                                                </div>
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center', color: task.deadline ? 'var(--color-text)' : 'var(--color-text-light)', fontSize: '0.9rem', fontWeight: 500 }}>
                                                {task.deadline || '--'}
                                            </td>
                                            <td style={{ padding: '1rem', textAlign: 'center' }}>
                                                <span style={{ backgroundColor: `${task.statusColor}15`, color: task.statusColor, padding: '0.3rem 0.8rem', borderRadius: '2rem', fontSize: '0.75rem', fontWeight: 800, whiteSpace: 'nowrap' }}>{task.status}</span>
                                            </td>
                                            <td style={{ padding: '1rem' }}>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                    <div style={{ flex: 1, backgroundColor: '#E5E7EB', height: '8px', borderRadius: '4px', overflow: 'hidden' }}>
                                                        <div style={{ width: `${progressPercent}%`, backgroundColor: task.statusColor, height: '100%', borderRadius: '4px', transition: 'width 0.3s ease' }}></div>
                                                    </div>
                                                    <span style={{ fontSize: '0.8rem', fontWeight: 700, color: 'var(--color-text-light)', width: '35px' }}>{progressPercent}%</span>
                                                </div>
                                            </td>
                                        </tr>
                                    )})}
                                </tbody>
                            </table>
                        </div>
                    </div>
                ) : activeTab !== 'Tài liệu' ? (
                    <>
                        <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)', letterSpacing: '1px', marginBottom: '1.5rem', textTransform: 'uppercase' }}>Các đầu việc cần phân công</h3>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', paddingBottom: '2rem' }}>
                                {isLoadingData ? (
                                    <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Đang tải công việc...</div>
                                ) : filteredTasks.map((task: any) => (
                                    <div key={task.id} style={{ backgroundColor: 'white', borderRadius: '0.75rem', padding: '1.5rem', border: '1px solid var(--color-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', ...(task.status === 'ĐANG LÀM' ? { borderColor: '#ff7d0d', boxShadow: '0 4px 12px rgba(255,125,13,0.1)' } : {})}}>
                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                                <h4 style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-text)' }}>{task.title}</h4>
                                                <button onClick={() => openModal(task)} style={{ background: 'transparent', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', outline: 'none', padding: '0.2rem' }}><Edit size={16} /></button>
                                            </div>
                                            <span style={{ backgroundColor: `${task.typeColor}15`, color: task.typeColor, padding: '0.2rem 0.6rem', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 800, letterSpacing: '0.5px' }}>{task.type}</span>
                                        </div>

                                        <div style={{ marginBottom: '1.5rem' }}>
                                            <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Người thực hiện</div>
                                            <div onDrop={(e) => handleDrop(e, task.id)} onDragOver={handleDragOver} style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-start', padding: '0.75rem 1rem', minHeight: '60px', flexWrap: 'wrap', gap: '0.5rem', backgroundColor: (task.assignees && task.assignees.length > 0) ? 'transparent' : '#F3F4F6', border: (task.assignees && task.assignees.length > 0) ? '1px solid var(--color-border)' : '1px dashed #D1D5DB', borderRadius: '0.5rem', cursor: 'grab' }}>
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
                                                                <button onClick={(e) => handleRemoveAssignee(task.id, a.id, e)} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', width: '20px', height: '20px', borderRadius: '50%', marginLeft: '0.25rem' }} title="Gỡ"><X size={12} /></button>
                                                            </div>
                                                        ))}
                                                    </div>
                                                ) : (
                                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: '#9CA3AF', width: '100%' }}>
                                                        <div style={{ width: '32px', height: '32px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Plus size={16} /></div>
                                                        <span style={{ fontSize: '0.9rem' }}>Chưa có người phụ trách (Kéo thả vào đây)</span>
                                                    </div>
                                                )}
                                            </div>
                                        </div>

                                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                            <div>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Hạn chót</div>
                                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, fontSize: '0.9rem' }}><Calendar size={14} color="var(--color-danger)" /> {task.deadline || 'Chưa định'}</div>
                                            </div>
                                            <div style={{ textAlign: 'right' }}>
                                                <div style={{ fontSize: '0.7rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.25rem', textTransform: 'uppercase' }}>Trạng thái</div>
                                                <span style={{ color: task.statusColor, fontWeight: 800, fontSize: '0.75rem' }}>{task.status}</span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                                {filteredTasks.length === 0 && <div style={{ textAlign: 'center', color: 'var(--color-text-light)', padding: '2rem' }}>Chưa có công việc nào.</div>}
                            </div>
                        </div>

                        <div style={{ width: '350px', backgroundColor: 'white', borderLeft: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                            <div style={{ padding: '2rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                                <h3 style={{ fontSize: '0.9rem', fontWeight: 800, color: 'var(--color-text)', letterSpacing: '0.5px', marginBottom: '1.25rem', textTransform: 'uppercase' }}>Danh sách nhân sự</h3>
                                <div style={{ position: 'relative' }}>
                                    <Search size={14} style={{ position: 'absolute', left: '0.75rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                                    <input type="text" placeholder="Tìm nhân sự..." value={teamSearch} onChange={(e) => setTeamSearch(e.target.value)} style={{ width: '100%', padding: '0.6rem 1rem 0.6rem 2.25rem', borderRadius: '0.5rem', border: 'none', backgroundColor: '#F3F4F6', outline: 'none', fontSize: '0.85rem' }} />
                                </div>
                            </div>
                            <div style={{ flex: 1, overflowY: 'auto', padding: '1.5rem' }}>
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                                    {filteredTeam.map((member: any) => (
                                        <div key={member.id} draggable={!member.locked} onDragStart={(e) => handleDragStart(e, member)} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '1rem', border: '1px solid var(--color-border)', borderRadius: '0.75rem', backgroundColor: 'white', cursor: member.locked ? 'not-allowed' : 'grab', opacity: member.locked ? 0.6 : 1 }}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                                {member.avatar ? <img src={member.avatar} alt={member.name} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} /> : <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: '#E5E7EB', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>{member.name.charAt(0)}</div>}
                                                <div style={{ pointerEvents: 'none' }}><div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{member.name}</div><div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{member.role}</div></div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                ) : (
                    <div style={{ flex: 1, padding: '2rem', overflowY: 'auto' }}>
                        <div>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 700, color: 'var(--color-text-light)', letterSpacing: '1px', marginBottom: '1.25rem', textTransform: 'uppercase' }}>Tệp cá nhân / Tải lên gần đây</h3>
                            {isLoadingData ? (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Đang tải dữ liệu tệp tin...</div>
                            ) : files.length > 0 ? (
                                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.25rem' }}>
                                    {files.map((file: any) => (
                                        <div key={file.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', backgroundColor: 'white', borderRadius: '0.75rem', padding: '1rem', border: '1px solid var(--color-border)', boxShadow: '0 2px 4px rgba(0,0,0,0.02)', cursor: file.data ? 'pointer' : 'default' }} onClick={() => file.data && setPreviewFile(file)}>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', overflow: 'hidden' }}>
                                                {file.data ? <img src={file.data} alt="Preview" style={{ width: '48px', height: '48px', borderRadius: '0.5rem', objectFit: 'cover' }} /> : <div style={{ backgroundColor: '#F3F4F6', padding: '0.75rem', borderRadius: '0.5rem', color: '#ff7d0d', display: 'flex' }}><File size={24}/></div>}
                                                <div style={{ overflow: 'hidden' }}><div style={{ fontWeight: 600, fontSize: '0.9rem', color: 'var(--color-text)' }}>{file.name}</div><div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.2rem' }}>{file.size}</div></div>
                                            </div>
                                            <button onClick={(e) => { e.stopPropagation(); handleDeleteFile(file.id); }} style={{ background: 'transparent', border: 'none', color: '#EF4444', cursor: 'pointer', padding: '0.5rem' }} title="Xóa tệp"><Trash2 size={16} /></button>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>Chưa có tệp nào được tải lên.</div>
                            )}
                        </div>
                    </div>
                )}
            </div>

            {/* Modal - Add Task */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={closeModal}>
                    <div style={{ width: '100%', maxWidth: '500px', backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingTask ? 'Chỉnh sửa Công việc' : 'Thêm Công việc mới'}</h3>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Nhập tên công việc..." />
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <select value={formData.type} onChange={e => setFormData({...formData, type: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }}>
                                    <option value="THIẾT KẾ">THIẾT KẾ</option><option value="MEDIA">MEDIA</option><option value="CONTENT">CONTENT</option><option value="MARKETING">MARKETING</option>
                                </select>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }}>
                                    <option value="CHƯA BẮT ĐẦU">CHƯA BẮT ĐẦU</option><option value="NHÁP">NHÁP</option><option value="ĐANG LÀM">ĐANG LÀM</option><option value="HOÀN THÀNH">HOÀN THÀNH</option>
                                </select>
                            </div>
                            <input type="text" value={formData.deadline} onChange={e => setFormData({...formData, deadline: e.target.value})} style={{ width: '100%', padding: '0.75rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Hạn chót VD: 30/10/2023" />
                        </div>
                        <div style={{ display: 'flex', gap: '1rem', marginTop: '0.5rem' }}>
                            <button onClick={handleSaveTask} style={{ flex: 1, padding: '0.75rem', backgroundColor: '#ff7d0d', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Lưu công việc</button>
                            {editingTask && <button onClick={() => handleDeleteTask(editingTask.id)} style={{ padding: '0.75rem 1rem', backgroundColor: '#FEF2F2', color: '#EF4444', border: '1px solid #FECACA', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Trash2 size={18} /></button>}
                        </div>
                    </div>
                </div>
            )}
            
            {/* Preview Document */}
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
