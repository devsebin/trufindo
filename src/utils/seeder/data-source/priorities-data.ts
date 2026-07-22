import { IPriorities } from "@/database/priority/priority-db-interface";
import { IStatus } from "../../..//database/status/status-db-interface";
import User from "../../../database/users/users-db-model";
import { roleTypes } from "../../../utils/definitions/constants/role-types";
import StatusModel from "@/database/status/status-db-model";
import { generateStatusData } from "./status-data";

export async function generatePrioritiesData() {
    const user = await User.findOne({ role: roleTypes.SuperAdmin }); // Or adjust to your specific query to get the first user
    const status = await StatusModel.findOne({ label: "active" });

    if (!user || !status) {
        console.log("No users found. Please add a user first.");
        return;
    }
    const priorityData: IPriorities[] = [
        {
            title: "Low",
            label: "low",
            color: "#00FF00", // Green
            is_active: true,
            is_deleted: false,
            is_default: true,
            created_by: user._id,
            status_id: status._id,
        },
        {
            title: "Medium",
            label: "medium",
            color: "#FFA500", // Orange
            is_active: true,
            is_deleted: false,
            is_default: false,
            created_by: user._id,
            status_id: status._id,
        },
        {
            title: "High",
            label: "high",
            color: "#FF0000", // Red
            is_active: true,
            is_deleted: false,
            is_default: false,
            created_by: user._id,
            status_id: status._id,
        },
    ];

    return priorityData;
}
