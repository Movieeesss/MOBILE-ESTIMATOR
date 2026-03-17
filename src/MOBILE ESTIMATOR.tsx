import React, { useState, useMemo } from 'react';

const INITIAL_ITEMS = [
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

// Function to generate the clean initial state
const getInitialRows = () => INITIAL_ITEMS.map((desc, i) => ({
  id: i, description: desc, nos: '1', l: '0', b: '0', d: '0', rate: '0'
}));

export default function UniqProEstimator() {
  const [projectName, setProjectName] = useState("");
  const [clientName, setClientName] = useState("");
  const [rows, setRows] = useState(getInitialRows());

  const computed = useMemo(() => {
    const data = rows.map(r => {
      const qty = (parseFloat(r.nos) || 0) * (parseFloat(r.l) || 0) * (parseFloat(r.b) || 0) * (parseFloat(r.d) || 0);
      const amount = qty * (parseFloat(r.rate) || 0);
      return { ...r, qty, amount };
    });
    const totalAmount = data.reduce((acc, curr) => acc + curr.amount, 0);
    return { data, totalAmount };
  }, [rows]);

  const update = (id: number, field: string, val: string) => {
    setRows(rows.map(r => r.id === id ? { ...r, [field]: val } : r));
  };

  const handleReset = () => {
    if (window.confirm("Are you sure you want to clear all data? This cannot be undone.")) {
      setProjectName("");
      setClientName("");
      setRows(getInitialRows());
    }
  };

  const shareToWhatsApp = () => {
    let message = `*🏢 UNIQ DESIGNS - QUOTATION*\n`;
    message += `--------------------------\n`;
    message += `*Project:* ${projectName || 'Not Specified'}\n`;
    message += `*Client:* ${clientName || 'Not Specified'}\n`;
    message += `*Date:* ${new Date().toLocaleDateString()}\n`;
    message += `--------------------------\n\n`;

    computed.data.forEach(item => {
      if (item.amount > 0) {
        message += `✅ *${item.description}*\nQty: ${item.qty.toFixed(3)} | Rate: ₹${item.rate} | *Amt: ₹${item.amount.toLocaleString()}*\n\n`;
      }
    });

    message += `--------------------------\n`;
    message += `*💰 GRAND TOTAL: ₹${computed.totalAmount.toLocaleString()}*`;
    
    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  return (
    <div style={{ maxWidth: '480px', margin: '0 auto', background: '#f0f2f5', minHeight: '100vh', paddingBottom: '160px', fontFamily: 'sans-serif' }}>
      
      {/* Header with Reset Button */}
      <header style={{ background: '#075E54', color: 'white', padding: '16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', position: 'sticky', top: 0, zIndex: 10 }}>
        <span style={{ fontWeight: '900', fontSize: '16px' }}>UNIQ DESIGNS ESTIMATOR</span>
        <button 
          onClick={handleReset}
          style={{ background: '#d93025', color: 'white', border: 'none', padding: '5px 12px', borderRadius: '4px', fontSize: '11px', fontWeight: 'bold', cursor: 'pointer' }}
        >
          RESET
        </button>
      </header>

      {/* Client & Project Info */}
      <div style={{ padding: '15px', background: '#fff', borderBottom: '2px solid #ddd' }}>
        <input 
          placeholder="Project Name / Location" 
          value={projectName} 
          onChange={(e) => setProjectName(e.target.value)}
          style={{ width: '100%', marginBottom: '8px', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', fontWeight: 'bold', boxSizing: 'border-box' }}
        />
        <input 
          placeholder="Client Name" 
          value={clientName} 
          onChange={(e) => setClientName(e.target.value)}
          style={{ width: '100%', padding: '12px', borderRadius: '5px', border: '1px solid #ccc', boxSizing: 'border-box' }}
        />
      </div>

      {/* Data Rows */}
      <div style={{ padding: '10px' }}>
        {computed.data.map((row) => (
          <div key={row.id} style={{ background: 'white', marginBottom: '12px', borderRadius: '8px', borderLeft: '5px solid #075E54', boxShadow: '0 1px 3px rgba(0,0,0,0.1)' }}>
            <div style={{ padding: '10px', fontSize: '13px', fontWeight: 'bold', background: '#f8f9fa' }}>{row.description}</div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '1px', background: '#eee' }}>
              <InputBox label="Nos" val={row.nos} onChange={(v: string) => update(row.id, 'nos', v)} />
              <InputBox label="L" val={row.l} onChange={(v: string) => update(row.id, 'l', v)} />
              <InputBox label="B" val={row.b} onChange={(v: string) => update(row.id, 'b', v)} />
              <InputBox label="D" val={row.d} onChange={(v: string) => update(row.id, 'd', v)} />
              <InputBox label="Rate" val={row.rate} onChange={(v: string) => update(row.id, 'rate', v)} color="#e8f0fe" />
            </div>
            {row.amount > 0 && (
              <div style={{ padding: '8px 12px', textAlign: 'right', fontSize: '12px', color: '#075E54', fontWeight: 'bold', borderTop: '1px solid #f0f0f0' }}>
                Subtotal: ₹{row.amount.toLocaleString()}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Footer Action Bar */}
      <div style={{ position: 'fixed', bottom: 0, width: '100%', maxWidth: '480px', background: 'white', padding: '15px', borderTop: '2px solid #ddd', boxShadow: '0 -2px 10px rgba(0,0,0,0.1)', boxSizing: 'border-box' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px', alignItems: 'center' }}>
          <span style={{ fontSize: '14px', color: '#666' }}>Estimate Total:</span>
          <span style={{ fontSize: '20px', fontWeight: '900', color: '#075E54' }}>₹ {computed.totalAmount.toLocaleString()}</span>
        </div>
        <button 
          onClick={shareToWhatsApp}
          style={{ width: '100%', padding: '15px', background: '#25D366', color: 'white', border: 'none', borderRadius: '10px', fontWeight: '900', fontSize: '16px', cursor: 'pointer' }}
        >
          SHARE ON WHATSAPP 📲
        </button>
      </div>
    </div>
  );
}

function InputBox({ label, val, onChange, color="#fff" }: any) {
  return (
    <div style={{ background: color, padding: '5px', textAlign: 'center' }}>
      <div style={{ fontSize: '9px', color: '#666' }}>{label}</div>
      <input 
        type="number" 
        inputMode="decimal" 
        value={val} 
        onChange={(e) => onChange(e.target.value)} 
        style={{ width: '100%', border: 'none', textAlign: 'center', fontSize: '12px', fontWeight: 'bold', background: 'transparent' }} 
      />
    </div>
  );
}
