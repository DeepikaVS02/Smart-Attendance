import React, { useState, useEffect, useRef } from 'react';
import { 
  Play, Square, LogOut, Bluetooth, 
  RefreshCw, Radio, Settings, AlertCircle 
} from 'lucide-react';
import StatsCards from './StatsCards';
import StudentRoster from './StudentRoster';
import AttendanceLogs from './AttendanceLogs';
import { ToastContainer } from './Toast';
import { API } from '../utils/api';

const Dashboard = ({ onLogout }) => {
  const [activeTab, setActiveTab] = useState('logs'); // 'logs' or 'roster'
  const [students, setStudents] = useState([]);
  const [attendance, setAttendance] = useState([]);
  const [stats, setStats] = useState({
    total_students: 0,
    present_today: 0,
    absent_today: 0,
    attendance_rate: 0
  });

  const [toasts, setToasts] = useState([]);
  const [activeSession, setActiveSession] = useState(null);
  const [countdown, setCountdown] = useState(0);
  const [isScanning, setIsScanning] = useState(false);
  const [demoMode, setDemoMode] = useState(false);
  const [loading, setLoading] = useState({ roster: false, logs: false });

  const simTimerRef = useRef(null);
  const countdownIntervalRef = useRef(null);

  // Toast helpers
  const addToast = (message, type = 'info') => {
    const id = Date.now() + Math.random().toString(36).substr(2, 9);
    setToasts((prev) => [...prev, { id, message, type }]);
  };

  const removeToast = (id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Fetch initial data
  const fetchData = async () => {
    setLoading({ roster: true, logs: true });
    try {
      // 1. Fetch Students
      const rosterRes = await fetch(`${API}/api/students`);
      if (rosterRes.ok) {
        const rosterData = await rosterRes.json();
        setStudents(rosterData);
      }

      // 2. Fetch Active Session
      await checkActiveSession();

      // 3. Fetch stats and attendance
      await refreshAttendanceAndStats();
    } catch (err) {
      addToast('Failed to fetch data from backend. Is the server running?', 'error');
    } finally {
      setLoading({ roster: false, logs: false });
    }
  };

  useEffect(() => {
    fetchData();
    return () => {
      clearInterval(countdownIntervalRef.current);
      clearInterval(simTimerRef.current);
    };
  }, []);

  const checkActiveSession = async () => {
    try {
      const res = await fetch(`${API}/api/session/active`);
      if (res.ok) {
        const data = await res.json();
        if (data.active) {
          setActiveSession(data.session);
          setCountdown(data.session.time_remaining_seconds);
          startCountdownTimer(data.session.time_remaining_seconds);
        } else {
          setActiveSession(null);
          setCountdown(0);
        }
      }
    } catch (err) {
      console.error('Session sync error:', err);
    }
  };

  const refreshAttendanceAndStats = async () => {
    try {
      const statsRes = await fetch(`${API}/api/stats`);
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      const attRes = await fetch(`${API}/api/attendance`);
      if (attRes.ok) {
        const attData = await attRes.json();
        setAttendance(attData);
      }
    } catch (err) {
      console.error('Refresh error:', err);
    }
  };

  // Countdown timer logic
  const startCountdownTimer = (durationSeconds) => {
    clearInterval(countdownIntervalRef.current);
    let secondsLeft = durationSeconds;
    
    countdownIntervalRef.current = setInterval(() => {
      secondsLeft -= 1;
      setCountdown(Math.max(0, secondsLeft));

      if (secondsLeft <= 0) {
        clearInterval(countdownIntervalRef.current);
        setActiveSession(null);
        addToast('Attendance session has expired!', 'warning');
        refreshAttendanceAndStats();
        // Stop demo simulator if running
        if (simTimerRef.current) {
          clearInterval(simTimerRef.current);
          simTimerRef.current = null;
        }
      }
    }, 1000);
  };

  // Start Session
  const handleStartSession = async () => {
    try {
      const res = await fetch(`${API}/api/session/start`, {
        method: 'POST',
      });
      if (res.ok) {
        const data = await res.json();
        setActiveSession({
          id: data.id,
          start_time: data.start_time,
          end_time: data.end_time
        });
        // 5 minutes session = 300 seconds
        setCountdown(300);
        startCountdownTimer(300);
        addToast('New attendance session started! (5 Minutes)', 'success');
        
        // Reset attendance states to show fresh logs
        await refreshAttendanceAndStats();

        // If Demo mode is toggled ON, initialize simulation
        if (demoMode) {
          startDemoSimulation();
        }
      } else {
        addToast('Failed to start session on backend.', 'error');
      }
    } catch (err) {
      addToast('Connection error starting session.', 'error');
    }
  };

  // Stop Session
  const handleStopSession = async () => {
    try {
      const res = await fetch(`${API}/api/session/stop`, {
        method: 'POST',
      });
      if (res.ok) {
        clearInterval(countdownIntervalRef.current);
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
        setActiveSession(null);
        setCountdown(0);
        addToast('Attendance session stopped manually.', 'info');
        await refreshAttendanceAndStats();
      }
    } catch (err) {
      addToast('Connection error stopping session.', 'error');
    }
  };

  // Demo Simulation Engine
  const startDemoSimulation = () => {
    clearInterval(simTimerRef.current);
    
    // Every 8 to 15 seconds, mock a student check-in
    simTimerRef.current = setInterval(async () => {
      if (!activeSession) return;

      // Find students who are NOT marked present yet
      const checkedInIds = new Set(attendance.map((log) => log.student_id));
      const absentStudents = students.filter((s) => !checkedInIds.has(s.id));

      if (absentStudents.length === 0) {
        clearInterval(simTimerRef.current);
        simTimerRef.current = null;
        addToast('All students checked in! Demo simulation completed.', 'info');
        return;
      }

      // Pick random absent student
      const randomIndex = Math.floor(Math.random() * absentStudents.length);
      const studentToMark = absentStudents[randomIndex];

      try {
        const res = await fetch(`${API}/api/mark-attendance`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ studentId: studentToMark.bluetooth_id }),
        });

        const data = await res.json();
        if (res.ok && data.success) {
          addToast(`[Demo] Present: ${studentToMark.name} (${studentToMark.id})`, 'success');
          // Refresh logs & stats
          await refreshAttendanceAndStats();
        }
      } catch (err) {
        console.error('Demo simulation mark-in error:', err);
      }
    }, 7000);
  };

  // Watch demoMode changes
  useEffect(() => {
    if (demoMode && activeSession) {
      startDemoSimulation();
      addToast('Demo Mode simulator enabled.', 'info');
    } else {
      clearInterval(simTimerRef.current);
      simTimerRef.current = null;
      if (!demoMode && activeSession) {
        addToast('Demo Mode simulator disabled. Real Bluetooth scanning active.', 'info');
      }
    }
  }, [demoMode, activeSession, students, attendance]);

  // Real Web Bluetooth Scanning API Handler
  const handleBluetoothScan = async () => {
    if (!activeSession) {
      addToast('Please start an attendance session first.', 'warning');
      return;
    }

    if (!navigator.bluetooth) {
      addToast('Web Bluetooth API is not supported in this browser. Please use Chrome/Edge or enable Demo Mode!', 'error');
      return;
    }

    setIsScanning(true);
    addToast('Opening Bluetooth scan picker...', 'info');

    try {
      // Prompt user to select device.
      // Filter by the service UUID "1234" (Full 128-bit: 00001234-0000-1000-8000-00805f9b34fb)
      const serviceUUID = '00001234-0000-1000-8000-00805f9b34fb';
      const charUUID = '0000abcd-0000-1000-8000-00805f9b34fb';

      const device = await navigator.bluetooth.requestDevice({
        filters: [
          { services: [serviceUUID] }
        ],
        optionalServices: [serviceUUID]
      });

      addToast(`Connecting to BLE device: ${device.name || 'Unnamed Device'}...`, 'info');
      
      const server = await device.gatt.connect();
      addToast('Connected! Retrieving service...', 'info');
      
      const service = await server.getPrimaryService(serviceUUID);
      addToast('Service located. Reading characteristic...', 'info');
      
      const characteristic = await service.getCharacteristic(charUUID);
      const value = await characteristic.readValue();
      
      // Decode the buffer
      const decoder = new TextDecoder('utf-8');
      const studentId = decoder.decode(value).trim();
      
      addToast(`Extracted Student ID: ${studentId}. Registering...`, 'info');
      
      // POST to backend
      const res = await fetch('/api/mark-attendance', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId }),
      });

      const data = await res.json();
      
      if (res.ok && data.success) {
        addToast(`Success! Marked present: ${data.attendance.student_name}`, 'success');
        await refreshAttendanceAndStats();
      } else {
        addToast(data.detail || 'Failed to mark attendance.', 'error');
      }

      // Disconnect device cleanly
      if (device.gatt.connected) {
        device.gatt.disconnect();
      }

    } catch (error) {
      console.error(error);
      if (error.name === 'NotFoundError') {
        addToast('Bluetooth scan cancelled by teacher.', 'warning');
      } else {
        addToast(`BLE connection failed: ${error.message}`, 'error');
      }
    } finally {
      setIsScanning(false);
    }
  };

  // Timer string formatting
  const formatTime = (secs) => {
    const minutes = Math.floor(secs / 60);
    const seconds = secs % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  };

  const percentageRemaining = (countdown / 300) * 100;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-8">
      {/* Top Navbar */}
      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-slate-900/40 p-4 px-6 rounded-2xl border border-slate-800 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-cyan-950 flex items-center justify-center border border-cyan-500/40 text-cyan-400 shadow-md">
            <Radio className="w-6 h-6 animate-pulse" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-white tracking-wide">
              Smart Bluetooth Attendance
            </h1>
            <p className="text-xs text-slate-400">Proximity-based Check-In Panel</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          {/* Demo mode toggle */}
          <div className="flex items-center gap-2 bg-slate-950/80 px-4 py-2 rounded-xl border border-slate-850">
            <div className="text-right">
              <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Simulation Mode</p>
              <p className={`text-xs font-bold ${demoMode ? 'text-emerald-400' : 'text-slate-500'}`}>
                {demoMode ? 'Demo Mode ON' : 'Demo Mode OFF'}
              </p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={demoMode}
                onChange={(e) => setDemoMode(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-9 h-5 bg-slate-800 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-slate-400 after:border-slate-350 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500 peer-checked:after:bg-white peer-checked:after:border-emerald-600"></div>
            </label>
          </div>

          {/* Logout Button */}
          <button
            onClick={onLogout}
            className="flex items-center gap-2 bg-rose-950/30 hover:bg-rose-900/40 text-rose-300 hover:text-rose-200 border border-rose-900/30 hover:border-rose-850 py-2.5 px-4 rounded-xl text-sm font-semibold transition-all active:scale-95"
          >
            <LogOut className="w-4 h-4" />
            <span className="hidden sm:inline">Logout</span>
          </button>
        </div>
      </div>

      {/* Main Grid: Control Panel + Stats */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Session Control Panel Card */}
        <div className="glass-card p-6 rounded-2xl flex flex-col justify-between relative overflow-hidden border border-slate-800">
          <div className="absolute top-0 right-0 -mt-8 -mr-8 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl"></div>
          
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white flex items-center gap-2">
                <Settings className="w-5 h-5 text-slate-400" />
                Session Controls
              </h2>
              {activeSession ? (
                <span className="inline-flex items-center gap-1 bg-cyan-500/10 border border-cyan-500/30 text-cyan-400 text-xs px-2.5 py-1 rounded-full font-bold shadow-sm animate-pulse">
                  <span className="w-1.5 h-1.5 rounded-full bg-cyan-400"></span>
                  Active
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 bg-slate-900 border border-slate-800 text-slate-500 text-xs px-2.5 py-1 rounded-full font-bold">
                  Inactive
                </span>
              )}
            </div>

            <p className="text-sm text-slate-400 mb-6 leading-relaxed">
              Start a 5-minute attendance window. Students can be scanned manually via Web Bluetooth, or automatically simulated via Demo Mode.
            </p>
          </div>

          <div className="space-y-4">
            {activeSession && (
              <div className="bg-slate-950/60 border border-slate-900 p-4 rounded-xl space-y-2">
                <div className="flex justify-between items-center text-xs text-slate-400">
                  <span>Session Remaining Time</span>
                  <span className="font-mono font-bold text-cyan-400">{formatTime(countdown)}</span>
                </div>
                {/* Progress Bar */}
                <div className="w-full bg-slate-900 h-2 rounded-full overflow-hidden">
                  <div 
                    className="bg-cyan-500 h-full rounded-full transition-all duration-1000 ease-linear shadow-sm shadow-cyan-400"
                    style={{ width: `${percentageRemaining}%` }}
                  ></div>
                </div>
              </div>
            )}

            <div className="flex gap-3">
              {!activeSession ? (
                <button
                  onClick={handleStartSession}
                  className="flex-1 flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-emerald-500/20 transition-all active:scale-95"
                >
                  <Play className="w-5 h-5 fill-white text-white" />
                  <span>Start Session</span>
                </button>
              ) : (
                <button
                  onClick={handleStopSession}
                  className="flex-1 flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-500 text-white font-bold py-3 px-4 rounded-xl shadow-lg hover:shadow-rose-500/20 transition-all active:scale-95"
                >
                  <Square className="w-5 h-5 fill-white text-white" />
                  <span>Stop Session</span>
                </button>
              )}

              {activeSession && (
                <button
                  onClick={handleBluetoothScan}
                  disabled={isScanning}
                  className="flex items-center justify-center bg-cyan-600 hover:bg-cyan-500 disabled:bg-slate-800 disabled:border-slate-700 disabled:text-slate-500 text-white font-bold py-3 px-5 rounded-xl shadow-lg hover:shadow-cyan-500/20 border border-cyan-500/20 transition-all active:scale-95"
                  title="Scan BLE Device"
                >
                  {isScanning ? (
                    <div className="w-5 h-5 border-2 border-slate-500 border-t-transparent rounded-full animate-spin"></div>
                  ) : (
                    <Bluetooth className="w-5 h-5" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Stats Summary cards (spans 2 columns) */}
        <div className="lg:col-span-2 flex flex-col justify-between space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-bold text-white">Live Ratios</h2>
            <button
              onClick={refreshAttendanceAndStats}
              className="p-2 bg-slate-900 border border-slate-800 hover:border-slate-700 rounded-xl text-slate-400 hover:text-slate-200 transition-colors"
              title="Refresh Stats"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
          <StatsCards stats={stats} />

          {/* Simple alert notice for Web Bluetooth */}
          <div className="bg-cyan-950/20 border border-cyan-800/30 p-4 rounded-2xl flex gap-3 text-cyan-300 text-xs">
            <AlertCircle className="w-5 h-5 text-cyan-400 flex-shrink-0" />
            <div>
              <p className="font-bold text-white mb-0.5">Physical Device Scanning Note</p>
              <p className="leading-relaxed text-cyan-200">
                To mark real devices, students must host a BLE Server advertising UUID <code className="font-mono bg-cyan-950/60 px-1 py-0.5 rounded text-white border border-cyan-900/40">1234</code>. If testing without hardware, simply toggle **Simulation Mode** above to see attendance simulate live!
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs Menu */}
      <div className="border-b border-slate-850 flex gap-4">
        <button
          onClick={() => setActiveTab('logs')}
          className={`py-3 font-semibold text-sm border-b-2 px-1 transition-all ${
            activeTab === 'logs'
              ? 'border-cyan-500 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Attendance Log Sheet
        </button>
        <button
          onClick={() => setActiveTab('roster')}
          className={`py-3 font-semibold text-sm border-b-2 px-1 transition-all ${
            activeTab === 'roster'
              ? 'border-cyan-500 text-cyan-400 font-bold'
              : 'border-transparent text-slate-400 hover:text-slate-200'
          }`}
        >
          Registered Class Roster
        </button>
      </div>

      {/* Tab Panels */}
      <div className="min-h-96">
        {activeTab === 'logs' ? (
          <AttendanceLogs 
            attendance={attendance} 
            loading={loading.logs} 
          />
        ) : (
          <StudentRoster 
            students={students} 
            loading={loading.roster} 
          />
        )}
      </div>

      {/* Toast Notification Mount */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default Dashboard;
