import React, { useState } from 'react';
import { Search, Bluetooth, Sparkles } from 'lucide-react';

const StudentRoster = ({ students = [], loading = false }) => {
  const [searchTerm, setSearchTerm] = useState('');

  const filteredStudents = students.filter(
    (student) =>
      student.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      student.bluetooth_id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <Sparkles className="w-5 h-5 text-indigo-400" />
            Registered Roster
          </h2>
          <p className="text-xs text-slate-400">
            List of student devices registered in the system
          </p>
        </div>

        <div className="relative w-full sm:w-72">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-slate-500">
            <Search className="h-4 w-4" />
          </span>
          <input
            type="text"
            placeholder="Search students..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="block w-full rounded-xl border border-slate-700 bg-slate-900/40 py-2 pl-9 pr-3 text-slate-100 placeholder-slate-500 focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 focus:outline-none text-sm transition-colors"
          />
        </div>
      </div>

      <div className="glass-panel rounded-2xl overflow-hidden shadow-lg border border-slate-800">
        <div className="overflow-x-auto">
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 gap-3 text-slate-400">
              <div className="w-8 h-8 border-2 border-cyan-500 border-t-transparent rounded-full animate-spin"></div>
              <p className="text-sm">Loading student records...</p>
            </div>
          ) : filteredStudents.length === 0 ? (
            <div className="text-center py-12 text-slate-500 text-sm">
              No students found matching your search.
            </div>
          ) : (
            <table className="min-w-full divide-y divide-slate-800">
              <thead className="bg-slate-900/60 text-slate-400 text-xs font-semibold uppercase tracking-wider text-left">
                <tr>
                  <th className="px-6 py-4">Student ID</th>
                  <th className="px-6 py-4">Full Name</th>
                  <th className="px-6 py-4">BLE Device Name (Bluetooth ID)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 text-sm text-slate-300">
                {filteredStudents.map((student) => (
                  <tr
                    key={student.id}
                    className="hover:bg-slate-900/30 transition-colors"
                  >
                    <td className="px-6 py-4 font-mono text-cyan-400 font-medium">
                      {student.id}
                    </td>
                    <td className="px-6 py-4 font-semibold text-white">
                      {student.name}
                    </td>
                    <td className="px-6 py-4 flex items-center gap-2 text-slate-400">
                      <Bluetooth className="w-4 h-4 text-cyan-500" />
                      <span className="font-mono text-xs">{student.bluetooth_id}</span>
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

export default StudentRoster;
