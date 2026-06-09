import mongoose, { Document, Schema } from "mongoose";

// 1. Define the "Split" structure
// This tracks exactly who owes money for this specific expense
export interface ISplit {
  user: mongoose.Types.ObjectId;
  amountOwed: number;
  isPaid: boolean;
}

// 2. The main Expense Interface
export interface IExpense extends Document {
  description: string;
  amount: number;
  paidBy: mongoose.Types.ObjectId;
  household: mongoose.Types.ObjectId;
  splits: ISplit[];
  date: Date;
}

// 3. Mongoose Schema
const ExpenseSchema: Schema = new Schema(
  {
    description: { 
      type: String, 
      required: true,
      trim: true
    },
    amount: { 
      type: Number, 
      required: true,
      min: [0.01, 'Amount must be greater than zero']
    },
    paidBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    },
    household: {
      type: Schema.Types.ObjectId,
      ref: "Household",
      required: true
    },
    splits: [
      {
        user: {
          type: Schema.Types.ObjectId,
          ref: "User",
          required: true
        },
        amountOwed: {
          type: Number,
          required: true,
          min: 0
        },
        isPaid: {
          type: Boolean,
          default: false
        }
      }
    ],
    date: {
      type: Date,
      default: Date.now
    }
  },
  { timestamps: true }
);

export default mongoose.model<IExpense>("Expense", ExpenseSchema);