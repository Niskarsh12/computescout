"use client";

import Link from "next/link";
import {
  useReactTable,
  getCoreRowModel,
  getSortedRowModel,
  flexRender,
  type ColumnDef,
  type SortingState,
} from "@tanstack/react-table";
import { useState } from "react";
import type { MarketEntry } from "@/domain/market";
import { GPU_LABELS, REGION_LABELS } from "@/domain/provider";
import { formatPricePerHour, timeAgo, cn } from "@/lib/utils";
import { StatusDot } from "@/components/layout/header";

function DataSourceBadge({ source }: { source: MarketEntry["dataSource"] }) {
  const isLive = source === "live";
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 text-xs uppercase tracking-wider",
        isLive ? "text-success" : "text-muted"
      )}
    >
      <span
        className={cn(
          "h-1.5 w-1.5 rounded-full",
          isLive ? "bg-success animate-pulse-subtle" : "bg-muted"
        )}
      />
      {isLive ? "live" : "seed"}
    </span>
  );
}

const columns: ColumnDef<MarketEntry>[] = [
  {
    accessorKey: "provider.name",
    header: "Provider",
    cell: ({ row }) => (
      <Link
        href={`/providers/${row.original.provider.slug}`}
        className="font-medium text-foreground hover:underline"
      >
        {row.original.provider.name}
      </Link>
    ),
  },
  {
    accessorKey: "gpuType",
    header: "GPU",
    cell: ({ getValue }) => (
      <span className="font-mono text-xs">
        {GPU_LABELS[getValue() as keyof typeof GPU_LABELS] ?? getValue()}
      </span>
    ),
  },
  {
    accessorKey: "region",
    header: "Region",
    cell: ({ getValue }) =>
      REGION_LABELS[getValue() as keyof typeof REGION_LABELS] ?? getValue(),
  },
  {
    accessorKey: "availability",
    header: "Avail",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {row.original.availability}
        {row.original.dataSource === "seed" && (
          <span className="text-muted text-[10px] ml-1">est</span>
        )}
      </span>
    ),
  },
  {
    accessorKey: "hourlyPrice",
    header: "Price",
    cell: ({ row }) => (
      <span className="tabular-nums">
        {formatPricePerHour(row.original.hourlyPrice)}
      </span>
    ),
  },
  {
    accessorKey: "healthScore",
    header: "Health",
    cell: ({ row }) => (
      <StatusDot
        status={row.original.status}
        score={row.original.healthScore}
      />
    ),
  },
  {
    accessorKey: "dataSource",
    header: "Source",
    cell: ({ row }) => <DataSourceBadge source={row.original.dataSource} />,
  },
  {
    accessorKey: "lastUpdated",
    header: "Updated",
    cell: ({ getValue }) => (
      <span className="text-muted text-xs">
        {timeAgo(getValue() as Date)}
      </span>
    ),
  },
];

export function RadarTable({ entries }: { entries: MarketEntry[] }) {
  const [sorting, setSorting] = useState<SortingState>([
    { id: "healthScore", desc: true },
  ]);

  const table = useReactTable({
    data: entries,
    columns,
    state: { sorting },
    onSortingChange: setSorting,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
  });

  return (
    <div className="border border-border overflow-x-auto">
      <table className="data-table">
        <thead>
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id}>
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className="cursor-pointer select-none"
                  onClick={header.column.getToggleSortingHandler()}
                >
                  {flexRender(
                    header.column.columnDef.header,
                    header.getContext()
                  )}
                  {header.column.getIsSorted() === "asc" && " ↑"}
                  {header.column.getIsSorted() === "desc" && " ↓"}
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody>
          {table.getRowModel().rows.map((row) => (
            <tr key={row.id}>
              {row.getVisibleCells().map((cell) => (
                <td key={cell.id}>
                  {flexRender(cell.column.columnDef.cell, cell.getContext())}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
