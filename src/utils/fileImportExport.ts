import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
import { Student } from '../types';

/**
 * Clean and normalize student names
 * Removes numbering prefixes like "1. ", "01/ ", "1) ", bullets, etc.
 */
export function cleanStudentName(raw: string): string {
  if (!raw) return '';
  return raw
    .trim()
    .replace(/^[\d\s./\-–—)\],]+/, '') // remove leading numbers/punctuation like "1. ", "02 - "
    .trim();
}

/**
 * Parse text from pasted string (textarea)
 * Supports newlines, commas, semicolons, tabs, and numbered lines
 */
export function parseStudentsFromText(text: string): string[] {
  const lines = text
    .split(/[\r\n]+/)
    .map(line => line.trim())
    .filter(line => line.length > 0);

  const results: string[] = [];

  for (const line of lines) {
    // If line contains multiple names separated by comma or semicolon
    if (line.includes(',') || line.includes(';')) {
      const parts = line.split(/[,;]+/).map(p => cleanStudentName(p)).filter(Boolean);
      results.push(...parts);
    } else {
      const cleaned = cleanStudentName(line);
      if (cleaned.length > 0) {
        results.push(cleaned);
      }
    }
  }

  return results;
}

/**
 * Parse Excel file (.xlsx, .xls, .csv)
 */
export async function parseStudentsFromExcel(file: File): Promise<{ names: string[]; sheetName: string; detectedColumn: string }> {
  const data = await file.arrayBuffer();
  const workbook = XLSX.read(data, { type: 'array' });
  const sheetName = workbook.SheetNames[0];
  if (!sheetName) {
    throw new Error('File Excel không có dữ liệu');
  }

  const worksheet = workbook.Sheets[sheetName];
  const rows: unknown[][] = XLSX.utils.sheet_to_json(worksheet, { header: 1, defval: '' });

  if (rows.length === 0) {
    throw new Error('Bảng tính trống');
  }

  // Find header row or column containing names
  let nameColIndex = -1;
  let startRowIndex = 0;
  let detectedColumn = 'Cột 1';

  // Keyword match for student name header
  const keywords = ['họ và tên', 'họ tên', 'tên học sinh', 'tên', 'học sinh', 'fullname', 'full name', 'name', 'họ và tên học sinh'];

  // Check first 5 rows for header names
  for (let r = 0; r < Math.min(rows.length, 5); r++) {
    const row = rows[r];
    for (let c = 0; c < row.length; c++) {
      const cellVal = String(row[c] || '').toLowerCase().trim();
      if (keywords.some(k => cellVal.includes(k))) {
        nameColIndex = c;
        startRowIndex = r + 1;
        detectedColumn = String(row[c]);
        break;
      }
    }
    if (nameColIndex !== -1) break;
  }

  // Fallback: If no header found, pick the column with the highest number of non-numeric Vietnamese text entries
  if (nameColIndex === -1) {
    const maxCols = Math.max(...rows.map(r => r.length));
    let bestCol = 0;
    let bestScore = 0;

    for (let c = 0; c < maxCols; c++) {
      let score = 0;
      for (let r = 0; r < rows.length; r++) {
        const val = String(rows[r][c] || '').trim();
        // Check if string contains letters and isn't just an integer or date
        if (val.length >= 2 && !/^\d+$/.test(val) && /[a-zA-ZÀ-ỹ]/.test(val)) {
          score++;
        }
      }
      if (score > bestScore) {
        bestScore = score;
        bestCol = c;
      }
    }
    nameColIndex = bestCol;
    startRowIndex = 0;
    detectedColumn = `Cột ${String.fromCharCode(65 + nameColIndex)}`;
  }

  const names: string[] = [];
  for (let r = startRowIndex; r < rows.length; r++) {
    const cellValue = rows[r][nameColIndex];
    if (cellValue !== undefined && cellValue !== null) {
      const cleaned = cleanStudentName(String(cellValue));
      // Ignore header repetitions or empty rows
      if (cleaned.length > 0 && !keywords.includes(cleaned.toLowerCase()) && !/^(stt|số thứ tự|id)$/i.test(cleaned)) {
        names.push(cleaned);
      }
    }
  }

  return { names, sheetName, detectedColumn };
}

/**
 * Parse Word file (.docx)
 * Extracts text from paragraphs and tables using mammoth
 */
