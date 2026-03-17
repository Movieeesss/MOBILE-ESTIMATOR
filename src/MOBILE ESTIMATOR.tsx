import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jsPDF';
import autoTable from 'jspdf-autotable';

const INITIAL_TITLES = [
  "1. Earthwork excavation for foundation", "2. Filling in basement with gravel",
  "3. Filling in basement with river sand", "4. PCC 1:4:8 for foundation",
  "5. RCC 1:2:4 for footings", "6. RCC 1:2:4 for column up to plinth level",
  "7. RCC 1:2:4 for plinth beam", "8. Brickwork in CM 1:6 for foundation",
  "9. Brickwork in CM 1:6 for super structure", "10. RCC 1:2:4 for lintel",
  "11. RCC 1:2:4 for sunshade", "12. RCC 1:2:4 for roof beam",
  "13. RCC 1:2:4 for roof slab", "14. Internal Plastering (12mm)",
  "15. External Plastering (20mm)", "16. Ceiling Plastering (10mm)",
  "17. PCC 1:4:8 for flooring", "18. Vitrified tile flooring",
  "19. Toilet wall tiling", "20. Toilet floor tiling",
  "21. Main door", "22. Internal doors", "23. PVC doors",
  "24. UPVC Windows", "25. UPVC Ventilators", "26. Kitchen Granite",
  "27. Kitchen wall tiles", "28. Wall Painting (Internal)",
  "29. Wall Painting (External)", "30. Ceiling Painting",
  "31. Parapet brickwork", "32. Weathering course",
  "33. Septic tank", "34. Water tank (UG)", "35. Compound wall",
  "36. Main gate", "37. Electrical - LS", "38. Sanitary - LS"
];

