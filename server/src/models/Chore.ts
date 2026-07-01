import mongoose, { Document, Schema } from "mongoose";

// 1. TypeScript Interface
export interface IChore extends Document {
  title: string;
  assignedTo: mongoose.Types.ObjectId;
  household: mongoose.Types.ObjectId;
  isCompleted: boolean;
  dueDate?: Date; // Optional: When does the trash actually need to go out?
}

// 2. Mongoose Schema
const ChoreSchema: Schema = new Schema(
  {
    title: { 
      type: String, 
      required: true,
      trim: true,
      maxlength: [100, "Chore title cannot exceed 100 characters."] // 🛡️ GUARD LIMIT
    },
    assignedTo: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    household: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true
    },
    isCompleted: {
      type: Boolean,
      default: false // All new chores start as "not done"
    },
    dueDate: {
      type: Date,
      required: false
    }
  },
  { timestamps: true }
);

// 🚀 ADD THESE HIGH-PERFORMANCE INDEXES RIGHT HERE:
ChoreSchema.index({ household: 1 });
ChoreSchema.index({ assignedTo: 1 });
ChoreSchema.index({ household: 1, isCompleted: 1 }); // Optimizes the "Pending Tasks" dashboard panel specifically!

export default mongoose.model<IChore>("Chore", ChoreSchema);