export async function parseStudentsFromWord(file: File): Promise<{ names: string[] }> {
  const arrayBuffer = await file.arrayBuffer();
  
  // Extract both raw text and HTML to ensure table contents are cleanly separated
  const result = await mammoth.extractRawText({ arrayBuffer });
  const rawText = result.value;

  const lines = rawText.split(/[\r\n]+/).map(l => l.trim()).filter(Boolean);
  const names: string[] = [];

  const ignoreWords = [
    'danh sách', 'học sinh', 'lớp', 'năm học', 'họ và tên', 'stt', 'số thứ tự',
    'giáo viên', 'ngày sinh', 'giới tính', 'ghi chú', 'trường', 'phòng gd'
  ];

  for (const line of lines) {
    // Check if line looks like a header or document title
    const lower = line.toLowerCase();
    const isDocHeader = ignoreWords.some(w => lower === w || lower.startsWith(w + ':'));
    if (isDocHeader) continue;

    // Line might have multiple tab-separated cells if copied from a table
    if (line.includes('\t')) {
      const cells = line.split('\t').map(c => cleanStudentName(c)).filter(Boolean);
      for (const cell of cells) {
        if (cell.length >= 2 && !/^\d+$/.test(cell) && !ignoreWords.includes(cell.toLowerCase())) {
          names.push(cell);
        }
      }
    } else {
      const cleaned = cleanStudentName(line);
      if (cleaned.length >= 2 && !/^\d+$/.test(cleaned) && !ignoreWords.includes(cleaned.toLowerCase())) {
        names.push(cleaned);
      }
    }
  }

  return { names };
}

/**
 * Export students list to Excel (.xlsx)
 */
export function exportStudentsToExcel(students: Student[], className: string) {
  const wb = XLSX.utils.book_new();

  const data = [
    [`DANH SÁCH HỌC SINH - ${className.toUpperCase()}`],
    [`Ngày xuất: ${new Date().toLocaleDateString('vi-VN')} ${new Date().toLocaleTimeString('vi-VN')}`],
    [],
    ['STT', 'Họ và tên', 'Trạng thái', 'Số lần đã gọi', 'Ghi chú']
  ];

  students.forEach((s, idx) => {
    data.push([
      (idx + 1).toString(),
      s.name,
      s.active ? 'Đang tham gia' : 'Tạm loại / Vắng',
      s.pickedCount.toString(),
      s.note || ''
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 8 },  // STT
    { wch: 28 }, // Họ và tên
    { wch: 18 }, // Trạng thái
    { wch: 16 }, // Số lần đã gọi
    { wch: 25 }, // Ghi chú
  ];

  XLSX.utils.book_append_sheet(wb, ws, 'Danh sách');
  const fileName = `Danh_Sach_Hoc_Sinh_${className.replace(/\s+/g, '_')}_${Date.now()}.xlsx`;
  XLSX.writeFile(wb, fileName);
}

/**
 * Export students list to Word document (.doc)
 * Generates an MS Word & Google Docs compatible rich XML/HTML document with full styling
 */
export function exportStudentsToWord(students: Student[], className: string) {
  const currentDate = new Date().toLocaleDateString('vi-VN');
  const currentTime = new Date().toLocaleTimeString('vi-VN');

  const rowsHtml = students.map((s, index) => `
    <tr>
      <td style="border: 1px solid #94a3b8; padding: 8px 12px; text-align: center;">${index + 1}</td>
      <td style="border: 1px solid #94a3b8; padding: 8px 12px; font-weight: 600; color: #1e293b;">${s.name}</td>
      <td style="border: 1px solid #94a3b8; padding: 8px 12px; text-align: center; color: ${s.active ? '#16a34a' : '#dc2626'};">
        ${s.active ? 'Đang tham gia' : 'Tạm loại'}
      </td>
      <td style="border: 1px solid #94a3b8; padding: 8px 12px; text-align: center; font-weight: bold;">${s.pickedCount}</td>
      <td style="border: 1px solid #94a3b8; padding: 8px 12px; color: #64748b;">${s.note || ''}</td>
    </tr>
  `).join('');

  const htmlContent = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head>
        <meta charset='utf-8'>
        <title>Danh sách học sinh - ${className}</title>
        <style>
          body {
            font-family: 'Times New Roman', Times, serif;
            font-size: 13pt;
            color: #0f172a;
            line-height: 1.5;
            padding: 40px;
          }
          .header {
            text-align: center;
            margin-bottom: 25px;
          }
          .title {
            font-size: 18pt;
            font-weight: bold;
            color: #1e3a8a;
            text-transform: uppercase;
            margin: 10px 0;
          }
          .meta {
            font-style: italic;
            color: #475569;
            font-size: 11pt;
            margin-bottom: 20px;
          }
          table {
            width: 100%;
            border-collapse: collapse;
            margin-top: 15px;
          }
          th {
            background-color: #2563eb;
            color: #ffffff;
            font-weight: bold;
            border: 1px solid #1d4ed8;
            padding: 10px 12px;
            text-align: center;
          }
          .footer {
            margin-top: 30px;
            text-align: right;
            font-style: italic;
            font-size: 11pt;
          }
        </style>
      </head>
      <body>
        <div class="header">
          <div style="font-weight: bold; font-size: 12pt;">TRƯỜNG TIỂU HỌC / THCS / THPT</div>
          <div style="font-weight: bold; font-size: 11pt; color: #64748b;">VÒNG QUAY MAY MẮN GỌI TÊN HỌC SINH</div>
          <div class="title">DANH SÁCH HỌC SINH - ${className}</div>
          <div class="meta">Tổng số: ${students.length} học sinh | Xuất lúc: ${currentTime} ngày ${currentDate}</div>
        </div>

        <table>
          <thead>
            <tr>
              <th style="width: 50px;">STT</th>
              <th>Họ và tên học sinh</th>
              <th style="width: 120px;">Trạng thái</th>
              <th style="width: 100px;">Đã gọi</th>
              <th>Ghi chú</th>
            </tr>
          </thead>
          <tbody>
            ${rowsHtml}
          </tbody>
        </table>

        <div class="footer">
          <p>Ngày ..... tháng ..... năm 20...</p>
          <p style="font-weight: bold; padding-right: 40px;">Giáo viên bộ môn / Chủ nhiệm</p>
        </div>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', htmlContent], {
    type: 'application/msword;charset=utf-8'
  });

  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `Danh_Sach_Hoc_Sinh_${className.replace(/\s+/g, '_')}_${Date.now()}.doc`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}

