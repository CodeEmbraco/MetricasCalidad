import ExcelJS from "exceljs"
import { SEM_HEX, semaforoCPK } from "./metrics.js"

const NIDEC_GREEN = "FF00833E"

function downloadBuffer(buffer, filename) {
  const blob = new Blob([buffer], {
    type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  })
  const url = URL.createObjectURL(blob)
  const a = document.createElement("a")
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function semFill(estado) {
  const hex = SEM_HEX[estado]
  return {
    type: "pattern",
    pattern: "solid",
    fgColor: { argb: "FF" + hex.fill },
  }
}
function semFont(estado) {
  return { color: { argb: "FF" + SEM_HEX[estado].text }, bold: true }
}

export async function exportTable({ filename, sheetName, columns, rows, getSemEstado, title }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "Métricas de Calidad - Nidec"
  const ws = wb.addWorksheet(sheetName || "Datos")

  let startRow = 1
  if (title) {
    ws.mergeCells(1, 1, 1, columns.length)
    const tcell = ws.getCell(1, 1)
    tcell.value = title
    tcell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } }
    tcell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIDEC_GREEN } }
    tcell.alignment = { vertical: "middle", horizontal: "left" }
    ws.getRow(1).height = 24
    startRow = 2
  }

  const headerRow = ws.getRow(startRow)
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = c.header
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B211E" } }
    cell.alignment = { vertical: "middle", horizontal: "left" }
  })
  headerRow.height = 20

  rows.forEach((row, r) => {
    const xlsRow = ws.getRow(startRow + 1 + r)
    columns.forEach((c, i) => {
      const cell = xlsRow.getCell(i + 1)
      cell.value = typeof c.value === "function" ? c.value(row) : row[c.key]
      if (c.sem && getSemEstado) {
        const estado = getSemEstado(row, c.sem)
        if (estado) {
          cell.fill = semFill(estado)
          cell.font = semFont(estado)
        }
      }
    })
  })

  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width || 18
  })
  const lastRow = startRow + rows.length
  for (let r = startRow; r <= lastRow; r++) {
    for (let i = 1; i <= columns.length; i++) {
      ws.getCell(r, i).border = {
        top: { style: "thin", color: { argb: "FFD9DEDB" } },
        bottom: { style: "thin", color: { argb: "FFD9DEDB" } },
        left: { style: "thin", color: { argb: "FFD9DEDB" } },
        right: { style: "thin", color: { argb: "FFD9DEDB" } },
      }
    }
  }

  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer, filename)
}

export async function exportReportWithCharts({ filename, columns, rows, getSemEstado, title, charts = [] }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "Métricas de Calidad - Nidec"

  const ws = wb.addWorksheet("Datos")
  ws.mergeCells(1, 1, 1, columns.length)
  const tcell = ws.getCell(1, 1)
  tcell.value = title || "Reporte"
  tcell.font = { bold: true, size: 14, color: { argb: "FFFFFFFF" } }
  tcell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIDEC_GREEN } }
  ws.getRow(1).height = 24

  const headerRow = ws.getRow(2)
  columns.forEach((c, i) => {
    const cell = headerRow.getCell(i + 1)
    cell.value = c.header
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B211E" } }
  })

  rows.forEach((row, r) => {
    const xlsRow = ws.getRow(3 + r)
    columns.forEach((c, i) => {
      const cell = xlsRow.getCell(i + 1)
      cell.value = typeof c.value === "function" ? c.value(row) : row[c.key]
      if (c.sem && getSemEstado) {
        const estado = getSemEstado(row, c.sem)
        if (estado) {
          cell.fill = semFill(estado)
          cell.font = semFont(estado)
        }
      }
    })
  })
  columns.forEach((c, i) => {
    ws.getColumn(i + 1).width = c.width || 18
  })

  if (charts.length) {
    const cs = wb.addWorksheet("Gráficas")
    let anchorRow = 0
    charts.forEach((ch) => {
      const titleCell = cs.getCell(anchorRow + 1, 1)
      titleCell.value = ch.title
      titleCell.font = { bold: true, size: 12 }
      const imgId = wb.addImage({ base64: ch.dataUrl.replace(/^data:image\/png;base64,/, ""), extension: "png" })
      cs.addImage(imgId, {
        tl: { col: 0, row: anchorRow + 1 },
        ext: { width: ch.widthPx || 640, height: ch.heightPx || 300 },
      })
      anchorRow += Math.ceil((ch.heightPx || 300) / 18) + 3
    })
    cs.getColumn(1).width = 30
  }

  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer, filename)
}

