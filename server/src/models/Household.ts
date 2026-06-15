import mongoose, { Schema, Document } from "mongoose";

// 1. UPDATE THE TYPESCRIPT INTERFACE
export interface IHousehold extends Document {
  name: string;
  inviteCode: string;
  members: mongoose.Types.ObjectId[];
  owner: mongoose.Types.ObjectId; // ✅ FIXED: Added owner type declaration here!
}

// 2. THE MONGOOSE SCHEMA
const HouseholdSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    inviteCode: { type: String, required: true, unique: true },
    members: [{ type: Schema.Types.ObjectId, ref: "User" }],
    owner: { type: Schema.Types.ObjectId, ref: "User", required: true } // Keeps MongoDB aligned
  },
  { timestamps: true }
);

export default mongoose.model<IHousehold>("Household", HouseholdSchema);