import mongoose, { Document, Schema } from "mongoose";

// 1. TypeScript Interface
export interface IHousehold extends Document {
  name: string;
  inviteCode: string;
  members: mongoose.Types.ObjectId[]; // This array holds the IDs of the users
}

// 2. Mongoose Schema
const HouseholdSchema: Schema = new Schema(
  {
    name: { 
      type: String, 
      required: true,
      trim: true 
    },
    inviteCode: { 
      type: String, 
      required: true, 
      unique: true // Ensures no two apartments ever have the same invite code
    },
    members: [
      {
        type: Schema.Types.ObjectId,
        ref: "User", // The Magic Link: This tells MongoDB these IDs belong to the User collection
        required: true
      },
    ],
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

export default mongoose.model<IHousehold>("Household", HouseholdSchema);