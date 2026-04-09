import { useState, useEffect } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon, Home, Coffee, Flag, Activity } from 'lucide-react';
import { db } from '../config/firebase';
import { collection, getDocs } from 'firebase/firestore';

export default function Dashboard() {
  const [stats, setStats] = useState({
    totalUsers: 0,
    checkInUsers: 0,
    totalTasks: 0,
    completedTasks: 0,
  });

  // Calculate work time percent (assume 8:00 AM to 5:30 PM = 9.5 hours)
  const [workPercent, setWorkPercent] = useState(0);

  useEffect(() => {
    // Current time
    const now = new Date();
    const startHour = 8;
    const endHour = 17.5; // 5:30 PM
    const currentHourDecimal = now.getHours() + now.getMinutes() / 60;
    
    let percent = 0;
    if (currentHourDecimal < startHour) percent = 100;
    else if (currentHourDecimal > endHour) percent = 0;
    else {
      const elapsed = currentHourDecimal - startHour;
      const total = endHour - startHour;
      percent = Math.max(0, 100 - (elapsed / total) * 100);
    }
    setWorkPercent(Math.round(percent));

    // Fetch stats
    const fetchStats = async () => {
      try {
        const [usersSnap, tasksSnap] = await Promise.all([
          getDocs(collection(db, 'users')),
          getDocs(collection(db, 'project_tasks'))
        ]);
        
        let completed = 0;
        tasksSnap.forEach(doc => {
            if (doc.data().status === 'HOÀN THÀNH' || doc.data().status === 'ĐÃ XONG' || doc.data().progress === 100) {
                completed++;
            }
        });

        // Simulate checked in users
        const checkIn = Math.min(usersSnap.size, Math.max(1, Math.floor(usersSnap.size * 0.8)));

        setStats({
          totalUsers: usersSnap.size,
          checkInUsers: checkIn,
          totalTasks: tasksSnap.size,
          completedTasks: completed,
        });

      } catch (error) {
        console.error('Lỗi khi tải dữ liệu tổng quan:', error);
      }
    };
    
    fetchStats();
  }, []);

  const d = new Date();
  const monthNames = ["Tháng 1", "Tháng 2", "Tháng 3", "Tháng 4", "Tháng 5", "Tháng 6", "Tháng 7", "Tháng 8", "Tháng 9", "Tháng 10", "Tháng 11", "Tháng 12"];
  const dayNames = ["Chủ Nhật", "Thứ Hai", "Thứ Ba", "Thứ Tư", "Thứ Năm", "Thứ Sáu", "Thứ Bảy"];

  // Efficiency gauge calculation
  const efficiency = stats.totalTasks > 0 ? Math.round((stats.completedTasks / stats.totalTasks) * 100) : 0;
  // mapped efficiency to angle (0% -> 0deg, 100% -> 180deg) 
  // Gauge path goes from x=20, y=100 to arc to x=180, y=100.
  const angle = Math.max(0, Math.min(180, (efficiency / 100) * 180));

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', backgroundColor: '#F3F4F6' }}>
      
      <div style={{ padding: '1.5rem 2rem', flex: 1, overflowY: 'auto' }}>
        
        {/* ROW 1: 6 Widgets */}
        <div style={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(6, 1fr)', 
            gap: '1rem',
            marginBottom: '1.5rem',
            alignItems: 'stretch'
        }}>
            
            {/* Widget 1: Battery */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem 1rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>Thời gian làm việc còn lại trong ngày</p>
                <div style={{ position: 'relative', width: '90px', height: '40px', border: '3px solid #D1D5DB', borderRadius: '0.5rem', padding: '2px', display: 'flex', alignItems: 'center' }}>
                    <div style={{ width: `${workPercent}%`, height: '100%', backgroundColor: workPercent > 20 ? '#10B981' : '#EF4444', borderRadius: '0.2rem', transition: 'width 0.5s' }} />
                    <div style={{ position: 'absolute', right: '-8px', top: '50%', transform: 'translateY(-50%)', width: '5px', height: '15px', backgroundColor: '#D1D5DB', borderRadius: '0 3px 3px 0' }} />
                    <div style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: '0.9rem', color: '#374151', textShadow: '0 0 2px white' }}>
                        {workPercent}%
                    </div>
                </div>
            </div>

            {/* Widget 2: Pie Chart */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem 1rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>Thành viên đã bắt đầu làm việc</p>
                <div style={{ 
                    width: '90px', height: '90px', borderRadius: '50%', 
                    background: `conic-gradient(var(--color-primary) ${stats.totalUsers > 0 ? (stats.checkInUsers/stats.totalUsers)*100 : 0}%, #E5E7EB 0)`,
                    position: 'relative'
                }}>
                    <div style={{ position: 'absolute', inset: '1px', backgroundColor: 'transparent', borderRadius: '50%', border: '4px solid white' }} />
                </div>
            </div>

            {/* Widget 3: Task Fraction */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem 1rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', margin: '0 0 1.5rem 0', lineHeight: 1.4 }}>Công việc đã hoàn thành trong ngày</p>
                <div style={{ fontSize: '2rem', fontWeight: 700, display: 'flex', alignItems: 'baseline', gap: '0.2rem' }}>
                    <span style={{ color: 'var(--color-primary)', fontSize: '2.5rem' }}>{stats.completedTasks}</span>
                    <span style={{ color: '#9CA3AF' }}>/{stats.totalTasks}</span>
                </div>
                <div style={{ fontSize: '0.85rem', color: '#6B7280', fontWeight: 500 }}>công việc</div>
            </div>

            {/* Widget 4: Line Chart */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem 1rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                    <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', margin: 0 }}>Hoạt động</p>
                    <div style={{ display: 'flex', gap: '0.5rem', fontSize: '0.65rem', fontWeight: 600 }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><div style={{width:'8px',height:'4px',borderRadius:'2px',backgroundColor:'#F97316'}}/> Đã tạo</span>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}><div style={{width:'8px',height:'4px',borderRadius:'2px',backgroundColor:'#3B82F6'}}/> Hoàn thành</span>
                    </div>
                </div>
                {/* SVG Line chart abstraction */}
                <svg width="100%" height="80" viewBox="0 0 200 80" preserveAspectRatio="none">
                    <path d="M 0 60 C 30 60, 40 40, 70 30 C 100 20, 120 70, 160 50 C 180 40, 190 20, 200 10" fill="none" stroke="#F97316" strokeWidth="2.5" strokeLinecap="round" />
                    <path d="M 0 70 C 30 70, 40 60, 70 50 C 100 40, 120 50, 160 20 C 180 10, 190 0, 200 5" fill="none" stroke="#3B82F6" strokeWidth="2" strokeDasharray="4,4" strokeLinecap="round" />
                    {/* Points */}
                    <circle cx="70" cy="30" r="3" fill="var(--color-primary)" />
                    <circle cx="160" cy="50" r="3" fill="var(--color-primary)" />
                    <circle cx="200" cy="10" r="3" fill="var(--color-primary)" />
                    
                    <line x1="0" y1="75" x2="200" y2="75" stroke="#E5E7EB" strokeWidth="1" />
                    <line x1="0" y1="40" x2="200" y2="40" stroke="#E5E7EB" strokeWidth="1" strokeDasharray="2,2"/>
                </svg>
            </div>

            {/* Widget 5: Calendar */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.25rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column' }}>
                <div style={{ backgroundColor: 'var(--color-primary)', color: 'white', textAlign: 'center', padding: '0.5rem', borderRadius: '0.5rem', fontSize: '0.85rem', fontWeight: 600, display: 'inline-block', margin: '0 auto', marginBottom: '-0.5rem', zIndex: 1, position: 'relative', width: '80%' }}>
                    {monthNames[d.getMonth()]}, {d.getFullYear()}
                </div>
                <div style={{ backgroundColor: '#FFF7ED', border: '1px solid #FDE68A', borderRadius: '0.5rem', paddingTop: '1.5rem', paddingBottom: '0.75rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', paddingLeft: '1rem', paddingRight: '1rem' }}>
                    <ChevronLeft size={20} color="var(--color-primary)" style={{ cursor: 'pointer', marginLeft: '0.5rem' }} />
                    <div style={{ textAlign: 'center' }}>
                        <div style={{ fontSize: '2rem', fontWeight: 800, color: '#374151', lineHeight: 1 }}>
                            {String(d.getDate()).padStart(2, '0')}
                        </div>
                        <div style={{ fontSize: '0.8rem', color: '#6B7280', fontWeight: 500, marginTop: '0.2rem' }}>
                            {dayNames[d.getDay()]}
                        </div>
                    </div>
                    <ChevronRight size={20} color="var(--color-primary)" style={{ cursor: 'pointer', marginRight: '0.5rem' }} />
                </div>
                
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: '0.5rem', marginTop: '1rem' }}>
                     <div style={{ backgroundColor: '#F3F4F6', borderRadius: '0.3rem', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <CalendarIcon size={14} color="#6B7280" />
                         <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0.2rem 0' }}>0</span>
                         <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>Nghỉ phép</span>
                     </div>
                     <div style={{ backgroundColor: '#F3F4F6', borderRadius: '0.3rem', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <Home size={14} color="#6B7280" />
                         <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0.2rem 0' }}>0</span>
                         <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>WFH</span>
                     </div>
                     <div style={{ backgroundColor: '#F3F4F6', borderRadius: '0.3rem', padding: '0.5rem 0', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                         <Coffee size={14} color="#6B7280" />
                         <span style={{ fontSize: '1rem', fontWeight: 700, color: 'var(--color-primary)', margin: '0.2rem 0' }}>0</span>
                         <span style={{ fontSize: '0.65rem', color: '#6B7280' }}>Ngoại lệ</span>
                     </div>
                </div>
            </div>

            {/* Widget 6: Gauge */}
            <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', padding: '1.5rem 1rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: '#4B5563', margin: '0 0 1rem 0', lineHeight: 1.4 }}>Hiệu suất trong ngày</p>
                <div style={{ position: 'relative', width: '140px', height: '70px', overflow: 'hidden' }}>
                    <svg viewBox="0 0 200 100" width="100%" height="200%" style={{ position: 'absolute', bottom: 0, left: 0, transform: 'translateY(50%)' }}>
                        <defs>
                            <linearGradient id="gaugeGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                                <stop offset="0%" stopColor="#EF4444" />
                                <stop offset="50%" stopColor="#F59E0B" />
                                <stop offset="100%" stopColor="#10B981" />
                            </linearGradient>
                        </defs>
                        <path d="M 20 100 A 80 80 0 0 1 180 100" fill="none" stroke="url(#gaugeGradient)" strokeWidth="30" strokeLinecap="round" />
                        
                        {/* Needle */}
                        <g style={{ transform: `rotate(${angle - 180}deg)`, transformOrigin: '100px 100px', transition: 'transform 1s cubic-bezier(0.175, 0.885, 0.32, 1.275)' }}>
                            <path d="M 95 100 L 100 25 L 105 100 Z" fill="#374151" />
                            <circle cx="100" cy="100" r="10" fill="#374151" />
                            <circle cx="100" cy="100" r="4" fill="white" />
                        </g>
                    </svg>
                </div>
                <div style={{ marginTop: '0.5rem' }}>
                    <div style={{ fontSize: '1.5rem', fontWeight: 800, color: 'var(--color-primary)' }}>{efficiency}%</div>
                    <div style={{ fontSize: '0.75rem', fontWeight: 600, color: '#9CA3AF', textTransform: 'uppercase' }}>
                        {efficiency >= 80 ? 'Excellent' : efficiency >= 50 ? 'Good' : efficiency > 0 ? 'Normal' : 'No Data'}
                    </div>
                </div>
            </div>

        </div>

        {/* BOTTOM SECTION */}
        <div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
            <div style={{ padding: '0.5rem 1rem', fontWeight: 600, color: 'var(--color-primary)', borderBottom: '2px solid var(--color-primary)', cursor: 'pointer' }}>Đã hoàn thành</div>
            <div style={{ padding: '0.5rem 1rem', fontWeight: 600, color: '#6B7280', cursor: 'pointer' }}>Công việc mới</div>
        </div>

        <div style={{ display: 'flex', gap: '1.5rem', alignItems: 'stretch' }}>
             
             {/* Left Giant Box */}
             <div style={{ flex: 1, backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #E5E7EB', display: 'flex', flexDirection: 'column', padding: '1.5rem' }}>
                 <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#374151', fontWeight: 600 }}>Hoàn thành</h4>
                 <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', minHeight: '300px' }}>
                    <Flag fill="var(--color-primary)" color="var(--color-primary)" size={48} style={{ opacity: 0.8 }} />
                    <p style={{ color: '#6B7280', fontSize: '1.1rem', fontWeight: 500 }}>Bạn hãy là người đầu tiên hoàn thành công việc hôm nay</p>
                 </div>
             </div>

             {/* Right Column (3 boxes) */}
             <div style={{ width: '400px', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                  
                  {/* Hoàn thành nhiều nhất */}
                  <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #E5E7EB', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                       <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#374151', fontWeight: 600, marginBottom: 'auto' }}>Hoàn thành nhiều nhất</h4>
                       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
                           Bạn hãy là thành viên tích cực hôm nay
                       </div>
                  </div>

                  {/* Lĩnh vực / dự án */}
                  <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #E5E7EB', padding: '1.5rem', flex: 1, display: 'flex', flexDirection: 'column' }}>
                       <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#374151', fontWeight: 600, marginBottom: 'auto' }}>Lĩnh vực /dự án</h4>
                       <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9CA3AF', fontSize: '0.9rem' }}>
                           Chưa có thông tin hôm nay
                       </div>
                  </div>

                  {/* Thống kê trong tuần */}
                  <div style={{ backgroundColor: 'white', borderRadius: '0.5rem', border: '1px solid #E5E7EB', padding: '1.5rem', height: '180px', display: 'flex', flexDirection: 'column' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
                            <h4 style={{ margin: 0, fontSize: '0.9rem', color: '#374151', fontWeight: 600 }}>Thống kê trong tuần</h4>
                            <Activity size={16} color="var(--color-primary)" />
                       </div>
                       
                       {/* Mini bar chart simulation */}
                       <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', flex: 1, padding: '0 1rem' }}>
                            {[20, 40, 25, 60, 30, 45, 10].map((h, i) => (
                                <div key={i} style={{ width: '12px', height: `${h}%`, backgroundColor: i === 3 ? 'var(--color-primary)' : '#E5E7EB', borderRadius: '2px 2px 0 0' }}></div>
                            ))}
                       </div>
                       <div style={{ borderTop: '1px solid #F3F4F6', marginTop: '0.5rem', display: 'flex', justifyContent: 'space-between', fontSize: '0.65rem', color: '#9CA3AF', paddingTop: '0.5rem' }}>
                            <span>T2</span><span>T3</span><span>T4</span><span>T5</span><span>T6</span><span>T7</span><span>CN</span>
                       </div>
                  </div>

             </div>
        </div>

      </div>
    </div>
  );
}
