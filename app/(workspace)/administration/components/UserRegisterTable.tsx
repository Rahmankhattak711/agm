"use client";

import type { UserItem } from "@/lib/hooks/types";
import {
  Button,
  Table,
  TableHead,
  TableHeaderCell,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
} from "@/components/ui";
import { EditIcon, ProtectedIcon, TrashIcon } from "@/components/icons";
import { ALL_ROLES } from "../types";

export interface UserRegisterTableProps {
  users: UserItem[];
  isLoading: boolean;
  currentUserId?: string;
  search: string;
  onEdit: (user: UserItem) => void;
  onDelete: (user: UserItem) => void;
  onAddUser: () => void;
}

export function UserRegisterTable({
  users,
  isLoading,
  currentUserId,
  search,
  onEdit,
  onDelete,
  onAddUser,
}: UserRegisterTableProps) {
  return (
    <div className="bg-agm-card rounded-2xl border border-agm-box-border shadow-xs overflow-hidden">
      <Table>
        <TableHead className="bg-agm-box-bg border-b border-agm-box-border">
          <TableHeaderCell className="py-2.5 px-4 text-agm-muted font-bold">
            User
          </TableHeaderCell>
          <TableHeaderCell className="py-2.5 px-4 text-agm-muted font-bold">
            Email Address
          </TableHeaderCell>
          <TableHeaderCell className="py-2.5 px-4 text-agm-muted font-bold">
            Role
          </TableHeaderCell>
          <TableHeaderCell className="py-2.5 px-4 text-agm-muted font-bold">
            Status
          </TableHeaderCell>
          <TableHeaderCell className="py-2.5 px-4 text-agm-muted font-bold">
            Password
          </TableHeaderCell>
          <TableHeaderCell
            align="right"
            className="py-2.5 px-4 text-agm-muted font-bold"
          >
            Actions
          </TableHeaderCell>
        </TableHead>
        <TableBody className="divide-y divide-agm-border font-medium">
          {isLoading ? (
            <TableLoading colSpan={6} rows={5} />
          ) : users.length === 0 ? (
            <TableRow className="hover:bg-transparent">
              <TableCell colSpan={6} className="py-12 px-4 border-0">
                <EmptyState
                  icon={<ProtectedIcon size={24} className="text-agm-subtle" />}
                  title="No users found"
                  description={
                    search
                      ? "Try adjusting your search criteria or role filters."
                      : "No user accounts have been created yet."
                  }
                  actionLabel={!search ? "Add User" : undefined}
                  onAction={!search ? onAddUser : undefined}
                />
              </TableCell>
            </TableRow>
          ) : (
            users.map((user) => {
              const roleObj = ALL_ROLES.find((r) => r.value === user.role);
              const isSelf = user.id === currentUserId;
              const isTargetSuperAdmin = user.role === "SUPER_ADMIN";
              const mustChangePwd = (user as any).mustChangePassword;

              return (
                <TableRow
                  key={user.id}
                  onClick={() => onEdit(user)}
                  className="hover:bg-agm-box-bg/70 transition-colors cursor-pointer group"
                >
                  <TableCell className="py-3 px-4 text-xs">
                    <span className="font-bold text-agm-text group-hover:text-agm-green transition-colors">
                      {user.fullName}
                    </span>
                    {isSelf && (
                      <span className="ml-1.5 text-[11px] font-normal text-agm-muted">
                        (You)
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-xs text-agm-muted">
                    {user.email}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-xs text-agm-text">
                    {roleObj?.label || user.role}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-xs">
                    {user.isActive ? (
                      <span className="text-agm-green font-semibold">
                        Active
                      </span>
                    ) : (
                      <span className="text-agm-muted font-normal">
                        Disabled
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-xs">
                    {mustChangePwd ? (
                      <span className="text-agm-navy font-semibold">
                        Pending Reset
                      </span>
                    ) : (
                      <span className="text-agm-subtle font-normal">
                        Secured
                      </span>
                    )}
                  </TableCell>

                  <TableCell className="py-3 px-4 text-right whitespace-nowrap">
                    <div
                      className="flex items-center justify-end gap-1"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onEdit(user)}
                        className="h-8 w-8 p-0 flex items-center justify-center text-agm-muted hover:text-agm-text rounded-lg hover:bg-agm-box-bg cursor-pointer transition"
                        title="Edit Account"
                      >
                        <EditIcon size={18} className="w-[18px] h-[18px]" />
                      </Button>
                      {!isSelf && !isTargetSuperAdmin && (
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => onDelete(user)}
                          className="h-8 w-8 p-0 flex items-center justify-center text-agm-muted hover:text-agm-navy rounded-lg hover:bg-agm-box-bg cursor-pointer transition"
                          title="Deactivate Account"
                        >
                          <TrashIcon size={18} className="w-[18px] h-[18px]" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                </TableRow>
              );
            })
          )}
        </TableBody>
      </Table>
    </div>
  );
}
