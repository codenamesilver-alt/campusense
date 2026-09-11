import React, { useState, useRef, useEffect } from "react";
import { Search, X, User, Phone, Hash, GraduationCap, ChevronRight } from "lucide-react";
import { base44 } from "@/api/base44Client";
import { fetchAllFiltered } from "@/lib/fetchAll";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";

export default function StudentQuickSearch() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState([]);
  const [selected, setSelected] = useState(null);
  const [loading, setLoading] = useState(false);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);
  const wrapperRef = useRef(null);

  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setShowDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const handleSearch = (val) => {
    setQuery(val);
    setSelected(null);
    clearTimeout(debounceRef.current);
    if (!val.trim()) { setResults([]); setShowDropdown(false); return; }
    debounceRef.current = setTimeout(async () => {
      setLoading(true);
      try {
        const all = await fetchAllFiltered('Student', { status: "active" }, "-created_date");
        const q = val.trim().toLowerCase();
        const matched = all.filter(s => {
          const fullName = `${s.first_name || ""} ${s.last_name || ""}`.toLowerCase();
          return (
            fullName.includes(q) ||
            (s.admission_number || "").toLowerCase().includes(q) ||
            (s.guardian_phone || "").includes(q)
          );
        }).slice(0, 8);
        setResults(matched);
        setShowDropdown(true);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }, 300);
  };

  const handleSelect = (student) => {
    setSelected(student);
    setQuery(`${student.first_name} ${student.last_name || ""}`);
    setShowDropdown(false);
    setResults([]);
  };

  const handleClear = () => {
    setQuery("");
    setSelected(null);
    setResults([]);
    setShowDropdown(false);
  };

  return (
    <div ref={wrapperRef} className="mb-6" style={{ position: "relative", zIndex: 100 }}>
      <div
        className="rounded-2xl p-5"
        style={{
          background: "rgba(0,245,255,0.04)",
          border: "1px solid rgba(0,245,255,0.18)",
          backdropFilter: "blur(12px)"
        }}
      >
        <div className="flex items-center gap-2 mb-3">
          <Search className="h-4 w-4" style={{ color: "#00f5ff" }} />
          <span className="text-xs font-mono tracking-widest" style={{ color: "#00f5ff" }}>STUDENT QUICK SEARCH</span>
        </div>

        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => results.length > 0 && setShowDropdown(true)}
            placeholder="Search by name, admission number or mobile..."
            className="w-full rounded-xl px-4 py-3 pr-10 text-sm font-mono outline-none"
            style={{
              background: "rgba(255,255,255,0.05)",
              border: "1px solid rgba(0,245,255,0.25)",
              color: "rgba(255,255,255,0.9)",
              caretColor: "#00f5ff"
            }}
          />
          <div className="absolute right-3 top-1/2 -translate-y-1/2">
            {loading ? (
              <div className="h-4 w-4 border-2 border-t-transparent rounded-full animate-spin" style={{ borderColor: "rgba(0,245,255,0.5)", borderTopColor: "transparent" }} />
            ) : query ? (
              <button onClick={handleClear}><X className="h-4 w-4" style={{ color: "rgba(255,255,255,0.4)" }} /></button>
            ) : (
              <Search className="h-4 w-4" style={{ color: "rgba(255,255,255,0.3)" }} />
            )}
          </div>

          {/* Dropdown */}
          {showDropdown && (
            <div
              className="absolute left-0 right-0 top-full mt-2 rounded-xl overflow-hidden"
              style={{ background: "#0d1b2a", border: "1px solid rgba(0,245,255,0.2)", boxShadow: "0 8px 32px rgba(0,0,0,0.6)", zIndex: 9999 }}
            >
              {results.length === 0 ? (
                <div className="px-4 py-3 text-sm font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>No students found</div>
              ) : results.map(s => (
                <button
                  key={s.id}
                  onClick={() => handleSelect(s)}
                  className="w-full flex items-center gap-3 px-4 py-3 text-left transition-colors"
                  style={{ borderBottom: "1px solid rgba(0,245,255,0.06)" }}
                  onMouseEnter={e => e.currentTarget.style.background = "rgba(0,245,255,0.07)"}
                  onMouseLeave={e => e.currentTarget.style.background = "transparent"}
                >
                  <div className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "rgba(0,245,255,0.1)", border: "1px solid rgba(0,245,255,0.2)" }}>
                    {s.photo_url ? (
                      <img src={s.photo_url} alt="" className="w-full h-full rounded-full object-cover" />
                    ) : (
                      <User className="h-4 w-4" style={{ color: "#00f5ff" }} />
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono font-medium text-white truncate">{s.first_name} {s.last_name}</div>
                    <div className="text-xs font-mono" style={{ color: "rgba(255,255,255,0.4)" }}>
                      #{s.admission_number} &bull; Class {s.class}-{s.section}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Student Detail Card */}
        {selected && (
          <div
            className="mt-4 rounded-xl p-4"
            style={{ background: "rgba(0,245,255,0.05)", border: "1px solid rgba(0,245,255,0.15)" }}
          >
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-full flex items-center justify-center flex-shrink-0 overflow-hidden" style={{ border: "2px solid rgba(0,245,255,0.3)" }}>
                {selected.photo_url ? (
                  <img src={selected.photo_url} alt="" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-7 w-7" style={{ color: "#00f5ff" }} />
                )}
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="text-lg font-black font-mono text-white">{selected.first_name} {selected.last_name}</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                  <InfoPill icon={<Hash className="h-3 w-3" />} label="Adm. No." value={selected.admission_number || "—"} />
                  <InfoPill icon={<GraduationCap className="h-3 w-3" />} label="Class" value={`${selected.class}-${selected.section}`} />
                  <InfoPill icon={<Phone className="h-3 w-3" />} label="Mobile" value={selected.guardian_phone || "—"} />
                  <InfoPill icon={<User className="h-3 w-3" />} label="Father" value={selected.father_name || "—"} />
                </div>
                {(selected.address || selected.blood_group || selected.gender) && (
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-3 mt-2">
                    {selected.gender && <InfoPill icon={null} label="Gender" value={selected.gender} />}
                    {selected.blood_group && <InfoPill icon={null} label="Blood" value={selected.blood_group} />}
                    {selected.academic_year && <InfoPill icon={null} label="Session" value={selected.academic_year} />}
                  </div>
                )}
              </div>
              <Link
                to={`${createPageUrl("StudentDetails")}?class=${encodeURIComponent(selected.class)}&section=${encodeURIComponent(selected.section)}&admission=${encodeURIComponent(selected.admission_number || "")}`}
                className="flex items-center gap-1 text-xs font-mono px-3 py-2 rounded-lg flex-shrink-0"
                style={{ background: "rgba(0,245,255,0.1)", color: "#00f5ff", border: "1px solid rgba(0,245,255,0.2)" }}
              >
                Full Profile <ChevronRight className="h-3 w-3" />
              </Link>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function InfoPill({ icon, label, value }) {
  return (
    <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.07)" }}>
      <div className="flex items-center gap-1 mb-0.5" style={{ color: "rgba(0,245,255,0.6)" }}>
        {icon}
        <span className="text-xs font-mono tracking-wider">{label}</span>
      </div>
      <div className="text-sm font-mono text-white truncate">{value}</div>
    </div>
  );
}