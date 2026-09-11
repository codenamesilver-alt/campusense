import { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { motion } from "framer-motion";
import { CreditCard, Check, Printer, School } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

const TEMPLATES = [
  {
    id: "neon_vertical",
    name: "Neon Futuristic",
    orientation: "vertical",
    description: "Dark cyberpunk theme with neon glow",
    preview: (school) => (
      <div style={{
        width: 200, height: 360, background: '#fff',
        border: '2px solid #00f5ff', borderRadius: 16, overflow: 'hidden', position: 'relative',
        boxShadow: '0 0 24px rgba(0,245,255,0.3)', fontFamily: 'monospace', color: '#111', flexShrink: 0
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 6, background: 'linear-gradient(90deg,#00f5ff,#a855f7,#00ff88)' }} />
        <div style={{ textAlign: 'center', padding: '16px 12px 8px' }}>
          <div style={{ width: 40, height: 40, borderRadius: 8, background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.4)', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {school.logo_url ? <img src={school.logo_url} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <School size={20} color="#00f5ff" />}
          </div>
          <p style={{ fontSize: 9, color: '#00a0b0', letterSpacing: 2, fontWeight: 'bold', textTransform: 'uppercase', margin: 0 }}>{school.name || 'SCHOOL NAME'}</p>
          <p style={{ fontSize: 7, color: 'rgba(0,0,0,0.4)', margin: '2px 0 0' }}>STUDENT IDENTITY CARD</p>
        </div>
        <div style={{ display: 'flex', justifyContent: 'center', padding: '4px 0' }}>
          <div style={{ width: 64, height: 64, borderRadius: 10, border: '2px solid #00f5ff', background: 'rgba(0,245,255,0.08)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 12px rgba(0,245,255,0.2)' }}>
            <span style={{ fontSize: 9, color: 'rgba(0,245,255,0.5)' }}>PHOTO</span>
          </div>
        </div>
        <div style={{ padding: '10px 14px', textAlign: 'center' }}>
          <p style={{ fontSize: 11, fontWeight: 'bold', color: '#111', margin: '0 0 2px', letterSpacing: 1 }}>STUDENT NAME</p>
          <p style={{ fontSize: 8, color: '#a855f7', margin: '0 0 8px', letterSpacing: 1 }}>ADM: 2024001</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 4 }}>
            {[['CLASS', '10'], ['SEC', 'A'], ['BLOOD', 'B+'], ['YEAR', '2024']].map(([k, v]) => (
              <div key={k} style={{ background: '#f0fdff', border: '1px solid rgba(0,245,255,0.3)', borderRadius: 6, padding: '4px 6px' }}>
                <p style={{ fontSize: 6, color: 'rgba(0,0,0,0.4)', margin: 0 }}>{k}</p>
                <p style={{ fontSize: 9, color: '#007a8a', margin: 0, fontWeight: 'bold' }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, padding: '5px 8px', background: 'rgba(255,0,110,0.07)', border: '1px solid rgba(255,0,110,0.3)', borderRadius: 6 }}>
            <p style={{ fontSize: 6, color: 'rgba(200,0,80,0.7)', margin: 0 }}>EMERGENCY</p>
            <p style={{ fontSize: 9, color: '#cc005a', margin: 0, fontWeight: 'bold' }}>+91 98765 43210</p>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#a855f7,#00f5ff)' }} />
      </div>
    )
  },
  {
    id: "classic_horizontal",
    name: "Classic Professional",
    orientation: "horizontal",
    description: "Clean white professional card",
    preview: (school) => (
      <div style={{
        width: 320, height: 190, background: '#fff', border: '1px solid #e5e7eb',
        borderRadius: 12, overflow: 'hidden', position: 'relative', fontFamily: 'sans-serif',
        boxShadow: '0 4px 24px rgba(0,0,0,0.12)', flexShrink: 0
      }}>
        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: 80, background: 'linear-gradient(180deg,#1e3a8a,#3b82f6)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 8 }}>
          <div style={{ width: 48, height: 48, borderRadius: '50%', border: '2px solid rgba(255,255,255,0.5)', background: 'rgba(255,255,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {school.logo_url ? <img src={school.logo_url} style={{ width: 36, height: 36, objectFit: 'contain' }} /> : <School size={22} color="#fff" />}
          </div>
          <div style={{ width: 56, height: 56, borderRadius: 8, border: '2px solid rgba(255,255,255,0.6)', background: 'rgba(255,255,255,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <span style={{ fontSize: 7, color: 'rgba(255,255,255,0.7)' }}>PHOTO</span>
          </div>
        </div>
        <div style={{ marginLeft: 88, padding: '14px 14px 10px 0' }}>
          <p style={{ fontSize: 10, fontWeight: 800, color: '#1e3a8a', textTransform: 'uppercase', margin: 0, letterSpacing: 1 }}>{school.name || 'SCHOOL NAME'}</p>
          <p style={{ fontSize: 7, color: '#6b7280', margin: '1px 0 8px' }}>STUDENT IDENTITY CARD</p>
          <p style={{ fontSize: 13, fontWeight: 700, color: '#111827', margin: '0 0 1px' }}>Student Name</p>
          <p style={{ fontSize: 8, color: '#3b82f6', margin: '0 0 8px' }}>Admission: 2024001</p>
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {[['Class', '10-A'], ['Blood', 'B+'], ['Year', '2024-25']].map(([k, v]) => (
              <div key={k} style={{ background: '#f0f9ff', border: '1px solid #bae6fd', borderRadius: 4, padding: '2px 6px' }}>
                <span style={{ fontSize: 7, color: '#0369a1' }}>{k}: </span>
                <span style={{ fontSize: 7, fontWeight: 700, color: '#0369a1' }}>{v}</span>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 8, display: 'flex', alignItems: 'center', gap: 4 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#ef4444' }} />
            <span style={{ fontSize: 8, color: '#374151' }}>Emergency: </span>
            <span style={{ fontSize: 8, fontWeight: 700, color: '#ef4444' }}>+91 98765 43210</span>
          </div>
        </div>
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 4, background: 'linear-gradient(90deg,#1e3a8a,#3b82f6,#1e3a8a)' }} />
      </div>
    )
  },
  {
    id: "emerald_vertical",
    name: "Emerald Nature",
    orientation: "vertical",
    description: "Fresh green gradient with organic feel",
    preview: (school) => (
      <div style={{
        width: 200, height: 360, background: '#fff',
        borderRadius: 16, overflow: 'hidden', position: 'relative', fontFamily: 'sans-serif', border: '2px solid #059669',
        boxShadow: '0 8px 32px rgba(6,78,59,0.5)', flexShrink: 0
      }}>
        <div style={{ position: 'absolute', top: -30, right: -30, width: 100, height: 100, borderRadius: '50%', background: 'rgba(255,255,255,0.06)' }} />
        <div style={{ position: 'absolute', bottom: -20, left: -20, width: 80, height: 80, borderRadius: '50%', background: 'rgba(255,255,255,0.04)' }} />
        <div style={{ textAlign: 'center', padding: '20px 12px 12px', position: 'relative' }}>
          <div style={{ width: 44, height: 44, borderRadius: '50%', background: 'rgba(5,150,105,0.1)', border: '2px solid rgba(5,150,105,0.5)', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {school.logo_url ? <img src={school.logo_url} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <School size={20} color="#059669" />}
          </div>
          <p style={{ fontSize: 9, color: '#064e3b', fontWeight: 800, margin: 0, textTransform: 'uppercase', letterSpacing: 1 }}>{school.name || 'SCHOOL NAME'}</p>
          <p style={{ fontSize: 7, color: 'rgba(0,0,0,0.4)', margin: '2px 0 0' }}>Identity Card</p>
        </div>
        <div style={{ margin: '0 auto', width: 70, height: 70, borderRadius: '50%', border: '3px solid rgba(5,150,105,0.5)', background: 'rgba(5,150,105,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ fontSize: 9, color: 'rgba(255,255,255,0.5)' }}>PHOTO</span>
        </div>
        <div style={{ padding: '12px 16px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#111', margin: '0 0 2px' }}>STUDENT NAME</p>
          <p style={{ fontSize: 8, color: '#6b7280', margin: '0 0 10px' }}>ADM NO: 2024001</p>
          <div style={{ background: '#f0fdf4', border: '1px solid rgba(5,150,105,0.2)', borderRadius: 8, padding: '8px 10px', marginBottom: 8 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 8, color: '#6b7280' }}>Class &amp; Section</span>
              <span style={{ fontSize: 8, color: '#064e3b', fontWeight: 700 }}>10 - A</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 4 }}>
              <span style={{ fontSize: 8, color: '#6b7280' }}>Blood Group</span>
              <span style={{ fontSize: 8, color: '#064e3b', fontWeight: 700 }}>B+</span>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 8, color: '#6b7280' }}>Academic Year</span>
              <span style={{ fontSize: 8, color: '#064e3b', fontWeight: 700 }}>2024-25</span>
            </div>
          </div>
          <div style={{ background: 'rgba(245,158,11,0.08)', border: '1px solid rgba(245,158,11,0.4)', borderRadius: 6, padding: '5px 8px' }}>
            <p style={{ fontSize: 6, color: 'rgba(180,120,0,0.8)', margin: 0 }}>EMERGENCY CONTACT</p>
            <p style={{ fontSize: 9, color: '#b45309', fontWeight: 700, margin: 0 }}>+91 98765 43210</p>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "royal_horizontal",
    name: "Royal Maroon",
    orientation: "horizontal",
    description: "Prestigious maroon with gold accents",
    preview: (school) => (
      <div style={{
        width: 320, height: 190, background: '#fff',
        borderRadius: 14, overflow: 'hidden', position: 'relative', fontFamily: 'Georgia, serif', border: '2px solid #9f1239',
        boxShadow: '0 8px 32px rgba(74,14,26,0.6)', flexShrink: 0
      }}>
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#b8860b,#ffd700,#b8860b)' }} />
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, background: 'linear-gradient(90deg,#b8860b,#ffd700,#b8860b)' }} />
        <div style={{ position: 'absolute', top: 3, bottom: 3, left: 0, width: 2, background: 'linear-gradient(180deg,#b8860b,#ffd700,#b8860b)' }} />
        <div style={{ position: 'absolute', top: 3, bottom: 3, right: 0, width: 2, background: 'linear-gradient(180deg,#b8860b,#ffd700,#b8860b)' }} />
        <div style={{ display: 'flex', height: '100%', alignItems: 'center', padding: '0 16px 0 12px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginRight: 14 }}>
            <div style={{ width: 44, height: 44, borderRadius: 8, border: '2px solid #9f1239', background: 'rgba(159,18,57,0.06)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              {school.logo_url ? <img src={school.logo_url} style={{ width: 36, height: 36, objectFit: 'contain' }} /> : <School size={20} color="#9f1239" />}
            </div>
            <div style={{ width: 60, height: 60, borderRadius: 8, border: '2px solid #9f1239', background: '#fff5f7', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <span style={{ fontSize: 7, color: 'rgba(255,215,0,0.5)' }}>PHOTO</span>
            </div>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: 11, fontWeight: 700, color: '#9f1239', margin: '0 0 1px', letterSpacing: 1, textTransform: 'uppercase' }}>{school.name || 'SCHOOL NAME'}</p>
            <p style={{ fontSize: 7, color: 'rgba(159,18,57,0.5)', margin: '0 0 8px', letterSpacing: 2 }}>EST. MMXXIV · STUDENT CARD</p>
            <div style={{ width: 60, height: 1, background: 'linear-gradient(90deg,#ffd700,transparent)', marginBottom: 8 }} />
            <p style={{ fontSize: 13, fontWeight: 700, color: '#111', margin: '0 0 2px', fontFamily: 'Georgia' }}>Student Name</p>
            <p style={{ fontSize: 8, color: '#be123c', margin: '0 0 8px' }}>ADM: 2024001</p>
            <div style={{ display: 'flex', gap: 8, marginBottom: 6 }}>
              <span style={{ fontSize: 8, color: '#6b7280' }}>Class: <strong style={{ color: '#9f1239' }}>10-A</strong></span>
              <span style={{ fontSize: 8, color: '#6b7280' }}>Blood: <strong style={{ color: '#9f1239' }}>B+</strong></span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
              <div style={{ width: 6, height: 6, borderRadius: '50%', background: '#9f1239' }} />
              <span style={{ fontSize: 7, color: '#6b7280' }}>Emergency: </span>
              <span style={{ fontSize: 7, fontWeight: 700, color: '#9f1239' }}>+91 98765 43210</span>

            </div>
          </div>
        </div>
      </div>
    )
  },
  {
    id: "violet_vertical",
    name: "Galaxy Violet",
    orientation: "vertical",
    description: "Purple galaxy with holographic shimmer",
    preview: (school) => (
      <div style={{
        width: 200, height: 360, background: '#fff',
        borderRadius: 16, overflow: 'hidden', position: 'relative', fontFamily: 'system-ui', border: '2px solid #7c3aed',
        boxShadow: '0 8px 32px rgba(76,29,149,0.6)', flexShrink: 0
      }}>
        <div style={{ position: 'absolute', top: -40, left: -40, width: 120, height: 120, borderRadius: '50%', background: 'radial-gradient(circle,rgba(167,139,250,0.25),transparent)' }} />
        <div style={{ position: 'absolute', bottom: 20, right: -20, width: 90, height: 90, borderRadius: '50%', background: 'radial-gradient(circle,rgba(236,72,153,0.2),transparent)' }} />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 5, background: 'linear-gradient(90deg,#a78bfa,#ec4899,#a78bfa)' }} />
        <div style={{ textAlign: 'center', padding: '18px 12px 10px', position: 'relative' }}>
          <div style={{ width: 44, height: 44, borderRadius: 10, background: 'rgba(124,58,237,0.08)', border: '1.5px solid rgba(124,58,237,0.4)', margin: '0 auto 6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            {school.logo_url ? <img src={school.logo_url} style={{ width: 32, height: 32, objectFit: 'contain' }} /> : <School size={20} color="#7c3aed" />}
          </div>
          <p style={{ fontSize: 9, color: '#5b21b6', fontWeight: 700, margin: 0, textTransform: 'uppercase', letterSpacing: 1.5 }}>{school.name || 'SCHOOL NAME'}</p>
          <p style={{ fontSize: 7, color: 'rgba(0,0,0,0.35)', margin: '2px 0 0', letterSpacing: 2 }}>STUDENT CARD</p>
        </div>
        <div style={{ margin: '0 auto', width: 68, height: 68, borderRadius: 12, border: '2px solid rgba(124,58,237,0.4)', background: 'rgba(124,58,237,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 16px rgba(167,139,250,0.25)' }}>
          <span style={{ fontSize: 8, color: 'rgba(196,181,253,0.5)' }}>PHOTO</span>
        </div>
        <div style={{ padding: '12px 14px 10px', textAlign: 'center' }}>
          <p style={{ fontSize: 12, fontWeight: 700, color: '#111', margin: '0 0 1px' }}>STUDENT NAME</p>
          <p style={{ fontSize: 8, color: '#7c3aed', margin: '0 0 10px' }}>2024001</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 5, marginBottom: 8 }}>
            {[['CLASS', '10'], ['SECTION', 'A'], ['BLOOD', 'B+'], ['HOUSE', 'BLUE']].map(([k, v]) => (
              <div key={k} style={{ background: '#faf5ff', border: '1px solid rgba(124,58,237,0.2)', borderRadius: 6, padding: '4px 6px' }}>
                <p style={{ fontSize: 6, color: 'rgba(0,0,0,0.4)', margin: 0 }}>{k}</p>
                <p style={{ fontSize: 9, color: '#5b21b6', fontWeight: 700, margin: 0 }}>{v}</p>
              </div>
            ))}
          </div>
          <div style={{ background: 'rgba(236,72,153,0.07)', border: '1px solid rgba(236,72,153,0.3)', borderRadius: 7, padding: '5px 8px' }}>
            <p style={{ fontSize: 6, color: 'rgba(190,24,93,0.7)', margin: 0, letterSpacing: 1 }}>EMERGENCY</p>
            <p style={{ fontSize: 10, color: '#be185d', fontWeight: 700, margin: 0 }}>+91 98765 43210</p>
          </div>
        </div>
      </div>
    )
  }
];

export default function IDCardDesign() {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [school, setSchool] = useState({ name: '', logo_url: '' });
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    base44.entities.SchoolSetting.list().then(data => {
      if (data.length > 0) setSchool({ name: data[0].school_name || '', logo_url: data[0].school_logo_url || '' });
    });
    const saved = localStorage.getItem('campusense_id_card_template');
    if (saved) setSelectedTemplate(saved);
  }, []);

  const handleSelect = (id) => {
    setSelectedTemplate(id);
    localStorage.setItem('campusense_id_card_template', id);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  const verticals = TEMPLATES.filter(t => t.orientation === 'vertical');
  const horizontals = TEMPLATES.filter(t => t.orientation === 'horizontal');

  return (
    <div className="min-h-screen" style={{ background: 'linear-gradient(135deg, #0a0e1a 0%, #0d1b2a 50%, #0a0e1a 100%)' }}>
      {/* Header */}
      <motion.div className="rounded-2xl mb-6 p-6" style={{ background: 'linear-gradient(135deg,rgba(0,245,255,0.08),rgba(168,85,247,0.1))', border: '1px solid rgba(0,245,255,0.2)', backdropFilter: 'blur(20px)' }} initial={{ opacity: 0, y: -20 }} animate={{ opacity: 1, y: 0 }}>
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl" style={{ background: 'rgba(0,245,255,0.1)', border: '1px solid rgba(0,245,255,0.3)' }}>
              <CreditCard className="h-7 w-7" style={{ color: '#00f5ff' }} />
            </div>
            <div>
              <h1 className="text-2xl font-black font-mono" style={{ color: '#00f5ff', textShadow: '0 0 16px rgba(0,245,255,0.5)' }}>ID CARD DESIGN</h1>
              <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.4)' }}>Select a template to use for ID card printing</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} className="flex items-center gap-2 px-3 py-2 rounded-lg" style={{ background: 'rgba(0,255,136,0.1)', border: '1px solid rgba(0,255,136,0.3)' }}>
                <Check className="h-4 w-4" style={{ color: '#00ff88' }} />
                <span className="text-xs font-mono" style={{ color: '#00ff88' }}>Template Saved!</span>
              </motion.div>
            )}
            <Link to={createPageUrl('IDCardPrint')}>
              <Button className="font-mono" style={{ background: 'rgba(168,85,247,0.15)', border: '1px solid rgba(168,85,247,0.4)', color: '#a855f7' }}>
                <Printer className="h-4 w-4 mr-2" /> GO TO PRINT
              </Button>
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Vertical Templates */}
      <div className="mb-8">
        <p className="text-xs font-mono tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>// VERTICAL TEMPLATES</p>
        <div className="flex flex-wrap gap-6">
          {verticals.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }} className="flex flex-col items-center gap-3">
              <div
                onClick={() => handleSelect(t.id)}
                className="cursor-pointer transition-all duration-200 relative"
                style={{ transform: selectedTemplate === t.id ? 'scale(1.04)' : 'scale(1)', filter: selectedTemplate === t.id ? 'drop-shadow(0 0 16px rgba(0,245,255,0.4))' : 'none' }}
              >
                {selectedTemplate === t.id && (
                  <div className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#00f5ff' }}>
                    <Check className="h-3 w-3 text-black" />
                  </div>
                )}
                {t.preview(school)}
              </div>
              <div className="text-center">
                <p className="text-sm font-mono font-bold" style={{ color: selectedTemplate === t.id ? '#00f5ff' : 'rgba(255,255,255,0.7)' }}>{t.name}</p>
                <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.description}</p>
                <button onClick={() => handleSelect(t.id)} className="mt-2 px-4 py-1.5 rounded-lg text-xs font-mono transition-all" style={selectedTemplate === t.id ? { background: 'rgba(0,245,255,0.15)', border: '1px solid rgba(0,245,255,0.4)', color: '#00f5ff' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {selectedTemplate === t.id ? '✓ SELECTED' : 'SELECT'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Horizontal Templates */}
      <div>
        <p className="text-xs font-mono tracking-widest mb-4" style={{ color: 'rgba(255,255,255,0.3)' }}>// HORIZONTAL TEMPLATES</p>
        <div className="flex flex-wrap gap-6">
          {horizontals.map((t, i) => (
            <motion.div key={t.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 + i * 0.1 }} className="flex flex-col items-center gap-3">
              <div
                onClick={() => handleSelect(t.id)}
                className="cursor-pointer transition-all duration-200 relative"
                style={{ transform: selectedTemplate === t.id ? 'scale(1.04)' : 'scale(1)', filter: selectedTemplate === t.id ? 'drop-shadow(0 0 16px rgba(0,245,255,0.4))' : 'none' }}
              >
                {selectedTemplate === t.id && (
                  <div className="absolute -top-2 -right-2 z-10 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: '#00f5ff' }}>
                    <Check className="h-3 w-3 text-black" />
                  </div>
                )}
                {t.preview(school)}
              </div>
              <div className="text-center">
                <p className="text-sm font-mono font-bold" style={{ color: selectedTemplate === t.id ? '#00f5ff' : 'rgba(255,255,255,0.7)' }}>{t.name}</p>
                <p className="text-xs font-mono" style={{ color: 'rgba(255,255,255,0.35)' }}>{t.description}</p>
                <button onClick={() => handleSelect(t.id)} className="mt-2 px-4 py-1.5 rounded-lg text-xs font-mono transition-all" style={selectedTemplate === t.id ? { background: 'rgba(0,245,255,0.15)', border: '1px solid rgba(0,245,255,0.4)', color: '#00f5ff' } : { background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.5)' }}>
                  {selectedTemplate === t.id ? '✓ SELECTED' : 'SELECT'}
                </button>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </div>
  );
}