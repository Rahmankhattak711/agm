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
      <div className="bg-agm-card text-agm-text rounded-2xl border border-agm-box-border shadow-xs overflow-hidden">
        <Table className="w-full text-left">
          <TableHead className="border-b border-agm-box-border bg-agm-box-bg">
            <TableRow>
              <TableHeaderCell className="py-3 px-4 font-mono text-agm-text text-xs font-bold">
                USER
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-agm-text text-xs font-bold">
                ACCOUNTANT
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-agm-text text-xs font-bold">
                HR
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-agm-text text-xs font-bold">
                INVENTORY_MANAGER
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-agm-text text-xs font-bold">
                ADMIN
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-agm-border text-xs font-mono">
            <TableRow className="hover:bg-agm-box-bg/70 transition-colors">
              <TableCell className="py-3.5 px-4 text-agm-muted">view</TableCell>
              <TableCell className="py-3.5 px-4 text-agm-muted">view</TableCell>
              <TableCell className="py-3.5 px-4 text-agm-muted">view</TableCell>
              <TableCell className="py-3.5 px-4 text-agm-muted">view</TableCell>
              <TableCell className="py-3.5 px-4 text-agm-green font-bold">
                create/update/delete
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-agm-box-bg/70 transition-colors">
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-navy font-bold">
                create/update
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-navy font-bold">
                create/update
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-agm-box-bg/70 transition-colors">
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-navy font-bold">
                create/update
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-navy font-bold">
                create/update
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-agm-box-bg/70 transition-colors">
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                none
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-navy font-bold">
                create/update
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-navy font-bold">
                create/update
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>

      <div className="bg-agm-card text-agm-text rounded-2xl border border-agm-box-border shadow-xs overflow-hidden">
        <Table className="w-full text-left">
          <TableHead className="border-b border-agm-box-border bg-agm-box-bg">
            <TableRow>
              <TableHeaderCell className="py-3 px-4 font-mono text-agm-text text-xs font-bold w-1/2">
                Role
              </TableHeaderCell>
              <TableHeaderCell className="py-3 px-4 font-mono text-agm-text text-xs font-bold w-1/2">
                Quotations
              </TableHeaderCell>
            </TableRow>
          </TableHead>
          <TableBody className="divide-y divide-agm-border text-xs font-mono">
            <TableRow className="hover:bg-agm-box-bg/70 transition-colors">
              <TableCell className="py-3.5 px-4 font-bold text-agm-text">
                SUPER_ADMIN
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-muted font-medium">
                full access
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-agm-box-bg/70 transition-colors">
              <TableCell className="py-3.5 px-4 font-bold text-agm-text">
                ADMIN
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-green font-bold">
                create / update / delete
              </TableCell>
            </TableRow>

            <TableRow className="hover:bg-agm-box-bg/70 transition-colors">
              <TableCell className="py-3.5 px-4 text-agm-text font-medium">
                ACCOUNTANT, HR, INVENTORY_MANAGER, USER
              </TableCell>
              <TableCell className="py-3.5 px-4 text-agm-subtle">
                view only
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
