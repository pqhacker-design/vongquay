/**
 * Helper to detect and normalize Vietnamese student gender
 */

export function detectGender(name: string): 'male' | 'female' {
  if (!name) return 'male';
  const normalized = name.trim().toLowerCase();

  // Explicit keyword check
  if (normalized.includes('(nữ)') || normalized.includes('(nu)') || normalized.includes(' - nữ') || normalized.includes(' - nu')) {
    return 'female';
  }
  if (normalized.includes('(nam)') || normalized.includes(' - nam')) {
    return 'male';
  }

  const words = normalized.split(/\s+/);
  
  // Direct check middle name for "Thị" (Female) or "Văn" (Male)
  for (let i = 1; i < words.length; i++) {
    const w = words[i];
    if (w === 'thị' || w === 'thi') return 'female';
    if (w === 'văn' || w === 'van') return 'male';
  }

  // Strong female name indicators
  const femaleKeywords = new Set([
    'thị', 'thi', 'ngọc', 'ngoc', 'thu', 'mai', 'phương', 'phuong', 
    'quỳnh', 'quynh', 'lan', 'hương', 'huong', 'trúc', 'truc', 'thảo', 'thao', 
    'linh', 'vy', 'yến', 'yen', 'nhi', 'hà', 'ha', 'trang', 'duyên', 'duyen', 
    'my', 'loan', 'hoa', 'bích', 'bich', 'ngân', 'ngan', 'tuyết', 'tuyet', 
    'ánh', 'huyền', 'huyen', 'ly', 'thúy', 'thuy', 'diệu', 'dieu', 
    'chi', 'trâm', 'tram', 'thương', 'thuong', 'hạnh', 'hanh', 'nhung', 'oanh',
    'kiều', 'kieu', 'nga', 'hồng', 'hong', 'mỹ', 'xuyên', 'diễm', 'nhã', 'trinh'
  ]);

  // Strong male name indicators
  const maleKeywords = new Set([
    'văn', 'van', 'đức', 'duc', 'hoàng', 'hoang', 'tuấn', 'tuan', 
    'huy', 'long', 'kiệt', 'kiet', 'hưng', 'hung', 'đăng', 'dang', 
    'cường', 'cuong', 'minh', 'triết', 'triet', 'dương', 'duong', 
    'trọng', 'trong', 'hải', 'hai', 'quốc', 'quoc', 'nam', 'khánh', 'khanh', 
    'khoa', 'phong', 'thành', 'thanh', 'dũng', 'dung', 'tùng', 'tung', 
    'bảo', 'bao', 'đạt', 'dat', 'phúc', 'phuc', 'thịnh', 'thinh', 
    'quân', 'quan', 'tiến', 'tien', 'trung', 'hiếu', 'hieu', 'thắng', 'thang',
    'bách', 'bach', 'sơn', 'son', 'bình', 'binh', 'khang', 'khôi', 'khoi'
  ]);

  // Given name (last word)
  const givenName = words[words.length - 1];
  if (femaleKeywords.has(givenName)) return 'female';
  if (maleKeywords.has(givenName)) return 'male';

  // Middle name (second to last or all middle words)
  for (let i = 1; i < words.length - 1; i++) {
    const w = words[i];
    if (femaleKeywords.has(w)) return 'female';
    if (maleKeywords.has(w)) return 'male';
  }

  return 'male';
}
