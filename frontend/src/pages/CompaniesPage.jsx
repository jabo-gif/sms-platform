import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from 'react-query';
import toast from 'react-hot-toast';
import {
  FiUsers, FiPlus, FiSearch, FiEdit2, FiTrash2,
  FiX, FiCheck, FiUser, FiChevronRight, FiPhone,
  FiMail, FiMapPin, FiArrowLeft, FiUpload, FiDownload
} from 'react-icons/fi';
import { companiesAPI, contactsAPI } from '../services/api';

export default function CompaniesPage() {
  const [search, setSearch]           = useState('');
  const [page, setPage]               = useState(1);
  const [modal, setModal]             = useState(null);
  const [viewCompany, setViewCompany] = useState(null);
  const qc = useQueryClient();

  const { data, isLoading } = useQuery(
    ['companies', page, search],
    () => companiesAPI.list({ page, limit: 15, search }),
    { select: r => r.data, keepPreviousData: true }
  );

  const deleteMut = useMutation(id => companiesAPI.delete(id), {
    onSuccess: () => { qc.invalidateQueries('companies'); toast.success('Company deleted'); },
  });

  if (viewCompany) {
    return (
      <CompanyDetail
        company={viewCompany}
        onBack={() => setViewCompany(null)}
        onEdit={() => setModal(viewCompany)}
      />
    );
  }

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '24px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>Companies</h1>
          <p style={{ fontSize: '14px', color: 'var(--text-muted)', marginTop: '4px' }}>{data?.pagination?.total || 0} total companies</p>
        </div>
        <button onClick={() => setModal('add')} className="btn-primary" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <FiPlus size={16} /> Add Company
        </button>
      </div>

      {/* Search */}
      <div style={{ position: 'relative', maxWidth: '400px', marginBottom: '20px' }}>
        <FiSearch size={15} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none', zIndex: 1 }} />
        <input className="input" style={{ paddingLeft: '40px' }} placeholder="Search companies..."
          value={search} onChange={e => { setSearch(e.target.value); setPage(1); }} />
      </div>

      {/* Table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Company', 'Phone', 'Email', 'Industry', 'Contacts', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                Array.from({ length: 5 }).map((_, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--border-light)' }}>
                    {Array.from({ length: 7 }).map((_, j) => (
                      <td key={j} style={{ padding: '16px 20px' }}>
                        <div style={{ height: '12px', borderRadius: '4px', background: 'var(--bg-hover)' }} />
                      </td>
                    ))}
                  </tr>
                ))
              ) : data?.companies?.length === 0 ? (
                <tr>
                  <td colSpan={7} style={{ padding: '48px 20px', textAlign: 'center', color: 'var(--text-muted)' }}>
                    <FiUsers size={32} style={{ margin: '0 auto 8px', display: 'block' }} />
                    No companies yet. Add your first one!
                  </td>
                </tr>
              ) : (
                data?.companies?.map(c => (
                  <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)', cursor: 'pointer' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                    <td style={{ padding: '16px 20px' }} onClick={() => setViewCompany(c)}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 'bold', fontSize: '14px', flexShrink: 0 }}>
                          {c.name?.charAt(0)?.toUpperCase()}
                        </div>
                        <div>
                          <p style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{c.name}</p>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>Click to view</p>
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone || '—'}</td>
                    <td style={{ padding: '16px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', background: 'var(--bg-hover)', color: 'var(--text-secondary)' }}>{c.industry}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                        <FiUser size={12} /><span style={{ fontSize: '12px', fontWeight: '600' }}>{c.contact_count || 0}</span>
                      </div>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <span style={{ padding: '4px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '500', background: c.status === 'active' ? '#22c55e20' : '#64748b20', color: c.status === 'active' ? '#22c55e' : '#94a3b8' }}>{c.status}</span>
                    </td>
                    <td style={{ padding: '16px 20px' }}>
                      <div style={{ display: 'flex', gap: '4px', alignItems: 'center' }}>
                        <button onClick={() => setViewCompany(c)} title="View"
                          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                          <FiChevronRight size={15} />
                        </button>
                        <button onClick={() => setModal(c)}
                          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                          <FiEdit2 size={14} />
                        </button>
                        <button onClick={() => { if (window.confirm('Delete this company and all its contacts?')) deleteMut.mutate(c.id); }}
                          style={{ padding: '6px', borderRadius: '8px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                          onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                          onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
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

      {modal && (
        <CompanyModal
          company={modal === 'add' ? null : modal}
          onClose={() => setModal(null)}
          onSaved={(newCompany) => {
            qc.invalidateQueries('companies');
            setModal(null);
            if (!modal || modal === 'add') setViewCompany(newCompany);
          }}
        />
      )}
    </div>
  );
}

// ─── Company Detail ───────────────────────────────────────────────────────────
function CompanyDetail({ company, onBack, onEdit }) {
  const [contactModal, setContactModal] = useState(false);
  const [editContact, setEditContact]   = useState(null);
  const [importing, setImporting]       = useState(false);
  const fileRef = useRef();
  const qc = useQueryClient();

  const { data: contacts, isLoading } = useQuery(
    ['contacts', company.id],
    () => contactsAPI.list({ company_id: company.id, limit: 200 }),
    { select: r => r.data }
  );

  const { data: companyData } = useQuery(
    ['company', company.id],
    () => companiesAPI.get(company.id),
    { select: r => r.data }
  );

  const current = companyData || company;

  const deleteMut = useMutation(id => contactsAPI.delete(id), {
    onSuccess: () => { qc.invalidateQueries(['contacts', company.id]); qc.invalidateQueries('companies'); toast.success('Contact deleted'); },
  });

  // ── CSV Import ──────────────────────────────────────────────────────────────
  const handleImport = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    e.target.value = '';

    const text = await file.text();
    const lines = text.trim().split('\n');
    if (lines.length < 2) { toast.error('CSV file is empty'); return; }

    // Detect header
    const headers = lines[0].toLowerCase().split(',').map(h => h.trim().replace(/"/g, ''));
    const phoneIdx    = headers.findIndex(h => ['phone','mobile','tel','telephone','number'].includes(h));
    const nameIdx     = headers.findIndex(h => ['name','full_name','fullname','contact_name'].includes(h));
    const emailIdx    = headers.findIndex(h => ['email','mail'].includes(h));
    const locationIdx = headers.findIndex(h => ['location','city','address','district'].includes(h));

    if (phoneIdx === -1) { toast.error('CSV must have a "phone" column'); return; }

    setImporting(true);
    let success = 0, failed = 0;

    for (let i = 1; i < lines.length; i++) {
      const cols = lines[i].split(',').map(c => c.trim().replace(/"/g, ''));
      const phone = cols[phoneIdx];
      if (!phone) continue;
      try {
        await contactsAPI.create({
          company_id: company.id,
          phone,
          name:     nameIdx     !== -1 ? cols[nameIdx]     : '',
          email:    emailIdx    !== -1 ? cols[emailIdx]    : '',
          location: locationIdx !== -1 ? cols[locationIdx] : '',
        });
        success++;
      } catch { failed++; }
    }

    setImporting(false);
    qc.invalidateQueries(['contacts', company.id]);
    qc.invalidateQueries('companies');
    toast.success(`✅ Imported ${success} contacts${failed > 0 ? `, ${failed} failed` : ''}`);
  };

  // ── Download contacts as CSV ────────────────────────────────────────────────
  const downloadContacts = () => {
    const rows = contacts?.contacts || [];
    if (!rows.length) { toast.error('No contacts to download'); return; }
    const header = 'name,phone,email,location,status';
    const csv = rows.map(c => `${c.name||''},${c.phone},${c.email||''},${c.location||''},${c.status}`).join('\n');
    const blob = new Blob([header + '\n' + csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = `${current.name}_contacts.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Contacts downloaded!');
  };

  // ── Download CSV template ───────────────────────────────────────────────────
  const downloadTemplate = () => {
    const csv = 'name,phone,email,location\nJohn Doe,+250781234567,john@email.com,Kigali\nJane Smith,+250789876543,jane@email.com,Musanze';
    const blob = new Blob([csv], { type: 'text/csv' });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement('a');
    a.href     = url;
    a.download = 'contacts_template.csv';
    a.click();
    URL.revokeObjectURL(url);
    toast.success('Template downloaded!');
  };

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto' }}>
      {/* Back */}
      <button onClick={onBack}
        style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', fontSize: '14px', marginBottom: '20px', padding: 0 }}
        onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
        <FiArrowLeft size={16} /> Back to Companies
      </button>

      {/* Company info */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '16px', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{ width: '56px', height: '56px', borderRadius: '14px', background: '#6366f120', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#6366f1', fontWeight: 'bold', fontSize: '22px' }}>
              {current.name?.charAt(0)?.toUpperCase()}
            </div>
            <div>
              <h2 style={{ fontSize: '20px', fontWeight: 'bold', color: 'var(--text-primary)', margin: 0 }}>{current.name}</h2>
              <span style={{ display: 'inline-block', marginTop: '4px', padding: '3px 10px', borderRadius: '8px', fontSize: '11px', background: '#6366f120', color: '#6366f1' }}>{current.industry}</span>
            </div>
          </div>
          <button onClick={onEdit} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <FiEdit2 size={14} /> Edit
          </button>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '16px', marginTop: '20px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
          {[
            { icon: FiPhone,  label: 'Phone',    value: current.phone   || '—' },
            { icon: FiMail,   label: 'Email',    value: current.email   || '—' },
            { icon: FiMapPin, label: 'Address',  value: current.address || '—' },
            { icon: FiUser,   label: 'Contacts', value: `${current.contact_count || 0} contacts` },
          ].map(({ icon: Icon, label, value }) => (
            <div key={label} style={{ display: 'flex', alignItems: 'flex-start', gap: '10px' }}>
              <Icon size={16} style={{ color: 'var(--text-muted)', marginTop: '2px', flexShrink: 0 }} />
              <div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: 0 }}>{label}</p>
                <p style={{ fontSize: '13px', color: 'var(--text-primary)', margin: '2px 0 0', fontWeight: '500' }}>{value}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Contacts header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
        <h3 style={{ fontSize: '18px', fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>
          Contacts <span style={{ color: 'var(--text-muted)', fontWeight: '400', fontSize: '14px' }}>({contacts?.pagination?.total || 0})</span>
        </h3>
        <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
          {/* Download template */}
          <button onClick={downloadTemplate} className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}
            title="Download CSV template">
            <FiDownload size={13} /> Template
          </button>

          {/* Import CSV */}
          <button onClick={() => fileRef.current?.click()} className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px', opacity: importing ? 0.6 : 1 }}
            disabled={importing}>
            <FiUpload size={13} /> {importing ? 'Importing...' : 'Import CSV'}
          </button>
          <input ref={fileRef} type="file" accept=".csv" style={{ display: 'none' }} onChange={handleImport} />

          {/* Download contacts */}
          <button onClick={downloadContacts} className="btn-secondary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '12px', padding: '8px 14px' }}>
            <FiDownload size={13} /> Export
          </button>

          {/* Add contact */}
          <button onClick={() => setContactModal(true)} className="btn-primary"
            style={{ display: 'flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
            <FiPlus size={14} /> Add Contact
          </button>
        </div>
      </div>


      {/* Contacts table */}
      <div className="card" style={{ padding: 0, overflow: 'hidden' }}>
        {isLoading ? (
          <div style={{ padding: '40px', textAlign: 'center', color: 'var(--text-muted)' }}>Loading contacts...</div>
        ) : contacts?.contacts?.length === 0 ? (
          <div style={{ padding: '48px 20px', textAlign: 'center' }}>
            <FiUser size={36} style={{ color: 'var(--text-muted)', margin: '0 auto 12px', display: 'block' }} />
            <p style={{ color: 'var(--text-primary)', fontWeight: '600', margin: '0 0 6px' }}>No contacts yet</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '13px', margin: '0 0 16px' }}>Add manually or import a CSV file</p>
            <div style={{ display: 'flex', gap: '8px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button onClick={() => fileRef.current?.click()} className="btn-secondary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <FiUpload size={13} /> Import CSV
              </button>
              <button onClick={() => setContactModal(true)} className="btn-primary"
                style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', fontSize: '13px' }}>
                <FiPlus size={13} /> Add Manually
              </button>
            </div>
          </div>
        ) : (
          <table style={{ width: '100%', fontSize: '14px', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['#', 'Name', 'Phone', 'Email', 'Location', 'Status', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 20px', textAlign: 'left', fontSize: '11px', fontWeight: '600', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {contacts?.contacts?.map((c, idx) => (
                <tr key={c.id} style={{ borderBottom: '1px solid var(--border-light)' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--bg-hover)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-muted)' }}>{idx + 1}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <div style={{ width: '30px', height: '30px', borderRadius: '50%', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 'bold', fontSize: '12px', flexShrink: 0 }}>
                        {(c.name || c.phone)?.charAt(0)?.toUpperCase()}
                      </div>
                      <span style={{ fontWeight: '500', color: 'var(--text-primary)' }}>{c.name || '—'}</span>
                    </div>
                  </td>
                  <td style={{ padding: '14px 20px', fontFamily: 'monospace', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.phone}</td>
                  <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.email || '—'}</td>
                  <td style={{ padding: '14px 20px', fontSize: '12px', color: 'var(--text-secondary)' }}>{c.location || '—'}</td>
                  <td style={{ padding: '14px 20px' }}>
                    <span style={{ padding: '3px 10px', borderRadius: '8px', fontSize: '11px', fontWeight: '500', background: c.status === 'active' ? '#22c55e20' : '#64748b20', color: c.status === 'active' ? '#22c55e' : '#94a3b8' }}>
                      {c.status}
                    </span>
                  </td>
                  <td style={{ padding: '14px 20px' }}>
                    <div style={{ display: 'flex', gap: '6px' }}>
                      <button onClick={() => setEditContact(c)}
                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#6366f1'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <FiEdit2 size={13} />
                      </button>
                      <button onClick={() => { if (window.confirm('Delete contact?')) deleteMut.mutate(c.id); }}
                        style={{ padding: '5px', borderRadius: '6px', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--text-muted)' }}
                        onMouseEnter={e => e.currentTarget.style.color = '#ef4444'}
                        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}>
                        <FiTrash2 size={13} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {(contactModal || editContact) && (
        <ContactModal
          contact={editContact}
          companyId={company.id}
          onClose={() => { setContactModal(false); setEditContact(null); }}
          onSaved={() => { qc.invalidateQueries(['contacts', company.id]); qc.invalidateQueries('companies'); setContactModal(false); setEditContact(null); }}
        />
      )}
    </div>
  );
}

// ─── Modals ───────────────────────────────────────────────────────────────────
const INDUSTRIES = ['Technology','Finance','Healthcare','Education','Retail','Agriculture','Transport','Hospitality','Government','NGO','Real Estate','Other'];

function CompanyModal({ company, onClose, onSaved }) {
  const [form, setForm] = useState({ name: company?.name||'', phone: company?.phone||'', email: company?.email||'', address: company?.address||'', industry: company?.industry||'Other', notes: company?.notes||'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      let result;
      if (company) { result = await companiesAPI.update(company.id, form); toast.success('Company updated!'); }
      else         { result = await companiesAPI.create(form); toast.success('Company added! Now add contacts 👇'); }
      onSaved(result?.data || company);
    } finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '440px', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{company ? 'Edit Company' : 'Add Company'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Company Name *</label>
            <input required className="input" placeholder="e.g. Acme Rwanda Ltd" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Phone</label>
              <input className="input" placeholder="+250 78X XXX XXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className="input" placeholder="info@company.rw" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Industry</label>
            <select className="input" value={form.industry} onChange={e => setForm(f => ({ ...f, industry: e.target.value }))}>
              {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
            </select>
          </div>
          <div style={{ marginBottom: '14px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Address</label>
            <input className="input" placeholder="Kigali, Rwanda" value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} />
          </div>
          <div style={{ marginBottom: '20px' }}>
            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Notes</label>
            <textarea className="input" rows={2} style={{ resize: 'none' }} placeholder="Optional notes..." value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} />
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Saving...' : company ? 'Update Company' : 'Save & Add Contacts →'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

function ContactModal({ contact, companyId, onClose, onSaved }) {
  const [form, setForm] = useState({ company_id: companyId||contact?.company_id||'', phone: contact?.phone||'', name: contact?.name||'', email: contact?.email||'', location: contact?.location||'' });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault(); setLoading(true);
    try {
      if (contact) { await contactsAPI.update(contact.id, form); toast.success('Contact updated!'); }
      else         { await contactsAPI.create(form); toast.success('Contact added!'); }
      onSaved();
    } catch (err) { toast.error(err.response?.data?.message || 'Failed'); }
    finally { setLoading(false); }
  };

  return (
    <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 50, padding: '16px' }}>
      <div style={{ width: '100%', maxWidth: '420px', borderRadius: '16px', overflow: 'hidden', background: 'var(--bg-secondary)', border: '1px solid var(--border)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '20px', borderBottom: '1px solid var(--border)' }}>
          <h3 style={{ fontWeight: '600', color: 'var(--text-primary)', margin: 0 }}>{contact ? 'Edit Contact' : 'Add Contact'}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}><FiX size={20} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '20px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '14px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Phone *</label>
              <input required className="input" style={{ fontFamily: 'monospace' }} placeholder="+250 78X XXX XXX" value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Full Name</label>
              <input className="input" placeholder="John Doe" value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Email</label>
              <input type="email" className="input" placeholder="john@email.com" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', marginBottom: '6px', color: 'var(--text-secondary)' }}>Location</label>
              <input className="input" placeholder="Kigali" value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))} />
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button type="button" onClick={onClose} className="btn-secondary" style={{ flex: 1 }}>Cancel</button>
            <button type="submit" disabled={loading} className="btn-primary" style={{ flex: 1 }}>
              {loading ? 'Saving...' : contact ? 'Update' : 'Add Contact'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}