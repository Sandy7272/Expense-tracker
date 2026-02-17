import jsPDF from "jspdf";
import "jspdf-autotable";
import { format } from "date-fns";

interface ReportData {
  totalIncome: number;
  totalExpenses: number;
  netProfit: number;
  savingsRate: number;
  topCategories: { category: string; amount: number; percentage: number }[];
  monthlyData: { month: string; income: number; expenses: number }[];
  currency: string;
}

export function generateFinancialPDF(data: ReportData) {
  const doc = new jsPDF();
  const pageWidth = doc.internal.pageSize.getWidth();

  // Header
  doc.setFillColor(124, 58, 237); // Purple
  doc.rect(0, 0, pageWidth, 35, "F");
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont("helvetica", "bold");
  doc.text("FinTrack", 14, 18);
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text("Financial Report", 14, 26);
  doc.text(`Generated: ${format(new Date(), "MMMM d, yyyy")}`, pageWidth - 14, 26, { align: "right" });

  // Reset color
  doc.setTextColor(30, 30, 30);
  let y = 50;

  // Summary Section
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Financial Summary", 14, y);
  y += 12;

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  const summaryItems = [
    ["Total Income", `${data.currency} ${data.totalIncome.toLocaleString()}`],
    ["Total Expenses", `${data.currency} ${data.totalExpenses.toLocaleString()}`],
    ["Net Profit", `${data.currency} ${data.netProfit.toLocaleString()}`],
    ["Savings Rate", `${data.savingsRate.toFixed(1)}%`],
  ];

  summaryItems.forEach(([label, value]) => {
    doc.text(label, 14, y);
    doc.setFont("helvetica", "bold");
    doc.text(value, pageWidth - 14, y, { align: "right" });
    doc.setFont("helvetica", "normal");
    y += 8;
  });

  y += 10;

  // Top Categories
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Top Spending Categories", 14, y);
  y += 5;

  if (data.topCategories.length > 0) {
    (doc as any).autoTable({
      startY: y,
      head: [["Category", "Amount", "% of Total"]],
      body: data.topCategories.map(c => [
        c.category,
        `${data.currency} ${c.amount.toLocaleString()}`,
        `${c.percentage.toFixed(1)}%`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
    y = (doc as any).lastAutoTable.finalY + 15;
  }

  // Monthly Breakdown
  if (y > 240) { doc.addPage(); y = 20; }
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Monthly Breakdown", 14, y);
  y += 5;

  if (data.monthlyData.length > 0) {
    (doc as any).autoTable({
      startY: y,
      head: [["Month", "Income", "Expenses", "Net"]],
      body: data.monthlyData.map(m => [
        m.month,
        `${data.currency} ${m.income.toLocaleString()}`,
        `${data.currency} ${m.expenses.toLocaleString()}`,
        `${data.currency} ${(m.income - m.expenses).toLocaleString()}`,
      ]),
      theme: "striped",
      headStyles: { fillColor: [124, 58, 237], textColor: 255 },
      styles: { fontSize: 10 },
      margin: { left: 14, right: 14 },
    });
  }

  // Footer
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.setTextColor(130);
    doc.text(
      `FinTrack Financial Report • Page ${i} of ${pageCount}`,
      pageWidth / 2, doc.internal.pageSize.getHeight() - 10,
      { align: "center" }
    );
  }

  doc.save(`fintrack-report-${format(new Date(), "yyyy-MM")}.pdf`);
}
