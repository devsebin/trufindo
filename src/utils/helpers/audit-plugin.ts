import { Schema } from "mongoose";

export const auditPlugin = (schema: Schema) => {
  schema.pre("save", function (next) {
    const currentUserId = this.$locals.currentUserId;
    console.log("Current User ID in pre-save hook:", this.$locals);
    if (currentUserId) {
      if (this.isNew) {
        this.created_by = currentUserId;
      }

      this.updated_by = currentUserId;
    }

    next();
  });

  schema.pre(["findOneAndUpdate", "updateOne"], function (next) {
    const currentUserId = this.getOptions().currentUserId;
    const update: any = this.getUpdate();

    if (currentUserId) {
      update.updated_by = currentUserId;

      if (update.is_deleted === true) {
        update.deleted_by = currentUserId;
        update.deleted_at = new Date();
      }

      this.set(update);
    }

    next();
  });
};

export default auditPlugin;
