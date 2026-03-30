import { useState } from 'react';
import { Minus, X, Users, User, Calendar, Paperclip, FileText, Mic, Circle, Triangle, UserPlus, PenSquare, PlusCircle } from 'lucide-react';
import Avatar from './Avatar';

interface CreateTaskModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const mockTeam = [
    { id: 1, name: 'Julian Peters', role: 'Creative Director', avatar: 'https://i.pravatar.cc/150?img=15' },
    { id: 2, name: 'Quốc Huy', role: 'Video Editor', avatar: 'https://i.pravatar.cc/150?img=11' },
    { id: 3, name: 'Minh Anh', role: 'Account Manager', avatar: 'https://i.pravatar.cc/150?img=5' },
    { id: 4, name: 'Hoàng Nam', role: 'Graphic Designer', avatar: 'https://i.pravatar.cc/150?img=8' }
];

export default function CreateTaskModal({ isOpen, onClose }: CreateTaskModalProps) {
    const [taskName, setTaskName] = useState('');
    const [isMemberDropdownOpen, setIsMemberDropdownOpen] = useState(false);
    const [selectedMember, setSelectedMember] = useState<typeof mockTeam[0] | null>(null);

    return (
        <div style={{
            position: 'fixed',
            inset: 0,
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            zIndex: 1000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            // Transition properties for overlay
            opacity: isOpen ? 1 : 0,
            visibility: isOpen ? 'visible' : 'hidden',
            transition: 'all 0.3s ease-in-out'
        }}>
            <div style={{
                backgroundColor: 'white',
                borderRadius: '0.5rem',
                width: '100%',
                maxWidth: '600px',
                overflow: 'hidden',
                boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 10px 10px -5px rgba(0, 0, 0, 0.04)',
                display: 'flex',
                flexDirection: 'column',
                // Transition properties for modal body
                transform: isOpen ? 'scale(1) translateY(0)' : 'scale(0.95) translateY(20px)',
                transition: 'all 0.3s cubic-bezier(0.19, 1, 0.22, 1)'
            }}>
                {/* Header */}
                <div style={{
                    backgroundColor: 'var(--color-primary)', // App primary color
                    padding: '1rem',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    color: 'white'
                }}>
                    <h2 style={{ fontSize: '1.125rem', fontWeight: 600, margin: 0 }}>Tạo công việc mới</h2>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                            <Minus size={20} />
                        </button>
                        <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', padding: 0 }}>
                            <X size={20} />
                        </button>
                    </div>
                </div>

                {/* Content */}
                <div style={{ padding: '1.5rem', flex: 1, overflowY: 'auto' }}>
                    {/* Task Name Input */}
                    <div style={{ marginBottom: '1.5rem' }}>
                        <input
                            type="text"
                            placeholder="Đặt tên công việc"
                            value={taskName}
                            onChange={(e) => setTaskName(e.target.value)}
                            style={{
                                width: '100%',
                                padding: '0.75rem 1rem',
                                border: '1px solid #9CA3AF', // Gray 400
                                borderRadius: '0.375rem',
                                fontSize: '1rem',
                                outline: 'none',
                                color: '#374151'
                            }}
                        />
                        <div style={{ textAlign: 'right', fontSize: '0.75rem', color: '#6B7280', marginTop: '0.25rem' }}>
                            {taskName.length}/200
                        </div>
                    </div>

                    {/* Assignee Selection */}
                    <div style={{ marginBottom: '1rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--color-primary)', fontSize: '0.875rem', fontWeight: 500, marginBottom: '0.5rem' }}>
                            Người phụ trách <PenSquare size={14} />
                        </div>
                        <div style={{
                            display: 'flex',
                            gap: '1rem',
                            border: '1px solid #E5E7EB', // Gray 200
                            borderRadius: '0.5rem',
                            padding: '0.5rem',
                            marginBottom: '0.5rem'
                        }}>
                            <button style={{
                                flex: 1,
                                display: 'flex',
                                alignItems: 'center',
                                gap: '0.5rem',
                                padding: '0.5rem',
                                border: 'none',
                                backgroundColor: 'transparent',
                                cursor: 'pointer',
                                color: '#4B5563',
                                fontSize: '0.875rem',
                                borderRight: '1px solid #E5E7EB'
                            }}>
                                <div style={{ backgroundColor: '#9CA3AF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                    <Users size={16} />
                                </div>
                                Nhóm
                            </button>
                            <div style={{ flex: 1, position: 'relative' }}>
                                <button
                                    onClick={() => setIsMemberDropdownOpen(!isMemberDropdownOpen)}
                                    style={{
                                        width: '100%',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '0.5rem',
                                        padding: '0.5rem',
                                        border: 'none',
                                        backgroundColor: 'transparent',
                                        cursor: 'pointer',
                                        color: selectedMember ? '#374151' : '#6B7280',
                                        fontSize: '0.875rem'
                                    }}
                                >
                                    {selectedMember ? (
                                        <Avatar src={selectedMember.avatar} name={selectedMember.name} size={28} />
                                    ) : (
                                        <div style={{ backgroundColor: '#9CA3AF', borderRadius: '50%', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white' }}>
                                            <User size={16} />
                                        </div>
                                    )}
                                    <span style={{ fontWeight: selectedMember ? 600 : 400 }}>
                                        {selectedMember ? selectedMember.name : 'Chọn thành viên'}
                                    </span>
                                </button>

                                {isMemberDropdownOpen && (
                                    <div style={{
                                        position: 'absolute',
                                        top: '100%',
                                        left: 0,
                                        width: '200px',
                                        backgroundColor: 'white',
                                        border: '1px solid #E5E7EB',
                                        borderRadius: '0.5rem',
                                        boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                                        marginTop: '0.5rem',
                                        zIndex: 10,
                                        maxHeight: '160px',
                                        overflowY: 'auto'
                                    }}>
                                        {mockTeam.map(member => (
                                            <div
                                                key={member.id}
                                                onClick={() => {
                                                    setSelectedMember(member);
                                                    setIsMemberDropdownOpen(false);
                                                }}
                                                onMouseEnter={(e) => e.currentTarget.style.backgroundColor = '#F9FAFB'}
                                                onMouseLeave={(e) => e.currentTarget.style.backgroundColor = 'white'}
                                                style={{
                                                    padding: '0.5rem 0.75rem',
                                                    display: 'flex',
                                                    alignItems: 'center',
                                                    gap: '0.75rem',
                                                    cursor: 'pointer',
                                                    borderBottom: '1px solid #F3F4F6',
                                                    transition: 'background-color 0.2s'
                                                }}
                                            >
                                                <Avatar src={member.avatar} name={member.name} size={24} />
                                                <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                    <span style={{ fontSize: '0.85rem', fontWeight: 500, color: '#374151' }}>{member.name}</span>
                                                    <span style={{ fontSize: '0.7rem', color: '#6B7280' }}>{member.role}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ fontSize: '0.875rem', color: '#EF4444', marginBottom: '0.25rem' }}>
                            *Chọn nhóm hoặc người chịu trách nhiệm cho công việc
                        </div>
                        <div style={{ color: 'var(--color-primary)', cursor: 'pointer', display: 'inline-flex', marginBottom: '0.25rem' }}>
                            <PlusCircle size={24} fill="var(--color-primary)" color="white" />
                        </div>
                        <div style={{ fontSize: '0.875rem', color: '#D97706' }}>
                            * Vui lòng chọn lại vì bạn đã thay đổi nhóm/người phụ trách.
                        </div>
                    </div>

                    {/* Date Picker */}
                    <div style={{ marginBottom: '1.5rem', width: '50%' }}>
                        <div style={{
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'space-between',
                            padding: '0.75rem 1rem',
                            border: '1px solid #D1D5DB', // Gray 300
                            borderRadius: '0.375rem',
                            color: '#6B7280'
                        }}>
                            <span>dd/mm/yyyy</span>
                            <Calendar size={18} />
                        </div>
                    </div>

                    {/* Description */}
                    <textarea
                        placeholder="Thêm mô tả ..."
                        style={{
                            width: '100%',
                            minHeight: '150px',
                            padding: '1rem',
                            border: 'none',
                            borderRadius: '0.5rem',
                            backgroundColor: '#F9FAFB', // Gray 50
                            fontSize: '0.875rem',
                            resize: 'vertical',
                            outline: 'none',
                            color: '#374151'
                        }}
                    />
                </div>

                {/* Footer */}
                <div style={{
                    padding: '1rem 1.5rem',
                    borderTop: '1px solid #E5E7EB',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    backgroundColor: 'white'
                }}>
                    {/* Attachment Icons */}
                    <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: 'var(--color-primary)' }}>
                            <Paperclip size={20} />
                        </button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#F97316' }}>
                            <FileText size={20} />
                        </button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#3B82F6' }}>
                            <Mic size={20} />
                        </button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#EF4444' }}>
                            <Circle size={20} />
                        </button>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#10B981' }}>
                            <Triangle size={20} fill="#F59E0B" />
                        </button>
                    </div>

                    {/* Action Buttons */}
                    <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'center' }}>
                        <button style={{ background: 'none', border: 'none', cursor: 'pointer', padding: 0, color: '#6B7280', display: 'flex', alignItems: 'center' }}>
                            <UserPlus size={20} />
                        </button>
                        <button style={{
                            backgroundColor: 'var(--color-primary)', // App primary color
                            color: 'white',
                            border: 'none',
                            borderRadius: '0.375rem',
                            padding: '0.5rem 1.5rem',
                            fontWeight: 600,
                            cursor: 'pointer',
                            fontSize: '1rem'
                        }}>
                            Tạo
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}
