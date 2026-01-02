import React, { useEffect, useState } from 'react';
import { useRobot } from '@/hooks/useRobot';
import { triggerClearMap } from './MapDisplay/mapEvents';

const Calibrating = () => {
  
  const { send, robotData } = useRobot();
  const [baseValue, setBaseValue] = useState('0.235');


  const handleUpdateBase = () => {
    console.log(baseValue);
    const val = parseFloat(baseValue);
    if (isNaN(val)) return;
    send(JSON.stringify({ base: val }));
  };
  useEffect(() => {
    if (robotData.type === 'wb' && robotData.val !== undefined){
      console.log('wheel base: ',robotData.val);
      setBaseValue(robotData.val)
    }
  }, [robotData]);

  return (
    <div style={styles.container}>


      {/* --- ส่วนปรับจูน (แถวเดียวกันประหยัดที่) --- */}
      <div style={styles.row}>
        <input
          type="number"
          step="0.0001"
          value={baseValue}
          onChange={(e) => setBaseValue(e.target.value)}
          style={styles.input}
        />
        <button onClick={handleUpdateBase} style={styles.updateBtn}>
          Set
        </button>
      </div>

      {/* --- ปุ่ม Action (เรียงแนวนอน) --- */}
      <div style={styles.row}>
        <button 
          onClick={() => send(JSON.stringify({ cmd: "cal" }))} 
          style={{ ...styles.actionBtn, backgroundColor: '#ff9800' }} // สีส้ม
          title="หมุนรอบตัวเอง 360 องศา"
        >
          🔄 Calib 360°
        </button>
        
        <button 
          onClick={() => {
            // 1. ส่งคำสั่ง Reset ไปที่หุ่น
            send(JSON.stringify({ cmd: "RST_ODOM" })); 
            
            // 2. สั่งล้างแมพ (ต้องมีวงเล็บ () เพื่อเรียกใช้ฟังก์ชัน)
            triggerClearMap(); 
          }}
          style={{ ...styles.actionBtn, backgroundColor: '#607d8b' }} 
          title="ตั้งค่าพิกัดปัจจุบันเป็น (0,0)"
        >
          📍 Zero
        </button>
      </div>
    </div>
  );
};

// 🎨 Styles: Dark & Minimal
const styles: { [key: string]: React.CSSProperties } = {
  container: {
    backgroundColor: '#1e1e1e', // Dark Grey
    color: '#e0e0e0',           // Off-white text
    padding: '10px',
    borderRadius: '8px',
    boxShadow: '0 4px 6px rgba(0,0,0,0.3)',
    width: 'fit-content',       // หดความกว้างเท่าเนื้อหา
    minWidth: '220px',
    border: '1px solid #333',
    fontFamily: 'sans-serif',
  },
  header: {
    marginBottom: '8px',
    borderBottom: '1px solid #333',
    paddingBottom: '5px',
    textAlign: 'center',
    color: '#bdbdbd',
  },
  row: {
    display: 'flex',
    gap: '5px',
    marginBottom: '8px',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  label: {
    fontSize: '12px',
    color: '#9e9e9e',
    whiteSpace: 'nowrap',
  },
  input: {
    backgroundColor: '#2d2d2d',
    border: '1px solid #444',
    color: '#fff',
    padding: '4px 8px',
    borderRadius: '4px',
    width: '200px',
    fontSize: '13px',
    textAlign: 'center',
  },
  updateBtn: {
    backgroundColor: '#9c27b0', // สีม่วง
    color: 'white',
    border: 'none',
    borderRadius: '4px',
    padding: '5px 10px',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
  },
  actionBtn: {
    flex: 1, // ขยายเต็มพื้นที่
    border: 'none',
    borderRadius: '4px',
    padding: '8px 5px',
    color: 'white',
    cursor: 'pointer',
    fontSize: '12px',
    fontWeight: 'bold',
    whiteSpace: 'nowrap',
  }
};

export default Calibrating;