import { ipcMain, dialog, BrowserWindow } from 'electron'
import { writeFileSync } from 'node:fs'
import ExcelJS from 'exceljs'
import { IpcChannels } from '@shared/ipc'
import type { ExportRequest, ExportResult } from '@shared/types'
import { toCsvValue } from '@shared/export'

export function registerExportIpc(): void {
  ipcMain.handle(
    IpcChannels.export.run,
    async (event, request: ExportRequest): Promise<ExportResult> => {
      const win = BrowserWindow.fromWebContents(event.sender)
      if (!win) return { saved: false }

      const extension = request.fileName.toLowerCase().endsWith('.csv') ? 'csv' : 'xlsx'
      const result = await dialog.showSaveDialog(win, {
        title: 'CRM-Easy Export',
        defaultPath: request.fileName,
        filters: [{ name: extension.toUpperCase(), extensions: [extension] }],
      })
      if (result.canceled || !result.filePath) return { saved: false }

      const headers = request.columns.map((column) => column.header)

      if (extension === 'csv') {
        const lines = [
          headers.map(toCsvValue).join(','),
          ...request.rows.map((row) => row.map(toCsvValue).join(',')),
        ]
        writeFileSync(result.filePath, `\uFEFF${lines.join('\n')}`, 'utf8')
      } else {
        const workbook = new ExcelJS.Workbook()
        workbook.creator = 'CRM-Easy'
        const sheet = workbook.addWorksheet('Export')
        sheet.addRow(headers)
        for (const row of request.rows) {
          sheet.addRow(row)
        }
        sheet.getRow(1).font = { bold: true }
        sheet.columns.forEach((column) => {
          column.width = 20
        })
        const buffer = await workbook.xlsx.writeBuffer()
        writeFileSync(result.filePath, new Uint8Array(buffer))
      }

      return { saved: true, path: result.filePath }
    },
  )
}
