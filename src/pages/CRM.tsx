import { useState, useEffect } from 'react';
import { Search, Plus, Filter, Phone, Mail, MapPin, Star, User, X, Edit, Trash2, Calendar, FileText, Download, AlertTriangle } from 'lucide-react';
import toast from 'react-hot-toast';
import { db, storage } from '../config/firebase';
import { collection, query, getDocs, addDoc, updateDoc, doc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import PageTransition from '../components/PageTransition';

const COLORS = ['var(--color-primary)', 'var(--color-success)', 'var(--color-warning)', 'var(--color-secondary)', '#8b5cf6', '#ec4899', '#14b8a6'];

export default function CRM() {
    const [clients, setClients] = useState<any[]>([]);
    const [isLoading, setIsLoading] = useState(true);

    // Fetch from Firebase
    useEffect(() => {
        const fetchClients = async () => {
            try {
                const q = query(collection(db, 'crm_clients'));
                const querySnapshot = await getDocs(q);
                const fetchedClients = querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setClients(fetchedClients);
            } catch (error) {
                console.error("Lỗi khi tải khách hàng CRM:", error);
                toast.error("Không thể tải danh sách khách hàng");
            } finally {
                setIsLoading(false);
            }
        };
        fetchClients();
    }, []);
    const [searchTerm, setSearchTerm] = useState('');
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [viewingClient, setViewingClient] = useState<any>(null);
    const [editingClient, setEditingClient] = useState<any>(null);
    const [formData, setFormData] = useState({
        name: '', contact: '', role: '', email: '', phone: '', address: '', status: 'Khách hàng Mới', startDate: '', endDate: '', contractFileUrl: ''
    });
    const [contractFile, setContractFile] = useState<File | null>(null);
    const [isUploading, setIsUploading] = useState(false);

    const handleSave = async () => {
        if (!formData.name || !formData.contact) {
            toast.error("Vui lòng nhập tên công ty và người liên hệ");
            return;
        }
        
        toast.loading('Đang lưu thông tin khách hàng...', { id: 'save-crm' });
        setIsUploading(true);
        
        try {
            let finalFileUrl = formData.contractFileUrl;

            // Nếu user có đính kèm file thì up lên Firebase Storage trước
            if (contractFile) {
                toast.loading('Đang tải tệp đính kèm lên đám mây...', { id: 'save-crm' });
                const fileRef = ref(storage, `crm_contracts/${new Date().getTime()}_${contractFile.name}`);
                await uploadBytes(fileRef, contractFile);
                finalFileUrl = await getDownloadURL(fileRef);
            }

            const dataToSave = { ...formData, contractFileUrl: finalFileUrl };

            if (editingClient) {
                const clientRef = doc(db, 'crm_clients', editingClient.id);
                await updateDoc(clientRef, dataToSave);
                setClients(clients.map((c: any) => c.id === editingClient.id ? { ...editingClient, ...dataToSave } : c));
                toast.success('Cập nhật thành công!', { id: 'save-crm' });
            } else {
                const newClientData = {
                    ...dataToSave,
                    bg: COLORS[Math.floor(Math.random() * COLORS.length)],
                    createdAt: new Date().toISOString()
                };
                const docRef = await addDoc(collection(db, 'crm_clients'), newClientData);
                setClients([{ id: docRef.id, ...newClientData }, ...clients]);
                toast.success('Thêm khách hàng mới thành công!', { id: 'save-crm' });
            }
            closeModal();
        } catch (error: any) {
            console.error(error);
            toast.error("Lỗi khi lưu khách hàng: " + error.message, { id: 'save-crm' });
        } finally {
            setIsUploading(false);
        }
    };

    const handleDelete = async (id: string) => {
        if (confirm("Bạn có chắc chắn muốn xóa khách hàng này?")) {
            toast.loading('Đang xóa khách hàng...', { id: 'delete-crm' });
            try {
                await deleteDoc(doc(db, 'crm_clients', id));
                setClients(clients.filter((c: any) => c.id !== id));
                toast.success('Đã xóa khách hàng thành công!', { id: 'delete-crm' });
            } catch (error: any) {
                console.error(error);
                toast.error("Lỗi khi xóa khách hàng: " + error.message, { id: 'delete-crm' });
            }
        }
    };

    const openModal = (client: any = null) => {
        setEditingClient(client);
        if (client) {
            setFormData({
                name: client.name, contact: client.contact, role: client.role,
                email: client.email, phone: client.phone, address: client.address, status: client.status,
                startDate: client.startDate || '', endDate: client.endDate || '', contractFileUrl: client.contractFileUrl || ''
            });
            setContractFile(null); // Reset when edit
        } else {
            setFormData({ name: '', contact: '', role: '', email: '', phone: '', address: '', status: 'Khách hàng Mới', startDate: '', endDate: '', contractFileUrl: '' });
            setContractFile(null);
        }
        setIsModalOpen(true);
    };

    const closeModal = () => {
        setIsModalOpen(false);
        setEditingClient(null);
    };

    const filteredClients = clients.filter((c: any) => 
        c.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
        c.contact.toLowerCase().includes(searchTerm.toLowerCase()) ||
        c.email.toLowerCase().includes(searchTerm.toLowerCase())
    );

    const checkExpiring = (endDateStr: string) => {
        if (!endDateStr) return false;
        const end = new Date(endDateStr);
        const now = new Date();
        const diffTime = end.getTime() - now.getTime();
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays >= 0 && diffDays <= 7;
    };

    const expiringClients = clients.filter(c => checkExpiring(c.endDate));

    return (
        <PageTransition style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', height: '100%' }}>

            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                <div>
                    <h2 style={{ fontSize: '1.75rem', fontWeight: 700, marginBottom: '0.25rem' }}>Quản lý Khách hàng (CRM)</h2>
                    <p style={{ color: 'var(--color-text-light)' }}>Danh sách {clients.length} khách hàng và đối tác kinh doanh.</p>
                </div>
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                    <button className="btn btn-secondary">
                        <Filter size={18} /> Lọc
                    </button>
                    <button className="btn btn-primary">
                        <Plus size={18} /> Thống kê & Báo cáo
                    </button>
                </div>
            </div>

            {expiringClients.length > 0 && (
                <div style={{ 
                    padding: '1rem', backgroundColor: '#fef2f2', border: '1px solid #fca5a5', 
                    borderRadius: 'var(--border-radius-sm)', color: '#b91c1c', display: 'flex', 
                    alignItems: 'flex-start', gap: '0.75rem', animation: 'fadeIn 0.5s ease-out'
                }}>
                    <AlertTriangle size={24} style={{ flexShrink: 0, marginTop: '2px' }} />
                    <div>
                        <h4 style={{ margin: '0 0 0.25rem 0', fontWeight: 700, fontSize: '1.05rem' }}>Khách hàng sắp hết hạn hợp đồng!</h4>
                        <p style={{ margin: 0, fontSize: '0.9rem' }}>
                            Có <b>{expiringClients.length}</b> khách hàng sẽ hết hạn hợp đồng trong 7 ngày tới. Hãy liên hệ với họ để gia hạn.
                        </p>
                    </div>
                </div>
            )}

            {/* Toolbar */}
            <div className="glass-panel" style={{ padding: '1rem', display: 'flex', gap: '1rem', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{
                    display: 'flex',
                    alignItems: 'center',
                    background: 'var(--color-background)',
                    padding: '0.5rem 1rem',
                    borderRadius: 'var(--border-radius-sm)',
                    flex: 1,
                    maxWidth: '400px',
                    border: '1px solid var(--color-border)'
                }}>
                    <Search size={18} color="var(--color-text-light)" />
                    <input
                        type="text"
                        placeholder="Tìm theo tên công ty, người liên hệ..."
                        value={searchTerm}
                        onChange={(e) => setSearchTerm(e.target.value)}
                        style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', width: '100%', marginLeft: '0.5rem', fontSize: '0.9rem' }}
                    />
                </div>
                <button className="btn btn-primary" style={{ height: '100%' }} onClick={() => openModal()}>
                    <Plus size={18} /> Thêm Khách hàng
                </button>
            </div>

            {/* Cards Grid */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '1.5rem', flex: 1, overflowY: 'auto', paddingBottom: '1rem' }}>
                {isLoading ? (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                        <div style={{ width: '30px', height: '30px', border: '3px solid #ff7d0d', borderTopColor: 'transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
                        Đang lấy dữ liệu khách hàng từ Firebase...
                    </div>
                ) : filteredClients.length === 0 ? (
                    <div style={{ gridColumn: '1 / -1', padding: '3rem', textAlign: 'center', color: 'var(--color-text-light)' }}>
                        Không tìm thấy khách hàng nào trên hệ thống.
                    </div>
                ) : filteredClients.map((client: any) => (
                    <div key={client.id} className="glass-panel client-card" style={{ padding: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1rem', transition: 'all var(--transition-normal)', position: 'relative' }}>

                        {/* Card Header & Controls */}
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '48px', height: '48px', borderRadius: '12px',
                                    background: `linear-gradient(135deg, ${client.bg}, ${client.bg}cc)`,
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.25rem', fontWeight: 'bold'
                                }}>
                                    {client.name.charAt(0)}
                                </div>
                                <div style={{ flex: 1 }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', width: '100%' }}>
                                        <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--color-text)', marginBottom: '0.25rem', lineHeight: 1.2, paddingRight: '2rem' }}>{client.name}</h3>
                                        <button style={{ color: 'var(--color-text-light)', background: 'transparent', padding: '0', cursor: 'pointer', position: 'absolute', right: '1.5rem', top: '1.5rem' }}>
                                            <Star size={18} />
                                        </button>
                                    </div>
                                    <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                                        <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '1rem', backgroundColor: `${client.bg}15`, color: client.bg }}>
                                            {client.status}
                                        </span>
                                        {checkExpiring(client.endDate) && (
                                            <span style={{ fontSize: '0.75rem', fontWeight: 600, padding: '0.25rem 0.6rem', borderRadius: '1rem', backgroundColor: '#fef2f2', color: '#dc2626', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                                                <AlertTriangle size={12} /> Sắp hết hạn
                                            </span>
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>

                        {/* Contact Info */}
                        <div style={{ background: 'var(--color-background)', padding: '1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)', flex: 1, marginTop: '0.5rem' }}>
                            <div style={{ fontWeight: 600, marginBottom: '0.75rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                <User size={16} color="var(--color-primary)" /> {client.contact}
                                <span style={{ fontWeight: 400, color: 'var(--color-text-light)', fontSize: '0.85rem' }}>- {client.role}</span>
                            </div>

                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Mail size={14} /> {client.email}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <Phone size={14} /> {client.phone}
                                </div>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <MapPin size={14} /> {client.address}
                                </div>
                                {(client.startDate || client.endDate) && (
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: checkExpiring(client.endDate) ? '#dc2626' : 'var(--color-primary)', fontWeight: checkExpiring(client.endDate) ? 700 : 500 }}>
                                        <Calendar size={14} /> 
                                        {client.startDate ? new Date(client.startDate).toLocaleDateString('vi-VN') : '...'} - {client.endDate ? new Date(client.endDate).toLocaleDateString('vi-VN') : '...'}
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Actions */}
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto' }}>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => openModal(client)}>
                                <Edit size={16} /> Sửa
                            </button>
                            <button className="btn btn-primary" style={{ flex: 1, padding: '0.5rem' }} onClick={() => setViewingClient(client)}>
                                Xem chi tiết
                            </button>
                            <button className="btn btn-secondary" style={{ padding: '0.5rem', color: '#ef4444', borderColor: '#ef444415', background: '#ef444405' }} onClick={() => handleDelete(client.id)}>
                                <Trash2 size={16} />
                            </button>
                        </div>

                    </div>
                ))}
            </div>

            {/* Add/Edit Modal */}
            {isModalOpen && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={closeModal}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-surface)',
                        padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        display: 'flex', flexDirection: 'column', gap: '1rem',
                        maxHeight: '90vh', overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                            <h3 style={{ fontSize: '1.25rem', fontWeight: 700 }}>{editingClient ? 'Chỉnh sửa Khách hàng' : 'Thêm Khách hàng mới'}</h3>
                            <button onClick={closeModal} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Tên công ty / Tổ chức *</label>
                                <input type="text" value={formData.name} onChange={e => setFormData({...formData, name: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} placeholder="Công ty TNHH..." />
                            </div>
                            
                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Người liên hệ *</label>
                                    <input type="text" value={formData.contact} onChange={e => setFormData({...formData, contact: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Chức vụ</label>
                                    <input type="text" value={formData.role} onChange={e => setFormData({...formData, role: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Email</label>
                                    <input type="email" value={formData.email} onChange={e => setFormData({...formData, email: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Số điện thoại</label>
                                    <input type="tel" value={formData.phone} onChange={e => setFormData({...formData, phone: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Địa chỉ</label>
                                <input type="text" value={formData.address} onChange={e => setFormData({...formData, address: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                            </div>

                            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Ngày bắt đầu hợp đồng</label>
                                    <input type="date" value={formData.startDate} onChange={e => setFormData({...formData, startDate: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                                <div>
                                    <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Ngày kết thúc hợp đồng</label>
                                    <input type="date" value={formData.endDate} onChange={e => setFormData({...formData, endDate: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'block' }}>Trạng thái</label>
                                <select value={formData.status} onChange={e => setFormData({...formData, status: e.target.value})} style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px solid var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }}>
                                    <option value="Khách hàng Mới">Khách hàng Mới</option>
                                    <option value="Đang thương lượng">Đang thương lượng</option>
                                    <option value="Khách hàng Tiềm năng">Khách hàng Tiềm năng</option>
                                    <option value="Khách hàng VIP">Khách hàng VIP</option>
                                    <option value="Mất liên lạc">Mất liên lạc</option>
                                </select>
                            </div>

                            <div>
                                <label style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--color-text-light)', marginBottom: '0.4rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                                    <FileText size={16} /> Phiếu báo cáo/Hợp đồng đính kèm
                                </label>
                                {formData.contractFileUrl && !contractFile && (
                                    <div style={{ padding: '0.5rem', background: '#ecfdf5', border: '1px solid #10b981', color: '#059669', borderRadius: '6px', fontSize: '0.85rem', marginBottom: '0.5rem', display: 'flex', justifyContent: 'space-between' }}>
                                        <span>✓ Đã đính kèm tệp hợp đồng cũ</span>
                                        <button onClick={() => setFormData({...formData, contractFileUrl: ''})} style={{ background: 'none', border: 'none', color: '#ef4444', cursor: 'pointer' }}><Trash2 size={14}/></button>
                                    </div>
                                )}
                                <input 
                                    type="file" 
                                    onChange={e => {
                                        if (e.target.files && e.target.files[0]) {
                                            setContractFile(e.target.files[0]);
                                        }
                                    }} 
                                    style={{ width: '100%', padding: '0.6rem 0.8rem', borderRadius: '6px', border: '1px dashed var(--color-border)', background: 'var(--color-background)', color: 'var(--color-text)', outline: 'none' }} 
                                />
                                {contractFile && (
                                    <div style={{ fontSize: '0.8rem', color: 'var(--color-primary)', marginTop: '0.2rem' }}>
                                        Tệp chờ tải lên: {contractFile.name} (Tải lên cần 3-5 giây)
                                    </div>
                                )}
                            </div>
                        </div>

                        <div style={{ display: 'flex', gap: '1rem', marginTop: '1.5rem' }}>
                            <button className="btn btn-primary" style={{ flex: 1, padding: '0.75rem' }} onClick={handleSave} disabled={isUploading}>
                                {isUploading ? 'Đang lưu Cloud...' : 'Lưu thông tin'}
                            </button>
                            <button className="btn btn-secondary" style={{ flex: 1, padding: '0.75rem' }} onClick={closeModal}>Hủy</button>
                        </div>

                    </div>
                </div>
            )}

            {/* View Details Modal */}
            {viewingClient && (
                <div style={{
                    position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
                    backgroundColor: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)',
                    zIndex: 999, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    animation: 'fadeIn 0.2s ease-out'
                }} onClick={() => setViewingClient(null)}>
                    <div className="glass-panel" style={{
                        width: '100%', maxWidth: '500px', backgroundColor: 'var(--color-surface)',
                        padding: '2rem', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.25)',
                        display: 'flex', flexDirection: 'column', gap: '1.5rem',
                        maxHeight: '90vh', overflowY: 'auto'
                    }} onClick={e => e.stopPropagation()}>
                        
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                                <div style={{
                                    width: '56px', height: '56px', borderRadius: '12px',
                                    background: `linear-gradient(135deg, ${viewingClient.bg}, ${viewingClient.bg}cc)`,
                                    color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                    fontSize: '1.5rem', fontWeight: 'bold'
                                }}>
                                    {viewingClient.name.charAt(0)}
                                </div>
                                <div>
                                    <h3 style={{ fontSize: '1.25rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.2rem' }}>{viewingClient.name}</h3>
                                    <span style={{ fontSize: '0.8rem', fontWeight: 600, padding: '0.25rem 0.75rem', borderRadius: '1rem', backgroundColor: `${viewingClient.bg}15`, color: viewingClient.bg }}>
                                        {viewingClient.status}
                                    </span>
                                </div>
                            </div>
                            <button onClick={() => setViewingClient(null)} style={{ background: 'transparent', border: 'none', cursor: 'pointer', color: 'var(--color-text-light)', padding: '0.2rem' }}>
                                <X size={20} />
                            </button>
                        </div>

                        <div style={{ padding: '1.25rem', backgroundColor: 'var(--color-background)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: 'var(--color-text-light)', borderBottom: '1px solid var(--color-border)', paddingBottom: '0.5rem' }}>Người đại diện</h4>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                                <div style={{ width: '40px', height: '40px', borderRadius: '50%', backgroundColor: 'rgba(0,0,0,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <User size={18} color="var(--color-primary)" />
                                </div>
                                <div>
                                    <div style={{ fontWeight: 700, fontSize: '1.05rem' }}>{viewingClient.contact}</div>
                                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>{viewingClient.role || 'Không có chức vụ'}</div>
                                </div>
                            </div>
                        </div>

                        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Phone size={14} /> Điện thoại</span>
                                <span style={{ fontWeight: 600 }}>{viewingClient.phone || 'Chưa cung cấp'}</span>
                            </div>
                            <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><Mail size={14} /> Email</span>
                                <span style={{ fontWeight: 600, wordBreak: 'break-all' }}>{viewingClient.email || 'Chưa cung cấp'}</span>
                            </div>
                        </div>

                        <div style={{ padding: '1rem', backgroundColor: 'var(--color-background)', borderRadius: '0.75rem', border: '1px solid var(--color-border)', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            <span style={{ fontSize: '0.75rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}><MapPin size={14} /> Địa chỉ</span>
                            <span style={{ fontWeight: 600 }}>{viewingClient.address || 'Chưa cung cấp'}</span>
                        </div>

                        {(viewingClient.startDate || viewingClient.endDate) && (
                            <div style={{ padding: '1rem', backgroundColor: '#fff7ed', borderRadius: '0.75rem', border: '1px solid #fed7aa', display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                                <span style={{ fontSize: '0.75rem', color: '#f97316', display: 'flex', alignItems: 'center', gap: '0.4rem', fontWeight: 600 }}><Calendar size={14} /> Thời hạn hợp đồng</span>
                                <span style={{ fontWeight: 700, color: '#ea580c' }}>
                                    {viewingClient.startDate ? new Date(viewingClient.startDate).toLocaleDateString('vi-VN') : 'Không xác định'} 
                                    {' -> '} 
                                    {viewingClient.endDate ? new Date(viewingClient.endDate).toLocaleDateString('vi-VN') : 'Không xác định'}
                                </span>
                            </div>
                        )}

                        {viewingClient.contractFileUrl && (
                            <a href={viewingClient.contractFileUrl} target="_blank" rel="noreferrer" style={{ 
                                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', 
                                padding: '1rem', backgroundColor: '#e0e7ff', color: '#4f46e5', 
                                borderRadius: '0.75rem', border: '1px solid #c7d2fe', fontWeight: 600, textDecoration: 'none' 
                            }}>
                                <Download size={18} />
                                Mở / Tải Về Hợp Đồng Đính Kèm
                            </a>
                        )}

                        <button className="btn btn-secondary" style={{ width: '100%', padding: '0.75rem', marginTop: '0.5rem' }} onClick={() => setViewingClient(null)}>Đóng chi tiết</button>
                    </div>
                </div>
            )}

            <style>{`
        .client-card:hover { transform: translateY(-4px); box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1); border-color: var(--color-primary); }
      `}</style>
        </PageTransition>
    );
}
