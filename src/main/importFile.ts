import { BrowserWindow, dialog } from 'electron'
import { readFileSync } from 'node:fs'
import type { ImportPreview } from '@shared/types'
import { parseCsv, sanitizeCell } from '@shared/imports'

/** Read CSV rows directly or Excel rows via exceljs (dynamic import). */
export async function readRowsFromFile(filePath: string): Promise<string[][]> {
  if (filePath.toLowerCase().endsWith('.csv')) {
    return parseCsv(readFileSync(filePath, 'utf8'))
  }
  const ExcelJS = await import('exceljs')
  const workbook = new ExcelJS.Workbook()
  await workbook.xlsx.readFile(filePath)
  const worksheet = workbook.worksheets[0]
  if (!worksheet) return []
  const rows: string[][] = []
  worksheet.eachRow((row) => {
    const cells = row.values as (string | number | Date)[]
    rows.push(cells.slice(1).map(sanitizeCell))
  })
  return rows
}

/** Open a native file picker and return a preview of the first 30 data rows. */
export async function pickImportFile(title: string): Promise<ImportPreview> {
  const win = BrowserWindow.getFocusedWindow() ?? BrowserWindow.getAllWindows()[0]
  const result = win
    ? await dialog.showOpenDialog(win, {
        title,
        properties: ['openFile'],
        filters: [
          { name: 'Spreadsheets', extensions: ['csv', 'xlsx'] },
          { name: 'All files', extensions: ['*'] },
        ],
      })
    : { canceled: true, filePaths: [] as string[] }

  if (result.canceled || result.filePaths.length === 0) return { canceled: true }

  const filePath = result.filePaths[0]
  const fileName = filePath.split(/[\\/]/).pop() ?? filePath

  const rows = await readRowsFromFile(filePath)
  if (rows.length < 2)
    return { canceled: true, filePath, fileName, headers: rows[0] ?? [], rows: [], totalRows: 0 }

  const headers = rows[0]
  const totalRows = rows.length - 1
  return {
    canceled: false,
    filePath,
    fileName,
    headers,
    rows: rows.slice(1, Math.min(31, rows.length)),
    totalRows,
  }
}
