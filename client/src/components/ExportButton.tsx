import { useState } from "react";
import { Button } from "@/components/ui/button";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { Download, FileSpreadsheet, FileText, ChevronDown } from "lucide-react";
import { toast } from "sonner";
import * as XLSX from "xlsx";

interface Column {
  key: string;
  label: string;
  format?: (value: unknown) => string;
}

interface ExportButtonProps {
  data: Record<string, unknown>[];
  columns: Column[];
  filename: string;
  sheetName?: string;
  size?: "sm" | "default";
}

export default function ExportButton({ data, columns, filename, sheetName = "البيانات", size = "sm" }: ExportButtonProps) {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = () => {
    if (!data.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    setExporting(true);
    try {
      const rows = data.map(row =>
        Object.fromEntries(columns.map(col => [
          col.label,
          col.format ? col.format(row[col.key]) : (row[col.key] ?? ""),
        ]))
      );
      const ws = XLSX.utils.json_to_sheet(rows);
      // Set column widths
      ws["!cols"] = columns.map(() => ({ wch: 20 }));
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, sheetName);
      XLSX.writeFile(wb, `${filename}_${new Date().toISOString().split("T")[0]}.xlsx`);
      toast.success("تم تصدير الملف بنجاح");
    } catch {
      toast.error("فشل تصدير الملف");
    } finally {
      setExporting(false);
    }
  };

  const exportToCSV = () => {
    if (!data.length) { toast.error("لا توجد بيانات للتصدير"); return; }
    setExporting(true);
    try {
      const header = columns.map(c => c.label).join(",");
      const rows = data.map(row =>
        columns.map(col => {
          const val = col.format ? col.format(row[col.key]) : (row[col.key] ?? "");
          return `"${String(val).replace(/"/g, '""')}"`;
        }).join(",")
      );
      const csv = "\uFEFF" + [header, ...rows].join("\n"); // BOM for Arabic support
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `${filename}_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("تم تصدير CSV بنجاح");
    } catch {
      toast.error("فشل تصدير الملف");
    } finally {
      setExporting(false);
    }
  };

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" size={size} className="gap-1.5" disabled={exporting}>
          <Download className="h-4 w-4" />
          تصدير
          <ChevronDown className="h-3 w-3 opacity-60" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuItem onClick={exportToExcel} className="gap-2 cursor-pointer">
          <FileSpreadsheet className="h-4 w-4 text-green-600" />
          تصدير Excel (.xlsx)
        </DropdownMenuItem>
        <DropdownMenuItem onClick={exportToCSV} className="gap-2 cursor-pointer">
          <FileText className="h-4 w-4 text-blue-600" />
          تصدير CSV
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
