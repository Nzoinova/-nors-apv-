import jsPDF from 'jspdf'
import autoTable from 'jspdf-autotable'
import type { DashboardKPIs, EstadoContrato, Alerta, Configuracao } from '@/types'
import { formatUSD, formatKZ, formatDate, formatNumber } from '@/utils/formatters'

interface ReportData {
  kpis: DashboardKPIs
  contratos: EstadoContrato[]
  alertas: Alerta[]
  config: Configuracao | null
}

const COLORS = {
  black: '#000000',
  offBlack: '#2B2B2B',
  darkGray: '#575757',
  mediumGray: '#808080',
  lightGray2: '#ABABAB',
  lightGray: '#D6D6D6',
  offWhite: '#F2F2F2',
  white: '#FFFFFF',
  teal: '#415A67',
}

const MARGINS = { top: 20, bottom: 25, left: 15, right: 15 }
const PAGE_WIDTH = 210
const CONTENT_WIDTH = PAGE_WIDTH - MARGINS.left - MARGINS.right

const MESES_PT = [
  'Janeiro', 'Fevereiro', 'Março', 'Abril', 'Maio', 'Junho',
  'Julho', 'Agosto', 'Setembro', 'Outubro', 'Novembro', 'Dezembro',
]

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages()
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i)
    const y = 297 - MARGINS.bottom + 10

    // Line above footer
    doc.setDrawColor(COLORS.lightGray)
    doc.setLineWidth(0.3)
    doc.line(MARGINS.left, y, PAGE_WIDTH - MARGINS.right, y)

    doc.setFontSize(7)
    doc.setTextColor(COLORS.lightGray2)

    doc.setFont('Helvetica', 'normal')
    doc.text('NORS Trucks & Buses Angola VT — Making it work.', MARGINS.left, y + 5)
    doc.text('Confidencial', PAGE_WIDTH / 2, y + 5, { align: 'center' })
    doc.text(`Página ${i} de ${pageCount}`, PAGE_WIDTH - MARGINS.right, y + 5, { align: 'right' })
  }
}

