import { IStatus } from "@/database/status/status-db-interface";
import { HydratedDocument } from "mongoose";

export const statusResponse = (status: any): any => ({
  id: status._id,
  title: status.title,
  color: status.color,
  label: status.label,
  is_active: status.is_active,
  is_deleted: status.is_deleted,
  created_by: status.created_by
    ? {
        id: status.created_by._id,
        first_name: status.created_by.first_name,
        last_name: status.created_by.last_name,
        email: status.created_by.email,
        role: status.created_by.role,
      }
    : null,

  updated_by: status.updated_by
    ? {
        id: status.created_by._id,
        first_name: status.created_by.first_name,
        last_name: status.created_by.last_name,
        email: status.created_by.email,
        role: status.created_by.role,
      }
    : null,
  deleted_by: status.deleted_by
    ? {
        id: status.created_by._id,
        first_name: status.created_by.first_name,
        last_name: status.created_by.last_name,
        email: status.created_by.email,
        role: status.created_by.role,
      }
    : null,

  created_at: status.createdAt,
  updated_at: status.updatedAt,
  deleted_at: status.deleted_at,
});

export const statusListResponse = (data: any): any =>
  data?.map((status: any) => statusResponse(status)) ?? [];

export const statusErrorResponse = (status: any): any => ({
  id: status._id,
  title: status.title,
  color: status.color,
  label: status.label,
  is_active: status.is_active,
  is_deleted: status.is_deleted,
});
