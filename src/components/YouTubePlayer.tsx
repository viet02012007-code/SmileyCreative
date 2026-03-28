import React, { useState } from 'react';
import { Music, X, Minimize2, Maximize2, Play } from 'lucide-react';
import toast from 'react-hot-toast';

export default function YouTubePlayer() {
    const [isOpen, setIsOpen] = useState(false);
    const [isMinimized, setIsMinimized] = useState(false);
    const [videoUrl, setVideoUrl] = useState('');
    const [videoId, setVideoId] = useState<string | null>(null);

    const [videoTitle, setVideoTitle] = useState<string>('');

    // Extract Video ID from various YouTube URL formats
    const extractVideoId = (url: string) => {
        const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
        const match = url.match(regExp);
        return (match && match[2].length === 11) ? match[2] : null;
    };

    const fetchVideoTitle = async (id: string) => {
        try {
            const response = await fetch(`https://noembed.com/embed?url=https://www.youtube.com/watch?v=${id}`);
            const data = await response.json();
            if (data.title) {
                setVideoTitle(data.title);
            } else {
                setVideoTitle('Nhạc nền');
            }
        } catch (error) {
            console.error("Error fetching video title:", error);
            setVideoTitle('Nhạc nền');
        }
    };

    const handlePlay = (e: React.FormEvent) => {
        e.preventDefault();
        const id = extractVideoId(videoUrl);
        const finalId = id || (videoUrl.length === 11 ? videoUrl : null);

        if (finalId) {
            setVideoId(finalId);
            setIsMinimized(false);
            setVideoUrl(''); // clear input after playing
            fetchVideoTitle(finalId);
        } else {
            toast.error('Vui lòng nhập link hoặc ID YouTube hợp lệ!');
        }
    };

    const handleClose = () => {
        setVideoId(null);
        setVideoTitle('');
        setIsOpen(false);
    };

    if (!isOpen && !videoId) {
        return (
            <button
                className="btn btn-primary animate-fade-in"
                onClick={() => setIsOpen(true)}
                style={{
                    position: 'fixed',
                    bottom: '2rem',
                    right: '2rem',
                    borderRadius: '50%',
                    width: '60px',
                    height: '60px',
                    padding: 0,
                    zIndex: 1000,
                    boxShadow: '0 10px 25px rgba(79, 70, 229, 0.4)'
                }}
                title="Mở nhạc nền (YouTube)"
            >
                <Music size={24} />
            </button>
        );
    }

    return (
        <div className={`glass-panel youtube-player-widget ${isMinimized ? 'minimized' : ''} animate-fade-in`} style={{
            position: 'fixed',
            bottom: '2rem',
            right: '2rem',
            width: isMinimized ? '250px' : '350px',
            zIndex: 1000,
            overflow: 'hidden',
            transition: 'all 0.3s ease'
        }}>
            {/* Header / Controls */}
            <div style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '0.75rem 1rem',
                borderBottom: '1px solid var(--glass-border)',
                background: 'rgba(0,0,0,0.05)'
            }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600 }}>
                    <Music size={18} className="text-primary" />
                    <span>Nhạc Nền</span>
                </div>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                    {videoId && (
                        <button onClick={() => setIsMinimized(!isMinimized)} style={{ color: 'var(--color-text-light)' }} title={isMinimized ? "Mở rộng" : "Thu nhỏ"}>
                            {isMinimized ? <Maximize2 size={16} /> : <Minimize2 size={16} />}
                        </button>
                    )}
                    <button onClick={handleClose} style={{ color: 'var(--color-danger)' }} title="Đóng">
                        <X size={16} />
                    </button>
                </div>
            </div>

            {/* Content Area */}
            <div style={{
                padding: isMinimized ? '0' : '1rem',
                height: isMinimized ? '0' : 'auto',
                overflow: 'hidden',
                opacity: isMinimized ? 0 : 1,
                position: isMinimized ? 'absolute' : 'relative',
                pointerEvents: isMinimized ? 'none' : 'auto',
            }}>
                {!videoId ? (
                    <form onSubmit={handlePlay} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                        <p style={{ fontSize: '0.875rem', color: 'var(--color-text-light)' }}>
                            Nhập link video YouTube để phát nhạc nền.
                        </p>
                        <input
                            type="text"
                            value={videoUrl}
                            onChange={(e) => setVideoUrl(e.target.value)}
                            placeholder="https://www.youtube.com/watch?v=..."
                            style={{
                                width: '100%',
                                padding: '0.75rem',
                                borderRadius: 'var(--border-radius-sm)',
                                border: '1px solid var(--color-border)',
                                background: 'var(--color-background)',
                                color: 'var(--color-text)',
                                outline: 'none',
                                fontSize: '0.875rem'
                            }}
                        />
                        <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                            <Play size={18} /> Phát Nhạc
                        </button>
                    </form>
                ) : (
                    <div style={{ borderRadius: 'var(--border-radius-sm)', overflow: 'hidden' }}>
                        <iframe
                            width="100%"
                            height="200"
                            src={`https://www.youtube.com/embed/${videoId}?autoplay=1`}
                            title="YouTube video player"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                            allowFullScreen
                            style={{ display: 'block' }}
                        ></iframe>
                    </div>
                )}
            </div>

            {/* Minimized View Info */}
            {isMinimized && videoId && (
                <div style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: 'var(--color-success)', animation: 'pulse 2s infinite', flexShrink: 0 }}></div>
                    <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {videoTitle ? videoTitle : 'Đang phát nhạc...'}
                    </span>
                </div>
            )}

            <style>{`
                @keyframes pulse {
                    0% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
                    70% { transform: scale(1); box-shadow: 0 0 0 6px rgba(16, 185, 129, 0); }
                    100% { transform: scale(0.95); box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
                }
            `}</style>
        </div>
    );
}
