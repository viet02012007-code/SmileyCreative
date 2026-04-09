import { useState, useEffect } from 'react';
import { Rocket, Plus, Briefcase, FileText } from 'lucide-react';
import toast from 'react-hot-toast';
import { db } from '../config/firebase';
import { collection, getDocs, addDoc } from 'firebase/firestore';
import { useAuth } from '../contexts/AuthContext';

export default function DailyTaskPrompt() {
    const { currentUser } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [projects, setProjects] = useState<any[]>([]);
    
    // User task inputs
    const [taskName, setTaskName] = useState('');
    const [selectedProjectId, setSelectedProjectId] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    useEffect(() => {
        // Only run check if user is logged in
        if (!currentUser) return;

        const checkDailyPrompt = async () => {
            const today = new Date().toLocaleDateString('en-CA'); // YYYY-MM-DD format
            const STORAGE_KEY = `daily_prompt_${currentUser.uid}_${today}`;
            
            // Check if user already submitted today
            if (!localStorage.getItem(STORAGE_KEY)) {
                setIsOpen(true);
                // Load projects so user can select where to put the task
                try {
                    const snap = await getDocs(collection(db, 'projects'));
                    const projectList = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                    setProjects(projectList);
                    if (projectList.length > 0) {
                        setSelectedProjectId(projectList[0].id);
                    }
                } catch (err) {
                    console.error('Lỗi tải danh sách dự án:', err);
                }
            }
        };

        checkDailyPrompt();
    }, [currentUser]);

    const handleSubmitTask = async () => {
        if (!taskName.trim()) {
            return toast.error('Bạn phải nhập ít nhất 1 công việc để có thể bắt đầu ngày mới!');
        }
        if (!selectedProjectId) {
            return toast.error('Vui lòng chọn 1 Dự án phụ trách.');
        }

        setIsSubmitting(true);
        toast.loading('Đang khởi tạo mục tiêu ngày...', { id: 'daily-task' });
        
        try {
            const newTaskData = {
                projectId: selectedProjectId,
                title: taskName,
                description: '',
                status: 'CHƯA XỬ LÝ',
                priority: 'TRUNG BÌNH',
                progress: 0,
                date: new Date().toLocaleDateString('vi-VN'),
                deadline: '',
                tags: ['Hằng ngày'],
                assignees: [{
                    id: currentUser?.uid || Date.now(),
                    name: currentUser?.displayName || currentUser?.email?.split('@')[0] || 'Member',
                    avatar: currentUser?.photoURL || `https://ui-avatars.com/api/?name=${currentUser?.email || 'M'}&background=random`
                }]
            };

            await addDoc(collection(db, 'project_tasks'), newTaskData);
            
            // Mark as done for today
            const today = new Date().toLocaleDateString('en-CA');
            localStorage.setItem(`daily_prompt_${currentUser?.uid}_${today}`, 'true');
            
            toast.success('Chúc bạn một ngày làm việc hiệu quả! 🚀', { id: 'daily-task' });
            setIsOpen(false);
            
        } catch (error: any) {
            toast.error('Lỗi khởi tạo: ' + error.message, { id: 'daily-task' });
        } finally {
            setIsSubmitting(false);
        }
    };

    if (!isOpen) return null;

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            backdropFilter: 'blur(4px)',
            WebkitBackdropFilter: 'blur(4px)',
            zIndex: 9999, // Ensure it covers everything including other modals and header
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '1rem',
                width: '90%',
                maxWidth: '900px',
                height: '80vh',
                maxHeight: '600px',
                overflow: 'hidden',
                boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25)',
                display: 'flex',
                animation: 'modalSlideUp 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
            }}>
                {/* Left Panel: Graphic & Motivation */}
                <div style={{
                    width: '35%',
                    backgroundColor: '#FFF7ED', // Light orange background matching app theme
                    padding: '3rem 2rem',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    textAlign: 'center',
                    position: 'relative',
                    borderRight: '1px solid #FFEDD5'
                }}>
                    <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#C2410C', lineHeight: 1.5, zIndex: 10 }}>
                        Hãy lên kế hoạch tạo những công việc bạn dự định làm trong ngày.
                    </h2>
                    
                    <div style={{ marginTop: 'auto', marginBottom: '1rem', zIndex: 10 }}>
                        <div style={{ 
                            width: '120px', height: '120px', 
                            backgroundColor: 'white', borderRadius: '50%', 
                            display: 'flex', alignItems: 'center', justifyContent: 'center',
                            boxShadow: '0 10px 15px -3px rgba(249, 115, 22, 0.1)'
                        }}>
                            <Rocket size={64} color="#F97316" fill="#FB923C" />
                        </div>
                    </div>
                </div>

                {/* Right Panel: Form Input */}
                <div style={{
                    flex: 1,
                    display: 'flex',
                    flexDirection: 'column',
                    backgroundColor: 'white'
                }}>
                    {/* Header bar */}
                    <div style={{ 
                        padding: '1.25rem 2rem', 
                        borderBottom: '1px solid #F3F4F6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center'
                    }}>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-heading)', margin: 0 }}>
                            Hôm nay tôi làm gì?
                        </h3>
                        <span style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                            *Bắt buộc tạo tác vụ để tiếp tục
                        </span>
                    </div>

                    {/* Task Content */}
                    <div style={{ padding: '2rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', overflowY: 'auto' }}>
                        
                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                                <FileText size={16} color="var(--color-primary)" /> Tên công việc dự định
                            </label>
                            <input 
                                type="text" 
                                value={taskName}
                                onChange={(e) => setTaskName(e.target.value)}
                                placeholder="Ví dụ: Thiết kế xong banner Landing Page..."
                                autoFocus
                                style={{ 
                                    width: '100%', 
                                    padding: '1rem', 
                                    borderRadius: '0.5rem', 
                                    border: '2px dashed #CBD5E1', 
                                    outline: 'none',
                                    fontSize: '1rem',
                                    transition: 'border-color 0.2s',
                                    backgroundColor: '#F8FAFC'
                                }}
                                onFocus={(e) => e.target.style.borderColor = 'var(--color-primary)'}
                                onBlur={(e) => e.target.style.borderColor = '#CBD5E1'}
                                onKeyDown={(e) => {
                                    if(e.key === 'Enter') handleSubmitTask();
                                }}
                            />
                        </div>

                        <div>
                            <label style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.9rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.75rem' }}>
                                <Briefcase size={16} color="var(--color-primary)" /> Gán vào thuộc Dự án
                            </label>
                            {projects.length > 0 ? (
                                <select 
                                    value={selectedProjectId}
                                    onChange={(e) => setSelectedProjectId(e.target.value)}
                                    style={{ 
                                        width: '100%', 
                                        padding: '0.85rem 1rem', 
                                        borderRadius: '0.5rem', 
                                        border: '1px solid #E2E8F0', 
                                        outline: 'none',
                                        fontSize: '0.95rem',
                                        backgroundColor: 'white',
                                        cursor: 'pointer'
                                    }}
                                >
                                    <option value="" disabled>--- Chọn Dự án ---</option>
                                    {projects.map((p) => (
                                        <option key={p.id} value={p.id}>{p.title}</option>
                                    ))}
                                </select>
                            ) : (
                                <div style={{ fontSize: '0.9rem', color: '#EF4444', padding: '0.75rem', backgroundColor: '#FEF2F2', borderRadius: '0.5rem' }}>
                                    Hệ thống chưa có Dự án nào. Vui lòng liên hệ Quản trị viên để tạo Dự án trước!
                                </div>
                            )}
                        </div>

                    </div>

                    {/* Footer bar */}
                    <div style={{ 
                        padding: '1.25rem 2rem', 
                        borderTop: '1px solid #F3F4F6',
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        backgroundColor: '#F8FAFC'
                    }}>
                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                            Hôm nay bạn dự định bắt đầu làm việc lúc: 
                            <strong style={{ color: 'var(--color-primary)', marginLeft: '0.5rem' }}>{new Date().toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}</strong>
                        </div>
                        <button 
                            onClick={handleSubmitTask}
                            disabled={isSubmitting}
                            style={{ 
                                backgroundColor: 'var(--color-primary)', 
                                color: 'white', 
                                border: 'none', 
                                padding: '0.75rem 2rem', 
                                borderRadius: '0.5rem', 
                                fontWeight: 600, 
                                fontSize: '0.95rem',
                                cursor: isSubmitting ? 'not-allowed' : 'pointer',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                boxShadow: '0 4px 6px -1px rgba(249, 115, 22, 0.3)'
                            }}
                        >
                            <Plus size={18} />
                            Tiếp tục làm việc
                        </button>
                    </div>

                </div>
            </div>

            <style>{`
                @keyframes modalSlideUp {
                    from { transform: translateY(20px) scale(0.95); opacity: 0; }
                    to { transform: translateY(0) scale(1); opacity: 1; }
                }
            `}</style>
        </div>
    );
}
