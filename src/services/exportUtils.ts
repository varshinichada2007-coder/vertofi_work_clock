import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { AttendanceRecord, TeamMemberStatus } from '../types';

export const exportAttendanceToCSV = (data: AttendanceRecord[], filename = 'vertofi_attendance_report.csv') => {
  const headers = ['Date', 'Day', 'Clock In', 'Clock Out', 'Break Time', 'Work Hours', 'Status', 'Initial Task'];
  const rows = data.map(r => [
    r.date,
    r.dayName,
    r.clockIn,
    r.clockOut || '---',
    formatSecondsToHM(r.totalBreakSeconds),
    formatSecondsToHM(r.netWorkSeconds),
    r.status,
    `"${(r.initialTask || '').replace(/"/g, '""')}"`
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

export const exportAttendanceToExcel = (data: AttendanceRecord[], filename = 'vertofi_attendance_report.xlsx') => {
  const formattedData = data.map(r => ({
    'Date': r.date,
    'Day': r.dayName,
    'Clock In': r.clockIn,
    'Clock Out': r.clockOut || 'N/A',
    'Break Time': formatSecondsToHM(r.totalBreakSeconds),
    'Work Hours': formatSecondsToHM(r.netWorkSeconds),
    'Status': r.status,
    'Task Summary': r.initialTask || 'N/A'
  }));

  const worksheet = XLSX.utils.json_to_sheet(formattedData);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Attendance Report');
  XLSX.writeFile(workbook, filename);
};

export const exportAttendanceToPDF = (data: AttendanceRecord[], employeeName = 'Geethika', filename = 'vertofi_attendance_report.pdf') => {
  const doc = new jsPDF();

  // Header background
  doc.setFillColor(15, 23, 42); // slate-900
  doc.rect(0, 0, 210, 35, 'F');

  // Title & Brand
  doc.setTextColor(14, 165, 233); // brand blue
  doc.setFontSize(20);
  doc.text('VERTOFI WORKCLOCK', 14, 18);

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(11);
  doc.text(`Employee Attendance & Productivity Report - ${employeeName}`, 14, 27);

  doc.setTextColor(100, 116, 139);
  doc.setFontSize(9);
  doc.text(`Generated on: ${new Date().toLocaleDateString()} | Timezone: Asia/Kolkata`, 14, 42);

  const tableRows = data.map(r => [
    r.date,
    r.dayName,
    r.clockIn,
    r.clockOut || '---',
    formatSecondsToHM(r.totalBreakSeconds),
    formatSecondsToHM(r.netWorkSeconds),
    r.status
  ]);

  autoTable(doc, {
    startY: 48,
    head: [['Date', 'Day', 'Clock In', 'Clock Out', 'Break Time', 'Work Hours', 'Status']],
    body: tableRows,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 165, 233],
      textColor: 255,
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [241, 245, 249]
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

export const formatSecondsToHM = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '00h 00m';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hStr}h ${mStr}m`;
};

export const formatSecondsToHMS = (totalSeconds: number): string => {
  if (!totalSeconds || totalSeconds <= 0) return '00h 00m 00s';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const hStr = hours < 10 ? `0${hours}` : `${hours}`;
  const mStr = minutes < 10 ? `0${minutes}` : `${minutes}`;
  const sStr = seconds < 10 ? `0${seconds}` : `${seconds}`;
  return `${hStr}h ${mStr}m ${sStr}s`;
};
