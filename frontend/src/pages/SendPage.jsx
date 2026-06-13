import React, { useState } from 'react';
import { useQuery, useMutation } from 'react-query';
import toast from 'react-hot-toast';
import {
  FiSend, FiUsers, FiCheck, FiMessageSquare,
  FiMessageCircle, FiCalendar, FiZap, FiX
} from 'react-icons/fi';
import { companiesAPI, contactsAPI, messagesAPI } from '../services/api';

const MSG_TYPES = [
  { value: 'Promotion',        emoji: '📢', color: '#6366f1' },
  { value: 'Alert',            emoji: '🔔', color: '#ef4444' },
  { value: 'Update',           emoji: '📋', color: '#22c55e' },
  { value: 'Announcement',     emoji: '🎉', color: '#f59e0b' },
  { value: 'OTP',              emoji: '🔐', color: '#8b5cf6' },
  { value: 'Payment Reminder', emoji: '💰', color: '#14b8a6' },
  { value: 'Delivery Update',  emoji: '📦', color: '#3b82f6' },
  { value: 'Welcome',          emoji: '👋', color: '#ec4899' },
  { value: 'Other',            emoji: '✉️',  color: '#64748b' },
];

const CHANNELS = [
  { value: 'SMS',       icon: FiMessageSquare, label: 'SMS Only',       color: '#6366f1' },
  { value: 'WhatsApp',  icon: FiMessageCircle, label: 'WhatsApp Only',  color: '#22c55e' },
  { value: 'Both',      icon: FiZap,           label: 'SMS + WhatsApp', color: '#f59e0b' },
];

const charCount = txt => txt.length;
const smsParts  = txt => {
  const isUni = /[^\x00-\x7F]/.test(txt);
  const len   = txt.length;
  return isUni ? (len <= 70 ? 1 : Math.ceil(len / 67)) : (len <= 160 ? 1 : Math.ceil(len / 153));
};

