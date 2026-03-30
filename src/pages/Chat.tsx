import { useState } from 'react';
import { Search, Send, Phone, Video, MoreVertical, Image as ImageIcon, Paperclip, Smile } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import Avatar from '../components/Avatar';

const mockChats = [
    { id: 1, name: 'Phòng Phát triển Sản phẩm', lastMsg: 'Anh push code lên nhánh dev rồi nhé', time: '10:30', unread: 2, avatar: 'https://i.pravatar.cc/150?img=1', isGroup: true },
    { id: 2, name: 'Nguyễn Hoàng Đức Việt', lastMsg: 'Duyệt giúp em đơn xin nghỉ phép', time: '09:15', unread: 0, avatar: 'https://i.pravatar.cc/150?img=11', isGroup: false },
    { id: 3, name: 'Team Marketing', lastMsg: 'Mai họp online lúc 2h chiều nhé', time: 'Hôm qua', unread: 5, avatar: 'https://i.pravatar.cc/150?img=3', isGroup: true },
    { id: 4, name: 'Trần Thị B', lastMsg: 'Ok anh', time: 'Hôm qua', unread: 0, avatar: 'https://i.pravatar.cc/150?img=5', isGroup: false },
];

export default function Chat() {
    const [activeChat, setActiveChat] = useState(mockChats[0]);
    const [messagesByChat, setMessagesByChat] = useState<Record<number, any[]>>({
        1: [
            { id: 1, text: 'Anh push code lên nhánh dev rồi nhé. Mọi người pull về test nha.', sender: 'Lê Văn C', time: '10:15', isMine: false, avatar: 'https://i.pravatar.cc/150?img=12' },
            { id: 2, text: 'Ok anh, để em check luôn ạ.', sender: 'Bạn', time: '10:30', isMine: true }
        ],
        2: [
            { id: 3, text: 'Duyệt giúp em đơn xin nghỉ phép', sender: 'Nguyễn Hoàng Đức Việt', time: '09:15', isMine: false, avatar: 'https://i.pravatar.cc/150?img=11' }
        ],
        3: [
            { id: 4, text: 'Mai họp online lúc 2h chiều nhé', sender: 'Team Marketing', time: 'Hôm qua', isMine: false, avatar: 'https://i.pravatar.cc/150?img=3' }
        ],
        4: [
            { id: 5, text: 'Ok anh', sender: 'Trần Thị B', time: 'Hôm qua', isMine: false, avatar: 'https://i.pravatar.cc/150?img=5' }
        ]
    });
    const [inputValue, setInputValue] = useState('');

    const handleSendMessage = () => {
        if (!inputValue.trim()) return;

        const now = new Date();
        const timeString = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

        const newMessage = {
            id: Date.now(),
            text: inputValue,
            sender: 'Bạn',
            time: timeString,
            isMine: true
        };

        setMessagesByChat(prev => ({
            ...prev,
            [activeChat.id]: [...(prev[activeChat.id] || []), newMessage]
        }));
        setInputValue('');
    };

    const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
        if (e.key === 'Enter') {
            handleSendMessage();
        }
    };

    const currentMessages = messagesByChat[activeChat.id] || [];

    return (
        <PageTransition style={{ display: 'flex', gap: '1rem', height: 'calc(100vh - var(--header-height) - 7rem)', margin: '-1rem' }}>

            {/* Sidebar - Chat List */}
            <div style={{ width: '320px', borderRight: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column' }}>
                <div style={{ padding: '1.5rem 1.5rem 1rem 1.5rem' }}>
                    <h2 style={{ fontSize: '1.5rem', fontWeight: 700, marginBottom: '1rem' }}>Chat Nội bộ</h2>
                    <div style={{
                        display: 'flex', alignItems: 'center', background: 'var(--color-background)',
                        padding: '0.5rem 1rem', borderRadius: '2rem', border: '1px solid var(--color-border)'
                    }}>
                        <Search size={16} color="var(--color-text-light)" />
                        <input type="text" placeholder="Tìm kiếm..." style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', width: '100%', marginLeft: '0.5rem', fontSize: '0.9rem' }} />
                    </div>
                </div>

                <div style={{ overflowY: 'auto', flex: 1 }}>
                    {mockChats.map(chat => (
                        <div key={chat.id} onClick={() => setActiveChat(chat)} style={{
                            display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem 1.5rem',
                            cursor: 'pointer', background: activeChat.id === chat.id ? 'var(--color-background)' : 'transparent',
                            borderLeft: activeChat.id === chat.id ? '3px solid var(--color-primary)' : '3px solid transparent',
                            transition: 'background 0.2s'
                        }} className="chat-item">
                            <div style={{ position: 'relative' }}>
                                <Avatar src={chat.avatar} name={chat.name} size={48} style={{ borderRadius: chat.isGroup ? '16px' : '50%' }} />
                                {!chat.isGroup && <div style={{ position: 'absolute', bottom: '0', right: '0', width: '12px', height: '12px', borderRadius: '50%', backgroundColor: 'var(--color-success)', border: '2px solid var(--color-surface)' }}></div>}
                            </div>
                            <div style={{ flex: 1, minWidth: 0 }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.25rem' }}>
                                    <h4 style={{ fontWeight: 600, margin: 0, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', fontSize: '1rem' }}>{chat.name}</h4>
                                    <span style={{ fontSize: '0.75rem', color: chat.unread > 0 ? 'var(--color-primary)' : 'var(--color-text-light)', fontWeight: chat.unread > 0 ? 600 : 400 }}>{chat.time}</span>
                                </div>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                                    <p style={{ margin: 0, fontSize: '0.85rem', color: chat.unread > 0 ? 'var(--color-text)' : 'var(--color-text-light)', fontWeight: chat.unread > 0 ? 600 : 400, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{chat.lastMsg}</p>
                                    {chat.unread > 0 && <span style={{ background: 'var(--color-danger)', color: 'white', fontSize: '0.7rem', fontWeight: 600, padding: '0.1rem 0.4rem', borderRadius: '1rem', marginLeft: '0.5rem' }}>{chat.unread}</span>}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* Main Chat Area */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>

                {/* Chat Header */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '1rem 1.5rem', borderBottom: '1px solid var(--color-border)' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        <Avatar src={activeChat.avatar} name={activeChat.name} size={40} style={{ borderRadius: activeChat.isGroup ? '12px' : '50%' }} />
                        <div>
                            <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 600 }}>{activeChat.name}</h3>
                            <span style={{ fontSize: '0.8rem', color: 'var(--color-success)' }}>{activeChat.isGroup ? '24 thành viên' : 'Đang hoạt động'}</span>
                        </div>
                    </div>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                        <button className="icon-btn"><Phone size={20} /></button>
                        <button className="icon-btn"><Video size={20} /></button>
                        <button className="icon-btn"><MoreVertical size={20} /></button>
                    </div>
                </div>

                {/* Chat Messages */}
                <div style={{ flex: 1, padding: '1.5rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1rem', background: 'rgba(0,0,0,0.01)' }}>
                    <div style={{ textAlign: 'center', margin: '1rem 0' }}><span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', background: 'var(--color-background)', padding: '0.3rem 1rem', borderRadius: '1rem' }}>Hôm nay</span></div>

                    {currentMessages.map((msg: any) => (
                        <div key={msg.id} style={{ display: 'flex', gap: '1rem', alignSelf: msg.isMine ? 'flex-end' : 'flex-start', maxWidth: '70%' }}>
                            {!msg.isMine && msg.avatar && (
                                <Avatar src={msg.avatar} size={32} />
                            )}
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem', alignItems: msg.isMine ? 'flex-end' : 'flex-start' }}>
                                <span style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{msg.sender}, {msg.time}</span>
                                <div style={{
                                    background: msg.isMine ? 'linear-gradient(135deg, var(--color-primary), var(--color-secondary))' : 'var(--color-background)',
                                    color: msg.isMine ? 'white' : 'var(--color-text)',
                                    padding: '0.75rem 1rem',
                                    borderRadius: msg.isMine ? '1rem 0 1rem 1rem' : '0 1rem 1rem 1rem'
                                }}>
                                    {msg.text}
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Chat Input */}
                <div style={{ padding: '1rem 1.5rem', borderTop: '1px solid var(--color-border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <button className="icon-btn"><Paperclip size={20} /></button>
                    <button className="icon-btn"><ImageIcon size={20} /></button>
                    <div style={{ flex: 1, background: 'var(--color-background)', borderRadius: '2rem', padding: '0.5rem 1rem', display: 'flex', alignItems: 'center' }}>
                        <input
                            type="text"
                            placeholder="Nhập tin nhắn..."
                            value={inputValue}
                            onChange={(e) => setInputValue(e.target.value)}
                            onKeyDown={handleKeyDown}
                            style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)' }}
                        />
                        <button style={{ background: 'transparent', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer' }}><Smile size={20} /></button>
                    </div>
                    <button
                        onClick={handleSendMessage}
                        style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', border: 'none', cursor: 'pointer', transition: 'transform 0.2s' }}
                        onMouseDown={e => e.currentTarget.style.transform = 'scale(0.95)'}
                        onMouseUp={e => e.currentTarget.style.transform = 'scale(1)'}
                    >
                        <Send size={18} style={{ marginLeft: '2px' }} />
                    </button>
                </div>

            </div>

            <style>{`
        .chat-item:hover { background: rgba(0,0,0,0.02) !important; }
        .icon-btn { background: transparent; border: none; color: var(--color-text-light); padding: 0.5rem; border-radius: 50%; cursor: pointer; transition: all 0.2s; display: flex; align-items: center; justify-content: center; }
        .icon-btn:hover { background: var(--color-background); color: var(--color-text); }
        @media (prefers-color-scheme: dark) {
          .chat-item:hover { background: rgba(255,255,255,0.02) !important; }
        }
      `}</style>
        </PageTransition>
    );
}
