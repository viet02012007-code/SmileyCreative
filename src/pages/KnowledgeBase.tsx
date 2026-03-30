import { useState } from 'react';
import { ThumbsUp, MessageSquare, Share2, Image as ImageIcon, Video, Link as LinkIcon, Send, Smile, X } from 'lucide-react';
import PageTransition from '../components/PageTransition';
import Avatar from '../components/Avatar';

type Comment = {
    id: number;
    author: string;
    avatar: string;
    content: string;
    time: string;
    image?: string;
    video?: string;
    sticker?: string;
    replies?: Comment[];
};

type Post = {
    id: number;
    author: string;
    role: string;
    avatar: string;
    time: string;
    content: string;
    likes: number;
    comments: number;
    image?: string;
    video?: string;
    link?: string;
    isLiked?: boolean;
    commentList?: Comment[];
    showComments?: boolean;
};

const mockPosts: Post[] = [
    {
        id: 1,
        author: 'Trần Thị B',
        role: 'Trưởng phòng Nhân sự',
        avatar: 'https://i.pravatar.cc/150?img=5',
        time: '2 giờ trước',
        content: 'Chào mừng các bạn nhân viên mới gia nhập bộ phận Kinh Doanh. Tuần sau chúng ta sẽ có buổi training onboarding về sản phẩm mới nhé \n\nMọi người nhớ chuẩn bị câu hỏi.',
        likes: 24,
        comments: 5,
        isLiked: false,
        commentList: [
            { id: 1, author: 'Lê Văn C', avatar: 'https://i.pravatar.cc/150?img=12', content: 'Dạ vâng ạ.', time: '1 giờ trước' }
        ],
        showComments: false
    },
    {
        id: 2,
        author: 'Nguyễn Hoàng Đức Việt',
        role: 'Quản trị viên',
        avatar: 'https://i.pravatar.cc/150?img=11',
        time: 'Hôm qua lúc 15:30',
        content: 'Review sách hay tuần này: "Clean Code" của Robert C. Martin.\n\nĐây là cuốn sách gối đầu giường mà mọi lập trình viên đều nên đọc. Ai cần mượn thì ghé bàn mình nhé.',
        image: 'https://images.unsplash.com/photo-1555066931-4365d14bab8c?auto=format&fit=crop&q=80&w=800',
        likes: 45,
        comments: 12,
        isLiked: true,
        showComments: false
    },
];