export default function SendPage() {
  const [companyId,    setCompanyId]    = useState('');
  const [contacts,     setContacts]     = useState([]);
  const [selectedAll,  setSelectedAll]  = useState(false);
  const [selectedIds,  setSelectedIds]  = useState([]);
  const [message,      setMessage]      = useState('');
  const [msgType,      setMsgType]      = useState('');
  const [channel,      setChannel]      = useState('');
  const [sendMode,     setSendMode]     = useState('now');  // now | schedule
  const [scheduledAt,  setScheduledAt]  = useState('');
  const [result,       setResult]       = useState(null);

  // Load companies
  const { data: companies } = useQuery('companiesAll', companiesAPI.all, { select: r => r.data });

  // Load contacts when company changes
  const { data: companyContacts, isLoading: loadingContacts } = useQuery(
    ['contactsByCompany', companyId],
    () => contactsAPI.byCompany(companyId),
    {
      enabled: !!companyId,
      select: r => r.data,
      onSuccess: (data) => {
        setContacts(data);
        setSelectedIds([]);
        setSelectedAll(false);
      },
    }
  );

  const sendMutation = useMutation(messagesAPI.send, {
    onSuccess: (res) => {
      setResult(res.data);
      toast.success(res.message);
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || 'Send failed');
    },
  });

  const toggleContact = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]
    );
  };

  const toggleAll = () => {
    if (selectedAll) {
      setSelectedIds([]);
      setSelectedAll(false);
    } else {
      setSelectedIds(companyContacts?.map(c => c.id) || []);
      setSelectedAll(true);
    }
  };

  const handleSend = () => {
    if (!companyId)           return toast.error('Please select a company');
    if (!selectedIds.length)  return toast.error('Please select at least one contact');
    if (!message.trim())      return toast.error('Please write a message');
    if (!msgType)             return toast.error('Please select message type');
    if (!channel)             return toast.error('Please select channel');
    if (sendMode === 'schedule' && !scheduledAt) return toast.error('Please select date and time');

    sendMutation.mutate({
      company_id:  companyId,
      contact_ids: selectedIds,
      content:     message,
      type:        msgType,
      channel,
      scheduled_at: sendMode === 'schedule' ? scheduledAt : null,
    });
  };

  const reset = () => {
    setMessage(''); setMsgType(''); setChannel('');
    setSelectedIds([]); setSelectedAll(false);
    setResult(null); setSendMode('now'); setScheduledAt('');
  };

  // Result screen
  if (result) {
    return (
      <div className="max-w-lg mx-auto space-y-5">
        <div className="card text-center py-8">
          <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiCheck size={28} className="text-green-400" />
          </div>
          <h2 className="text-xl font-bold mb-1" style={{ color: 'var(--text-primary)' }}>Messages Sent!</h2>
          <p className="text-sm mb-6" style={{ color: 'var(--text-muted)' }}>
            Sent: <strong className="text-green-400">{result.sent}</strong>
            {result.failed > 0 && <> · Failed: <strong className="text-red-400">{result.failed}</strong></>}
          </p>

          {/* Details */}
          <div className="text-left space-y-2 max-h-48 overflow-y-auto mb-6">
            {result.details?.map((d, i) => (
              <div key={i} className="flex items-center justify-between px-3 py-2 rounded-xl text-sm"
                style={{ background: 'var(--bg-input)' }}>
                <span style={{ color: 'var(--text-secondary)' }}>{d.name || d.phone}</span>
                <div className="flex gap-3 text-xs">
                  <span>SMS {d.sms}</span>
                  <span>WA {d.wa}</span>
                </div>
              </div>
            ))}
          </div>

          <div className="flex gap-3">
            <button onClick={reset} className="btn-secondary flex-1">Send Another</button>
            <button onClick={() => window.location.href = '/history'} className="btn-primary flex-1">View History</button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      <div>
        <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>Send Message</h1>
        <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>Compose and send SMS or WhatsApp messages</p>
      </div>

      {/* Step 1 — Select Company */}
      <Section number="1" title="Select Company">
        <select className="input" value={companyId}
          onChange={e => { setCompanyId(e.target.value); setSelectedIds([]); setSelectedAll(false); }}>
          <option value="">Choose a company...</option>
          {companies?.map(c => (
            <option key={c.id} value={c.id}>{c.name} ({c.contact_count} contacts)</option>
          ))}
        </select>
      </Section>

      {/* Step 2 — Select Contacts */}
      {companyId && (
        <Section number="2" title="Select Recipients">
          {loadingContacts ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>Loading contacts...</p>
          ) : !companyContacts?.length ? (
            <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
              No contacts in this company.{' '}
              <a href="/contacts" style={{ color: 'var(--accent)' }}>Add contacts →</a>
            </p>
          ) : (
            <>
              {/* Select all */}
              <button onClick={toggleAll}
                className="flex items-center gap-2 text-sm font-medium mb-3 transition-all"
                style={{ color: selectedAll ? 'var(--accent)' : 'var(--text-secondary)' }}>
                <div className={`w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
                  selectedAll ? 'border-indigo-500 bg-indigo-600' : ''}`}
                  style={{ borderColor: selectedAll ? '' : 'var(--border)' }}>
                  {selectedAll && <FiCheck size={11} className="text-white" />}
                </div>
                Select All ({companyContacts.length} contacts)
              </button>

              {/* Contact list */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-56 overflow-y-auto pr-1">
                {companyContacts.map(c => {
                  const sel = selectedIds.includes(c.id);
                  return (
                    <button key={c.id} onClick={() => toggleContact(c.id)}
                      className="flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all"
                      style={{
                        borderColor: sel ? 'var(--accent)' : 'var(--border)',
                        background:  sel ? 'var(--accent)' + '15' : 'var(--bg-input)',
                      }}>
                      <div className={`w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all ${
                        sel ? 'bg-indigo-600 border-indigo-600' : ''}`}
                        style={{ borderColor: sel ? '' : 'var(--border)' }}>
                        {sel && <FiCheck size={11} className="text-white" />}
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate" style={{ color: 'var(--text-primary)' }}>
                          {c.name || c.phone}
                        </p>
                        <p className="text-xs font-mono truncate" style={{ color: 'var(--text-muted)' }}>{c.phone}</p>
                      </div>
                    </button>
                  );
                })}
              </div>

              {selectedIds.length > 0 && (
                <p className="text-xs mt-2" style={{ color: 'var(--accent)' }}>
                  ✅ {selectedIds.length} contact{selectedIds.length > 1 ? 's' : ''} selected
                </p>
              )}
            </>
          )}
        </Section>
      )}

      {/* Step 3 — Message Type */}
      <Section number="3" title="Message Type">
        <div className="grid grid-cols-3 sm:grid-cols-5 gap-2">
          {MSG_TYPES.map(t => (
            <button key={t.value} onClick={() => setMsgType(t.value)}
              className="flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all text-center"
              style={{
                borderColor:  msgType === t.value ? t.color : 'var(--border)',
                background:   msgType === t.value ? t.color + '15' : 'var(--bg-input)',
              }}>
              <span className="text-lg">{t.emoji}</span>
              <span className="text-xs font-medium leading-tight" style={{
                color: msgType === t.value ? t.color : 'var(--text-secondary)'
              }}>{t.value}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Step 4 — Channel */}
      <Section number="4" title="Channel">
        <div className="grid grid-cols-3 gap-3">
          {CHANNELS.map(({ value, icon: Icon, label, color }) => (
            <button key={value} onClick={() => setChannel(value)}
              className="flex flex-col items-center gap-2 p-4 rounded-xl border-2 transition-all"
              style={{
                borderColor: channel === value ? color : 'var(--border)',
                background:  channel === value ? color + '15' : 'var(--bg-input)',
              }}>
              <Icon size={22} style={{ color: channel === value ? color : 'var(--text-muted)' }} />
              <span className="text-xs font-medium text-center" style={{
                color: channel === value ? color : 'var(--text-secondary)'
              }}>{label}</span>
            </button>
          ))}
        </div>
      </Section>

      {/* Step 5 — Message */}
      <Section number="5" title="Message">
        <textarea className="input resize-none" rows={5}
          placeholder="Type your message here... e.g. Dear {{name}}, you have a new update."
          value={message} onChange={e => setMessage(e.target.value)} />
        <div className="flex justify-between mt-1.5 text-xs" style={{ color: 'var(--text-muted)' }}>
          <span>Keep it clear and concise</span>
          <div className="flex gap-3">
            <span className={charCount(message) > 160 ? 'text-amber-400' : ''}>{charCount(message)} chars</span>
            <span className={smsParts(message) > 1 ? 'text-amber-400' : ''}>{smsParts(message)} SMS part{smsParts(message) > 1 ? 's' : ''}</span>
          </div>
        </div>
      </Section>

      {/* Step 6 — When to send */}
      <Section number="6" title="When to Send">
        <div className="grid grid-cols-2 gap-3">
          {[
            { value: 'now',      icon: FiZap,      label: 'Send Now',    desc: 'Deliver immediately' },
            { value: 'schedule', icon: FiCalendar, label: 'Schedule',    desc: 'Pick a date & time' },
          ].map(opt => {
            const Icon = opt.icon;
            const sel  = sendMode === opt.value;
            return (
              <button key={opt.value} onClick={() => setSendMode(opt.value)}
                className="flex items-center gap-3 p-4 rounded-xl border-2 text-left transition-all"
                style={{
                  borderColor: sel ? 'var(--accent)' : 'var(--border)',
                  background:  sel ? 'var(--accent)' + '15' : 'var(--bg-input)',
                }}>
                <div className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: sel ? 'var(--accent)' : 'var(--bg-hover)' }}>
                  <Icon size={17} style={{ color: sel ? 'white' : 'var(--text-muted)' }} />
                </div>
                <div>
                  <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{opt.label}</p>
                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>{opt.desc}</p>
                </div>
              </button>
            );
          })}
        </div>

        {sendMode === 'schedule' && (
          <div className="mt-3">
            <input type="datetime-local" className="input"
              value={scheduledAt}
              min={new Date(Date.now() + 60000).toISOString().slice(0, 16)}
              onChange={e => setScheduledAt(e.target.value)} />
          </div>
        )}
      </Section>

      {/* Summary + Send Button */}
      {selectedIds.length > 0 && message && msgType && channel && (
        <div className="card" style={{ background: 'var(--accent)' + '10', borderColor: 'var(--accent)' + '40' }}>
          <p className="text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>Ready to send</p>
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
            <strong style={{ color: 'var(--text-primary)' }}>{selectedIds.length}</strong> recipient{selectedIds.length > 1 ? 's' : ''} ·
            <strong style={{ color: 'var(--text-primary)' }}> {msgType}</strong> ·
            <strong style={{ color: 'var(--text-primary)' }}> {channel}</strong> ·
            {sendMode === 'now' ? ' Send immediately' : ` Scheduled: ${new Date(scheduledAt).toLocaleString()}`}
          </p>
        </div>
      )}

      <button onClick={handleSend} disabled={sendMutation.isLoading} className="btn-primary w-full py-4 text-base flex items-center justify-center gap-2">
        {sendMutation.isLoading
          ? <><Spinner /> Sending...</>
          : <><FiSend size={18} /> {sendMode === 'now' ? 'Send Now' : 'Schedule Message'}</>}
      </button>
    </div>
  );
}

const Section = ({ number, title, children }) => (
  <div className="card space-y-3">
    <div className="flex items-center gap-3">
      <div className="w-7 h-7 bg-indigo-600 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
        {number}
      </div>
      <h3 className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</h3>
    </div>
    {children}
  </div>
);

const Spinner = () => <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />;
