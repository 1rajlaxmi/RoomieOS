import mongoose, { Document, Schema } from "mongoose";
import bcrypt from "bcrypt";

// 1. TypeScript Interface
export interface IUser extends Document {
  name: string;
  email: string;
  password: string;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

// 2. Mongoose Schema
const UserSchema: Schema = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true, lowercase: true },
    password: { type: String, required: true },
  },
  { timestamps: true } // Automatically adds createdAt and updatedAt
);

// 3. Hash password before saving
UserSchema.pre("save", async function (this: IUser) {
  // Only hash the password if it has been modified (or is new)
  if (!this.isModified("password")) return;

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});
// 4. Method to compare passwords during login
UserSchema.methods.comparePassword = async function (candidatePassword: string): Promise<boolean> {
  return await bcrypt.compare(candidatePassword, this.password);
};

export default mongoose.model<IUser>("User", UserSchema);