function ext(name: string): string {
  const i = name.lastIndexOf('.');
  return i === -1 ? '' : name.slice(i + 1).toLowerCase();
}

async function extractDocx(file: File): Promise<string> {
  const mammoth = await import('mammoth');
  const arrayBuffer = await file.arrayBuffer();
  const result = await mammoth.extractRawText({ arrayBuffer });
  return result.value;
}

async function extractPdf(file: File): Promise<string> {
  const pdfjs = await import('pdfjs-dist');
  // Vite: worker as URL
  const workerUrl = (await import('pdfjs-dist/build/pdf.worker.min.mjs?url')).default;
  (pdfjs as any).GlobalWorkerOptions.workerSrc = workerUrl;
  const data = await file.arrayBuffer();
  const pdf = await (pdfjs as any).getDocument({ data }).promise;
  let text = '';
  for (let i = 1; i <= pdf.numPages; i++) {
    const page = await pdf.getPage(i);
    const content = await page.getTextContent();
    text += content.items.map((it: any) => it.str).join(' ') + '\n';
  }
  return text.trim();
}

async function extractImage(file: File): Promise<string> {
  const Tesseract = (await import('tesseract.js')).default;
  const { data } = await Tesseract.recognize(file, 'eng+kor');
  return data.text;
}

export async function extractText(file: File): Promise<string> {
  const e = ext(file.name);
  if (e === 'txt' || file.type === 'text/plain') return (await file.text()).trim();
  if (e === 'docx') return extractDocx(file);
  if (e === 'pdf') return extractPdf(file);
  if (['png', 'jpg', 'jpeg', 'webp', 'bmp'].includes(e) || file.type.startsWith('image/')) {
    return extractImage(file);
  }
  throw new Error('지원하지 않는 파일 형식');
}
