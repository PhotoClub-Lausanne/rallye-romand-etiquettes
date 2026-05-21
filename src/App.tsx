import { useMemo, useState } from 'react';
import { parseExcelFile, ParsedData } from './excel';
import { generateMealCouponPdf, generateNameTagPdf, PageSize } from './pdf';

const pageSizeOptions: Array<{ value: PageSize; label: string }> = [
  { value: 'A4', label: 'A4 portrait' },
  { value: 'A4_LANDSCAPE', label: 'A4 landscape' },
];

const defaultRows = 5;
const defaultCols = 2;

function App() {
  const [fileName, setFileName] = useState('');
  const [parsed, setParsed] = useState<ParsedData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [nameRows, setNameRows] = useState(defaultRows);
  const [nameCols, setNameCols] = useState(defaultCols);
  const [couponRows, setCouponRows] = useState(defaultRows);
  const [couponCols, setCouponCols] = useState(defaultCols);
  const [pageSize, setPageSize] = useState<PageSize>('A4');
  const [couponColor, setCouponColor] = useState(false);

  const summary = useMemo(() => {
    if (!parsed) return null;
    return {
      names: parsed.names.length,
      menus: parsed.menus.length,
      menuChoices: Array.from(new Set(parsed.menus.map((item) => item.value))).sort(),
    };
  }, [parsed]);

  const handleFile = async (event: React.ChangeEvent<HTMLInputElement>) => {
    setError(null);
    setParsed(null);
    const file = event.target.files?.[0];
    if (!file) return;
    setFileName(file.name);

    try {
      const parsedData = await parseExcelFile(file);
      setParsed(parsedData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to parse Excel file');
    }
  };

  const downloadBlob = async (blob: Blob, name: string) => {
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = name;
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const handleGenerateNames = async () => {
    if (!parsed) return;
    const pdfBytes = await generateNameTagPdf(parsed.names, {
      pageSize,
      rows: nameRows,
      cols: nameCols,
    });
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'name-tags.pdf');
  };

  const handleGenerateCoupons = async () => {
    if (!parsed) return;
    const pdfBytes = await generateMealCouponPdf(parsed.menus, {
      pageSize,
      rows: couponRows,
      cols: couponCols,
      colored: couponColor,
    });
    downloadBlob(new Blob([pdfBytes], { type: 'application/pdf' }), 'meal-coupons.pdf');
  };

  return (
    <div className="app-shell">
      <header>
        <h1>Rallye Romand Étiquettes</h1>
        <p>Upload an Excel file to generate printable name tags and meal coupons.</p>
      </header>

      <section className="card">
        <label className="field">
          <span>Excel file</span>
          <input type="file" accept=".xlsx,.xls" onChange={handleFile} />
        </label>
        {fileName && <p className="info">Loaded file: {fileName}</p>}
        {error && <p className="error">{error}</p>}
        {parsed && (
          <div className="summary">
            <p>{summary?.names ?? 0} names found</p>
            <p>{summary?.menus.length ?? 0} meal coupon entries found</p>
            <p>Menu choices: {summary?.menuChoices.join(', ') || 'None'}</p>
          </div>
        )}
      </section>

      <section className="grid-panel">
        <div className="card">
          <h2>Name tags</h2>
          <label className="field">
            <span>Rows per page</span>
            <input
              type="number"
              min={1}
              value={nameRows}
              onChange={(e) => setNameRows(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Columns per page</span>
            <input
              type="number"
              min={1}
              value={nameCols}
              onChange={(e) => setNameCols(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Page size</span>
            <select value={pageSize} onChange={(event) => setPageSize(event.target.value as PageSize)}>
              {pageSizeOptions.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </label>
          <button type="button" disabled={!parsed?.names.length} onClick={handleGenerateNames}>
            Download Name Tags PDF
          </button>
        </div>

        <div className="card">
          <h2>Meal coupons</h2>
          <label className="field">
            <span>Rows per page</span>
            <input
              type="number"
              min={1}
              value={couponRows}
              onChange={(e) => setCouponRows(Number(e.target.value))}
            />
          </label>
          <label className="field">
            <span>Columns per page</span>
            <input
              type="number"
              min={1}
              value={couponCols}
              onChange={(e) => setCouponCols(Number(e.target.value))}
            />
          </label>
          <label className="field checkbox-field">
            <input
              type="checkbox"
              checked={couponColor}
              onChange={(e) => setCouponColor(e.target.checked)}
            />
            <span>Use color-coded coupons</span>
          </label>
          <button type="button" disabled={!parsed?.menus.length} onClick={handleGenerateCoupons}>
            Download Meal Coupons PDF
          </button>
        </div>
      </section>
    </div>
  );
}

export default App;
