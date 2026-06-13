import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  FiClock, FiSearch, FiFilter, FiTrash2,
  FiMessageSquare, FiMessageCircle, FiDownload, FiRefreshCw
} from 'react-icons/fi';
import { messagesAPI, companiesAPI } from '../services/api';

const TYPE_COLORS = {
  Promotion: '#6366f1', Alert: '#ef4444', Update: '#22c55e',
  Announcement: '#f59e0b', OTP: '#8b5cf6', 'Payment Reminder': '#14b8a6',
  'Delivery Update': '#3b82f6', Welcome: '#ec4899', Other: '#64748b',
};

const STATUS_COLORS = {
  sent: '#22c55e', delivered: '#6366f1', failed: '#ef4444', pending: '#f59e0b',
};

const MSG_TYPES = ['Promotion','Alert','Update','Announcement','OTP','Payment Reminder','Delivery Update','Welcome','Other'];

export default function HistoryPage() {
  const [search,    setSearch]    = useState('');
  const [company,   setCompany]   = useState('');
  const [type,      setType]      = useState('');
  const [channel,   setChannel]   = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate,   setEndDate]   = useState('');
  const [page,      setPage]      = useState(1);
  const qc = useQueryClient();

  const { data, isLoading, refetch } = useQuery(
    ['messages', page, search, company, type, channel, startDate, endDate],
    () => messagesAPI.list({ page, limit: 20, search, company_id: company, type, channel, start_date: startDate, end_date: endDate }),
    { select: r => r.data, keepPreviousData: true }
  );

  const { data: companies } = useQuery('companiesAll', companiesAPI.all, { select: r => r.data });

  const deleteMut = useMutation(id => messagesAPI.delete(id), {
    onSuccess: () => { qc.invalidateQueries('messages'); toast.success('Deleted'); },
  });

  const resetFilters = () => {
    setSearch(''); setCompany(''); setType(''); setChannel('');
    setStartDate(''); setEndDate(''); setPage(1);
  };

  // ── Download history as CSV ─────────────────────────────────────────────────
  const downloadHistory = async () => {
    toast('Preparing download...', { icon: '⏳' });
    try {
      // Fetch all messages with current filters (no pagination)
      const res = await messagesAPI.list({
        limit: 10000, company_id: company, type, channel,
        start_date: startDate, end_date: endDate, search,
      });
      const messages = res.data?.messages || [];
      if (!messages.length) { toast.error('No messages to download'); return; }

      const header = 'date,contact_name,phone,company,message,type,channel,sms_status,whatsapp_status';
      const rows = messages.map(m => {
        const date   = new Date(m.created_at).toLocaleString('en-RW');
        const msg    = `"${(m.content || '').replace(/"/g, "'")}"`;
        const comp   = m.company?.name || '';
        return `${date},${m.contact_name||''},${m.phone},${comp},${msg},${m.type},${m.channel},${m.sms_status},${m.whatsapp_status}`;
      }).join('\n');

      const csv  = header + '\n' + rows;
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url  = URL.createObjectURL(blob);
      const a    = document.createElement('a');
      a.href     = url;
      a.download = `message_history_${new Date().toISOString().slice(0,10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success(`✅ Downloaded ${messages.length} messages`);
    } catch {
      toast.error('Download failed');
    }
  };

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Message History</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data?.pagination?.total || 0} total messages
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={() => refetch()} className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <FiRefreshCw size={14} /> Refresh
          </button>
          <button onClick={downloadHistory} className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <FiDownload size={14} /> Download CSV
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="card" style={{ marginBottom: '20px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '13px', fontWeight: '600', color: 'var(--text-secondary)', margin: 0, display: 'flex', alignItems: 'center', gap: '6px' }}>
            <FiFilter size={14} /> Filters
          </p>
          <button onClick={resetFilters} style={{ fontSize: '12px', color: '#6366f1', background: 'none', border: 'none', cursor: 'pointer' }}>
            Reset all
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' }}>
          {/* Search */}
          <div style={{ position: 'relative' }}>
            <FiSearch size={13} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }} />
            <input className="input" style={{ paddingLeft: '34px', fontSize: '13px' }} placeholder="Search..."
              value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
          </div>

          {/* Company */}
          <select className="input" style={{ fontSize: '13px' }} value={company}
            onChange={e => { setCompany(e.target.value); setPage(1); }}>
            <option value="">All Companies</option>
            {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>

          {/* Type */}
          <select className="input" style={{ fontSize: '13px' }} value={type}
            onChange={e => { setType(e.target.value); setPage(1); }}>
            <option value="">All Types</option>
            {MSG_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
          </select>

          {/* Channel */}
          <select className="input" style={{ fontSize: '13px' }} value={channel}
            onChange={e => { setChannel(e.target.value); setPage(1); }}>
            <option value="">All Channels</option>
            <option value="SMS">SMS</option>
            <option value="WhatsApp">WhatsApp</option>
            <option value="Both">Both</option>
          </select>

          {/* Date from */}
          <input type="date" className="input" style={{ fontSize: '13px' }} value={startDate}
            onChange={e => { setStartDate(e.target.value); setPage(1); }} />

          {/* Date to */}
          <input type="date" className="input" style={{ fontSize: '13px' }} value={endDate}
            onChange={e => { setEndDate(e.target.value); setPage(1); }} />
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '13px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Recipient', 'Company', 'Message', 'Type', 'Channel', 'SMS', 'WhatsApp', 'Date', ''].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 8 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {Array.from({ length: 9 }).map((_, j) => (
                      <td key={j} style={{ padding: '14px 16px' }}>
                        <div style={{ height: '12px', borderRadius: '4px', background: 'var(--bg-hover)' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.messages?.length === 0 ? (
                <tr>
                  <td colSpan={9} style={{ padding: '48px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FiClock size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    No messages found
                  </td>
                </tr>
              ) : (
                data?.messages?.map(msg => (
                  <tr key={msg.id} style={{ borderBottom: '1px solid var(--border-light)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '14px 16px' }}>
                      <p style={{ fontWeight: '500', color: 'var(--text-primary)', margin: 0, fontSize: '13px' }}>{msg.contact_name || '—'}</p>
                      <p style={{ fontFamily: 'monospace', fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0' }}>{msg.phone}</p>
                    </td>
                    <td style={{ padding: '14px 16px', fontSize: '12px', color: 'var(--text-secondary)' }}>{msg.company?.name || '—'}</td>
                    <td style={{ padding: '14px 16px', maxWidth: '200px' }}>
                      <p style={{ fontSize: '12px', color: 'var(--text-secondary)', margin: 0, overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>
                        {msg.content}
                      </p>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', background: (TYPE_COLORS[msg.type]||'#64748b') + '20', color: TYPE_COLORS[msg.type]||'#64748b', whiteSpace: 'nowrap' }}>
                        {msg.type}
                      </span>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                        {(msg.channel === 'SMS' || msg.channel === 'Both') && <FiMessageSquare size={12} color="#6366f1" />}
                        {(msg.channel === 'WhatsApp' || msg.channel === 'Both') && <FiMessageCircle size={12} color="#22c55e" />}
                        <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>{msg.channel}</span>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={msg.sms_status} />
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <StatusBadge status={msg.whatsapp_status} />
                    </td>
                    <td style={{ padding: '14px 16px', whiteSpace: 'nowrap', fontSize: '11px', color: 'var(--text-muted)' }}>
                      {new Date(msg.created_at).toLocaleDateString('en-RW', { day: 'numeric', month: 'short', year: 'numeric' })}
                      <br />
                      {new Date(msg.created_at).toLocaleTimeString('en-RW', { hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <button onClick={() => { if (window.confirm('Delete?')) deleteMut.mutate(msg.id); }}
                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <FiTrash2 size={13} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {data?.pagination?.pages > 1 && (
          <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
              Showing {((page-1)*20)+1}–{Math.min(page*20, data.pagination.total)} of {data.pagination.total}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => p-1)} disabled={page === 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>← Prev</button>
              <button onClick={() => setPage(p => p+1)} disabled={page === data.pagination.pages} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Next →</button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

const StatusBadge = ({ status }) => {
  if (!status || status === 'pending') return <span style={{ fontSize: '11px', color: 'var(--text-muted)' }}>—</span>;
  return (
    <span style={{ padding: '3px 8px', borderRadius: '6px', fontSize: '11px', fontWeight: '500', background: (STATUS_COLORS[status]||'#64748b') + '20', color: STATUS_COLORS[status]||'#64748b' }}>
      {status}
    </span>
  );
};