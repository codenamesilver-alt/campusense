import { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { fetchAllFiltered } from "@/lib/fetchAll";
import { motion } from "framer-motion";
import { Printer, Search, CreditCard, Users, School, Link as LinkIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

// -- Shared template renderer (returns an HTML string for printing) --
function buildCardHTML(student, school, templateId) {
  const name = `${student.first_name} ${student.last_name}`;
  const cls = student.class || '—';
  const sec = student.section || '—';
  const blood = student.blood_group || '—';
  const adm = student.admission_number || '—';
  const emergency = student.guardian_phone || '—';
  const photo = student.photo_url ? `<img src="${student.photo_url}" style="width:100%;height:100%;object-fit:cover;border-radius:inherit" />` : '<span style="font-size:8px;color:rgba(255,255,255,0.4)">PHOTO</span>';
  const schoolName = school.name || 'SCHOOL NAME';
  const logoHtml = school.logo_url ? `<img src="${school.logo_url}" style="width:100%;height:100%;object-fit:contain" />` : `<svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>`;

  const templates = {
    neon_vertical: `<div style="width:200px;height:360px;background:#fff;border:2px solid #00f5ff;border-radius:16px;overflow:hidden;position:relative;font-family:monospace;color:#111;box-shadow:0 0 24px rgba(0,245,255,0.2);">
      <div style="position:absolute;top:0;left:0;right:0;height:6px;background:linear-gradient(90deg,#00f5ff,#a855f7,#00ff88)"></div>
      <div style="text-align:center;padding:16px 12px 8px">
        <div style="width:40px;height:40px;border-radius:8px;background:rgba(0,245,255,0.08);border:1px solid rgba(0,245,255,0.4);margin:0 auto 6px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#00a0b0">${logoHtml}</div>
        <p style="font-size:9px;color:#00a0b0;letter-spacing:2px;font-weight:bold;text-transform:uppercase;margin:0">${schoolName}</p>
        <p style="font-size:7px;color:rgba(0,0,0,0.4);margin:2px 0 0">STUDENT IDENTITY CARD</p>
      </div>
      <div style="display:flex;justify-content:center;padding:4px 0">
        <div style="width:64px;height:64px;border-radius:10px;border:2px solid #00f5ff;background:rgba(0,245,255,0.05);display:flex;align-items:center;justify-content:center;overflow:hidden">${photo}</div>
      </div>
      <div style="padding:10px 14px;text-align:center">
        <p style="font-size:11px;font-weight:bold;color:#111;margin:0 0 2px;letter-spacing:1px">${name}</p>
        <p style="font-size:8px;color:#a855f7;margin:0 0 8px">ADM: ${adm}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:4px">
          <div style="background:#f0fdff;border:1px solid rgba(0,245,255,0.3);border-radius:6px;padding:4px 6px"><p style="font-size:6px;color:rgba(0,0,0,0.4);margin:0">CLASS</p><p style="font-size:9px;color:#007a8a;margin:0;font-weight:bold">${cls}</p></div>
          <div style="background:#f0fdff;border:1px solid rgba(0,245,255,0.3);border-radius:6px;padding:4px 6px"><p style="font-size:6px;color:rgba(0,0,0,0.4);margin:0">SEC</p><p style="font-size:9px;color:#007a8a;margin:0;font-weight:bold">${sec}</p></div>
          <div style="background:#f0fdff;border:1px solid rgba(0,245,255,0.3);border-radius:6px;padding:4px 6px"><p style="font-size:6px;color:rgba(0,0,0,0.4);margin:0">BLOOD</p><p style="font-size:9px;color:#007a8a;margin:0;font-weight:bold">${blood}</p></div>
          <div style="background:#f0fdff;border:1px solid rgba(0,245,255,0.3);border-radius:6px;padding:4px 6px"><p style="font-size:6px;color:rgba(0,0,0,0.4);margin:0">YEAR</p><p style="font-size:9px;color:#007a8a;margin:0;font-weight:bold">2024</p></div>
        </div>
        <div style="margin-top:8px;padding:5px 8px;background:rgba(255,0,110,0.07);border:1px solid rgba(255,0,110,0.3);border-radius:6px">
          <p style="font-size:6px;color:rgba(200,0,80,0.7);margin:0">EMERGENCY</p>
          <p style="font-size:9px;color:#cc005a;margin:0;font-weight:bold">${emergency}</p>
        </div>
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#a855f7,#00f5ff)"></div>
    </div>`,

    classic_horizontal: `<div style="width:320px;height:190px;background:#fff;border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;position:relative;font-family:sans-serif;box-shadow:0 4px 24px rgba(0,0,0,0.12);">
      <div style="position:absolute;left:0;top:0;bottom:0;width:80px;background:linear-gradient(180deg,#1e3a8a,#3b82f6);display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px">
        <div style="width:44px;height:44px;border-radius:50%;border:2px solid rgba(255,255,255,0.5);background:rgba(255,255,255,0.1);display:flex;align-items:center;justify-content:center;overflow:hidden;color:#fff">${logoHtml}</div>
        <div style="width:56px;height:56px;border-radius:8px;border:2px solid rgba(255,255,255,0.6);background:rgba(255,255,255,0.15);display:flex;align-items:center;justify-content:center;overflow:hidden">${photo}</div>
      </div>
      <div style="margin-left:88px;padding:14px 14px 10px 0">
        <p style="font-size:10px;font-weight:800;color:#1e3a8a;text-transform:uppercase;margin:0;letter-spacing:1px">${schoolName}</p>
        <p style="font-size:7px;color:#6b7280;margin:1px 0 8px;letter-spacing:1px">STUDENT IDENTITY CARD</p>
        <p style="font-size:13px;font-weight:700;color:#111827;margin:0 0 1px">${name}</p>
        <p style="font-size:8px;color:#3b82f6;margin:0 0 8px">Admission: ${adm}</p>
        <div style="display:flex;gap:6px;flex-wrap:wrap;margin-bottom:6px">
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:4px;padding:2px 6px"><span style="font-size:7px;color:#0369a1">Class: </span><span style="font-size:7px;font-weight:700;color:#0369a1">${cls}-${sec}</span></div>
          <div style="background:#f0f9ff;border:1px solid #bae6fd;border-radius:4px;padding:2px 6px"><span style="font-size:7px;color:#0369a1">Blood: </span><span style="font-size:7px;font-weight:700;color:#0369a1">${blood}</span></div>
        </div>
        <div style="display:flex;align-items:center;gap:4px">
          <div style="width:8px;height:8px;border-radius:50%;background:#ef4444"></div>
          <span style="font-size:8px;color:#374151">Emergency: </span>
          <span style="font-size:8px;font-weight:700;color:#ef4444">${emergency}</span>
        </div>
      </div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:4px;background:linear-gradient(90deg,#1e3a8a,#3b82f6,#1e3a8a)"></div>
    </div>`,

    emerald_vertical: `<div style="width:200px;height:360px;background:#fff;border:2px solid #059669;border-radius:16px;overflow:hidden;position:relative;font-family:sans-serif;">
      <div style="background:linear-gradient(90deg,#064e3b,#059669);padding:16px 12px 12px;text-align:center">
        <div style="width:44px;height:44px;border-radius:50%;background:rgba(255,255,255,0.2);border:2px solid rgba(255,255,255,0.6);margin:0 auto 6px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#fff">${logoHtml}</div>
        <p style="font-size:9px;color:#fff;font-weight:800;margin:0;text-transform:uppercase;letter-spacing:1px">${schoolName}</p>
        <p style="font-size:7px;color:rgba(255,255,255,0.7);margin:2px 0 0">Identity Card</p>
      </div>
      <div style="display:flex;justify-content:center;margin-top:-24px">
        <div style="width:70px;height:70px;border-radius:50%;border:3px solid #059669;background:#f0fdf4;display:flex;align-items:center;justify-content:center;overflow:hidden">${photo}</div>
      </div>
      <div style="padding:10px 16px;text-align:center">
        <p style="font-size:12px;font-weight:700;color:#111;margin:0 0 2px">${name}</p>
        <p style="font-size:8px;color:#6b7280;margin:0 0 10px">ADM NO: ${adm}</p>
        <div style="background:#f0fdf4;border:1px solid rgba(5,150,105,0.2);border-radius:8px;padding:8px 10px;margin-bottom:8px">
          <div style="display:flex;justify-content:space-between;margin-bottom:4px"><span style="font-size:8px;color:#6b7280">Class &amp; Section</span><span style="font-size:8px;color:#064e3b;font-weight:700">${cls} - ${sec}</span></div>
          <div style="display:flex;justify-content:space-between"><span style="font-size:8px;color:#6b7280">Blood Group</span><span style="font-size:8px;color:#064e3b;font-weight:700">${blood}</span></div>
        </div>
        <div style="background:rgba(245,158,11,0.08);border:1px solid rgba(245,158,11,0.4);border-radius:6px;padding:5px 8px">
          <p style="font-size:6px;color:rgba(180,120,0,0.8);margin:0">EMERGENCY CONTACT</p>
          <p style="font-size:9px;color:#b45309;font-weight:700;margin:0">${emergency}</p>
        </div>
      </div>
    </div>`,

    royal_horizontal: `<div style="width:320px;height:190px;background:#fff;border:2px solid #9f1239;border-radius:14px;overflow:hidden;position:relative;font-family:Georgia,serif;">
      <div style="position:absolute;top:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#b8860b,#ffd700,#b8860b)"></div>
      <div style="position:absolute;bottom:0;left:0;right:0;height:3px;background:linear-gradient(90deg,#b8860b,#ffd700,#b8860b)"></div>
      <div style="display:flex;height:100%;align-items:center;padding:0 16px 0 12px">
        <div style="display:flex;flex-direction:column;align-items:center;gap:8px;margin-right:14px">
          <div style="width:44px;height:44px;border-radius:8px;border:2px solid #9f1239;background:rgba(159,18,57,0.06);display:flex;align-items:center;justify-content:center;overflow:hidden;color:#9f1239">${logoHtml}</div>
          <div style="width:60px;height:60px;border-radius:8px;border:2px solid #9f1239;background:#fff5f7;display:flex;align-items:center;justify-content:center;overflow:hidden">${photo}</div>
        </div>
        <div style="flex:1">
          <p style="font-size:11px;font-weight:700;color:#9f1239;margin:0 0 1px;letter-spacing:1px;text-transform:uppercase">${schoolName}</p>
          <p style="font-size:7px;color:rgba(159,18,57,0.5);margin:0 0 8px;letter-spacing:2px">STUDENT IDENTITY CARD</p>
          <div style="width:60px;height:1px;background:linear-gradient(90deg,#9f1239,transparent);margin-bottom:8px"></div>
          <p style="font-size:13px;font-weight:700;color:#111;margin:0 0 2px">${name}</p>
          <p style="font-size:8px;color:#be123c;margin:0 0 8px">ADM: ${adm}</p>
          <div style="display:flex;gap:8px;margin-bottom:6px">
            <span style="font-size:8px;color:#6b7280">Class: <strong style="color:#9f1239">${cls}-${sec}</strong></span>
            <span style="font-size:8px;color:#6b7280">Blood: <strong style="color:#9f1239">${blood}</strong></span>
          </div>
          <div style="display:flex;align-items:center;gap:4px">
            <div style="width:6px;height:6px;border-radius:50%;background:#9f1239"></div>
            <span style="font-size:7px;color:#6b7280">Emergency: <strong style="color:#9f1239">${emergency}</strong></span>
          </div>
        </div>
      </div>
    </div>`,

    violet_vertical: `<div style="width:200px;height:360px;background:#fff;border:2px solid #7c3aed;border-radius:16px;overflow:hidden;position:relative;font-family:system-ui;">
      <div style="position:absolute;top:0;left:0;right:0;height:5px;background:linear-gradient(90deg,#a78bfa,#ec4899,#a78bfa)"></div>
      <div style="text-align:center;padding:18px 12px 10px;position:relative">
        <div style="width:44px;height:44px;border-radius:10px;background:rgba(124,58,237,0.08);border:1.5px solid rgba(124,58,237,0.4);margin:0 auto 6px;display:flex;align-items:center;justify-content:center;overflow:hidden;color:#7c3aed">${logoHtml}</div>
        <p style="font-size:9px;color:#5b21b6;font-weight:700;margin:0;text-transform:uppercase;letter-spacing:1.5px">${schoolName}</p>
        <p style="font-size:7px;color:rgba(0,0,0,0.35);margin:2px 0 0;letter-spacing:2px">STUDENT CARD</p>
      </div>
      <div style="margin:0 auto;width:68px;height:68px;border-radius:12px;border:2px solid rgba(124,58,237,0.4);background:rgba(124,58,237,0.05);display:flex;align-items:center;justify-content:center;overflow:hidden">${photo}</div>
      <div style="padding:12px 14px 10px;text-align:center">
        <p style="font-size:12px;font-weight:700;color:#111;margin:0 0 1px">${name}</p>
        <p style="font-size:8px;color:#7c3aed;margin:0 0 10px">${adm}</p>
        <div style="display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:8px">
          <div style="background:#faf5ff;border:1px solid rgba(124,58,237,0.2);border-radius:6px;padding:4px 6px"><p style="font-size:6px;color:rgba(0,0,0,0.4);margin:0">CLASS</p><p style="font-size:9px;color:#5b21b6;font-weight:700;margin:0">${cls}</p></div>
          <div style="background:#faf5ff;border:1px solid rgba(124,58,237,0.2);border-radius:6px;padding:4px 6px"><p style="font-size:6px;color:rgba(0,0,0,0.4);margin:0">SECTION</p><p style="font-size:9px;color:#5b21b6;font-weight:700;margin:0">${sec}</p></div>
          <div style="background:#faf5ff;border:1px solid rgba(124,58,237,0.2);border-radius:6px;padding:4px 6px"><p style="font-size:6px;color:rgba(0,0,0,0.4);margin:0">BLOOD</p><p style="font-size:9px;color:#5b21b6;font-weight:700;margin:0">${blood}</p></div>
          <div style="background:#faf5ff;border:1px solid rgba(124,58,237,0.2);border-radius:6px;padding:4px 6px"><p style="font-size:6px;color:rgba(0,0,0,0.4);margin:0">HOUSE</p><p style="font-size:9px;color:#5b21b6;font-weight:700;margin:0">${student.house || '—'}</p></div>
        </div>
        <div style="background:rgba(236,72,153,0.07);border:1px solid rgba(236,72,153,0.3);border-radius:7px;padding:5px 8px">
          <p style="font-size:6px;color:rgba(190,24,93,0.7);margin:0;letter-spacing:1px">EMERGENCY</p>
          <p style="font-size:10px;color:#be185d;font-weight:700;margin:0">${emergency}</p>
        </div>
      </div>
    </div>`
  };

  return templates[templateId] || templates['neon_vertical'];
}

// -- Inline preview card component --
function CardPreview({ student, school, templateId }) {
  const html = buildCardHTML(student, school, templateId);
  return <div dangerouslySetInnerHTML={{ __html: html }} />;
}

export default function IDCardPrint() {
  const [students, setStudents] = useState([]);
  const [filteredStudents, setFilteredStudents] = useState([]);
  const [selectedIds, setSelectedIds] = useState([]);
  const [school, setSchool] = useState({ name: '', logo_url: '' });
  const [templateId, setTemplateId] = useState('neon_vertical');
  const [search, setSearch] = useState('');
  const [filterClass, setFilterClass] = useState('all');
  const [classes, setClasses] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isPrinting, setIsPrinting] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem('campusense_id_card_template');
    if (saved) setTemplateId(saved);

    Promise.all([
      fetchAllFiltered('Student', { status: 'active' }),
      base44.entities.SchoolSetting.list()
    ]).then(([studs, settings]) => {
      setStudents(studs);
      setFilteredStudents(studs);
      const uniqueClasses = [...new Set(studs.map(s => s.class).filter(Boolean))].sort();
      setClasses(uniqueClasses);
      if (settings.length > 0) setSchool({ name: settings[0].school_name || '', logo_url: settings[0].school_logo_url || '' });
      setIsLoading(false);
    });
  }, []);

  useEffect(() => {
    let result = students;
    if (search) result = result.filter(s => `${s.first_name} ${s.last_name} ${s.admission_number}`.toLowerCase().includes(search.toLowerCase()));
    if (filterClass !== 'all') result = result.filter(s => s.class === filterClass);
    setFilteredStudents(result);
  }, [search, filterClass, students]);

  const toggleSelect = (id) => setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  const selectAll = () => setSelectedIds(filteredStudents.map(s => s.id));
  const clearAll = () => setSelectedIds([]);

  const handlePrint = () => {
    const selectedStudents = students.filter(s => selectedIds.includes(s.id));
    if (selectedStudents.length === 0) return;
    setIsPrinting(true);

    const cardsHtml = selectedStudents.map(s => `
      <div style="display:inline-block;margin:8px;vertical-align:top">
        ${buildCardHTML(s, school, templateId)}
      </div>
    `).join('');

    const win = window.open('', '_blank');
    win.document.write(`
      <html><head><title>ID Cards - ${school.name || 'School'}</title>
      <style>
        body { margin: 16px; background: #fff; }
        @media print { body { margin: 0; } }
      </style></head>
      <body>${cardsHtml}
      <script>window.onload = function(){ window.print(); window.close(); }<\/script>
      </body></html>
    `);
    win.document.close();
    setIsPrinting(false);
  };

  const TEMPLATE_NAMES = {
    neon_vertical: 'Neon Futuristic', classic_horizontal: 'Classic Professional',
    emerald_vertical: 'Emerald Nature', royal_horizontal: 'Royal Maroon', violet_vertical: 'Galaxy Violet'
  };

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a0e1a 100%)' }}>
      {/* Header */}
      <motion.div className="rounded-2xl mb-6 p-6" style={{ background: 'linear-gradient(135deg,rgba(168,85,247,0.08),rgba(0,245,255,0.1))', border: '1px solid rgba(168,85,247,0.2)', backdropFilter: 'blur(20px)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(168,85,247,0.1)', border: '1px solid rgba(168,85,247,0.3)' }}>
              <Printer className="h-7 w-7" style={{ color: '#a855f7' }} />
            </div>
            <div>
              <h1 className="text-2xl font-black font-mono" style={{ color: '#a855f7', textShadow: '0 0 16px rgba(168,85,247,0.5)' }}>ID CARD PRINT</h1>
              <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>Select students and print their ID cards</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Link to={createPageUrl('IDCardDesign')}>
              <Button variant="ghost" size="sm" className="font-mono text-xs" style={{ color: 'rgba(255,255,255,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}>
                <CreditCard className="h-3.5 w-3.5 mr-1.5" /> CHANGE TEMPLATE
              </Button>
            </Link>
            <Button onClick={handlePrint} disabled={selectedIds.length === 0 || isPrinting} className="font-mono" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7' }}>
              <Printer className="h-4 w-4 mr-2" /> PRINT {selectedIds.length > 0 ? `(${selectedIds.length})` : ''}
            </Button>
          </div>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Left: Student Selector */}
        <div>
          {/* Filters */}
          <div className="flex flex-col sm:flex-row gap-3 mb-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
              <Input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search by name or admission no..." className="pl-9 font-mono text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }} />
            </div>
            <Select value={filterClass} onValueChange={setFilterClass}>
              <SelectTrigger className="w-36 font-mono text-sm" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff' }}>
                <SelectValue placeholder="All Classes" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Classes</SelectItem>
                {classes.map(c => <SelectItem key={c} value={c}>Class {c}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Template selector */}
          <div className="flex items-center gap-3 mb-4 p-3 rounded-xl" style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.07)' }}>
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>TEMPLATE:</p>
            <Select value={templateId} onValueChange={(v) => { setTemplateId(v); localStorage.setItem('campusense_id_card_template', v); }}>
              <SelectTrigger className="flex-1 font-mono text-xs" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(168,85,247,0.3)', color: '#a855f7' }}>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(TEMPLATE_NAMES).map(([id, name]) => <SelectItem key={id} value={id}>{name}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>

          {/* Select controls */}
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>{filteredStudents.length} STUDENTS · {selectedIds.length} SELECTED</p>
            <div className="flex gap-2">
              <button onClick={selectAll} className="text-xs font-mono px-3 py-1 rounded-lg" style={{ background: 'rgba(0,245,255,0.08)', border: '1px solid rgba(0,245,255,0.2)', color: '#00f5ff' }}>SELECT ALL</button>
              <button onClick={clearAll} className="text-xs font-mono px-3 py-1 rounded-lg" style={{ background: 'rgba(255,107,53,0.08)', border: '1px solid rgba(255,107,53,0.2)', color: '#ff6b35' }}>CLEAR</button>
            </div>
          </div>

          {/* Student List */}
          <div className="rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.08)' }}>
            {isLoading ? (
              <div className="flex items-center justify-center py-12">
                <div className="animate-spin h-6 w-6 rounded-full border-2" style={{ borderColor: 'rgba(168,85,247,0.3)', borderTopColor: '#a855f7' }} />
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="py-12 text-center">
                <Users className="h-8 w-8 mx-auto mb-2" style={{ color: 'rgba(255,255,255,0.2)' }} />
                <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>No students found</p>
              </div>
            ) : (
              <div className="max-h-[460px] overflow-y-auto">
                {filteredStudents.map(student => {
                  const isSelected = selectedIds.includes(student.id);
                  return (
                    <div key={student.id} onClick={() => toggleSelect(student.id)} className="flex items-center gap-3 px-4 py-3 cursor-pointer transition-all border-b" style={{ background: isSelected ? 'rgba(168,85,247,0.08)' : 'transparent', borderColor: 'rgba(255,255,255,0.05)' }}>
                      <div className="w-5 h-5 rounded flex items-center justify-center shrink-0" style={{ background: isSelected ? '#a855f7' : 'rgba(255,255,255,0.05)', border: `1px solid ${isSelected ? '#a855f7' : 'rgba(255,255,255,0.15)'}` }}>
                        {isSelected && <svg width="10" height="10" viewBox="0 0 10 10"><polyline points="1.5,5 4,7.5 8.5,2" stroke="#fff" strokeWidth="1.5" fill="none" /></svg>}
                      </div>
                      <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0" style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                        {student.photo_url ? <img src={student.photo_url} className="w-full h-full object-cover" /> : <div className="w-full h-full flex items-center justify-center text-xs font-bold" style={{ color: '#a855f7' }}>{student.first_name?.[0]}</div>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-mono font-medium truncate" style={{ color: 'rgba(255,255,255,0.85)' }}>{student.first_name} {student.last_name}</p>
                        <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>ADM: {student.admission_number} · Class {student.class}{student.section ? `-${student.section}` : ''}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right: Preview */}
        <div>
          <p className="text-xs font-mono tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>// PREVIEW (FIRST SELECTED STUDENT)</p>
          <div className="rounded-xl p-6 flex flex-col items-center justify-center min-h-[400px]" style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.07)' }}>
            {selectedIds.length > 0 ? (() => {
              const previewStudent = students.find(s => s.id === selectedIds[0]);
              return previewStudent ? (
                <motion.div key={selectedIds[0] + templateId} initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}>
                  <CardPreview student={previewStudent} school={school} templateId={templateId} />
                </motion.div>
              ) : null;
            })() : (
              <div className="text-center">
                <CreditCard className="h-12 w-12 mx-auto mb-3" style={{ color: 'rgba(255,255,255,0.1)' }} />
                <p className="text-sm font-mono" style={{ color: 'rgba(255,255,255,0.3)' }}>Select a student to preview</p>
              </div>
            )}
          </div>
          {selectedIds.length > 1 && (
            <p className="text-xs font-mono text-center mt-3" style={{ color: 'rgba(255,255,255,0.3)' }}>+ {selectedIds.length - 1} more student{selectedIds.length > 2 ? 's' : ''} will be printed</p>
          )}
        </div>
      </div>
    </div>
  );
}