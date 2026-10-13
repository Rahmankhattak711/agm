"use client";

import {
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
} from "@/components/ui";

export function PermissionsMatrix() {
  return (
    <div className="space-y-6">
      <div className="bg-white text-slate-800 rounded-xl border border-slate-200 p-5 shadow-xs overflow-hidden">
        <Table className="w-full text-left">
          <TableHead className="border-b border-slate-200 bg-slate-50/50">
            <TableRow>
              <TableHeaderCell className="py-3 px-4 font-mono text-slate-700 text-xs font-bold">
                USER
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-slate-700 text-xs font-bold">
                ACCOUNTANT
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-slate-700 text-xs font-bold">
                HR
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-slate-700 text-xs font-bold">
                INVENTORY_MANAGER
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-slate-700 text-xs font-bold">
                ADMIN
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-slate-100 text-xs font-mono">
            <TableRow className="hover:bg-slate-50/60">
              <TableCell className="py-3.5 px-4 text-slate-600">view</TableCell>
              <TableCell className="py-3.5 px-4 text-slate-600">view</TableCell>
              <TableCell className="py-3.5 px-4 text-slate-600">view</TableCell>
              <TableCell className="py-3.5 px-4 text-slate-600">view</TableCell>
              <TableCell className="py-3.5 px-4 text-emerald-600 font-bold">
                create/update/delete
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-slate-50/60">
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-teal-600 font-bold">
                create/update
              </TableCell>
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-teal-600 font-bold">
                create/update
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-slate-50/60">
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-teal-600 font-bold">
                create/update
              </TableCell>
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-teal-600 font-bold">
                create/update
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-slate-50/60">
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-slate-400">none</TableCell>
              <TableCell className="py-3.5 px-4 text-teal-600 font-bold">
                create/update
              </TableCell>
              <TableCell className="py-3.5 px-4 text-teal-600 font-bold">
                create/update
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="bg-white text-slate-800 rounded-xl border border-slate-200 p-5 shadow-xs overflow-hidden">
        <Table className="w-full text-left">
          <TableHead className="border-b border-slate-200 bg-slate-50/50">
            <TableRow>
              <TableHeaderCell className="py-3 px-4 font-mono text-slate-700 text-xs font-bold w-1/2">
                Role
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-slate-700 text-xs font-bold w-1/2">
                Quotations
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-slate-100 text-xs font-mono">
            <TableRow className="hover:bg-slate-50/60">
              <TableCell className="py-3.5 px-4 font-bold text-slate-900">
                SUPER_ADMIN
              </TableCell>
              <TableCell className="py-3.5 px-4 text-slate-700 font-medium">
                full access
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-slate-50/60">
              <TableCell className="py-3.5 px-4 font-bold text-slate-900">
                ADMIN
              </TableCell>
              <TableCell className="py-3.5 px-4 text-emerald-600 font-bold">
                create / update / delete
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-slate-50/60">
              <TableCell className="py-3.5 px-4 text-slate-700 font-medium">
                ACCOUNTANT, HR, INVENTORY_MANAGER, USER
              </TableCell>
              <TableCell className="py-3.5 px-4 text-slate-500">
                view only
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
