import { useState, useEffect } from 'react';
import { Search, Plus, Filter, LayoutGrid, List, Clock, Folder, Globe, Lock, X } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../../config/firebase';
import { collection, query, getDocs, addDoc, serverTimestamp, orderBy } from 'firebase/firestore';

export default function ProjectList({ onSelectProject }: { onSelectProject: (p: any) => void }) {
    const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
    const [projects, setProjects] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [search, setSearch] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        status: 'ĐANG CHẠY',
        privacy: 'PUBLIC'
    });

    useEffect(() => {
        loadProjects();
    }, []);

    const loadProjects = async () => {
        try {
            const q = query(collection(db, 'projects'), orderBy('createdAt', 'desc'));
            const snap = await getDocs(q);
            setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
        } catch (error: any) {
            console.error(error);
            try {
                const snap = await getDocs(collection(db, 'projects'));
                setProjects(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
            } catch(e) {
               toast.error('Lỗi tải danh sách dự án');
            }
        } finally {
            setIsLoading(false);
        }
    };

    const handleCreateProject = async () => {
        if (!formData.title) return toast.error('Vui lòng nhập tên dự án');
        toast.loading('Đang tạo dự án...', { id: 'create' });
        try {
            const newDoc = {
                ...formData,
                createdAt: serverTimestamp(),
                taskCount: 0
            };
            const docRef = await addDoc(collection(db, 'projects'), newDoc);
            setProjects([{ id: docRef.id, ...newDoc, createdAt: new Date() }, ...projects]);
            toast.success('Đã tạo dự án mới', { id: 'create' });
            setIsModalOpen(false);
            setFormData({ title: '', description: '', status: 'ĐANG CHẠY', privacy: 'PUBLIC' });
        } catch (error: any) {
            toast.error('Lỗi: ' + error.message, { id: 'create' });
        }
    };

    const filtered = projects.filter(p => p.title.toLowerCase().includes(search.toLowerCase()));

    return (
        <div style={{ padding: '2rem', height: '100%', display: 'flex', flexDirection: 'column' }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 800, marginBottom: '0.25rem', letterSpacing: '-0.5px' }}>Quản lý Dự án</h2>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>Theo dõi và quản lý toàn bộ các dự án, chiến dịch của công ty.</p>
                </div>
                <button onClick={() => setIsModalOpen(true)} className="btn hover-lift active-bounce glass-hover" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-primary)', color: 'white', border: 'none', padding: '0.75rem 1.25rem', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>
                    <Plus size={18} /> Tạo dự án mới
                </button>
            </div>

            {/* Toolbar */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                <div style={{ display: 'flex', gap: '1rem', flex: 1 }}>
                    <div style={{ position: 'relative', width: '300px' }}>
                        <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--color-text-light)' }} />
                        <input
                            type="text"
                            placeholder="Tìm kiếm dự án..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                            style={{ width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', borderRadius: '2rem', border: '1px solid var(--color-border)', backgroundColor: 'white', outline: 'none' }}
                        />
                    </div>
                </div>

                <div style={{ display: 'flex', background: 'white', borderRadius: '0.5rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                    <button onClick={() => setViewMode('grid')} style={{ padding: '0.5rem', background: viewMode === 'grid' ? 'var(--color-background)' : 'transparent', border: 'none', cursor: 'pointer', color: viewMode === 'grid' ? 'var(--color-primary)' : 'var(--color-text-light)' }} className="hover-bg">
                        <LayoutGrid size={18} />
                    </button>
                    <button onClick={() => setViewMode('list')} style={{ padding: '0.5rem', background: viewMode === 'list' ? 'var(--color-background)' : 'transparent', border: 'none', cursor: 'pointer', borderLeft: '1px solid var(--color-border)', color: viewMode === 'list' ? 'var(--color-primary)' : 'var(--color-text-light)' }} className="hover-bg">
                        <List size={18} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div style={{ flex: 1, overflowY: 'auto' }} className="custom-scrollbar">
                {isLoading ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>Đang tải danh sách dự án...</div>
                ) : filtered.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '3rem', color: 'var(--color-text-light)' }}>
                        <Folder size={48} strokeWidth={1} style={{margin:'0 auto 1rem'}}/>
                        {search ? 'Không tìm thấy dự án nào.' : 'Chưa có dự án nào.'}
                    </div>
                ) : viewMode === 'grid' ? (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', paddingBottom: '2rem' }}>
                        {filtered.map(project => (
                            <div key={project.id} onClick={() => onSelectProject(project)} className="glass-panel hover-lift active-bounce" style={{ padding: '1.5rem', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem', border: '1px solid var(--color-border)', backgroundColor: 'white' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                        {project.privacy === 'PUBLIC' ? <Globe size={16} color="var(--color-text-light)"/> : <Lock size={16} color="#F59E0B" />}
                                        <h3 style={{ fontSize: '1.2rem', fontWeight: 700, margin: 0, color: 'var(--color-heading)' }}>{project.title}</h3>
                                    </div>
                                    <span style={{ fontSize: '0.7rem', fontWeight: 700, padding: '0.2rem 0.6rem', borderRadius: '1rem', backgroundColor: project.status === 'ĐANG CHẠY' ? '#ECFDF5' : '#F3F4F6', color: project.status === 'ĐANG CHẠY' ? '#10B981' : '#6B7280' }}>
                                        {project.status}
                                    </span>
                                </div>
                                <p style={{ fontSize: '0.9rem', color: 'var(--color-text-light)', margin: 0 }}>{project.description || 'Chưa có mô tả'}</p>
                                <div style={{ marginTop: 'auto', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', color: 'var(--color-primary)', fontWeight: 600, fontSize: '0.85rem' }}>Mở dự án</div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div style={{ backgroundColor: 'white', borderRadius: '1rem', border: '1px solid var(--color-border)', overflow: 'hidden' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                            <thead style={{ backgroundColor: 'var(--color-background)', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                                <tr>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Tên Dự án</th>
                                    <th style={{ padding: '1rem', textAlign: 'left', fontWeight: 600, borderBottom: '1px solid var(--color-border)' }}>Trạng thái</th>
                                </tr>
                            </thead>
                            <tbody>
                                {filtered.map(project => (
                                    <tr key={project.id} className="hover-bg" style={{ borderBottom: '1px solid var(--color-border)', cursor: 'pointer' }} onClick={() => onSelectProject(project)}>
                                        <td style={{ padding: '1rem' }}><div style={{ fontWeight: 600, color: 'var(--color-heading)', fontSize: '1rem' }}>{project.title}</div></td>
                                        <td style={{ padding: '1rem' }}><span style={{ fontSize: '0.75rem', fontWeight: 700, padding: '0.3rem 0.6rem', borderRadius: '4px', backgroundColor: project.status === 'ĐANG CHẠY' ? '#ECFDF5' : '#F3F4F6', color: project.status === 'ĐANG CHẠY' ? '#10B981' : '#6B7280' }}>{project.status}</span></td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>

            {/* Modal */}
            {isModalOpen && (
                <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center' }} onClick={() => setIsModalOpen(false)}>
                    <div style={{ width: '500px', backgroundColor: 'white', borderRadius: '1rem', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }} onClick={e => e.stopPropagation()}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700, margin: 0 }}>Tạo Dự án Mới</h3>
                            <button onClick={() => setIsModalOpen(false)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}><X size={20} /></button>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <input type="text" value={formData.title} onChange={e => setFormData({...formData, title: e.target.value})} style={{ padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none' }} placeholder="Tên dự án *" />
                            <textarea value={formData.description} onChange={e => setFormData({...formData, description: e.target.value})} style={{ padding: '0.85rem', borderRadius: '0.5rem', border: '1px solid var(--color-border)', outline: 'none', resize: 'vertical', minHeight: '80px' }} placeholder="Mô tả mục tiêu của dự án..." />
                        </div>
                        <button onClick={handleCreateProject} style={{ padding: '0.85rem', backgroundColor: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '0.5rem', fontWeight: 600, cursor: 'pointer' }}>Tạo dự án</button>
                    </div>
                </div>
            )}
        </div>
    );
}
