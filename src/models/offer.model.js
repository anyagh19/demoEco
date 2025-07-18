import mongoose, { Schema, Document, Types } from "mongoose";


// -----------------------------
// TYPES
// -----------------------------

// Subdocument: OfferItem
// export interface IOfferItem {
//   itemId: Types.ObjectId;    // Reference to master Item
//   itemName: string;          // Snapshot
//   description: string;       // Snapshot
//   unit: string;              // Nos, Set, etc.
//   qty: number;               // Quantity in offer
//   rate: number;              // Unit price at time of offer
//   totalAmount: number;       // qty * rate
// }

// Main Offer
// export interface IOffer extends Document {
//   projectName: string;
//   client: Types.ObjectId;    // Ref to User
//   items: IOfferItem[];
//   subTotal: number;
//   taxPercentage: number;
//   taxAmount: number;
//   grandTotal: number;
//   status: "Draft" | "Sent" | "Accepted" | "Rejected";
//   createdAt: Date;
//   updatedAt: Date;
// }

// -----------------------------
// SCHEMA
// -----------------------------

// Embedded Offer Item Schema
const offerItemSchema = new Schema(
  {
    // itemId: {
    //   type: Schema.Types.ObjectId,
    //   ref: "Item",
    //   required: true
    // },
    itemName: {
      type: String,
      required: true
    },
    description: {
      type: String
    },
    unit: {
      type: String
    },
    qty: {
      type: Number,
      required: true
    },
    rate: {
      type: Number,
      required: true
    },
    totalAmount: {
      type: Number,
      required: true
    }
  },
  { _id: false }  // prevent separate _id for each sub-item
);

// Main Offer Schema
const offerSchema = new Schema(
  {
    projectName: {
      type: String,
      required: true
    },
    clientName: {
      type: String,
      required: true
    },
    projectLocation: {
      type: String,
      required: true
    },
    numberOfTower: {
      type: Number,
      required: true
    },
    towerName: {
      type: String,

    },
    typeOfChute: {
      type: String,
      enum: [],
      required: true
    },
    materialOfChute: {
      type: String,
      enum: [],
      required: true
    },
    diameterOfChute: {
      type: Number,
      required: true
    },
    thicknessOfChute: {
      type: Number,
      required: true
    },
    numberOfOpening: {
      type: Number,
      required: true
    },
    items: [offerItemSchema],
    subTotal: {
      type: Number,
      required: true
    },
    taxPercentage: {
      type: Number,
      default: 18
    },
    taxAmount: {
      type: Number,
      required: true
    },
    grandTotal: {
      type: Number,
      required: true
    },
    status: {
      type: String,
      enum: ["Draft", "Sent", "Accepted", "Rejected"],
      default: "Draft"
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true
    }
  },
  {
    timestamps: true
  }
);

export const Offer = mongoose.model("Offer", offerSchema);
