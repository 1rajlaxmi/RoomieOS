import mongoose, { Schema, Document } from "mongoose";

export interface IEvent extends Document {
  title: string;
  type: "event" | "quiet_hours";
  description?: string;
  startDate: Date;
  endDate: Date;
  postedBy: mongoose.Types.ObjectId;
  household: mongoose.Types.ObjectId;
}

const EventSchema: Schema = new Schema(
  {
    title: { type: String, required: true },
    type: { type: String, enum: ["event", "quiet_hours"], default: "event" },
    description: { type: String },
    startDate: { type: Date, required: true },
    endDate: { type: Date, required: true },
    postedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    household: { type: Schema.Types.ObjectId, ref: "Household", required: true },
  },
  { timestamps: true }
);

// High-speed retrieval index for the active house room
EventSchema.index({ household: 1, startDate: 1 });

export default mongoose.model<IEvent>("Event", EventSchema);