export function generateMonthlyReport({ kpis, contratos, alertas, config }: ReportData) {
  const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' })
  const now = new Date()
  const monthYear = `${MESES_PT[now.getMonth()]} ${now.getFullYear()}`
  const dateStr = formatDate(now.toISOString())
  const timeStr = now.toLocaleTimeString('pt-PT', { hour: '2-digit', minute: '2-digit' })

  // ─── PAGE 1: Cover + Executive Summary ─────────────────────────────

  let y = MARGINS.top

  // Header
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(24)
  doc.setTextColor(COLORS.black)
  doc.text('NORS', MARGINS.left, y)

  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(10)
  doc.setTextColor(COLORS.darkGray)
  doc.text('Trucks & Buses Angola VT', MARGINS.left + 32, y)

  y += 4
  doc.setDrawColor(COLORS.teal)
  doc.setLineWidth(1)
  doc.line(MARGINS.left, y, PAGE_WIDTH - MARGINS.right, y)

  y += 12
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(18)
  doc.setTextColor(COLORS.black)
  doc.text('Relatório Mensal de Contratos', MARGINS.left, y)

  y += 8
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(12)
  doc.setTextColor(COLORS.darkGray)
  doc.text(monthYear, MARGINS.left, y)

  y += 6
  doc.setFontSize(8)
  doc.setTextColor(COLORS.lightGray2)
  doc.text(`Gerado em: ${dateStr} às ${timeStr}`, MARGINS.left, y)

  // Executive Summary box
  y += 12
  const boxX = MARGINS.left
  const boxW = CONTENT_WIDTH
  const boxH = 68
  doc.setFillColor(COLORS.offWhite)
  doc.roundedRect(boxX, y, boxW, boxH, 3, 3, 'F')

  y += 8
  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(11)
  doc.setTextColor(COLORS.offBlack)
  doc.text('RESUMO EXECUTIVO', boxX + 8, y)

  const col1X = boxX + 8
  const col2X = boxX + boxW / 2 + 4
  const lineH = 9

  y += 10
  doc.setFont('Helvetica', 'normal')
  doc.setFontSize(9)
  doc.setTextColor(COLORS.darkGray)

  // Count active APV and CM
  const apvAtivos = contratos.filter(c => c.tipo_contrato === 'APV' && c.status_contrato === 'ATIVO').length
  const cmAtivos = contratos.filter(c => c.tipo_contrato === 'CM' && c.status_contrato === 'ATIVO').length
  const cmExpiring30 = contratos.filter(c => c.tipo_contrato === 'CM' && c.dias_ate_expiracao >= 0 && c.dias_ate_expiracao <= 30).length
  const totalViaturas = new Set(contratos.map(c => c.viatura_id)).size

  doc.text(`Contratos APV Activos: ${apvAtivos}`, col1X, y)
  doc.text(`Receita Mensal: ${formatUSD(kpis.receita_mensal_usd)}`, col2X, y)

  y += lineH
  doc.text(`Contratos CM Activos: ${cmAtivos}`, col1X, y)
  doc.text(`CM a Expirar (30d): ${cmExpiring30}`, col2X, y)

  y += lineH
  doc.text(`Total Viaturas: ${totalViaturas}`, col1X, y)
  doc.text(`Total Clientes: ${kpis.total_clientes}`, col2X, y)

  y += lineH
  const annualUsd = kpis.receita_mensal_usd * 12
  const annualKz = kpis.receita_mensal_kz * 12
  doc.text(`Projecção Anual: ${formatUSD(annualUsd)} (${formatKZ(annualKz)})`, col1X, y)

  y += lineH
  if (config) {
    doc.text(`Câmbio: ${formatNumber(config.taxa_cambio_usd_kz)} KZ/USD — ${formatDate(config.data_atualizacao_taxa)}`, col1X, y)
  }

  // Pipeline summary
  const pipelineContratos = contratos.filter(c => c.tipo_contrato === 'CM' && (c.status_contrato === 'EXPIRADO' || c.dias_ate_expiracao < 30))
  if (pipelineContratos.length > 0) {
    y += 18
    doc.setFont('Helvetica', 'bold')
    doc.setFontSize(11)
    doc.setTextColor(COLORS.offBlack)
    doc.text('PIPELINE CM→APV', MARGINS.left, y)

    y += 7
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(9)
    doc.setTextColor(COLORS.darkGray)
    doc.text(`${pipelineContratos.length} oportunidades de conversão identificadas`, MARGINS.left, y)
  }

  // ─── PAGE 2: Contracts Detail ──────────────────────────────────────

  doc.addPage()
  y = MARGINS.top

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(COLORS.black)
  doc.text('Detalhe de Contratos', MARGINS.left, y)

  y += 10

  // APV Active contracts table
  const apvActive = contratos
    .filter(c => c.tipo_contrato === 'APV' && (c.status_contrato === 'ATIVO' || c.status_contrato === 'A RENOVAR'))
    .sort((a, b) => a.dias_ate_expiracao - b.dias_ate_expiracao)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COLORS.teal)
  doc.text('CONTRATOS APV ACTIVOS', MARGINS.left, y)
  y += 2

  if (apvActive.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGINS.left, right: MARGINS.right },
      head: [['Cliente', 'Viatura', 'Matrícula', 'Valor USD/mês', 'Válido até', 'Dias']],
      body: apvActive.map(c => [
        c.cliente_nome.split(' - ')[0],
        c.modelo || c.marca,
        c.matricula || c.vin?.slice(-6) || '—',
        c.valor_mensal_usd != null ? formatUSD(c.valor_mensal_usd) : '—',
        formatDate(c.data_validade),
        String(c.dias_ate_expiracao),
      ]),
      headStyles: { fillColor: COLORS.teal, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: COLORS.offBlack },
      alternateRowStyles: { fillColor: COLORS.offWhite },
      styles: { cellPadding: 3, lineWidth: 0 },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
  } else {
    y += 6
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(COLORS.mediumGray)
    doc.text('Sem contratos APV activos.', MARGINS.left, y)
    y += 10
  }

  // Contracts to renew (next 60 days)
  const toRenew = contratos
    .filter(c => c.dias_ate_expiracao >= 0 && c.dias_ate_expiracao <= 60)
    .sort((a, b) => a.dias_ate_expiracao - b.dias_ate_expiracao)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COLORS.teal)
  doc.text('CONTRATOS A RENOVAR (próx. 60 dias)', MARGINS.left, y)
  y += 2

  if (toRenew.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGINS.left, right: MARGINS.right },
      head: [['Tipo', 'Cliente', 'Viatura', 'Matrícula', 'Válido até', 'Dias']],
      body: toRenew.map(c => [
        c.tipo_contrato,
        c.cliente_nome.split(' - ')[0],
        c.modelo || c.marca,
        c.matricula || c.vin?.slice(-6) || '—',
        formatDate(c.data_validade),
        String(c.dias_ate_expiracao),
      ]),
      headStyles: { fillColor: COLORS.teal, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: COLORS.offBlack },
      alternateRowStyles: { fillColor: COLORS.offWhite },
      styles: { cellPadding: 3, lineWidth: 0 },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
  } else {
    y += 6
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(COLORS.mediumGray)
    doc.text('Sem contratos a renovar nos próximos 60 dias.', MARGINS.left, y)
  }

  // ─── PAGE 3: Clients & Revenue ─────────────────────────────────────

  doc.addPage()
  y = MARGINS.top

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(COLORS.black)
  doc.text('Clientes & Receita', MARGINS.left, y)
  y += 10

  // Top clients by APV revenue
  const clientAgg: Record<string, { nome: string; viaturas: Set<string>; apvUsd: number }> = {}
  contratos.forEach(c => {
    if (c.tipo_contrato !== 'APV' || !c.valor_mensal_usd) return
    if (!clientAgg[c.cliente_id]) {
      clientAgg[c.cliente_id] = { nome: c.cliente_nome.split(' - ')[0], viaturas: new Set(), apvUsd: 0 }
    }
    if (c.viatura_id) clientAgg[c.cliente_id].viaturas.add(c.viatura_id)
    clientAgg[c.cliente_id].apvUsd += c.valor_mensal_usd
  })

  const topClients = Object.values(clientAgg)
    .sort((a, b) => b.apvUsd - a.apvUsd)
    .slice(0, 10)

  const totalApvRevenue = topClients.reduce((sum, c) => sum + c.apvUsd, 0)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COLORS.teal)
  doc.text('TOP CLIENTES POR RECEITA APV', MARGINS.left, y)
  y += 2

  if (topClients.length > 0) {
    const bodyRows = topClients.map((c, i) => [
      String(i + 1),
      c.nome,
      String(c.viaturas.size),
      formatUSD(c.apvUsd),
      totalApvRevenue > 0 ? `${((c.apvUsd / totalApvRevenue) * 100).toFixed(1)}%` : '—',
    ])
    bodyRows.push(['', 'TOTAL', '', formatUSD(totalApvRevenue), '100%'])

    autoTable(doc, {
      startY: y,
      margin: { left: MARGINS.left, right: MARGINS.right },
      head: [['#', 'Cliente', 'Viaturas', 'Receita USD/mês', '% do Total']],
      body: bodyRows,
      headStyles: { fillColor: COLORS.teal, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: COLORS.offBlack },
      alternateRowStyles: { fillColor: COLORS.offWhite },
      styles: { cellPadding: 3, lineWidth: 0 },
      didParseCell(data) {
        // Bold the total row
        if (data.section === 'body' && data.row.index === bodyRows.length - 1) {
          data.cell.styles.fontStyle = 'bold'
        }
      },
    })
    y = (doc as unknown as { lastAutoTable: { finalY: number } }).lastAutoTable.finalY + 12
  } else {
    y += 6
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(COLORS.mediumGray)
    doc.text('Sem dados de receita APV.', MARGINS.left, y)
    y += 10
  }

  // CM opportunities
  const cmOpportunities = contratos
    .filter(c => c.tipo_contrato === 'CM' && (c.dias_ate_expiracao <= 90))
    .sort((a, b) => a.dias_ate_expiracao - b.dias_ate_expiracao)

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COLORS.teal)
  doc.text('CONTRATOS CM — OPORTUNIDADES', MARGINS.left, y)
  y += 2

  if (cmOpportunities.length > 0) {
    autoTable(doc, {
      startY: y,
      margin: { left: MARGINS.left, right: MARGINS.right },
      head: [['Cliente', 'Viatura', 'Matrícula', 'Valor KZ', 'Expira', 'Dias']],
      body: cmOpportunities.map(c => [
        c.cliente_nome.split(' - ')[0],
        c.modelo || c.marca,
        c.matricula || c.vin?.slice(-6) || '—',
        c.valor_total_kz != null ? formatKZ(c.valor_total_kz) : '—',
        formatDate(c.data_validade),
        String(c.dias_ate_expiracao),
      ]),
      headStyles: { fillColor: COLORS.teal, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: COLORS.offBlack },
      alternateRowStyles: { fillColor: COLORS.offWhite },
      styles: { cellPadding: 3, lineWidth: 0 },
    })
  } else {
    y += 6
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(COLORS.mediumGray)
    doc.text('Sem oportunidades CM identificadas.', MARGINS.left, y)
  }

  // ─── PAGE 4: Alerts Summary ────────────────────────────────────────

  doc.addPage()
  y = MARGINS.top

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(14)
  doc.setTextColor(COLORS.black)
  doc.text('Alertas', MARGINS.left, y)
  y += 10

  const sortedAlertas = [
    ...alertas.filter(a => a.prioridade === 'ALTA'),
    ...alertas.filter(a => a.prioridade === 'MEDIA'),
    ...alertas.filter(a => a.prioridade === 'INFO'),
  ]

  doc.setFont('Helvetica', 'bold')
  doc.setFontSize(10)
  doc.setTextColor(COLORS.teal)
  doc.text('ALERTAS ACTIVOS', MARGINS.left, y)
  y += 2

  if (sortedAlertas.length > 0) {
    const priorityColors: Record<string, string> = {
      ALTA: '#DC2626',
      MEDIA: '#D97706',
      INFO: '#2563EB',
    }

    autoTable(doc, {
      startY: y,
      margin: { left: MARGINS.left, right: MARGINS.right },
      head: [['Prioridade', 'Tipo', 'Descrição', 'Detalhe']],
      body: sortedAlertas.map(a => [
        a.prioridade,
        a.tipo_alerta,
        a.descricao,
        a.detalhe,
      ]),
      headStyles: { fillColor: COLORS.teal, textColor: COLORS.white, fontSize: 8, fontStyle: 'bold' },
      bodyStyles: { fontSize: 8, textColor: COLORS.offBlack },
      alternateRowStyles: { fillColor: COLORS.offWhite },
      styles: { cellPadding: 3, lineWidth: 0 },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: 35 },
        2: { cellWidth: 50 },
        3: { cellWidth: 'auto' },
      },
      didParseCell(data) {
        if (data.section === 'body' && data.column.index === 0) {
          const priority = data.cell.raw as string
          const color = priorityColors[priority]
          if (color) {
            data.cell.styles.textColor = color
            data.cell.styles.fontStyle = 'bold'
          }
        }
      },
    })
  } else {
    y += 6
    doc.setFont('Helvetica', 'normal')
    doc.setFontSize(8)
    doc.setTextColor(COLORS.mediumGray)
    doc.text('Sem alertas activos.', MARGINS.left, y)
  }

  // ─── Footer on all pages ───────────────────────────────────────────

  addFooter(doc)

  // ─── Save ──────────────────────────────────────────────────────────

  const yyyy = now.getFullYear()
  const mm = String(now.getMonth() + 1).padStart(2, '0')
  doc.save(`NORS_Relatorio_Mensal_${yyyy}_${mm}.pdf`)
}
