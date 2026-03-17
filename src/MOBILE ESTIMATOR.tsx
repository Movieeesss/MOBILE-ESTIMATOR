import React, { useState, useMemo } from 'react';
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

export default function UniqUltimateEstimator() {
  const [project, setProject] = useState({ name: "", client: "" });
  const [sections, setSections] = useState(INITIAL_TITLES.map((title, idx) => ({
    id: idx,
    title: title,
    unit: 'M3',
    rate: '0',
    measurements: [{ id: Date.now() + idx, nos: '1', l: '0', b: '0', d: '0' }]
  })));

  const computedData = useMemo(() => {
    let grandTotal = 0;
    const processed = sections.map(sec => {
      const totalQty = sec.measurements.reduce((acc, m) => 
        acc + (parseFloat(m.nos) || 0) * (parseFloat(m.l) || 0) * (parseFloat(m.b) || 0) * (parseFloat(m.d) || 0), 0);
      const amount = totalQty * (parseFloat(sec.rate) || 0);
      grandTotal += amount;
      return { ...sec, totalQty, amount };
    });
    return { processed, grandTotal };
  }, [sections]);

  const addMeasurement = (secId: number) => {
    setSections(sections.map(s => s.id === secId ? 
      { ...s, measurements: [...s.measurements, { id: Date.now(), nos: '1', l: '0', b: '0', d: '0' }] } : s));
  };

  const updateMeasurement = (secId: number, mId: number, field: string, val: string) => {
    setSections(sections.map(s => s.id === secId ? {
      ...s, measurements: s.measurements.map(m => m.id === mId ? { ...m, [field]: val } : m)
    } : s));
  };

  const generatePDF = () => {
    const doc = new jsPDF();
    doc.setFontSize(18);
    doc.text("UNIQ DESIGNS - PROJECT ESTIMATE", 14, 20);
    doc.setFontSize(10);
    doc.text(`Project: ${project.name || 'N/A'}`, 14, 30);
    doc.text(`Client: ${project.client || 'N/A'}`, 14, 35);

    const body = computedData.processed.filter(s => s.amount > 0).map(s => [
      s.title, s.unit, s.totalQty.toFixed(3), s.rate, s.amount.toLocaleString()
    ]);

    autoTable(doc, {
      startY: 45,
      head: [['Description', 'Unit', 'Total Qty', 'Rate (Rs)', 'Amount (Rs)']],
      body: body,
      theme: 'grid',
      headStyles: { fillColor: [7, 94, 84] }
    });

    doc.save(`${project.name || 'Estimate'}.pdf`);
  };

  return (
    <div style={{ maxWidth: '500px', margin: '0 auto', background: '#f5f5f5', minHeight: '100vh', paddingBottom: '120px', fontFamily: 'sans-serif' }}>
      <header style={{ background: '#075E54', color: 'white', padding: '15px', position: 'sticky', top: 0, zIndex: 100, display: 'flex', justifyContent: 'space-between' }}>
        <b>UNIQ ESTIMATOR PRO</b>
        <button onClick={() => window.location.reload()} style={{ background: 'red', border: 'none', color: 'white', fontSize: '10px', padding: '4px 8px', borderRadius: '4px' }}>RESET</button>
      </header>

      <div style={{ padding: '15px', background: 'white', borderBottom: '1px solid #ddd' }}>
        <input placeholder="Project Name" onChange={e => setProject({...project, name: e.target.value})} style={inputStyle} />
        <input placeholder="Client Name" onChange={e => setProject({...project, client: e.target.value})} style={inputStyle} />
      </div>

      {computedData.processed.map((sec) => (
        <div key={sec.id} style={{ background: 'white', margin: '10px', borderRadius: '8px', boxShadow: '0 2px 5px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
          <div style={{ background: '#f8f9fa', padding: '10px', borderBottom: '1px solid #eee' }}>
            <textarea value={sec.title} onChange={e => setSections(sections.map(s => s.id === sec.id ? {...s, title: e.target.value} : s))} style={{ width: '100%', border: 'none', background: 'transparent', fontWeight: 'bold', fontSize: '13px' }} rows={2} />
            <div style={{ display: 'flex', gap: '10px', marginTop: '5px' }}>
              <select value={sec.unit} onChange={e => setSections(sections.map(s => s.id === sec.id ? {...s, unit: e.target.value} : s))} style={{ fontSize: '11px' }}>
                <option>M3</option><option>M2</option><option>Rft</option><option>Nos</option>
              </select>
              <input placeholder="Rate Rs." onChange={e => setSections(sections.map(s => s.id === sec.id ? {...s, rate: e.target.value} : s))} style={{ border: '1px solid #ccc', borderRadius: '4px', width: '80px', padding: '2px 5px', fontSize: '11px' }} />
            </div>
          </div>

          {sec.measurements.map((m, idx) => (
            <div key={m.id} style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1px', background: '#ddd', borderBottom: '1px solid #eee' }}>
              <MiniInput label="Nos" val={m.nos} onChange={v => updateMeasurement(sec.id, m.id, 'nos', v)} />
              <MiniInput label="L (m)" val={m.l} onChange={v => updateMeasurement(sec.id, m.id, 'l', v)} />
              <MiniInput label="B (m)" val={m.b} onChange={v => updateMeasurement(sec.id, m.id, 'b', v)} />
              <MiniInput label="D (m)" val={m.d} onChange={v => updateMeasurement(sec.id, m.id, 'd', v)} />
            </div>
          ))}

          <div style={{ padding: '8px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <button onClick={() => addMeasurement(sec.id)} style={{ color: '#075E54', border: '1px solid #075E54', background: 'white', fontSize: '10px', borderRadius: '4px', padding: '4px 8px' }}>+ ADD SUB-ROW</button>
            <div style={{ fontSize: '12px' }}>Total: <b>{sec.amount.toLocaleString()} Rs.</b></div>
          </div>
        </div>
      ))}

      <div style={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: '500px', background: 'white', padding: '15px', borderTop: '2px solid #075E54', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', fontWeight: 'bold' }}>
          <span>GRAND TOTAL:</span>
          <span style={{ color: '#d93025', fontSize: '18px' }}>Rs. {computedData.grandTotal.toLocaleString()}</span>
        </div>
        <button onClick={generatePDF} style={{ width: '100%', padding: '12px', background: '#333', color: 'white', borderRadius: '8px', fontWeight: 'bold' }}>DOWNLOAD PDF REPORT 📄</button>
      </div>
    </div>
  );
}

function MiniInput({ label, val, onChange }: any) {
  return (
    <div style={{ background: 'white', padding: '4px', textAlign: 'center' }}>
      <div style={{ fontSize: '8px', color: '#888' }}>{label}</div>
      <input type="number" value={val} onChange={e => onChange(e.target.value)} style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '12px', fontWeight: 'bold' }} />
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px', marginBottom: '8px', borderRadius: '5px', border: '1px solid #ccc', fontSize: '14px', boxSizing: 'border-box' as 'border-box' };