/* NUEVA: Exportación de la Matriz Cruzada (Familia, Componente, Característica vs Tiempos) 
  Pinta los fondos de color pastel y letras fuertes según rango de CPK (Estilo Imagen 5)
*/
export async function exportMatrixReport({ filename, title, timeColumns, matrixRows, chartDataUrl }) {
  const wb = new ExcelJS.Workbook()
  wb.creator = "Métricas de Calidad - Nidec"
  
  const ws = wb.addWorksheet("Matriz CPK")
  const totalCols = 3 + timeColumns.length

  // Banner superior
  ws.mergeCells(1, 1, 1, totalCols)
  const mainTitle = ws.getCell(1, 1)
  mainTitle.value = title
  mainTitle.font = { bold: true, size: 13, color: { argb: "FFFFFFFF" } }
  mainTitle.fill = { type: "pattern", pattern: "solid", fgColor: { argb: NIDEC_GREEN } }
  mainTitle.alignment = { vertical: "middle", horizontal: "left" }
  ws.getRow(1).height = 26

  // Encabezados
  const headerRow = ws.getRow(3)
  headerRow.getCell(1).value = "Familia"
  headerRow.getCell(2).value = "Componente"
  headerRow.getCell(3).value = "Característica"
  
  timeColumns.forEach((col, i) => {
    headerRow.getCell(4 + i).value = col.label
  })

  headerRow.eachCell((cell) => {
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } }
    cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF1B211E" } }
    cell.alignment = { vertical: "middle", horizontal: "center" }
  })
  headerRow.height = 20

  // Datos de la Matriz
  matrixRows.forEach((row, rIdx) => {
    const xlRow = ws.getRow(4 + rIdx)
    xlRow.getCell(1).value = row.familia
    xlRow.getCell(2).value = row.componente
    xlRow.getCell(3).value = row.caracteristica

    timeColumns.forEach((col, cIdx) => {
      const cell = xlRow.getCell(4 + cIdx)
      const item = row.valoresPorPeriodo[col.key]
      
      if (item) {
        cell.value = Number(item.cpk.toFixed(2))
        const state = semaforoCPK(item.cpk)
        
        // Estilos de semáforo idénticos a los del CSS de tu aplicación
        if (state === "red") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFD3D0" } }
          cell.font = { color: { argb: "FFD92D20" }, bold: true }
        } else if (state === "yellow") {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFFFF3CD" } }
          cell.font = { color: { argb: "FF856404" }, bold: true }
        } else {
          cell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FFD4EDDA" } }
          cell.font = { color: { argb: "FF155724" }, bold: true }
        }
        cell.alignment = { horizontal: "center" }
      } else {
        cell.value = "-"
        cell.alignment = { horizontal: "center" }
        cell.font = { color: { argb: "FFCCCCCC" } }
      }
    })
  })

  // Anchos automáticos y estructuración de rejilla
  ws.getColumn(1).width = 22
  ws.getColumn(2).width = 22
  ws.getColumn(3).width = 34
  timeColumns.forEach((_, i) => {
    ws.getColumn(4 + i).width = 12
  })

  for (let r = 3; r < 4 + matrixRows.length; r++) {
    for (let c = 1; c <= totalCols; c++) {
      ws.getCell(r, c).border = {
        top: { style: "thin", color: { argb: "FFD9DEDB" } },
        bottom: { style: "thin", color: { argb: "FFD9DEDB" } },
        left: { style: "thin", color: { argb: "FFD9DEDB" } },
        right: { style: "thin", color: { argb: "FFD9DEDB" } }
      }
    }
  }

  // Inyectar gráfica en la segunda pestaña
  if (chartDataUrl) {
    const wsChart = wb.addWorksheet("Gráficas Evolutivas")
    wsChart.getCell(1, 1).value = "Comportamiento Evolutivo Porcentual"
    wsChart.getCell(1, 1).font = { bold: true, size: 12 }
    
    const base64Clean = chartDataUrl.replace(/^data:image\/png;base64,/, "")
    const imgId = wb.addImage({ base64: base64Clean, extension: "png" })
    
    wsChart.addImage(imgId, {
      tl: { col: 0, row: 2 },
      ext: { width: 720, height: 320 }
    })
  }

  const buffer = await wb.xlsx.writeBuffer()
  downloadBuffer(buffer, filename)
}
