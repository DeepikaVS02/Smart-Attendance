import React, { useState } from 'react';
import { Download, CheckCircle, Search, ClipboardList } from 'lucide-react';

const AttendanceLogs = ({ attendance = [], loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredLogs = attendance.filter(
    (log) =>
      log.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.student_id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      log.bluetooth_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleExportCSV = () => {
    if (attendance.length === 0) return;

    // Header row
    const headers = ['Student ID', 'Student Name', 'Bluetooth ID', 'Date', 'Time', 'Session ID'];
    
    // Data rows
    const rows = attendance.map((log) => [
      log.student_id,
      log.student_name,
      log.bluetooth_id,
      log.date,
      log.time,
      log.session_id,
    ]);

    const csvContent = [headers, ...rows]
      .map((e) => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `attendance_session_export_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-cyan-400" />
            Live Logs
          </h2>
          <p className="text-xs text-slate-400">
            Real-time checked-in students for the current session
          </p>
        </div>

        <div className="flex w-full sm:w-auto items-center gap-2 flex-grow sm:flex-grow-0 justify-end">
          <div className="relative w-full sm:w-60">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
              <Search className="h-4 w-4" />
            </span>
            <input
              type="text"
              placeholder="Search logs..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="block w-full rounded-xl border border-slate-700 bg-slate-900/40 py-2 pl-9 pr-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm transition-colors"
            />
          </div>

          <button
            onClick={handleExportCSV}
            disabled={attendance.length === 0}
            className="flex items-center gap-2 bg-slate-800 hover:bg-slate-700 text-white font-semibold py-2 px-4 rounded-xl border border-slate-700 text-sm transition-all active:scale-95 disabled:opacity-40 disabled:pointer-events-none"
          >
            <Download className="w-4 h-4" />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-slate-800">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Loading attendance logs...</p>
            </div>
          ) : filteredLogs.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              {searchTerm ? 'No logs match search query.' : 'No students checked in yet. Start attendance and pair devices!'}
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider text-left">
                <tr>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Name</th>
                  <th className="px-6 py-4">Bluetooth ID</th>
                  <th className="px-6 py-4">Check-in Date</th>
                  <th className="px-6 py-4">Check-in Time</th>
                  <th className="px-6 py-4 text-center">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredLogs.map((log) => (
                  <tr
                    key={log.id}
                    className="hover:bg-slate-900/30 transition-colors animate-fade-in"
                  >
                    <td className="px-6 py-4 font-mono text-cyan-400 font-medium">
                      {log.student_id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {log.student_name}
                    </td>
                    <td className="px-6 py-4 font-mono text-xs text-slate-400">
                      {log.bluetooth_id}
                    </td>
                    <td className="px-6 py-4 text-slate-400">{log.date}</td>
                    <td className="px-6 py-4 font-medium text-slate-300">{log.time}</td>
                    <td className="px-6 py-4 text-center">
                      <span className="inline-flex items-center gap-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 px-3 py-1 rounded-full text-xs font-bold shadow-sm shadow-emerald-500/5">
                        <CheckCircle className="w-3.5 h-3.5" />
                        Present
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttendanceLogs;