/**
 * Generate sample Excel template
 */
export function downloadSampleExcel() {
  const wb = XLSX.utils.book_new();
  const sampleData = [
    ['STT', 'Họ và tên', 'Ghi chú'],
    [1, 'Nguyễn Văn An', 'Tổ 1'],
    [2, 'Trần Thị Bình', 'Tổ 1'],
    [3, 'Lê Hoàng Cường', 'Tổ 2'],
    [4, 'Phạm Quỳnh Duyên', 'Tổ 2'],
    [5, 'Hoàng Minh Đức', 'Tổ 3'],
    [6, 'Vũ Hải Yến', 'Tổ 3'],
    [7, 'Đỗ Gia Bảo', 'Tổ 4'],
    [8, 'Bùi Thảo Linh', 'Tổ 4'],
    [9, 'Ngô Quang Khải', 'Lớp phó'],
    [10, 'Đinh Ngọc Mai', 'Lớp trưởng']
  ];

  const ws = XLSX.utils.aoa_to_sheet(sampleData);
  ws['!cols'] = [{ wch: 8 }, { wch: 25 }, { wch: 15 }];
  XLSX.utils.book_append_sheet(wb, ws, 'Mau_Nhap_Hoc_Sinh');
  XLSX.writeFile(wb, 'Mau_Danh_Sach_Hoc_Sinh.xlsx');
}

/**
 * Generate sample Word template (.doc format)
 */
export function downloadSampleWord() {
  const sampleNames = [
    'Nguyễn Văn An',
    'Trần Thị Bình',
    'Lê Hoàng Cường',
    'Phạm Quỳnh Duyên',
    'Hoàng Minh Đức',
    'Vũ Hải Yến',
    'Đỗ Gia Bảo',
    'Bùi Thảo Linh',
    'Ngô Quang Khải',
    'Đinh Ngọc Mai'
  ];

  const content = `
    <html xmlns:o='urn:schemas-microsoft-com:office:office' xmlns:w='urn:schemas-microsoft-com:office:word' xmlns='http://www.w3.org/TR/REC-html40'>
      <head><meta charset='utf-8'><title>Mẫu danh sách học sinh</title></head>
      <body style="font-family: 'Times New Roman'; padding: 30px;">
        <h2 style="text-align: center; color: #1e40af;">MẪU DANH SÁCH HỌC SINH</h2>
        <p style="text-align: center; font-style: italic;">(Thầy cô có thể điền danh sách theo bảng hoặc danh sách gạch đầu dòng bên dưới)</p>
        
        <table border="1" cellpadding="8" style="border-collapse: collapse; width: 100%; margin-top: 20px;">
          <tr style="background-color: #f1f5f9;">
            <th style="width: 60px;">STT</th>
            <th>Họ và tên học sinh</th>
          </tr>
          ${sampleNames.map((n, i) => `<tr><td style="text-align: center;">${i + 1}</td><td>${n}</td></tr>`).join('')}
        </table>
      </body>
    </html>
  `;

  const blob = new Blob(['\ufeff', content], { type: 'application/msword;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'Mau_Danh_Sach_Hoc_Sinh.doc';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
