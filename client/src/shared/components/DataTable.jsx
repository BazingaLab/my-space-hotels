import { useState } from "react";
import {
  useReactTable, getCoreRowModel, getFilteredRowModel,
  getPaginationRowModel, getSortedRowModel, flexRender,
} from "@tanstack/react-table";
import { ArrowUpDown, ChevronLeft, ChevronRight, Search } from "lucide-react";

const t = { SEA_DARK: "#1F6B61", SAND: "#F0EAE0", INK: "#15201E", MUTED: "#6B7670" };

export default function DataTable({ data = [], columns = [], searchPlaceholder = "Search...", pageSize = 10, emptyMessage = "No data found", isLoading = false }) {
  const [globalFilter, setGlobalFilter] = useState("");
  const [sorting, setSorting] = useState([]);
  const table = useReactTable({
    data, columns, state: { globalFilter, sorting },
    onGlobalFilterChange: setGlobalFilter, onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(), getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(), getSortedRowModel: getSortedRowModel(),
    initialState: { pagination: { pageSize } },
  });
  return (
    <div>
      <div style={{ position: "relative", marginBottom: 16, maxWidth: 360 }}>
        <Search size={14} color={t.MUTED} style={{ position: "absolute", left: 12, top: "50%", transform: "translateY(-50%)" }} />
        <input value={globalFilter} onChange={(e) => setGlobalFilter(e.target.value)} placeholder={searchPlaceholder}
          style={{ width: "100%", padding: "10px 12px 10px 36px", border: `1px solid ${t.SAND}`, background: "#fff", fontSize: 13, outline: "none", fontFamily: "Inter, sans-serif", boxSizing: "border-box" }} />
      </div>
      <div style={{ background: "#fff", border: `1px solid ${t.SAND}`, overflow: "auto" }}>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 14 }}>
          <thead>
            {table.getHeaderGroups().map(hg => (
              <tr key={hg.id} style={{ borderBottom: `2px solid ${t.SAND}`, background: t.SAND }}>
                {hg.headers.map(h => (
                  <th key={h.id} onClick={h.column.getToggleSortingHandler()} style={{ textAlign: "left", padding: "12px 16px", fontSize: 11, letterSpacing: "0.15em", color: t.MUTED, textTransform: "uppercase", cursor: h.column.getCanSort() ? "pointer" : "default", userSelect: "none", whiteSpace: "nowrap" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                      {flexRender(h.column.columnDef.header, h.getContext())}
                      {h.column.getCanSort() && <ArrowUpDown size={10} />}
                    </div>
                  </th>
                ))}
              </tr>
            ))}
          </thead>
          <tbody>
            {isLoading ? (
              <tr><td colSpan={columns.length} style={{ padding: 40, textAlign: "center", color: t.MUTED }}>Loading…</td></tr>
            ) : table.getRowModel().rows.length === 0 ? (
              <tr><td colSpan={columns.length} style={{ padding: 40, textAlign: "center", color: t.MUTED }}>{emptyMessage}</td></tr>
            ) : table.getRowModel().rows.map(row => (
              <tr key={row.id} style={{ borderBottom: `1px solid ${t.SAND}` }}>
                {row.getVisibleCells().map(cell => (
                  <td key={cell.id} style={{ padding: "14px 16px" }}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {table.getPageCount() > 1 && (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginTop: 16, fontSize: 13 }}>
          <div style={{ color: t.MUTED }}>Page {table.getState().pagination.pageIndex + 1} of {table.getPageCount()} · {table.getFilteredRowModel().rows.length} rows</div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <button onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()} style={{ padding: "6px 10px", border: `1px solid ${t.SAND}`, background: "#fff", cursor: table.getCanPreviousPage() ? "pointer" : "not-allowed", opacity: table.getCanPreviousPage() ? 1 : 0.4 }}><ChevronLeft size={14} /></button>
            <button onClick={() => table.nextPage()} disabled={!table.getCanNextPage()} style={{ padding: "6px 10px", border: `1px solid ${t.SAND}`, background: "#fff", cursor: table.getCanNextPage() ? "pointer" : "not-allowed", opacity: table.getCanNextPage() ? 1 : 0.4 }}><ChevronRight size={14} /></button>
          </div>
        </div>
      )}
    </div>
  );
}
