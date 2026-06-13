import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import { FiUser, FiPlus, FiSearch, FiEdit2, FiTrash2, FiX, FiCheck, FiFilter } from 'react-icons/fi';
import { contactsAPI, companiesAPI } from '../services/api';

export default function ContactsPage() {
  const [search, setSearch]           = useState('');
  const [companyFilter, setCompanyFilter] = useState('');
  const [page, setPage]               = useState(1);
  const [modal, setModal]             = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(
    ['contacts', page, search, companyFilter],
    () => contactsAPI.list({ page, limit: 15, search, company_id: companyFilter }),
    { select: r => r.data, keepPreviousData: true }
  );

  const { data: companies } = useQuery('companiesAll', companiesAPI.all, { select: r => r.data });

  const deleteMut = useMutation(id => contactsAPI.delete(id), {
    onSuccess: () => {
      qc.invalidateQueries('contacts');
      qc.invalidateQueries('companies');
      toast.success('Contact deleted');
    },
  });

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Contacts</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {data?.pagination?.total || 0} total contacts
          </p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiPlus size={16} /> Add Contact
        </button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '12px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {/* Search input */}
        <div style={{ position: 'relative', flex: 1, minWidth: '200px' }}>
          <FiSearch
            size={15}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <input
            className="input"
            style={{ paddingLeft: '40px' }}
            placeholder="Search by name or phone..."
            value={search}
            onChange={e => { setSearch(e.target.value); setPage(1); }}
          />
        </div>

        {/* Company filter */}
        <div style={{ position: 'relative', minWidth: '180px' }}>
          <FiFilter
            size={15}
            style={{
              position: 'absolute',
              left: '14px',
              top: '50%',
              transform: 'translateY(-50%)',
              color: 'var(--text-muted)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <select
            className="input"
            style={{ paddingLeft: '40px' }}
            value={companyFilter}
            onChange={e => { setCompanyFilter(e.target.value); setPage(1); }}
          >
            <option value="">All Companies</option>
            {companies?.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Name', 'Phone', 'Company', 'Email', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{
                    padding: '12px 20px', textAlign: 'left',
                    fontSize: '11px', fontWeight: '600',
                    textTransform: 'uppercase', color: 'var(--text-muted)',
                  }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '16px 20px' }}>
                        <div style={{ height: '12px', borderRadius: '4px', background: 'var(--bg-hover)', animation: 'pulse 1.5s infinite' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.contacts?.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FiUser size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    No contacts yet. Add your first one!
                  </td>
                </tr>
              ) : (
                data?.contacts?.map(c => (
                  <tr key={c.id}
                    style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
                  >
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{
                          width: '32px', height: '32px', borderRadius: '50%',
                          background: '#6366f1', display: 'flex', alignItems: 'center',
                          justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px',
                          flexShrink: 0,
                        }}>
                          {(c.name || c.phone)?.charAt(0)?.toUpperCase()}
                        </div>
                        <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{c.name || '—'}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</td>
                    <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.company?.name || '—'}</td>
                    <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                    <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.location || '—'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{
                        padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '500',
                        background: c.status === 'active' ? '#22c55e30' : '#64748b30',
                        color: c.status === 'active' ? '#22c55e' : '#94a3b8',
                      }}>
                        {c.status}
                      </span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <button
                          onClick={() => setModal(c)}
                          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <FiEdit2 size={14} />
                        </button>
                        <button
                          onClick={() => { if (window.confirm('Delete this contact?')) deleteMut.mutate(c.id); }}
                          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                        >
                          <FiTrash2 size={14} />
                        </button>
                      </div>
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
              Page {page} of {data.pagination.pages}
            </p>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => setPage(p => p - 1)} disabled={page === 1} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>← Prev</button>
              <button onClick={() => setPage(p => p + 1)} disabled={page === data.pagination.pages} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '12px' }}>Next →</button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {modal && (
        <ContactModal
          contact={modal === 'add' ? null : modal}
          companies={companies || []}
          onClose={() => setModal(null)}
          onSaved={() => {
            qc.invalidateQueries('contacts');
            qc.invalidateQueries('companies');
            setModal(null);
          }}
        />
      )}
    </div>
  );
}

function ContactModal({ contact, companies, onClose, onSaved }) {
  const [form, setForm] = useState({
    company_id: contact?.company_id || '',
    phone:      contact?.phone      || '',
    name:       contact?.name       || '',
    email:      contact?.email      || '',
    location:   contact?.location   || '',
    notes:      contact?.notes      || '',
    status:     contact?.status     || 'active',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (contact) {
        await contactsAPI.update(contact.id, form);
        toast.success('Contact updated!');
      } else {
        await contactsAPI.create(form);
        toast.success('Contact added!');
      }
      onSaved();
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{contact ? 'Edit Contact' : 'Add Contact'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Company *</label>
            <select required className="input" value={form.company_id} onChange={e => setForm(f => ({ ...f, company_id: e.target.value }))}>
              <option value="">Select company...</option>
              {companies.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
            </select>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Phone *</label>
              <input required className="input" style={{ fontFamily: 'monospace' }} placeholder="+250 78X XXX XXX"
                value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Name</label>
              <input className="input" placeholder="John Doe"
                value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className="input" placeholder="john@email.com"
                value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '14px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Location</label>
              <input className="input" placeholder="Kigali"
                value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Saving...' : (contact ? 'Update Contact' : 'Add Contact')}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}