export default function KnowledgeBase() {
    const [activeTab, setActiveTab] = useState('all');
    const [posts, setPosts] = useState(mockPosts);
    const [replyingTo, setReplyingTo] = useState<{ postId: number, commentId: number, author: string } | null>(null);
    const [commentAttachments, setCommentAttachments] = useState<{ [postId: number]: { type: 'image' | 'video' | 'sticker', url: string } }>({});

    // Create post states
    const [content, setContent] = useState('');
    const [attachment, setAttachment] = useState<{ type: 'image' | 'video' | 'link', url: string } | null>(null);

    const handleAttachment = (type: 'image' | 'video' | 'link') => {
        let msg = '';
        if (type === 'image') msg = 'Nhập đường dẫn URL Hình ảnh (VD: https://images.unsplash.com/...)';
        if (type === 'video') msg = 'Nhập đường dẫn URL Video (phải là link .mp4 trực tiếp)';
        if (type === 'link') msg = 'Nhập URL Link tài liệu chia sẻ';

        const url = prompt(msg);
        if (url) {
            setAttachment({ type, url });
        }
    };

    const handlePost = () => {
        if (!content.trim() && !attachment) return; // Prevent empty posts

        const newPost = {
            id: Date.now(),
            author: 'Nguyễn Hoàng Đức Việt',
            role: 'Quản trị viên',
            avatar: 'https://i.pravatar.cc/150?img=11',
            time: 'Vừa xong',
            content: content,
            likes: 0,
            comments: 0,
            ...(attachment?.type === 'image' && { image: attachment.url }),
            ...(attachment?.type === 'video' && { video: attachment.url }),
            ...(attachment?.type === 'link' && { link: attachment.url }),
            isLiked: false,
            commentList: [],
            showComments: false
        };

        setPosts([newPost, ...posts]);
        setContent('');
        setAttachment(null);
    };

    const handleToggleLike = (postId: number) => {
        setPosts(posts.map(post => {
            if (post.id === postId) {
                return {
                    ...post,
                    isLiked: !post.isLiked,
                    likes: post.isLiked ? post.likes - 1 : post.likes + 1
                };
            }
            return post;
        }));
    };

    const handleToggleComments = (postId: number) => {
        setPosts(posts.map(post => post.id === postId ? { ...post, showComments: !post.showComments } : post));
    };

    const handleAddComment = (postId: number, commentStr: string, parentCommentId?: number) => {
        const attachment = commentAttachments[postId];
        if (!commentStr.trim() && !attachment) return;
        setPosts(posts.map(post => {
            if (post.id === postId) {
                const newComment: Comment = {
                    id: Date.now(),
                    author: 'Nguyễn Hoàng Đức Việt',
                    avatar: 'https://i.pravatar.cc/150?img=11',
                    content: commentStr,
                    time: 'Vừa xong',
                    ...(attachment?.type === 'image' && { image: attachment.url }),
                    ...(attachment?.type === 'video' && { video: attachment.url }),
                    ...(attachment?.type === 'sticker' && { sticker: attachment.url })
                };

                if (parentCommentId) {
                    return {
                        ...post,
                        comments: post.comments + 1,
                        commentList: post.commentList?.map(c =>
                            c.id === parentCommentId
                                ? { ...c, replies: [...(c.replies || []), newComment] }
                                : c
                        )
                    };
                }

                return {
                    ...post,
                    comments: post.comments + 1,
                    commentList: [...(post.commentList || []), newComment]
                };
            }
            return post;
        }));

        setReplyingTo(null);
        setCommentAttachments(prev => {
            const next = { ...prev };
            delete next[postId];
            return next;
        });
    };

    const handleCommentAttachment = (postId: number, type: 'image' | 'video' | 'sticker') => {
        let msg = '';
        if (type === 'image') msg = 'Nhập URL Hình ảnh cho bình luận:';
        if (type === 'video') msg = 'Nhập URL Video .mp4 cho bình luận:';
        if (type === 'sticker') msg = 'Nhập URL Sticker/Emoji cho bình luận (VD link ảnh GIF):';

        const url = prompt(msg);
        if (url) {
            setCommentAttachments(prev => ({ ...prev, [postId]: { type, url } }));
        }
    };

    return (
        <PageTransition style={{ display: 'flex', gap: '2rem', height: '100%' }}>

            {/* Main Feed */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem', maxWidth: '800px', margin: '0 auto', overflowY: 'auto', paddingRight: '0.5rem' }}>

                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                        <h2 style={{ fontSize: '1.75rem', fontWeight: 700 }}>Nhật ký chia sẻ & Học tập</h2>
                    </div>
                </div>

                {/* Create Post */}
                <div className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <Avatar src="https://i.pravatar.cc/150?img=11" name="Me" size={40} />
                        <textarea
                            value={content}
                            onChange={(e) => setContent(e.target.value)}
                            placeholder="Bạn muốn chia sẻ điều gì với công ty hôm nay?"
                            style={{ flex: 1, border: 'none', background: 'var(--color-background)', padding: '1rem', borderRadius: 'var(--border-radius)', resize: 'none', minHeight: '80px', outline: 'none', color: 'var(--color-text)', fontFamily: 'inherit', fontSize: '0.95rem' }}
                        />
                    </div>

                    {/* Attachment Preview Preview */}
                    {attachment && (
                        <div style={{ position: 'relative', display: 'inline-block', padding: '0.5rem', background: 'var(--color-background)', borderRadius: '8px', alignSelf: 'flex-start', marginLeft: '3.5rem' }}>
                            <div style={{ fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-primary)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                {attachment.type === 'image' && <ImageIcon size={14} />}
                                {attachment.type === 'video' && <Video size={14} />}
                                {attachment.type === 'link' && <LinkIcon size={14} />}
                                Đã đính kèm: {attachment.type === 'image' ? 'Hình ảnh' : attachment.type === 'video' ? 'Video' : 'Tài liệu'}
                            </div>
                            <button onClick={() => setAttachment(null)} style={{ color: 'var(--color-danger)', fontSize: '0.8rem', background: 'none', border: 'none', cursor: 'pointer', marginTop: '4px' }}>Hủy đính kèm</button>
                        </div>
                    )}

                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', gap: '0.5rem' }}>
                            <button onClick={() => handleAttachment('image')} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: attachment?.type === 'image' ? 'rgba(79, 70, 229, 0.1)' : 'transparent', borderColor: attachment?.type === 'image' ? 'var(--color-primary)' : 'var(--color-border)' }}><ImageIcon size={16} /> Ảnh</button>
                            <button onClick={() => handleAttachment('video')} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: attachment?.type === 'video' ? 'rgba(79, 70, 229, 0.1)' : 'transparent', borderColor: attachment?.type === 'video' ? 'var(--color-primary)' : 'var(--color-border)' }}><Video size={16} /> Video</button>
                            <button onClick={() => handleAttachment('link')} className="btn btn-secondary" style={{ padding: '0.4rem 0.75rem', fontSize: '0.85rem', background: attachment?.type === 'link' ? 'rgba(79, 70, 229, 0.1)' : 'transparent', borderColor: attachment?.type === 'link' ? 'var(--color-primary)' : 'var(--color-border)' }}><LinkIcon size={16} /> Link tài liệu</button>
                        </div>
                        <button onClick={handlePost} className="btn btn-primary" style={{ padding: '0.4rem 1.5rem', opacity: (!content.trim() && !attachment) ? 0.5 : 1, cursor: (!content.trim() && !attachment) ? 'not-allowed' : 'pointer' }}>
                            Đăng <Send size={16} style={{ marginLeft: '4px' }} />
                        </button>
                    </div>
                </div>

                {/* Filters */}
                <div style={{ display: 'flex', gap: '1rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>
                    {['all', 'learning', 'announcement', 'book_review'].map(tab => (
                        <button key={tab}
                            onClick={() => setActiveTab(tab)}
                            style={{
                                background: 'none', border: 'none', padding: '0.5rem 1rem', fontSize: '0.95rem', fontWeight: activeTab === tab ? 600 : 500,
                                color: activeTab === tab ? 'var(--color-primary)' : 'var(--color-text-light)',
                                borderBottom: activeTab === tab ? '2px solid var(--color-primary)' : '2px solid transparent',
                                marginBottom: '-0.5rem', transition: 'all 0.2s'
                            }}
                        >
                            {tab === 'all' ? 'Tất cả' : tab === 'learning' ? 'Tài liệu học tập' : tab === 'announcement' ? 'Thông báo nội bộ' : 'Review Sách'}
                        </button>
                    ))}
                </div>

                {/* Feed List */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                    {posts.filter(p => {
                        if (activeTab === 'all') return true;
                        if (activeTab === 'learning') return p.content?.includes('học tập') || p.link;
                        if (activeTab === 'announcement') return p.author === 'Trần Thị B' || p.content?.includes('thông báo');
                        if (activeTab === 'book_review') return p.content?.toLowerCase().includes('review') || p.content?.toLowerCase().includes('sách');
                        return true;
                    }).map(post => (
                        <div key={post.id} className="glass-panel" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.3s' }}>
                            {/* Header */}
                            <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                                <Avatar src={post.avatar} name={post.author} size={48} />
                                <div>
                                    <div style={{ fontWeight: 600 }}>{post.author}</div>
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)' }}>{post.role} • {post.time}</div>
                                </div>
                            </div>

                            {/* Content */}
                            <div style={{ fontSize: '1rem', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>
                                {post.content}
                            </div>

                            {/* Dynamic Attachments */}
                            {('image' in post) && typeof post.image === 'string' && (
                                <div style={{ width: '100%', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', marginTop: '0.5rem', background: '#000' }}>
                                    <img src={post.image} alt="Post content" loading="lazy" style={{ width: '100%', maxHeight: '450px', objectFit: 'contain' }} />
                                </div>
                            )}

                            {('video' in post) && typeof post.video === 'string' && (
                                <div style={{ width: '100%', borderRadius: 'var(--border-radius-sm)', overflow: 'hidden', marginTop: '0.5rem', background: '#000' }}>
                                    <video controls style={{ width: '100%', maxHeight: '450px', outline: 'none' }}>
                                        <source src={post.video} type="video/mp4" />
                                        Trình duyệt của bạn không hỗ trợ thẻ video.
                                    </video>
                                </div>
                            )}

                            {('link' in post) && typeof post.link === 'string' && (
                                <a href={post.link} target="_blank" rel="noopener noreferrer" style={{ display: 'flex', alignItems: 'center', gap: '1rem', padding: '1rem', background: 'var(--color-background)', border: '1px solid var(--color-border)', borderRadius: 'var(--border-radius-sm)', textDecoration: 'none', color: 'inherit', marginTop: '0.5rem', transition: 'all 0.2s' }} className="hover-bg">
                                    <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'rgba(79, 70, 229, 0.1)', color: 'var(--color-primary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <LinkIcon size={20} />
                                    </div>
                                    <div style={{ flex: 1, overflow: 'hidden' }}>
                                        <div style={{ fontWeight: 600, marginBottom: '0.2rem' }}>Tài liệu đính kèm</div>
                                        <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{post.link}</div>
                                    </div>
                                </a>
                            )}

                            {/* Stats */}
                            <div style={{ display: 'flex', justifyContent: 'space-between', color: 'var(--color-text-light)', fontSize: '0.85rem', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.75rem', marginTop: '0.5rem' }}>
                                <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                    <div style={{ background: 'var(--color-primary)', borderRadius: '50%', width: '18px', height: '18px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <ThumbsUp size={10} color="white" fill="white" />
                                    </div>
                                    {post.likes}
                                </span>
                                <span style={{ cursor: 'pointer' }} className="hover-text-primary" onClick={() => handleToggleComments(post.id)}>
                                    {post.comments} bình luận
                                </span>
                            </div>

                            {/* Actions */}
                            <div style={{ display: 'flex', gap: '0.25rem', paddingTop: '0.25rem' }}>
                                <button onClick={() => handleToggleLike(post.id)} className="post-action-btn fb-action-btn" style={{ color: post.isLiked ? 'var(--color-primary)' : 'var(--color-text-light)' }}>
                                    <ThumbsUp size={20} fill={post.isLiked ? 'currentColor' : 'none'} /> Thích
                                </button>
                                <button onClick={() => handleToggleComments(post.id)} className="post-action-btn fb-action-btn" style={{ color: 'var(--color-text-light)' }}>
                                    <MessageSquare size={20} /> Bình luận
                                </button>
                                <button className="post-action-btn fb-action-btn"><Share2 size={20} /> Chia sẻ</button>
                            </div>

                            {/* Comment Section (Hidden by Default) */}
                            {post.showComments && (
                                <div style={{ borderTop: '1px solid var(--color-border)', paddingTop: '1rem', marginTop: '0.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', animation: 'fadeIn 0.2s' }}>
                                    {/* Existing Comments and Replies */}
                                    {post.commentList?.map(comment => (
                                        <div key={comment.id} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                                            {/* Parent Comment */}
                                            <div style={{ display: 'flex', gap: '0.75rem' }}>
                                                <Avatar src={comment.avatar} name={comment.author} size={36} />
                                                <div style={{ flex: 1 }}>
                                                    <div style={{ background: 'rgba(128, 128, 128, 0.1)', padding: '0.5rem 0.85rem', borderRadius: '1.25rem', display: 'inline-block' }}>
                                                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-heading)' }}>{comment.author}</div>
                                                        {comment.content && <div style={{ fontSize: '0.95rem', marginTop: '0.1rem' }}>{comment.content}</div>}
                                                    </div>

                                                    {/* Parent Comment Media */}
                                                    {comment.image && <img src={comment.image} alt="Biểu tượng" style={{ maxWidth: '200px', borderRadius: '0.5rem', display: 'block', marginTop: '0.25rem' }} />}
                                                    {comment.video && <video controls src={comment.video} style={{ maxWidth: '250px', borderRadius: '0.5rem', display: 'block', marginTop: '0.25rem', outline: 'none' }} />}
                                                    {comment.sticker && <img src={comment.sticker} alt="Sticker" style={{ maxWidth: '100px', display: 'block', marginTop: '0.25rem' }} />}

                                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', marginTop: '0.25rem', paddingLeft: '0.75rem', display: 'flex', gap: '1rem', fontWeight: 500 }}>
                                                        <span style={{ cursor: 'pointer' }} className="hover-text-primary">Thích</span>
                                                        <span style={{ cursor: 'pointer' }} className="hover-text-primary" onClick={() => setReplyingTo({ postId: post.id, commentId: comment.id, author: comment.author })}>Phản hồi</span>
                                                        <span style={{ fontWeight: 400 }}>{comment.time}</span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Child Replies */}
                                            {comment.replies && comment.replies.length > 0 && (
                                                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginLeft: '2.5rem' }}>
                                                    {comment.replies.map(reply => (
                                                        <div key={reply.id} style={{ display: 'flex', gap: '0.75rem' }}>
                                                            <Avatar src={reply.avatar} name={reply.author} size={28} />
                                                            <div style={{ flex: 1 }}>
                                                                <div style={{ background: 'rgba(128, 128, 128, 0.1)', padding: '0.4rem 0.75rem', borderRadius: '1.25rem', display: 'inline-block' }}>
                                                                    <div style={{ fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-heading)' }}>{reply.author}</div>
                                                                    {reply.content && <div style={{ fontSize: '0.85rem', marginTop: '0.1rem' }}>{reply.content}</div>}
                                                                </div>

                                                                {/* Child Reply Media */}
                                                                {reply.image && <img src={reply.image} alt="Biểu tượng" style={{ maxWidth: '150px', borderRadius: '0.5rem', display: 'block', marginTop: '0.25rem' }} />}
                                                                {reply.video && <video controls src={reply.video} style={{ maxWidth: '200px', borderRadius: '0.5rem', display: 'block', marginTop: '0.25rem', outline: 'none' }} />}
                                                                {reply.sticker && <img src={reply.sticker} alt="Sticker" style={{ maxWidth: '80px', display: 'block', marginTop: '0.25rem' }} />}

                                                                <div style={{ fontSize: '0.7rem', color: 'var(--color-text-light)', marginTop: '0.2rem', paddingLeft: '0.75rem', display: 'flex', gap: '1rem', fontWeight: 500 }}>
                                                                    <span style={{ cursor: 'pointer' }} className="hover-text-primary">Thích</span>
                                                                    <span style={{ cursor: 'pointer' }} className="hover-text-primary" onClick={() => setReplyingTo({ postId: post.id, commentId: comment.id, author: reply.author })}>Phản hồi</span>
                                                                    <span style={{ fontWeight: 400 }}>{reply.time}</span>
                                                                </div>
                                                            </div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    ))}

                                    {/* Comment form */}
                                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                                        <Avatar src="https://i.pravatar.cc/150?img=11" name="Me" size={32} />
                                        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                                            {replyingTo?.postId === post.id && (
                                                <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', display: 'flex', justifyContent: 'space-between', paddingLeft: '0.5rem' }}>
                                                    <span>Đang trả lời <b>{replyingTo.author}</b></span>
                                                    <span style={{ cursor: 'pointer', color: 'var(--color-text-light)' }} onClick={() => setReplyingTo(null)}>Hủy</span>
                                                </div>
                                            )}
                                            {/* Preview Comment Attachment */}
                                            {commentAttachments[post.id] && (
                                                <div style={{ alignSelf: 'flex-start', marginLeft: '0.5rem', position: 'relative', marginTop: '-0.25rem', marginBottom: '0.25rem' }}>
                                                    {commentAttachments[post.id].type === 'image' && <img src={commentAttachments[post.id].url} alt="preview" style={{ maxHeight: '100px', borderRadius: '8px' }} />}
                                                    {commentAttachments[post.id].type === 'video' && <video src={commentAttachments[post.id].url} style={{ maxHeight: '100px', borderRadius: '8px' }} />}
                                                    {commentAttachments[post.id].type === 'sticker' && <img src={commentAttachments[post.id].url} alt="sticker" style={{ maxHeight: '60px' }} />}
                                                    <button
                                                        onClick={() => {
                                                            const newAttachments = { ...commentAttachments };
                                                            delete newAttachments[post.id];
                                                            setCommentAttachments(newAttachments);
                                                        }}
                                                        style={{ position: 'absolute', top: '-8px', right: '-8px', background: 'var(--color-background)', borderRadius: '50%', border: '1px solid var(--color-border)', width: '20px', height: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--color-text)' }}
                                                    >
                                                        <X size={12} />
                                                    </button>
                                                </div>
                                            )}

                                            <div style={{ display: 'flex', background: 'var(--color-background)', borderRadius: '1.5rem', padding: '0.2rem', paddingLeft: '1rem', border: '1px solid var(--color-border)', alignItems: 'center' }}>
                                                <input
                                                    type="text"
                                                    placeholder={replyingTo?.postId === post.id ? "Viết phản hồi..." : "Viết bình luận..."}
                                                    style={{ flex: 1, border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', fontSize: '0.9rem', minWidth: '0' }}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') {
                                                            handleAddComment(post.id, e.currentTarget.value, replyingTo?.postId === post.id ? replyingTo.commentId : undefined);
                                                            e.currentTarget.value = '';
                                                        }
                                                    }}
                                                />
                                                <div style={{ display: 'flex', gap: '0.25rem', paddingRight: '0.5rem', alignItems: 'center' }}>
                                                    <button onClick={() => handleCommentAttachment(post.id, 'image')} style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '50%' }} className="hover-bg" title="Đính kèm ảnh"><ImageIcon size={18} /></button>
                                                    <button onClick={() => handleCommentAttachment(post.id, 'video')} style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '50%' }} className="hover-bg" title="Đính kèm video"><Video size={18} /></button>
                                                    <button onClick={() => handleCommentAttachment(post.id, 'sticker')} style={{ background: 'none', border: 'none', color: 'var(--color-text-light)', cursor: 'pointer', display: 'flex', padding: '4px', borderRadius: '50%' }} className="hover-bg" title="Gửi nhãn dán"><Smile size={18} /></button>
                                                </div>
                                                <button
                                                    onClick={(e) => {
                                                        const div = e.currentTarget.previousElementSibling as HTMLDivElement;
                                                        const input = div.previousElementSibling as HTMLInputElement;
                                                        handleAddComment(post.id, input.value, replyingTo?.postId === post.id ? replyingTo.commentId : undefined);
                                                        input.value = '';
                                                    }}
                                                    style={{ background: 'var(--color-primary)', color: 'white', border: 'none', borderRadius: '50%', width: '32px', height: '32px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                                                >
                                                    <Send size={14} style={{ marginLeft: '-2px' }} />
                                                </button>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            </div>

            {/* Right Sidebar */}
            <div style={{ width: '300px', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Chủ đề nổi bật</h3>
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                        {['#ReactJS', '#Lideraship', '#MarketingTips', '#TàiLiệuHR', '#SáchHay'].map(tag => (
                            <span key={tag} style={{ background: 'var(--color-primary-hover)', color: 'white', padding: '0.2rem 0.75rem', borderRadius: '1rem', fontSize: '0.8rem', cursor: 'pointer' }}>
                                {tag}
                            </span>
                        ))}
                    </div>
                </div>

                <div className="glass-panel" style={{ padding: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: '1rem' }}>Nổi bật trong tháng</h3>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                        {[1, 2, 3].map(i => (
                            <div key={i} style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '8px', background: 'var(--color-background)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', color: 'var(--color-primary)' }}>
                                    #{i}
                                </div>
                                <div>
                                    <div style={{ fontWeight: 500, fontSize: '0.9rem' }}>Báo cáo thị trường...</div>
                                    <div style={{ fontSize: '0.75rem', color: 'var(--color-text-light)' }}>Bởi Nguyễn Hoàng Đức Việt</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>

            <style>{`
        .post-action-btn {
          flex: 1; display: flex; align-items: center; justify-content: center; gap: 0.5rem;
          padding: 0.5rem; border: none; background: transparent; color: var(--color-text-light);
          border-radius: var(--border-radius-sm); font-weight: 600; transition: all 0.2s;
          cursor: pointer;
        }
        .post-action-btn:hover { background: rgba(128, 128, 128, 0.1); }
        .hover-text-primary:hover { color: var(--color-primary) !important; text-decoration: underline; }
      `}</style>
        </PageTransition>
    );
}
