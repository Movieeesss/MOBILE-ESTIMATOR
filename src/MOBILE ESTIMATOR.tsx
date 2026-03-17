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

export default function UniqProfessionalEstimator() {
  // 1. Initialize from LocalStorage or use Defaults
  const [projectInfo, setProjectInfo] = useState(() => {
    const saved = localStorage.getItem('uniq_project_info');
    return saved ? JSON.parse(saved) : { name: "", client: "", location: "" };
  });

  const [sections, setSections] = useState(() => {
    const saved = localStorage.getItem('uniq_sections');
    return saved ? JSON.parse(saved) : INITIAL_TITLES.map((title, idx) => ({
      id: idx,
      title: title,
      unit: 'M3',
      rate: '0',
      measurements: [{ id: Date.now() + idx, type: 'Add', label: 'Main', nos: '1', l: '0', b: '0', d: '0' }]
    }));
  });

  // 2. Auto-Save to LocalStorage whenever data changes
  useEffect(() => {
    localStorage.setItem('uniq_project_info', JSON.stringify(projectInfo));
  }, [projectInfo]);

  useEffect(() => {
    localStorage.setItem('uniq_sections', JSON.stringify(sections));
  }, [sections]);

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

  const addRow = (secId: number, type: 'Add' | 'Ded') => {
    setSections(sections.map(s => s.id === secId ? 
      { ...s, measurements: [...s.measurements, { id: Date.now(), type, label: type === 'Ded' ? 'Deduction' : 'Extra', nos: '1', l: '0', b: '0', d: '0' }] } : s));
  };

  const updateM = (secId: number, mId: number, field: string, val: string) => {
    setSections(sections.map(s => s.id === secId ? {
      ...s, measurements: s.measurements.map(m => m.id === mId ? { ...m, [field]: val } : m)
    } : s));
  };

  const clearAllData = () => {
    if(window.confirm("Delete all saved data and start new estimate?")) {
      localStorage.removeItem('uniq_project_info');
      localStorage.removeItem('uniq_sections');
      window.location.reload();
    }
  };

  const shareWhatsApp = () => {
    let msg = `*UNIQ DESIGNS - ESTIMATE*\nProject: ${projectInfo.name}\nTotal: ₹${computedData.grandTotal.toLocaleString()}\n\n`;
    computedData.processed.filter(s => s.amount > 0).forEach(s => {
      msg += `✅ ${s.title}: ${s.totalQty.toFixed(2)} ${s.unit} = ₹${s.amount.toLocaleString()}\n`;
    });
    window.open(`https://wa.me/?text=${encodeURIComponent(msg)}`, '_blank');
  };

  return (
    <div style={{ maxWidth: '600px', margin: '0 auto', background: '#f4f6f9', minHeight: '100vh', paddingBottom: '160px', fontFamily: 'Arial' }}>
      
      <div style={{ background: '#003366', color: 'white', padding: '20px', textAlign: 'center', position: 'relative' }}>
        <h2 style={{ margin: 0, fontSize: '18px' }}>UNIQ DESIGNS & CONSTRUCTIONS</h2>
        <p style={{ margin: '5px 0', fontSize: '12px', opacity: 0.8 }}>DETAILED MEASUREMENT SHEET</p>
        <button onClick={clearAllData} style={{ position: 'absolute', right: '10px', top: '10px', background: '#dc3545', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px', padding: '5px' }}>CLEAR ALL</button>
      </div>

      <div style={{ background: '#fff', padding: '15px', borderBottom: '2px solid #003366', display: 'grid', gap: '10px' }}>
        <input placeholder="Project Name" value={projectInfo.name} style={headerInput} onChange={e => setProjectInfo({...projectInfo, name: e.target.value})} />
        <input placeholder="Client Name" value={projectInfo.client} style={headerInput} onChange={e => setProjectInfo({...projectInfo, client: e.target.value})} />
        <input placeholder="Location" value={projectInfo.location} style={headerInput} onChange={e => setProjectInfo({...projectInfo, location: e.target.value})} />
      </div>

      {computedData.processed.map((sec) => (
        <div key={sec.id} style={{ background: '#fff', margin: '15px 10px', borderRadius: '8px', boxShadow: '0 2px 8px rgba(0,0,0,0.1)', overflow: 'hidden', border: '1px solid #ddd' }}>
          <div style={{ background: '#007bff', color: 'white', padding: '10px', fontSize: '14px', fontWeight: 'bold' }}>{sec.title}</div>

          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '12px' }}>
            <thead style={{ background: '#e9ecef' }}>
              <tr>
                <th style={tdStyle}>Description</th>
                <th style={tdStyle}>Nos</th><th style={tdStyle}>L</th><th style={tdStyle}>B</th><th style={tdStyle}>D</th><th style={tdStyle}>Qty</th>
              </tr>
            </thead>
            <tbody>
              {sec.measurements.map(m => (
                <tr key={m.id} style={{ background: m.type === 'Ded' ? '#fff0f0' : 'white' }}>
                  <td style={tdStyle}><input value={m.label} onChange={e => updateM(sec.id, m.id, 'label', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><input type="number" value={m.nos} onChange={e => updateM(sec.id, m.id, 'nos', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><input type="number" value={m.l} onChange={e => updateM(sec.id, m.id, 'l', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><input type="number" value={m.b} onChange={e => updateM(sec.id, m.id, 'b', e.target.value)} style={cellInput} /></td>
                  <td style={tdStyle}><input type="number" value={m.d} onChange={e => updateM(sec.id, m.id, 'd', e.target.value)} style={cellInput} /></td>
                  <td style={{ ...tdStyle, fontWeight: 'bold' }}>
                    {(m.type === 'Ded' ? '-' : '') + ((parseFloat(m.nos)||0)*(parseFloat(m.l)||0)*(parseFloat(m.b)||0)*(parseFloat(m.d)||0)).toFixed(2)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <div style={{ padding: '10px', background: '#f8f9fa', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #ddd' }}>
            <div style={{ display: 'flex', gap: '5px' }}>
              <button onClick={() => addRow(sec.id, 'Add')} style={btnSmall}>+ Add</button>
              <button onClick={() => addRow(sec.id, 'Ded')} style={{ ...btnSmall, background: '#dc3545' }}>- Ded</button>
            </div>
            <div style={{ textAlign: 'right' }}>
              <div style={{ fontSize: '11px' }}>Rate: <input type="number" value={sec.rate} onChange={e => setSections(sections.map(s => s.id === sec.id ? {...s, rate: e.target.value} : s))} style={{ width: '60px' }} /></div>
              <div style={{ fontWeight: 'bold', color: '#003366' }}>Net Qty: {sec.totalQty.toFixed(2)} | ₹{sec.amount.toLocaleString()}</div>
            </div>
          </div>
        </div>
      ))}

      <div style={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: '600px', background: 'white', padding: '15px', borderTop: '3px solid #003366', boxShadow: '0 -5px 15px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
          <span style={{ fontWeight: 'bold' }}>GRAND TOTAL:</span>
          <span style={{ fontWeight: 'bold', color: '#d93025', fontSize: '20px' }}>₹ {computedData.grandTotal.toLocaleString()}</span>
        </div>
        <button onClick={shareWhatsApp} style={{ width: '100%', padding: '12px', background: '#25D366', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold', cursor: 'pointer' }}>
          SHARE ON WHATSAPP ✅
        </button>
      </div>
    </div>
  );
}

const tdStyle: React.CSSProperties = { border: '1px solid #ddd', padding: '4px', textAlign: 'center' };
const cellInput: React.CSSProperties = { width: '100%', border: 'none', textAlign: 'center', fontSize: '12px', outline: 'none', background: 'transparent' };
const headerInput: React.CSSProperties = { padding: '10px', border: '1px solid #ccc', borderRadius: '4px' };
const btnSmall: React.CSSProperties = { padding: '4px 8px', background: '#28a745', color: 'white', border: 'none', borderRadius: '4px', fontSize: '10px', cursor: 'pointer' };
