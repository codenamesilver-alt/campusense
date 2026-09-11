import { format } from 'date-fns';

const escapeCsvCell = (cell) => {
  if (cell === null || cell === undefined) {
    return '';
  }
  const str = String(cell);
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
};

export const exportToCsv = (data, headers, filename) => {
  if (!data || data.length === 0) {
    alert('No data to export.');
    return;
  }
  
  const csvContent = [
    headers.map(h => escapeCsvCell(h.label)).join(','),
    ...data.map(row => headers.map(h => escapeCsvCell(row[h.key])).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

export const exportToPdf = (data, headers, title, filename) => {
    if (!data || data.length === 0) {
      alert('No data to export.');
      return;
    }

    const printWindow = window.open('', '_blank');
    const htmlContent = `
      <html>
        <head>
          <title>${title}</title>
          <style>
            body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Helvetica, Arial, sans-serif; margin: 20px; color: #333; }
            table { width: 100%; border-collapse: collapse; margin-top: 20px; font-size: 11px; }
            th, td { border: 1px solid #ddd; padding: 6px; text-align: left; }
            th { background-color: #f2f2f2; font-weight: 600; }
            h1 { font-size: 20px; color: #000; }
            .header-info { margin-bottom: 15px; font-size: 12px; color: #555; }
            @media print {
                @page { size: landscape; }
                body { -webkit-print-color-adjust: exact; }
            }
          </style>
        </head>
        <body>
          <h1>${title}</h1>
          <div class="header-info">
            <p><strong>Generated on:</strong> ${format(new Date(), 'dd MMM, yyyy HH:mm')}</p>
            <p><strong>Total Records:</strong> ${data.length}</p>
          </div>
          <table>
            <thead>
              <tr>
                ${headers.map(h => `<th>${h.label}</th>`).join('')}
              </tr>
            </thead>
            <tbody>
              ${data.map(row => `
                <tr>
                  ${headers.map(h => `<td>${row[h.key] === undefined || row[h.key] === null ? '' : row[h.key]}</td>`).join('')}
                </tr>
              `).join('')}
            </tbody>
          </table>
        </body>
      </html>
    `;
    
    printWindow.document.write(htmlContent);
    printWindow.document.close();
    printWindow.print();
};