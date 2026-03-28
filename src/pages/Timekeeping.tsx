import { useState, useEffect } from 'react';
import { LogIn, LogOut, Download, Clock, Calendar, ChevronDown, Monitor, Search, AlertCircle } from 'lucide-react';
import { useLocalStorage } from '../hooks/useLocalStorage';

export default function Timekeeping() {
    const [currentTime, setCurrentTime] = useState(new Date());
    const [isCheckedIn, setIsCheckedIn] = useState(false);
    const [checkInTime, setCheckInTime] = useState<Date | null>(null);
    const [elapsedTime, setElapsedTime] = useState({ hours: 0, minutes: 0, seconds: 0 });

    const [logs, setLogs] = useLocalStorage<any[]>('smiley_timekeeping_logs', [
        { dateStr: '20 Th10, 2023', dayStr: 'Thứ Sáu', in: '09:02 AM', out: '06:15 PM', total: '8g 45ph', type: 'Từ xa', tColor: '#4f46e5', bg: '#4f46e515' },
        { dateStr: '19 Th10, 2023', dayStr: 'Thứ Năm', in: '08:55 AM', out: '05:30 PM', total: '8g 35ph', type: 'Văn phòng', tColor: '#f59e0b', bg: '#f59e0b15' },
        { dateStr: '18 Th10, 2023', dayStr: 'Thứ Tư', in: '09:10 AM', out: '07:05 PM', total: '9g 55ph', type: 'Văn phòng', tColor: '#f59e0b', bg: '#f59e0b15' },
        { dateStr: '17 Th10, 2023', dayStr: 'Thứ Ba', in: '08:30 AM', out: '05:00 PM', total: '8g 30ph', type: 'Tại khách hàng', tColor: '#8b5cf6', bg: '#8b5cf615' },
    ]);

    const handleExportCSV = () => {
        const headers = ['Ngày', 'Thứ', 'Giờ vào', 'Giờ ra', 'Tổng giờ', 'Hình thức'];
        const rows = logs.map((log: any) => [
            `"${log.dateStr}"`,
            `"${log.dayStr}"`,
            `"${log.in}"`,
            `"${log.out}"`,
            `"${log.total}"`,
            `"${log.type}"`
        ]);
        
        const csvContent = "data:text/csv;charset=utf-8,\uFEFF" 
            + headers.join(',') + '\n' 
            + rows.map((e: any[]) => e.join(",")).join("\n");
            
        const encodedUri = encodeURI(csvContent);
        const link = document.createElement("a");
        link.setAttribute("href", encodedUri);
        link.setAttribute("download", `lich_su_cham_cong_${new Date().toLocaleDateString('vi-VN').replace(/\//g, '-')}.csv`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    useEffect(() => {
        const timer = setInterval(() => {
            const now = new Date();
            setCurrentTime(now);

            // Calculate elapsed time if checked in
            if (isCheckedIn && checkInTime) {
                const diffMs = now.getTime() - checkInTime.getTime();
                const totalSeconds = Math.floor(diffMs / 1000);
                setElapsedTime({
                    hours: Math.floor(totalSeconds / 3600),
                    minutes: Math.floor((totalSeconds % 3600) / 60),
                    seconds: totalSeconds % 60
                });
            }
        }, 1000);
        return () => clearInterval(timer);
    }, [isCheckedIn, checkInTime]);

    const [systemConfig] = useLocalStorage('smiley_system_settings', { radius: 1, coords: '21.028511, 105.804817' });
    const [isCheckingLoc, setIsCheckingLoc] = useState(false);
    const [locError, setLocError] = useState('');

    // Haversine formula
    const calculateDistance = (lat1: number, lon1: number, lat2: number, lon2: number) => {
        const R = 6371; // Radius of the earth in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = Math.sin(dLat/2) * Math.sin(dLat/2) +
                  Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
                  Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c; 
    };

    const performCheckIn = () => {
        setCheckInTime(new Date());
        setIsCheckedIn(true);
        setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
    };

    const handleCheckInOut = (action: 'in' | 'out') => {
        setLocError('');
        if (action === 'in' && !isCheckedIn) {
            if (systemConfig.radius === 0) {
                performCheckIn();
                return;
            }

            if (!navigator.geolocation) {
                setLocError('Trình duyệt của bạn không hỗ trợ công nghệ định vị vị trí (Geolocation).');
                return;
            }

            setIsCheckingLoc(true);
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setIsCheckingLoc(false);
                    const userLat = position.coords.latitude;
                    const userLng = position.coords.longitude;
                    
                    const [compLatStr, compLngStr] = systemConfig.coords.split(',');
                    const compLat = parseFloat(compLatStr);
                    const compLng = parseFloat(compLngStr);

                    if (isNaN(compLat) || isNaN(compLng)) {
                        setLocError('Tọa độ công ty thiết lập không hợp lệ. Vui lòng kiểm tra lại cấu hình hệ thống.');
                        return;
                    }

                    const distKm = calculateDistance(compLat, compLng, userLat, userLng);
                    if (distKm <= systemConfig.radius) {
                        performCheckIn();
                    } else {
                        setLocError(`Bạn đang ở ngoài vùng chấm công! Khoảng cách hiện tại: ${(distKm).toFixed(2)}km (Lớn hơn mức cho phép là ${systemConfig.radius}km).`);
                    }
                },
                (error: any) => {
                    setIsCheckingLoc(false);
                    let errMsg = '';
                    switch (error.code) {
                        case error.PERMISSION_DENIED:
                            errMsg = 'Trình duyệt HOẶC Hệ điều hành (Windows/Mac) đang chặn quyền vị trí của bạn. Hãy vào Cài đặt Máy tính -> Quyền riêng tư (Privacy) -> Bật Location.';
                            break;
                        case error.POSITION_UNAVAILABLE:
                            errMsg = 'Không thể xác định vị trí hiện tại (Mất tín hiệu quét không gian).';
                            break;
                        case error.TIMEOUT:
                            errMsg = 'Hệ thống định vị phản hồi quá chậm (Timeout). Vui lòng thử lại.';
                            break;
                        default:
                            errMsg = 'Lỗi không xác định: ' + error.message;
                    }
                    setLocError('Cảnh báo: ' + errMsg);
                },
                { enableHighAccuracy: false, timeout: 15000, maximumAge: 0 }
            );
        } else if (action === 'out' && isCheckedIn) {
            const checkOutTime = new Date();
            let totalHoursStr = '';
            if (checkInTime) {
                const diffMs = checkOutTime.getTime() - checkInTime.getTime();
                const totalMins = Math.floor(diffMs / (1000 * 60));
                const h = Math.floor(totalMins / 60);
                const m = totalMins % 60;
                totalHoursStr = `${h}g ${m}ph`;
            }

            const monthNames = ["Th1", "Th2", "Th3", "Th4", "Th5", "Th6", "Th7", "Th8", "Th9", "Th10", "Th11", "Th12"];
            const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

            const newLog = {
                dateStr: `${checkOutTime.getDate()} ${monthNames[checkOutTime.getMonth()]}, ${checkOutTime.getFullYear()}`,
                dayStr: dayNames[checkOutTime.getDay()],
                in: checkInTime ? formatTimeAmpm(checkInTime) : '--:--',
                out: formatTimeAmpm(checkOutTime),
                total: totalHoursStr,
                type: 'Văn phòng',
                tColor: '#f59e0b',
                bg: '#f59e0b15'
            };

            setLogs([newLog, ...logs]);
            setIsCheckedIn(false);
            setCheckInTime(null);
            setElapsedTime({ hours: 0, minutes: 0, seconds: 0 });
        }
    };

    const formatTimeAmpm = (date: Date) => {
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });
    };

    const formatDateFull = (date: Date) => {
        const days = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];
        const day = days[date.getDay()];
        return `${day}, ${date.getDate()} Tháng ${date.getMonth() + 1}, ${date.getFullYear()}`;
    };

    const getCheckInStatus = () => {
        if (!checkInTime) return null;

        const eightAM = new Date(checkInTime);
        eightAM.setHours(8, 0, 0, 0);

        if (checkInTime <= eightAM) {
            return { text: 'Đúng giờ', color: 'var(--color-success)' };
        } else {
            return { text: 'Đi muộn', color: 'var(--color-warning)' };
        }
    };

    const statusObj = getCheckInStatus();

    return (
        <div className="timekeeping-container animate-fade-in" style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>

            {/* Header section */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <h2 style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--color-text)', marginBottom: '0.25rem', letterSpacing: '-0.5px', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                        Chấm công Nhân viên
                        <span style={{
                            fontSize: '1.2rem',
                            padding: '0.3rem 0.8rem',
                            background: 'transparent',
                            color: '#ff7d0d',
                            border: '2px solid #ff7d0d',
                            borderRadius: '0.5rem',
                            fontWeight: 700,
                            letterSpacing: '1.5px',
                            boxShadow: '0 4px 6px -1px var(--color-primary-light, rgba(255, 125, 13, 0.15))'
                        }}>
                            {currentTime.toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: false })}
                        </span>
                    </h2>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.95rem' }}>
                        {formatDateFull(currentTime)}
                    </p>
                </div>
                <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
                    <div style={{
                        display: 'flex', alignItems: 'center', background: 'var(--color-background)',
                        padding: '0.5rem 1rem', borderRadius: 'var(--border-radius-sm)', border: '1px solid var(--color-border)', width: '250px'
                    }}>
                        <Search size={16} color="var(--color-text-light)" />
                        <input type="text" placeholder="Tìm kiếm bản ghi..." style={{ border: 'none', background: 'transparent', outline: 'none', color: 'var(--color-text)', width: '100%', marginLeft: '0.5rem', fontSize: '0.85rem' }} />
                    </div>
                    <button onClick={handleExportCSV} className="btn btn-secondary" style={{ padding: '0.5rem 1rem', background: 'var(--color-surface)', fontSize: '0.9rem', fontWeight: 600, border: '1px solid var(--color-border)', borderRadius: '0.5rem', cursor: 'pointer', display: 'flex', alignItems: 'center' }}>
                        <Download size={16} style={{ marginRight: '0.5rem' }} />
                        Xuất CSV
                    </button>
                </div>
            </div>

            {/* Top Stat Cards */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1.5rem' }}>
                {/* Giờ vào hôm nay */}
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', fontWeight: 500 }}>Giờ vào hôm nay</span>
                        <LogIn size={20} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                        {checkInTime ? formatTimeAmpm(checkInTime) : '--:--'}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: statusObj ? statusObj.color : 'transparent', fontWeight: 600 }}>
                        {statusObj ? statusObj.text : '...'}
                    </div>
                </div>

                {/* Thời gian hiện tại / elapsed */}
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', fontWeight: 500 }}>Thời gian hiện tại</span>
                        <Clock size={20} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.1rem', color: 'var(--color-text)' }}>
                        {isCheckedIn ? `${elapsedTime.hours}g ${elapsedTime.minutes}ph ${elapsedTime.seconds}s` : '--:--'}
                    </div>
                    <div style={{ fontSize: '0.9rem', color: 'var(--color-primary)', fontWeight: 600, marginBottom: '0.5rem' }}>
                        {formatTimeAmpm(currentTime)}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)' }}>
                        Tính từ lúc vào ca
                    </div>
                </div>

                {/* Tổng giờ trong tuần */}
                <div className="glass-panel" style={{ padding: '1.5rem', background: 'var(--color-surface)' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                        <span style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', fontWeight: 500 }}>Tổng giờ trong tuần</span>
                        <Calendar size={20} color="#f59e0b" />
                    </div>
                    <div style={{ fontSize: '2rem', fontWeight: 800, marginBottom: '0.5rem', color: 'var(--color-text)' }}>
                        {(() => {
                            // Demo starting from zero. In a real app this would be fetched from database.
                            const baseHours = 0;
                            const baseMinutes = 0;
                            if (isCheckedIn) {
                                let totalMins = baseMinutes + elapsedTime.minutes;
                                let totalHours = baseHours + elapsedTime.hours;
                                if (totalMins >= 60) {
                                    totalHours += Math.floor(totalMins / 60);
                                    totalMins = totalMins % 60;
                                }
                                return `${totalHours}g ${totalMins}ph`;
                            }
                            return `${baseHours}g ${baseMinutes}ph`;
                        })()}
                    </div>
                    <div style={{ fontSize: '0.85rem', color: 'var(--color-text-light)', display: 'flex', alignItems: 'center', gap: '0.2rem' }}>
                        <span style={{ color: 'var(--color-success)' }}>↗ 2.4g</span> so với tuần trước
                    </div>
                </div>
            </div>

            {/* Check-in Action Bar */}
            <div className="glass-panel" style={{ padding: '2rem', background: 'linear-gradient(to right, var(--color-surface), rgba(255, 125, 13, 0.03))', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
                        <div style={{ width: '10px', height: '10px', borderRadius: '50%', background: isCheckedIn ? 'var(--color-success)' : 'var(--color-text-light)' }}></div>
                        <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, color: 'var(--color-text)' }}>
                            Trạng thái: {isCheckedIn ? 'Đang trong ca làm việc' : 'Chưa bắt đầu ca'}
                        </h3>
                    </div>
                    <p style={{ color: 'var(--color-text-light)', fontSize: '0.9rem', maxWidth: '450px', lineHeight: 1.5, marginBottom: '1.5rem' }}>
                        {isCheckedIn
                            ? `Bạn đã bắt đầu làm việc từ lúc ${formatTimeAmpm(checkInTime!)}. Đừng quên ghi nhận các giờ nghỉ để theo dõi năng suất chính xác nhất.`
                            : `Bạn chưa bắt đầu ca làm việc ngày hôm nay. Hãy bấm "Giờ vào" khi bắt đầu ca.`}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.4rem 0.8rem', background: 'var(--color-background)', borderRadius: '1rem', width: 'fit-content' }}>
                        <Monitor size={14} color="var(--color-text-light)" />
                        <span style={{ fontSize: '0.8rem', color: 'var(--color-text)', fontWeight: 500 }}>Chế độ: Tại văn phòng Agency</span>
                    </div>

                    {locError && (
                        <div style={{ marginTop: '1rem', padding: '1rem', background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '0.5rem', color: '#b91c1c', fontSize: '0.85rem', fontWeight: 500 }}>
                                <AlertCircle size={16} style={{ marginTop: '0.1rem', flexShrink: 0 }} />
                                <span>{locError}</span>
                            </div>
                        </div>
                    )}
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ display: 'flex', gap: '1rem' }}>
                        <button
                            onClick={() => handleCheckInOut('in')}
                            disabled={isCheckedIn || isCheckingLoc}
                            style={{
                                padding: '0.8rem 2rem', border: '1px solid #f97316', borderRadius: 'var(--border-radius-sm)',
                                background: (isCheckedIn || isCheckingLoc) ? 'transparent' : '#fff3e0', color: '#f97316',
                                fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                                cursor: (isCheckedIn || isCheckingLoc) ? 'not-allowed' : 'pointer', opacity: (isCheckedIn || isCheckingLoc) ? 0.5 : 1,
                                transition: 'all 0.2s'
                            }}
                        >
                            <LogIn size={18} /> {isCheckingLoc ? 'Đang định vị...' : 'Giờ vào'}
                        </button>
                        <button
                            onClick={() => handleCheckInOut('out')}
                            disabled={!isCheckedIn}
                            style={{
                                padding: '0.8rem 2rem', border: 'none', borderRadius: 'var(--border-radius-sm)',
                                background: isCheckedIn ? '#ff7d0d' : 'var(--color-border)', color: isCheckedIn ? 'white' : 'var(--color-text-light)',
                                fontSize: '1rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.5rem',
                                cursor: !isCheckedIn ? 'not-allowed' : 'pointer',
                                transition: 'all 0.2s', boxShadow: isCheckedIn ? '0 4px 10px rgba(255, 125, 13, 0.3)' : 'none'
                            }}
                        >
                            <LogOut size={18} /> Giờ ra
                        </button>
                    </div>
                    <a href="#" style={{ color: 'var(--color-text-light)', fontSize: '0.85rem', textDecoration: 'underline' }}>Nghỉ giải lao 15 phút</a>
                </div>
            </div>

            {/* Logs Table */}
            <div className="glass-panel" style={{ padding: '0', background: 'var(--color-surface)', overflow: 'hidden' }}>
                <div style={{ padding: '1.5rem 2rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--color-border)' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0 }}>Lịch sử chấm công</h3>
                    <button style={{
                        display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'var(--color-background)',
                        padding: '0.4rem 1rem', borderRadius: '1rem', border: 'none', fontSize: '0.85rem', fontWeight: 500, color: 'var(--color-text)'
                    }}>
                        Tháng 10, 2023 <ChevronDown size={14} />
                    </button>
                </div>

                <div style={{ overflowX: 'auto', padding: '0 2rem' }}>
                    <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left', minWidth: '700px' }}>
                        <thead>
                            <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                                <th style={{ padding: '1rem 0', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Ngày</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Hình thức</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Giờ vào</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase' }}>Giờ ra</th>
                                <th style={{ padding: '1rem 0', fontWeight: 600, fontSize: '0.75rem', color: 'var(--color-text-light)', textTransform: 'uppercase', textAlign: 'right' }}>Tổng giờ</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.map((log, index) => (
                                <tr key={index} style={{ borderBottom: index < logs.length - 1 ? '1px solid var(--color-border)' : 'none' }}>
                                    <td style={{ padding: '1.25rem 0' }}>
                                        <div style={{ fontWeight: 700, fontSize: '0.95rem', color: 'var(--color-text)' }}>{log.dateStr}</div>
                                        <div style={{ fontSize: '0.8rem', color: 'var(--color-text-light)', marginTop: '0.2rem' }}>{log.dayStr}</div>
                                    </td>
                                    <td style={{ padding: '1.25rem 0' }}>
                                        <span style={{
                                            padding: '0.3rem 0.6rem',
                                            borderRadius: '4px',
                                            fontSize: '0.8rem',
                                            fontWeight: 600,
                                            backgroundColor: log.bg,
                                            color: log.tColor,
                                            display: 'inline-block'
                                        }}>
                                            {log.type}
                                        </span>
                                    </td>
                                    <td style={{ padding: '1.25rem 0', fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)' }}>{log.in}</td>
                                    <td style={{ padding: '1.25rem 0', fontSize: '0.9rem', fontWeight: 500, color: 'var(--color-text)' }}>{log.out}</td>
                                    <td style={{ padding: '1.25rem 0', fontSize: '0.95rem', fontWeight: 700, color: 'var(--color-text)', textAlign: 'right' }}>{log.total}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                <div style={{ padding: '1rem', textAlign: 'center', borderTop: '1px solid var(--color-border)', marginTop: '0.5rem' }}>
                    <button style={{
                        background: 'transparent', border: 'none', color: '#f97316', fontSize: '0.9rem', fontWeight: 700, cursor: 'pointer'
                    }}>
                        Xem tất cả bản ghi
                    </button>
                </div>
            </div>

        </div>
    );
}
