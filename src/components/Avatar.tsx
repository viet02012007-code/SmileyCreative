import React from 'react';

// Palette dùng chung cho Emoji Avatar (đồng bộ với Settings)
export const avatarIcons = [
    { bg: '#FFE4D6', emoji: '😊', color: '#ff7d0d' },
    { bg: '#E1E9FF', emoji: '🐾', color: '#4F46E5' },
    { bg: '#D1FAE5', emoji: '🐰', color: '#10B981' },
    { bg: '#EDE9FE', emoji: '🌱', color: '#8B5CF6' },
    { bg: '#FCE7F3', emoji: '🌸', color: '#EC4899' },
    { bg: '#FEF3C7', emoji: '🌻', color: '#F59E0B' },
    { bg: '#CCFBF1', emoji: '🤖', color: '#14B8A6' },
    { bg: '#E0E7FF', emoji: '👩‍💻', color: '#6366F1' },
];

export interface AvatarProps {
    src?: string | null;
    name?: string | null;
    size?: number;
    style?: React.CSSProperties;
    className?: string;
}

export default function Avatar({ src, name, size = 40, style, className }: AvatarProps) {
    const isImage = typeof src === 'string' && (src.startsWith('http') || src.startsWith('data:'));
    
    // Nếu là URL hình ảnh thực sự
    if (isImage) {
        return (
            <img 
                src={src} 
                alt={name || 'Avatar'} 
                style={{ width: size, height: size, borderRadius: '50%', objectFit: 'cover', ...style }} 
                className={className} 
            />
        );
    }

    // Nếu là emoji hoặc không có gì
    const emojiObj = typeof src === 'string' ? avatarIcons.find(a => a.emoji === src) : null;
    const bgColor = emojiObj ? emojiObj.bg : '#E5E7EB';
    
    // Nội dung hiển thị (Emoji hoặc Chữ cái đầu tên)
    let content = '?';
    let isEmoji = false;
    
    if (typeof src === 'string' && src.trim() !== '') {
        content = src;
        isEmoji = true;
    } else if (typeof name === 'string' && name.trim() !== '') {
        content = name.charAt(0).toUpperCase();
    }

    return (
        <div 
            style={{
                width: size, 
                height: size, 
                borderRadius: '50%', 
                backgroundColor: bgColor, 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center', 
                fontWeight: 'bold',
                color: 'var(--color-text)',
                fontSize: isEmoji ? `${size * 0.6}px` : `${size * 0.4}px`,
                flexShrink: 0,
                ...style
            }} 
            className={className}
            title={name || undefined}
        >
            {content}
        </div>
    );
}
