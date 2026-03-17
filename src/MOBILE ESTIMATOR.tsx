import React, { useState, useMemo, useEffect } from 'react';
import jsPDF from 'jspdf';
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

export default function UniqMasterEstimator() {
  const [projectInfo, setProjectInfo] = useState(() => {
    const saved = localStorage.getItem('uniq_v3_info');
    return saved ? JSON.parse(saved) : { name: "", client: "", location: "" };
  });

  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('uniq_v3_sections');
    return saved ? JSON.parse(saved) : INITIAL_TITLES.map((title, idx) => ({
      id: idx,
      title: title,
      unit: 'M3',
      rate: '0',
      measurements: [{ id: Date.now() + idx, type: 'Add', label: 'Main', nos: '1', l: '0', b: '0', d: '0' }]
    }));
  });

  useEffect(() => {
    localStorage.setItem('uniq_v3_info', JSON.stringify(projectInfo));
    localStorage.setItem('uniq_v3_sections', JSON.stringify(sections));
  }, [projectInfo, sections]);

  const computedData = useMemo(() => {
    let grandTotal = 0;
    const processed = sections.map(sec => {
      const totalQty = sec.measurements.reduce((acc, m) => {
        const val = (parseFloat(m.nos) || 0) * (parseFloat(m.l) || 0) * (parseFloat(m.b) || 0) * (parseFloat(m.d) || 0);
        return m.type === 'Add' ? acc + val : acc - val;
      }, 0);
      const amount = totalQty * (parseFloat(sec.rate) || 0);
      grandTotal += amount;
      return { ...sec, totalQty, amount };
    });
    return { processed, grandTotal };
  }, [sections]);

  const updateSectionTitle = (id: number, newTitle: string) => {
    setSections(sections.map(s => s.id === id ? { ...s, title: newTitle } : s));
  };

  const addRow = (secId: number, type: 'Add' | 'Ded') => {
    setSections(sections.map(s => s.id === secId ? 
      { ...s, measurements: [...s.measurements, { id: Date.now(), type, label: type === 'Ded' ? 'Deduction' : 'Extra', nos: '1', l: '0', b: '0', d: '0' }] } : s));
  };

  const deleteRow = (secId: number, mId: number) => {
    setSections(sections.map(s => s.id === secId ? 
      { ...s, measurements: s.measurements.filter(m => m.id !== mId) } : s));
  };

  const updateM = (secId: number, mId: number, field: string, val: string) => {
    setSections(sections.map(s => s.id === secId ? {
      ...s, measurements: s.measurements.map(m => m.id === mId ? { ...m, [field]: val } : m)
    } : s));
  };

  const clearAllData = () => {
    if(window.confirm("Clear all data and reset to original titles?")) {
      localStorage.clear();
      window.location.reload();
    }
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(16);
    doc.text("UNIQ DESIGNS & CONSTRUCTIONS", 105, 15, { align: 'center' });
    doc.setFontSize(12);
    doc.text("DETAILED CONSTRUCTION ESTIMATE", 105, 22, { align: 'center' });
    
    doc.setFontSize(10);
    doc.text(`Project: ${projectInfo.name}`, 14, 35);
    doc.text(`Client: ${projectInfo.client}`, 14, 40);
    doc.text(`Location: ${projectInfo.location}`, 14, 45);

    const tableRows = computedData.processed.filter(s => s.amount !== 0).map(s => [
      s.title, s.unit, s.totalQty.toFixed(2), s.rate, s.amount.toLocaleString()
    ]);

    autoTable(doc, {
      startY: 55,
      head: [['Description of Work', 'Unit', 'Total Qty', 'Rate', 'Amount (Rs)']],
      body: tableRows,
      theme: 'grid',
      headStyles: { fillColor: [0, 51, 102] }
    });

    doc.save(`${projectInfo.name || 'Estimate'}_Report.pdf`);
  };

  const shareWhatsApp = () => {
    let msg = `*UNIQ DESIGNS - ESTIMATE*\n*Project:* ${projectInfo.name}\n*Total:* ₹${computedData.grandTotal.toLocaleString()}\n\n`;
    computedData.processed.filter(s => s.amount !== 0).forEach(s => {
      msg += `✅ ${s.title}\nQty: ${s.totalQty.toFixed(2)} | Amt: ₹${s.amount.toLocaleString()}\n\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#f8fafc', minHeight: '100vh', paddingBottom: '180px', fontFamily: 'Arial' }}>
      
      {/* PROFESSIONAL HEADER */}
      <div style={{ background: '#003366', color: 'white', padding: '25px 15px', textAlign: 'center' }}>
        <h2 style={{ margin: 0, fontSize: '20px', letterSpacing: '1px' }}>UNIQ DESIGNS & CONSTRUCTIONS</h2>
        <p style={{ margin: '8px 0', fontSize: '13px', fontWeight: 'bold', color: '#ffd700' }}>DETAILED CONSTRUCTION ESTIMATE</p>
        <button onClick={clearAllData} style={{ marginTop: '10px', background: '#dc3545', color: 'white', border: 'none', padding: '6px 15px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}>
          🗑️ CLEAR ALL DATA
        </button>
      </div>

      {/* PROJECT INFO */}
      <div style={{ background: '#fff', padding: '15px', borderBottom: '2px solid #003366', display: 'grid', gap: '8px' }}>
        <input placeholder="Project Name" value={projectInfo.name} style={headerInput} onChange={e => setProjectInfo({...projectInfo, name: e.target.value})} />
        <input placeholder="Client Name" value={projectInfo.client} style={headerInput} onChange={e => setProjectInfo({...projectInfo, client: e.target.value})} />
        <input placeholder="Location" value={projectInfo.location} style={headerInput} onChange={e => setProjectInfo({...projectInfo, location: e.target.value})} />
      </div>

      {/* EDITABLE 38 CONTENTS */}
      {computedData.processed.map((sec) => (
        <div key={sec.id} style={{ background: '#fff', margin: '15px 10px', borderRadius: '8px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)', border: '1px solid #e2e8f0' }}>
          <div style={{ background: '#007bff', padding: '8px' }}>
            <textarea 
              value={sec.title} 
              onChange={(e) => updateSectionTitle(sec.id, e.target.value)}
              style={{ width: '100%', background: 'transparent', border: 'none', color: 'white', fontWeight: 'bold', fontSize: '14px', resize: 'none' }}
              rows={2}
            />
          </div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ background: '#f1f5f9' }}>
              <tr>
                <th style={tdStyle}>Description</th><th style={tdStyle}>Nos</th><th style={tdStyle}>L</th><th style={tdStyle}>B</th><th style={tdStyle}>D</th><th style={tdStyle}>Action</th>
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
                  <td style={tdStyle}>
                    <button onClick={() => deleteRow(sec.id, m.id)} style={{ border: 'none', background: 'none', color: '#ef4444', fontSize: '14px' }}>🗑️</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: '12px', background: '#f8fafc', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button onClick={() => addRow(sec.id, 'Add')} style={btnAction}>+ Add</button>
              <button onClick={() => addRow(sec.id, 'Ded')} style={{ ...btnAction, background: '#ef4444' }}>- Ded</button>
            </div>
            <div style={{ textAlign: 'right', fontSize: '12px' }}>
              Rate: <input type="number" value={sec.rate} onChange={e => setSections(sections.map(s => s.id === sec.id ? {...s, rate: e.target.value} : s))} style={{ width: '70px', border: '1px solid #cbd5e1', borderRadius: '4px' }} />
              <div style={{ fontWeight: 'bold', marginTop: '4px', color: '#1e293b' }}>Qty: {sec.totalQty.toFixed(2)} | ₹{sec.amount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      ))}

      {/* STICKY ACTION FOOTER */}
      <div style={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: '600px', background: 'white', padding: '15px', borderTop: '3px solid #003366', boxShadow: '0 -5px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '12px' }}>
          <span style={{ fontWeight: 'bold' }}>GRAND TOTAL:</span>
          <span style={{ fontWeight: 'bold', color: '#b91c1c', fontSize: '22px' }}>₹ {computedData.grandTotal.toLocaleString()}</span>
        </div>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
          <button onClick={generatePDF} style={{ padding: '14px', background: '#1e293b', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>DOWNLOAD PDF 📄</button>
          <button onClick={shareWhatsApp} style={{ padding: '14px', background: '#22c55e', color: 'white', border: 'none', borderRadius: '8px', fontWeight: 'bold' }}>WHATSAPP ✅</button>
        </div>
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = { border: '1px solid #e2e8f0', padding: '6px', textAlign: 'center' };
const cellInput: React.CSSProperties = { width: '100%', border: 'none', textAlign: 'center', fontSize: '12px', background: 'transparent', outline: 'none' };
const headerInput: React.CSSProperties = { padding: '12px', border: '1px solid #cbd5e1', borderRadius: '6px', fontSize: '14px' };
const btnAction: React.CSSProperties = { padding: '6px 12px', background: '#10b981', color: 'white', border: 'none', borderRadius: '5px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' };