export default function DetailedConstructionEstimator() {
  const [projectInfo, setProjectInfo] = useState(() => {
    const saved = localStorage.getItem('est_v4_info');
    return saved ? JSON.parse(saved) : { name: "", client: "", location: "" };
  });

  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('est_v4_sections');
    return saved ? JSON.parse(saved) : INITIAL_TITLES.map((title, idx) => ({
      id: idx,
      title: title,
      unit: 'M3',
      rate: '',
      measurements: [{ id: Date.now() + idx, type: 'Add', label: 'Main', nos: '1', l: '0', b: '0', d: '0' }]
    }));
  });

  useEffect(() => {
    localStorage.setItem('est_v4_info', JSON.stringify(projectInfo));
    localStorage.setItem('est_v4_sections', JSON.stringify(sections));
  }, [projectInfo, sections]);

  const computedData = useMemo(() => {
    let grandTotal = 0;
    const processed = sections.map(sec => {
      const totalQty = sec.measurements.reduce((acc, m) => {
        const val = (parseFloat(m.nos) || 0) * (parseFloat(m.l) || 0) * (parseFloat(m.b) || 0) * (parseFloat(m.d) || 0);
        return m.type === 'Add' ? acc + val : acc - val;
      }, 0);
      const rateVal = parseFloat(sec.rate) || 0;
      const amount = totalQty * rateVal;
      grandTotal += amount;
      return { ...sec, totalQty, amount, rateVal };
    });
    return { processed, grandTotal };
  }, [sections]);

  const updateSection = (id: number, field: string, val: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, [field]: val } : s));
  };

  const addRow = (secId: number, type: 'Add' | 'Ded') => {
    setSections(sections.map(s => s.id === secId ? 
      { ...s, measurements: [...s.measurements, { id: Date.now(), type, label: type === 'Ded' ? 'Deduction' : 'Extra', nos: '1', l: '0', b: '0', d: '0' }] } : s));
  };

  const deleteRow = (secId: number, mId: number) => {
    setSections(sections.map(s => s.id === secId ? { ...s, measurements: s.measurements.filter(m => m.id !== mId) } : s));
  };

  const updateM = (secId: number, mId: number, field: string, val: string) => {
    setSections(sections.map(s => s.id === secId ? {
      ...s, measurements: s.measurements.map(m => m.id === mId ? { ...m, [field]: val } : m)
    } : s));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("DETAILED CONSTRUCTION ESTIMATE", 105, 15, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Project: ${projectInfo.name}`, 14, 25);
    doc.text(`Client: ${projectInfo.client}`, 14, 30);
    doc.text(`Location: ${projectInfo.location}`, 14, 35);

    // Only include items where Rate > 0
    const tableRows = computedData.processed
      .filter(s => s.rateVal > 0)
      .map(s => [s.title, s.unit, s.totalQty.toFixed(2), s.rateVal.toLocaleString(), s.amount.toLocaleString()]);

    autoTable(doc, {
      startY: 45,
      head: [['Description of Work', 'Unit', 'Qty', 'Rate', 'Amount (Rs)']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [30, 41, 59] }
    });

    doc.save(`Estimate_${projectInfo.name || 'Report'}.pdf`);
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#f1f5f9', minHeight: '100vh', paddingBottom: '180px', fontFamily: 'Arial' }}>
      
      {/* HEADER */}
      <div style={{ background: '#1e293b', color: 'white', padding: '30px 15px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '18px', letterSpacing: '0.5px', fontWeight: 'bold' }}>DETAILED CONSTRUCTION ESTIMATE</h2>
        <button onClick={() => { if(window.confirm("Reset all?")) { localStorage.clear(); window.location.reload(); }}} style={resetBtnStyle}>
          RESET ALL DATA
        </button>
      </div>

      {/* INFO SECTION */}
      <div style={{ background: '#fff', padding: '15px', borderBottom: '1px solid #e2e8f0', display: 'grid', gap: '8px' }}>
        <input placeholder="Project Name" value={projectInfo.name} style={headerInput} onChange={e => setProjectInfo({...projectInfo, name: e.target.value})} />
        <input placeholder="Client Name" value={projectInfo.client} style={headerInput} onChange={e => setProjectInfo({...projectInfo, client: e.target.value})} />
      </div>

      {/* ITEMS */}
      {computedData.processed.map((sec) => (
        <div key={sec.id} style={{ background: '#fff', margin: '12px 10px', borderRadius: '10px', boxShadow: '0 2px 4px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ background: '#334155', padding: '10px' }}>
            <textarea value={sec.title} onChange={(e) => updateSection(sec.id, 'title', e.target.value)} style={titleTextarea} rows={1} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '8px' }}>
              <select value={sec.unit} onChange={(e) => updateSection(sec.id, 'unit', e.target.value)} style={unitSelect}>
                <option>M3</option><option>M2</option><option>Nos</option><option>Rft</option>
              </select>
              <input placeholder="Rate Rs." type="number" value={sec.rate} onChange={(e) => updateSection(sec.id, 'rate', e.target.value)} style={rateInput} />
            </div>
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '11px' }}>
            <thead style={{ background: '#f8fafc' }}>
              <tr>
                <th style={tdStyle}>Desc</th><th style={tdStyle}>Nos</th><th style={tdStyle}>L</th><th style={tdStyle}>B</th><th style={tdStyle}>D</th><th style={tdStyle}></th>
              </tr>
            </thead>
            <tbody>
              {sec.measurements.map(m => (
                <tr key={m.id} style={{ background: m.type === 'Ded' ? '#fff1f2' : 'white' }}>
                  <td style={tdStyle}><input value={m.label} onChange={e => updateM(sec.id, m.id, 'label', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><input type="number" value={m.nos} onChange={e => updateM(sec.id, m.id, 'nos', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><input type="number" value={m.l} onChange={e => updateM(sec.id, m.id, 'l', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><input type="number" value={m.b} onChange={e => updateM(sec.id, m.id, 'b', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><input type="number" value={m.d} onChange={e => updateM(sec.id, m.id, 'd', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><button onClick={() => deleteRow(sec.id, m.id)} style={{ border: 'none', background: 'none' }}>🗑️</button></td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => addRow(sec.id, 'Add')} style={btnSml}>+ Add</button>
              <button onClick={() => addRow(sec.id, 'Ded')} style={{ ...btnSml, background: '#ef4444' }}>- Ded</button>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px', fontWeight: 'bold' }}>
               {sec.totalQty.toFixed(2)} {sec.unit} | ₹{sec.amount.toLocaleString()}
            </div>
          </div>
        </div>
      ))}

      {/* FOOTER */}
      <div style={footerStyle}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '15px' }}>
          <span style={{ fontWeight: 'bold', color: '#64748b' }}>TOTAL ESTIMATE:</span>
          <span style={{ fontWeight: 'bold', color: '#0f172a', fontSize: '20px' }}>₹ {computedData.grandTotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={generatePDF} style={mainBtn}>PDF REPORT 📄</button>
          <button onClick={() => {
            let msg = `*DETAILED ESTIMATE*\n*Project:* ${projectInfo.name}\n*Total:* ₹${computedData.grandTotal.toLocaleString()}\n\n`;
            computedData.processed.filter(s => s.rateVal > 0).forEach(s => msg += `✅ ${s.title}: ₹${s.amount.toLocaleString()}\n`);
            window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
          }} style={{ ...mainBtn, background: '#22c55e' }}>WHATSAPP ✅</button>
        </div>
      </div>
    </div>
  );
}

const tdStyle = { border: '1px solid #e2e8f0', padding: '6px', textAlign: 'center' as const };
const cellInput = { width: '100%', border: 'none', textAlign: 'center' as const, fontSize: '11px', background: 'transparent' };
const headerInput = { padding: '12px', border: '1px solid #e2e8f0', borderRadius: '6px', fontSize: '14px' };
const titleTextarea = { width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold' as const, fontSize: '14px', resize: 'none' as const };
const unitSelect = { padding: '4px', borderRadius: '4px', border: 'none', fontSize: '11px', background: '#f1f5f9' };
const rateInput = { padding: '4px 8px', borderRadius: '4px', border: 'none', fontSize: '11px', width: '90px' };
const btnSml = { padding: '5px 10px', background: '#10b981', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' as const };
const footerStyle = { position: 'fixed' as const, bottom: 0, width: '100%', maxWidth: '600px', background: 'white', padding: '20px', borderTop: '2px solid #1e293b', boxShadow: '0 -10px 15px rgba(0,0,0,0.05)' };
const mainBtn = { padding: '14px', background: '#0f172a', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' as const, fontSize: '14px' };
const resetBtnStyle = { marginTop: '15px', background: '#ef4444', color: 'white', border: 'none', padding: '6px 12px', borderRadius: '4px', fontSize: '10px', fontWeight: 'bold' as const };
