export async function downloadPDF(element: HTMLElement, filename: string) {
  const html2pdf = (await import('html2pdf.js')).default

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const opt: any = {
    margin: [0.5, 0.6, 0.4, 0.6],
    filename,
    image: { type: 'jpeg', quality: 0.98 },
    html2canvas: { scale: 2, useCORS: true, letterRendering: true },
    jsPDF: { unit: 'in', format: 'letter', orientation: 'portrait' },
    pagebreak: { mode: ['avoid-all', 'css', 'legacy'] },
  }

  await html2pdf().set(opt).from(element).save()
}
