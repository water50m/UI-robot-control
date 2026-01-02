// hooks/useRobot.ts
import { useState, useEffect, useRef, useCallback } from 'react';
import { SensorData, Direction } from '../types/robot';

export function useRobot() {
  const [isConnected, setIsConnected] = useState(false);
  const [activeBtn, setActiveBtn] = useState<Direction>('');
  const [logs, setLogs] = useState<string[]>([]);

  const [serverUrl, setServerUrl] = useState<string>('ws://10.29.129.59:8000/ws/client');
  const [isServerConnected, setIsServerConnected] = useState(false);
  const [isRobotConnected, setIsRobotConnected] = useState(false);
  const [robotData, setRobotData] = useState<SensorData>({ bat: 0, mode: '-', type: '' });
  
  const ws = useRef<WebSocket | null>(null);
  const watchdog = useRef<NodeJS.Timeout | null>(null);

  const [controlMode, setControlMode] = useState<'pad' | 'joy'>('pad');

  const [motorSpeed, setMotorSpeed] = useState({ L: 0, R: 0 });// เอาไว้ทำ animetion

  const handleConnectRequest = (ip: string) => {
    // เติม ws:// ถ้า user ลืมใส่
    const url = ip.startsWith('ws://') ? ip : `ws://${ip}`;
    // เพิ่ม path
    const fullUrl = `${url}/ws/client`; 
    setServerUrl(fullUrl);
  };

  // ฟังก์ชันส่งข้อมูล (ใช้ร่วมกันทั้ง Pad และ Joystick)
  const send = useCallback((cmd: string) => {
    if (ws.current?.readyState === WebSocket.OPEN) {
      ws.current.send(cmd);
    }
  }, []);

  // ฟังก์ชันเพิ่ม Log
  const addLog = (msg: string) => {
    const time = new Date().toLocaleTimeString('th-TH', { hour12: false });
    setLogs(prev => [`[${time}] ${msg}`, ...prev].slice(0, 50));
  };

  useEffect(() => {
    fetch('/api/ipconfig')
      .then((res) => res.json())
      .then((cfg) => setServerUrl(cfg.ip || serverUrl));
  }, []);

  useEffect(() => {
    // 1. WebSocket Setup
    const connect = () => {
      ws.current = new WebSocket(serverUrl);
      
      ws.current.onopen = () => {
        setIsServerConnected(true);
      };

      ws.current.onmessage = (e) => {
        setIsConnected(true);
        if (watchdog.current) clearTimeout(watchdog.current);
        
        // Watchdog: 2 วินาทีเงียบ = ตาย
        watchdog.current = setTimeout(() => {
            setIsConnected(false);
            //ws.current?.close();
        }, 2000);

        try {
         const parsed = JSON.parse(e.data);
          // ➕ 2. ดักจับคำสั่งเปลี่ยนโหมดจากบอร์ด
          // ตัวอย่าง JSON จากบอร์ด: { "sys": "config", "mode": "joy" }
          if (parsed.type === 'status' || parsed.type === 'lidar') {
           setIsRobotConnected(true);
           
          }

          // 2. ถ้า Server ส่ง event พิเศษมาบอกว่า "หุ่นหลุด" (ถ้า Python ทำไว้)
          if (parsed.type === 'robot_disconnected') {
            setIsRobotConnected(false);
          }

          if (parsed.mL !== undefined && parsed.mR !== undefined) {
             setMotorSpeed({ L: parsed.mL, R: parsed.mR });
             if (parsed.mL !== 0 && parsed.mR !==  0){
             setLogs(prev => [...prev, `Motor Power: L=${parsed.mL} R=${parsed.mR}`]);
             }

          }

          if (parsed.type === 'config' && parsed.mode) {
             setControlMode(parsed.mode); 
             addLog(`System: Switched to ${parsed.mode} mode`);
             return; 
          }

          if (parsed.type === 'wb' && parsed.mode) {
             addLog(`cal value: ${parsed.val} `);
             return; 
          }

          // ข้อมูล Sensor ปกติ
          setRobotData(prev => ({ ...prev, ...parsed }));
          if (parsed.log) addLog(parsed.log);

        } catch (err) { console.error(err); }
      };

      ws.current.onclose = () => {
        setIsServerConnected(false);
        setIsRobotConnected(false);
        setIsConnected(false);
        // เคลียร์ Watchdog ตอนหลุดด้วย กันมันทำงานซ้อน
        if (watchdog.current) clearTimeout(watchdog.current);
        setTimeout(connect, 3000); 
      };
    };

    connect();

    // 2. Keyboard Logic ⌨️
    const activeKeys = new Set<string>();
    let lastSentCmd = ''; // ตัวแปรกันส่งซ้ำ

    const evaluate = () => {
      let cmd: Direction = 'S';
      
      // เรียง Priority: บน/ล่าง/ซ้าย/ขวา
      const up = activeKeys.has('w') || activeKeys.has('arrowup');
      const down = activeKeys.has('s') || activeKeys.has('arrowdown');
      const left = activeKeys.has('a') || activeKeys.has('arrowleft');
      const right = activeKeys.has('d') || activeKeys.has('arrowright');

      if (up && left) cmd = 'FL';
      else if (up && right) cmd = 'FR';
      else if (down && left) cmd = 'BL';
      else if (down && right) cmd = 'BR';
      // 2. ถ้าไม่เฉียง ค่อยเช็คทิศทางหลัก
      else if (up) cmd = 'F';
      else if (down) cmd = 'B';
      else if (left) cmd = 'L';
      else if (right) cmd = 'R';

      // 💡 Update UI: ให้ปุ่มบนหน้าจอบุ๋มลง/เขียว (Visual Feedback)
      // ถ้า cmd='S' ให้ส่งค่าว่าง '' เพื่อให้ปุ่มเด้งคืน
      setActiveBtn(cmd === 'S' ? '' : cmd);

      // 📡 Send Command: ส่งเฉพาะเมื่อคำสั่งเปลี่ยนไปจากเดิม (กัน Spam)
      if (cmd !== lastSentCmd) {
        
        if (cmd === 'S') {
           send(JSON.stringify({ x: 0, y: 0 })); // หยุด
        } else {
           // แปลงทิศทางเป็นค่า x, y (ความแรง 70% สำหรับเฉียง, 100% สำหรับตรง)
           // แกน Y: ขึ้นเป็น +, ลงเป็น -
           // แกน X: ขวาเป็น +, ซ้ายเป็น -
           let x = 0, y = 0;
           const SPEED = 100;
           const DIAG_SPEED = 71; // sin(45) * 100 ประมาณ 70.7

           switch (cmd) {
             case 'F': x = 0; y = SPEED; break;
             case 'B': x = 0; y = -SPEED; break;
             case 'L': x = -SPEED; y = 0; break;
             case 'R': x = SPEED; y = 0; break;
             case 'FL': x = -DIAG_SPEED; y = DIAG_SPEED; break;
             case 'FR': x = DIAG_SPEED; y = DIAG_SPEED; break;
             case 'BL': x = -DIAG_SPEED; y = -DIAG_SPEED; break;
             case 'BR': x = DIAG_SPEED; y = -DIAG_SPEED; break;
           }

           // ส่งเป็น JSON ให้ ESP32 คำนวณ (ใช้สูตร Arcade Drive ที่เราทำไว้)
           send(JSON.stringify({ x, y }));
        }
        
        lastSentCmd = cmd;
      }
    };

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return; // กันกดแช่แล้ว event รัว
      activeKeys.add(e.key.toLowerCase());
      evaluate();
    };

    const handleKeyUp = (e: KeyboardEvent) => {
      activeKeys.delete(e.key.toLowerCase());
      evaluate();
    };

    // ติดตั้งหูฟัง Event
    window.addEventListener('keydown', handleKeyDown);
    window.addEventListener('keyup', handleKeyUp);

    // Cleanup (ทำงานเมื่อปิดหน้าเว็บ หรือ useEffect ถูกเรียกใหม่)
    return () => {
      ws.current?.close();
      if (watchdog.current) clearTimeout(watchdog.current);
      window.removeEventListener('keydown', handleKeyDown);
      window.removeEventListener('keyup', handleKeyUp);
    };
  }, [send, setActiveBtn, serverUrl]); // 👈 อย่าลืม Dependency นี้

  return { robotData, isConnected, activeBtn, logs, send, setLogs, setActiveBtn, controlMode, motorSpeed, handleConnectRequest, isServerConnected, isRobotConnected, serverUrl };
}