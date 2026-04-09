import { Outlet, useLocation } from 'react-router-dom';
import { useState } from 'react';
import Sidebar from '../components/Sidebar';
import Header from '../components/Header';
import YouTubePlayer from '../components/YouTubePlayer';
import CreateTaskModal from '../components/CreateTaskModal';
import DailyTaskPrompt from '../components/DailyTaskPrompt';
import CaroGame from '../components/CaroGame';
import { Plus } from 'lucide-react';

export default function MainLayout() {
    const location = useLocation();
    const [isCreateTaskOpen, setIsCreateTaskOpen] = useState(false);

    return (
        <div className="layout-container">
            <Sidebar />
            <Header />

            <main className="main-content animate-fade-in" key={location.pathname} style={{
                marginTop: 'calc(var(--header-height) + 2rem)',
                marginLeft: 'calc(var(--sidebar-width) + 2rem)',
                marginRight: '1rem',
                marginBottom: '1rem',
                padding: '2rem',
                minHeight: 'calc(100vh - var(--header-height) - 3rem)',
                borderRadius: 'var(--border-radius)',
                background: 'var(--glass-bg)',
                backdropFilter: 'var(--glass-blur)',
                WebkitBackdropFilter: 'var(--glass-blur)',
                border: '1px solid var(--glass-border)',
                boxShadow: 'var(--glass-shadow)',
                position: 'relative',
                zIndex: 10,
                overflow: 'hidden'
            }}>
                <Outlet />
            </main>
            <YouTubePlayer />
            <CaroGame />

            {/* Floating Create Task Button */}
            <button
                onClick={() => setIsCreateTaskOpen(true)}
                style={{
                    position: 'fixed',
                    right: 0,
                    top: '30%',
                    transform: 'translateY(-50%)',
                    backgroundColor: '#F59E0B',
                    color: 'white',
                    border: 'none',
                    padding: '0.75rem 0.5rem',
                    borderTopLeftRadius: '0.5rem',
                    borderBottomLeftRadius: '0.5rem',
                    cursor: 'pointer',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    boxShadow: '-4px 0 15px rgba(245, 158, 11, 0.3)',
                    zIndex: 50
                }}
            >
                <Plus size={16} />
                <span style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)', fontWeight: 600, fontSize: '0.85rem', letterSpacing: '0.5px' }}>
                    Công việc
                </span>
            </button>

            <CreateTaskModal
                isOpen={isCreateTaskOpen}
                onClose={() => setIsCreateTaskOpen(false)}
            />

            <DailyTaskPrompt />
        </div>
    );
}
