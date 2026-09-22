import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AttendanceRecord, User, TeamMemberStatus } from '../types';

export const formatSecondsToHM = (totalSeconds?: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '0h 0m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  return `${hours}h ${minutes}m`;
};

export const formatSecondsToHMS = (totalSeconds?: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
};

export const exportAttendanceToCSV = (
  records: AttendanceRecord[],
  users?: User[],
  filename = 'vertofi_attendance_export.csv'
) => {
  const headers = [
    'Date', 'Day', 'Employee Name', 'Employee ID', 'Department',
    'Clock In', 'Clock Out', 'Break Duration', 'Net Work Hours',
    'Overtime', 'Status', 'Late (Mins)'
  ];

  const rows = records.map(r => {
    const emp = users?.find(u => u.id === r.userId || u.employeeId === r.userId);
    return [
      r.date,
      r.dayName,
      `"${emp?.name || r.userId}"`,
      emp?.employeeId || '',
      `"${emp?.department || ''}"`,
      r.clockIn || '---',
      r.clockOut || '---',
      formatSecondsToHM(r.totalBreakSeconds),
      formatSecondsToHM(r.netWorkSeconds),
      formatSecondsToHM(r.overtimeSeconds),
      r.status,
      r.lateMinutes || 0
    ];
  });

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportAttendanceToExcel = (
  records: AttendanceRecord[],
  users?: User[],
  filename = 'vertofi_attendance_export.xlsx'
) => {
  const formattedData = records.map(r => {
    const emp = users?.find(u => u.id === r.userId || u.employeeId === r.userId);
    return {
      'Date': r.date,
      'Day': r.dayName,
      'Employee Name': emp?.name || r.userId,
      'Employee ID': emp?.employeeId || '',
      'Department': emp?.department || '',
      'Clock In': r.clockIn || 'N/A',
      'Clock Out': r.clockOut || 'N/A',
      'Break Duration': formatSecondsToHM(r.totalBreakSeconds),
      'Net Work Hours': formatSecondsToHM(r.netWorkSeconds),
      'Overtime': formatSecondsToHM(r.overtimeSeconds),
      'Status': r.status,
      'Late Minutes': r.lateMinutes || 0
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
  XLSX.writeFile(workbook, filename);
};

export const exportAttendanceToPDF = (
  records: AttendanceRecord[],
  users?: User[],
  reportTitle = 'Workforce Attendance Report',
  filename = 'vertofi_attendance_report.pdf'
) => {
  const doc = new jsPDF({ orientation: 'landscape' });

  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 297, 32, 'F');

  // Title & Brand
  doc.setTextColor(14, 165, 233); // brand blue
  doc.setFontSize(18);
  doc.text('VERTOFI WORKCLOCK', 14, 15);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(reportTitle, 14, 24);

  doc.setTextColor(148, 163, 184); // slate-400
  doc.setFontSize(8);
  doc.text(`Generated on: ${new Date().toLocaleString()} | SaaS Workforce Management`, 14, 38);

  const tableRows = records.map(r => {
    const emp = users?.find(u => u.id === r.userId || u.employeeId === r.userId);
    return [
      r.date,
      emp?.name || r.userId,
      emp?.employeeId || '',
      emp?.department || '',
      r.clockIn || '---',
      r.clockOut || '---',
      formatSecondsToHM(r.totalBreakSeconds),
      formatSecondsToHM(r.netWorkSeconds),
      formatSecondsToHM(r.overtimeSeconds),
      r.status
    ];
  });

  autoTable(doc, {
    startY: 44,
    head: [[
      'Date', 'Employee', 'ID', 'Department', 'Clock In', 'Clock Out',
      'Break', 'Work Hours', 'Overtime', 'Status'
    ]],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
      fontStyle: 'bold',
      fontSize: 8
    },
    styles: {
      fontSize: 8,
      cellPadding: 2.5
    },
    alternateRowStyles: {
      fillColor: [248, 250, 252]
    }
  });

  doc.save(filename);
};

export const exportTeamToCSV = (team: TeamMemberStatus[], filename = 'vertofi_team_attendance.csv') => {
  const headers = ['Employee Name', 'ID', 'Department', 'Status', 'Clock In', 'Current Activity', 'Work Hours', 'Break Time', 'Last Active'];
  const rows = team.map(t => [
    `"${t.user.name}"`,
    t.user.employeeId,
    t.user.department,
    t.currentStatus,
    t.clockInTimeFormatted || '---',
    `"${(t.currentActivity || '').replace(/"/g, '""')}"`,
    formatSecondsToHM(t.totalWorkSecondsToday),
    formatSecondsToHM(t.totalBreakSecondsToday),
    t.lastActive
  ]);

  const csvContent = [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
