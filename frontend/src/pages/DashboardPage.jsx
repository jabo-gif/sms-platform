import React from 'react';
import { useQuery } from 'react-query';
import { Link } from 'react-router-dom';
import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { FiUsers, FiUser, FiSend, FiMessageSquare, FiArrowRight,
  FiCheckCircle, FiXCircle, FiClock } from 'react-icons/fi';
import { messagesAPI } from '../services/api';

ChartJS.register(ArcElement, Tooltip, Legend);

const MSG_TYPES = ['Promotion','Alert','Update','Announcement','OTP','Payment Reminder','Delivery Update','Welcome','Other'];
const TYPE_COLORS = {
  Promotion: '#6366f1', Alert: '#ef4444', Update: '#22c55e',
  Announcement: '#f59e0b', OTP: '#8b5cf6', 'Payment Reminder': '#14b8a6',
  'Delivery Update': '#3b82f6', Welcome: '#ec4899', Other: '#64748b',
};

const StatCard = ({ icon: Icon, label, value, color, to }) => (
  <Link to={to || '#'} className="card flex items-center gap-4 hover:opacity-90 transition-all no-underline"
    style={{ textDecoration: 'none' }}>
    <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0"
      style={{ background: color + '20' }}>
      <Icon size={22} style={{ color }} />
    </div>
    <div>
      <p className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>{value ?? '—'}</p>
      <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>{label}</p>
    </div>
  </Link>
);

const ChannelBadge = ({ channel }) => {
  const map = { SMS: '#6366f1', WhatsApp: '#22c55e', Both: '#f59e0b' };
  return (
    <span className="px-2 py-0.5 rounded-lg text-xs font-medium"
      style={{ background: (map[channel] || '#64748b') + '20', color: map[channel] || '#64748b' }}>
      {channel}
    </span>
  );
};

const StatusDot = ({ status }) => {
  const map = { sent: '#22c55e', delivered: '#6366f1', failed: '#ef4444', pending: '#f59e0b' };
  return <span className="w-2 h-2 rounded-full inline-block" style={{ background: map[status] || '#64748b' }} />;
};

export default function DashboardPage() {
  const { data, isLoading } = useQuery('stats', messagesAPI.stats, {
    select: r => r.data,
    refetchInterval: 30000,
  });

  const stats = data?.stats || {};
  const byType = data?.byType || [];
  const recent = data?.recent || [];

  const donutData = {
    labels: byType.map(b => b.type),
    datasets: [{
      data: byType.map(b => parseInt(b.count)),
      backgroundColor: byType.map(b => TYPE_COLORS[b.type] || '#64748b'),
      borderWidth: 0,
      hoverOffset: 6,
    }],
  };

  return (
    <div className="space-y-6 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Dashboard</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Welcome back! Here's your overview.</p>
      </div>

      {/* Stat cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard icon={FiUsers}       label="Companies"       value={stats.totalCompanies}  color="#6366f1" to="/companies" />
        <StatCard icon={FiUser}        label="Contacts"        value={stats.totalContacts}   color="#22c55e" to="/contacts" />
        <StatCard icon={FiMessageSquare} label="Total Messages" value={stats.totalMessages} color="#f59e0b" to="/history" />
        <StatCard icon={FiSend}        label="Sent Today"      value={stats.todayMessages}   color="#14b8a6" to="/history" />
      </div>

      {/* Delivery stats */}
      <div className="grid grid-cols-3 gap-4">
        {[
          { icon: FiCheckCircle, label: 'SMS Sent',   value: stats.smsSent,  color: '#22c55e' },
          { icon: FiCheckCircle, label: 'WA Sent',    value: stats.waSent,   color: '#6366f1' },
          { icon: FiXCircle,     label: 'Failed',     value: stats.failed,   color: '#ef4444' },
        ].map(({ icon: Icon, label, value, color }) => (
          <div key={label} className="card text-center py-5">
            <Icon size={24} className="mx-auto mb-2" style={{ color }} />
            <p className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>{value ?? 0}</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        {/* Donut chart */}
        <div className="card">
          <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Messages by Type</h3>
          {byType.length > 0 ? (
            <>
              <div className="h-44 flex items-center justify-center">
                <Doughnut data={donutData} options={{
                  cutout: '68%',
                  plugins: { legend: { display: false } },
                }} />
              </div>
              <div className="mt-4 space-y-2">
                {byType.slice(0, 5).map(b => (
                  <div key={b.type} className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className="w-2.5 h-2.5 rounded-full" style={{ background: TYPE_COLORS[b.type] || '#64748b' }} />
                      <span className="text-xs" style={{ color: 'var(--text-secondary)' }}>{b.type}</span>
                    </div>
                    <span className="text-xs font-bold" style={{ color: 'var(--text-primary)' }}>{b.count}</span>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="h-44 flex items-center justify-center">
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet</p>
            </div>
          )}
        </div>

        {/* Recent messages */}
        <div className="lg:col-span-2 card">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>Recent Messages</h3>
            <Link to="/history" className="text-xs flex items-center gap-1" style={{ color: 'var(--accent)' }}>
              View all <FiArrowRight size={12} />
            </Link>
          </div>

          {recent.length === 0 ? (
            <div className="py-10 text-center">
              <FiSend size={32} className="mx-auto mb-2" style={{ color: 'var(--text-muted)' }} />
              <p className="text-sm" style={{ color: 'var(--text-muted)' }}>No messages yet</p>
              <Link to="/send" className="text-sm mt-2 inline-block" style={{ color: 'var(--accent)' }}>
                Send your first message →
              </Link>
            </div>
          ) : (
            <div className="space-y-3">
              {recent.map(msg => (
                <div key={msg.id} className="flex items-center gap-3 p-3 rounded-xl transition-all"
                  style={{ background: 'var(--bg-input)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                    style={{ background: (TYPE_COLORS[msg.type] || '#64748b') + '20' }}>
                    <FiSend size={14} style={{ color: TYPE_COLORS[msg.type] || '#64748b' }} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                        {msg.contact_name || msg.phone}
                      </p>
                      <ChannelBadge channel={msg.channel} />
                    </div>
                    <p className="text-xs truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>{msg.content}</p>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <div className="flex items-center gap-1 justify-end">
                      <StatusDot status={msg.sms_status} />
                      <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{msg.sms_status}</span>
                    </div>
                    <p className="text-xs mt-0.5" style={{ color: 'var(--text-muted)' }}>
                      {new Date(msg.created_at).toLocaleDateString()}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick actions */}
      <div className="card">
        <h3 className="font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>Quick Actions</h3>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { to: '/send',      icon: FiSend,    label: 'Send Message', color: '#6366f1' },
            { to: '/companies', icon: FiUsers,   label: 'Add Company',  color: '#22c55e' },
            { to: '/contacts',  icon: FiUser,    label: 'Add Contact',  color: '#f59e0b' },
            { to: '/history',   icon: FiClock,   label: 'View History', color: '#14b8a6' },
          ].map(({ to, icon: Icon, label, color }) => (
            <Link key={to} to={to}
              className="flex flex-col items-center gap-2 p-4 rounded-xl transition-all hover:opacity-90 no-underline"
              style={{ background: 'var(--bg-input)', textDecoration: 'none' }}>
              <div className="w-10 h-10 rounded-xl flex items-center justify-center"
                style={{ background: color + '20' }}>
                <Icon size={18} style={{ color }} />
              </div>
              <span className="text-xs font-medium text-center" style={{ color: 'var(--text-secondary)' }}>{label}</span>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}
