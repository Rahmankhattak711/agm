"use client";

import type { UserItem } from "@/lib/hooks/types";
import {
  Button,
  Badge,
  RegisterTable,
  TableBody,
  TableRow,
  TableCell,
  TableLoading,
  EmptyState,
} from "@/components/ui";
import { EditIcon, ProtectedIcon, TrashIcon } from "@/components/icons";
import { ALL_ROLES, ROLE_TONES, USER_TABLE_COLUMNS } from "../types";

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
    <RegisterTable
      title="Users Register"
      countLabel={`${users.length} Accounts`}
      columns={USER_TABLE_COLUMNS}
    >
      <TableBody className="divide-y divide-slate-100 font-medium">
        {isLoading ? (
          <TableLoading colSpan={6} rows={4} />
        ) : users.length === 0 ? (
          <TableRow className="hover:bg-transparent">
            <TableCell colSpan={6} className="p-0 border-0">
              <EmptyState
                icon={<ProtectedIcon size={20} className="text-slate-400" />}
                title="No users found"
                description={
                  search
                    ? "Try adjusting your search."
                    : "No accounts created yet."
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
                className="hover:bg-slate-50/80 transition-colors cursor-pointer"
              >
                <TableCell className="py-2.5 px-3 text-xs">
                  <div className="flex items-center gap-1.5">
                    <span className="font-bold text-slate-900 truncate max-w-[180px]">
                      {user.fullName}
                    </span>
                    {isSelf && (
                      <Badge tone="emerald" size="xs">
                        You
                      </Badge>
                    )}
                  </div>
                </TableCell>

                <TableCell className="py-2.5 px-3 text-xs text-slate-600">
                  {user.email}
                </TableCell>

                <TableCell
                  align="center"
                  className="py-2.5 px-3 text-center text-xs"
                >
                  <Badge tone={ROLE_TONES[user.role] || "slate"}>
                    {roleObj?.label || user.role}
                  </Badge>
                </TableCell>

                <TableCell
                  align="center"
                  className="py-2.5 px-3 text-center text-xs"
                >
                  <Badge tone={user.isActive ? "emerald" : "rose"}>
                    {user.isActive ? "Active" : "Disabled"}
                  </Badge>
                </TableCell>

                <TableCell
                  align="center"
                  className="py-2.5 px-3 text-center text-xs"
                >
                  {mustChangePwd ? (
                    <Badge tone="amber">Reset Required</Badge>
                  ) : (
                    <span className="text-[10px] text-slate-400">Active</span>
                  )}
                </TableCell>

                <TableCell className="py-2.5 px-3 text-right whitespace-nowrap">
                  <div
                    className="flex items-center justify-end gap-1"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => onEdit(user)}
                      className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-slate-800 rounded-lg hover:bg-slate-100 cursor-pointer transition"
                      title="Edit"
                    >
                      <EditIcon size={20} className="w-5 h-5" strokeWidth={2} />
                    </Button>
                    {!isSelf && !isTargetSuperAdmin && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => onDelete(user)}
                        className="h-8 w-8 p-0 flex items-center justify-center text-slate-500 hover:text-rose-600 rounded-lg hover:bg-rose-50 cursor-pointer transition"
                        title="Deactivate"
                      >
                        <TrashIcon
                          size={20}
                          className="w-5 h-5"
                          strokeWidth={2}
                        />
                      </Button>
                    )}
                  </div>
                </TableCell>
              </TableRow>
            );
          })
        )}
      </TableBody>
    </RegisterTable>
  );
}
