import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  FiUserX, FiRefreshCw, FiMessageSquare, FiClock,
  FiAlertTriangle, FiCheckCircle, FiList
} from 'react-icons/fi';
import { optOutAPI, contactsAPI, companiesAPI } from '../services/api';

export default function OptOutsPage() {
  const [tab, setTab] = useState('list'); // list | log
  const [page, setPage] = useState(1);
  const [company, setCompany] = useState('');
  const qc = useQueryClient();

  const { data: companies } = useQuery('companiesAll', companiesAPI.all, { select: r => r.data });

  const { data, isLoading } = useQuery(
    ['optOuts', page, company],
    () => optOutAPI.list({ page, limit: 20, company_id: company }),
    { select: r => r.data, keepPreviousData: true, enabled: tab === 'list' }
  );

  const { data: replyLog, isLoading: loadingLog } = useQuery(
    ['optOutReplies', page],
    () => optOutAPI.replies({ page, limit: 30 }),
    { select: r => r.data, keepPreviousData: true, enabled: tab === 'log' }
  );

  const resubMut = useMutation(id => contactsAPI.resubscribe(id), {
    onSuccess: () => {
      qc.invalidateQueries('optOuts');
      qc.invalidateQueries('contacts');
      toast.success('Contact re-subscribed!');
    },
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ marginBottom: '20px' }}>
        <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0, display: 'flex', alignItems: 'center', gap: '10px' }}>
          <FiUserX size={22} color="#ef4444" /> Opt-Out Management
        </h1>
        <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
          Contacts who replied to stop receiving messages — automatically excluded from future sends
        </p>
      </div>

      {/* Info banner */}
      <div style={{
        padding: '14px 16px', borderRadius: '12px', marginBottom: '20px',
        background: '#6366f110', border: '1px solid #6366f130',
        display: 'flex', gap: '10px', alignItems: 'flex-start',
      }}>
        <FiAlertTriangle size={16} color="#6366f1" style={{ marginTop: '2px', flexShrink: 0 }} />
        <p style={{ fontSize: '13px', color: '#6366f1', margin: 0 }}>
          Every outgoing SMS automatically includes <strong>"Reply STOP to opt out"</strong>.
          When a contact replies <code>1</code>, <code>STOP</code>, or <code>UNSUBSCRIBE</code>,
          they are instantly excluded from all future campaigns across every company.
        </p>
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '20px', background: 'var(--bg-secondary)', border: '1px solid var(--border)', borderRadius: '12px', padding: '4px', width: 'fit-content' }}>
        {[
          { id: 'list', label: 'Opted-Out Contacts', icon: FiUserX },
          { id: 'log',  label: 'Reply Log',           icon: FiList },
        ].map(t => {
          const Icon = t.icon;
          return (
            <button key={t.id} onClick={() => { setTab(t.id); setPage(1); }}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '8px 16px', borderRadius: '8px', border: 'none',
                fontSize: '13px', fontWeight: '600', cursor: 'pointer',
                background: tab === t.id ? '#ef4444' : 'transparent',
                color: tab === t.id ? 'white' : 'var(--text-muted)',
              }}>
              <Icon size={14} /> {t.label}
            </button>
          );
        })}
      </div>

      {/* ── TAB: Opted-out contacts list ──────────────────────────────── */}
      {tab === 'list' && (
        <>
          <div style={{ marginBottom: '16px' }}>
            <select className="input" style={{ maxWidth: '260px' }} value={company}
              onChange={e => { setCompany(e.target.value); setPage(1); }}>
              <option value="">All Companies</option>
              {companies?.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>

          <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['Name', 'Phone', 'Company', 'Reason', 'Opted Out At', 'Actions'].map(h => (
                      <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {isLoading ? (
                    Array.from({ length: 4 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                        {Array.from({ length: 6 }).map((_, j) => (
                          <td key={j} style={{ padding: '16px 20px' }}>
                            <div style={{ height: '12px', borderRadius: '4px', background: 'var(--bg-hover)' }} />
                          </td>
                        ))}
                      </tr>
                    ))
                  ) : data?.contacts?.length === 0 ? (
                    <tr>
                      <td colSpan={6} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        <FiCheckCircle size={32} color="#22c55e" style={{ margin: '0 auto 8px', display: 'block' }} />
                        Nobody has opted out yet — great job! 🎉
                      </td>
                    </tr>
                  ) : (
                    data?.contacts?.map(c => (
                      <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}
                        onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                        onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                        <td style={{ padding: '14px 20px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#ef444420', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#ef4444', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                              {(c.name || c.phone)?.charAt(0)?.toUpperCase()}
                            </div>
                            <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{c.name || '—'}</span>
                          </div>
                        </td>
                        <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</td>
                        <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.company?.name || '—'}</td>
                        <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.opt_out_reason || '—'}</td>
                        <td style={{ padding: '14px 20px', fontSize: '11px', color: 'var(--text-muted)' }}>
                          {c.opted_out_at ? new Date(c.opted_out_at).toLocaleString('en-RW', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' }) : '—'}
                        </td>
                        <td style={{ padding: '14px 20px' }}>
                          <button onClick={() => resubMut.mutate(c.id)}
                            style={{
                              display: 'flex', alignItems: 'center', gap: '6px',
                              padding: '6px 12px', borderRadius: '8px', fontSize: '12px',
                              fontWeight: '500', border: '1px solid #22c55e40',
                              background: '#22c55e15', color: '#22c55e', cursor: 'pointer',
                            }}>
                            <FiRefreshCw size={12} /> Re-subscribe
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            {data?.pagination?.pages > 1 && (
              <div style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid var(--border)' }}>
                <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Page {page} of {data.pagination.pages}</p>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>← Prev</button>
                  <button onClick={() => setPage(p => p + 1)} disabled={page === data.pagination.pages} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Next →</button>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {/* ── TAB: Reply log (raw audit trail) ──────────────────────────── */}
      {tab === 'log' && (
        <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ borderBottom: '1px solid var(--border)' }}>
                  {['Phone', 'Reply Text', 'Result', 'Received At'].map(h => (
                    <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {loadingLog ? (
                  <tr><td colSpan={4} style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading...</td></tr>
                ) : replyLog?.replies?.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                      <FiMessageSquare size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                      No replies received yet
                    </td>
                  </tr>
                ) : (
                  replyLog?.replies?.map(r => (
                    <tr key={r.id} style={{ borderBottom: '1px solid var(--border-light)' }}>
                      <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{r.phone}</td>
                      <td style={{ padding: '14px 20px', fontSize: '13px', color: 'var(--text-primary)' }}>"{r.text}"</td>
                      <td style={{ padding: '14px 20px' }}>
                        {r.was_opt_out ? (
                          <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '500', background: '#ef444420', color: '#ef4444' }}>
                            🚫 Opted Out
                          </span>
                        ) : (
                          <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '500', background: '#64748b20', color: '#94a3b8' }}>
                            Normal reply
                          </span>
                        )}
                      </td>
                      <td style={{ padding: '14px 20px', fontSize: '11px', color: 'var(--text-muted)' }}>
                        {new Date(r.created_at).toLocaleString('en-RW', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
