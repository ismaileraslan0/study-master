import { NavLink } from 'react-router-dom';
import {
    LayoutDashboard,
    Youtube,
    FileQuestion,
    ClipboardCheck,
    BarChart3,
    GraduationCap,
    CalendarDays
} from 'lucide-react';

const navItems = [
    { to: '/', icon: LayoutDashboard, label: 'Dashboard' },
    { to: '/playlist', icon: Youtube, label: 'Video Planı' },
    { to: '/daily-plan', icon: CalendarDays, label: 'Günlük Plan' },
    { to: '/questions', icon: FileQuestion, label: 'Soru Takibi' },
    { to: '/exams', icon: ClipboardCheck, label: 'Denemeler' },
    { to: '/analysis', icon: BarChart3, label: 'Analiz' },
    { to: '/subjects', icon: GraduationCap, label: 'Dersler' },
];

export function Sidebar() {
    return (
        <aside className="sidebar">
            <div className="sidebar-logo">
                <GraduationCap size={32} color="#6366f1" />
                <h1>StudyMaster</h1>
            </div>

            <nav className="sidebar-nav">
                {navItems.map((item) => (
                    <NavLink
                        key={item.to}
                        to={item.to}
                        className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
                    >
                        <item.icon size={20} />
                        {item.label}
                    </NavLink>
                ))}
            </nav>
        </aside>
    );
}
