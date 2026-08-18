import { NextResponse, NextRequest } from "next/server";
import { db } from "@/lib/firebase";
import {
  collection,
  addDoc,
  updateDoc,
  doc,
  getDocs,
  query,
  where,
  Timestamp,
  deleteDoc,
} from "firebase/firestore";

/* ==================== TYPES ==================== */

export interface MealItem {
  recipeId: string;
  recipeName: string;
  servings: number;
  portionSize?: string;
}

export interface ScheduledMeal {
  mealType: "morning" | "breakfast" | "lunch" | "dinner" | "prasadam";
  time: string; // HH:MM format
  items: MealItem[];
  notes?: string;
}

export interface KitchenSchedule {
  id: string;
  date: string; // YYYY-MM-DD
  meals: ScheduledMeal[];
  totalDevotees: number;
  createdAt: Timestamp;
  updatedAt: Timestamp;
}

/* ==================== GET ==================== */

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const date = searchParams.get("date");
    const startDate = searchParams.get("startDate");
    const endDate = searchParams.get("endDate");

    if (date) {
      // Get specific date
      const q = query(
        collection(db, "kitchenSchedules"),
        where("date", "==", date)
      );
      const snap = await getDocs(q);

      if (snap.empty) {
        return NextResponse.json({
          schedule: null,
          message: "No schedule for this date",
        });
      }

      const doc = snap.docs[0].data();
      return NextResponse.json({
        schedule: {
          id: snap.docs[0].id,
          ...doc,
        } as KitchenSchedule,
      });
    }

    if (startDate && endDate) {
      // Get date range
      const q = query(
        collection(db, "kitchenSchedules"),
        where("date", ">=", startDate),
        where("date", "<=", endDate)
      );
      const snap = await getDocs(q);

      const schedules = snap.docs.map((d) => ({
        id: d.id,
        ...d.data(),
      }));

      return NextResponse.json({ schedules });
    }

    return NextResponse.json({ error: "Missing date parameters" }, { status: 400 });
  } catch (error: any) {
    console.error("Error fetching schedule:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/* ==================== POST ==================== */

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { date, meals, totalDevotees } = body;

    if (!date || !meals || !Array.isArray(meals)) {
      return NextResponse.json(
        { error: "Missing required fields: date, meals" },
        { status: 400 }
      );
    }

    // Check if schedule already exists for this date
    const existingQ = query(
      collection(db, "kitchenSchedules"),
      where("date", "==", date)
    );
    const existingSnap = await getDocs(existingQ);

    if (!existingSnap.empty) {
      // Update existing
      const docId = existingSnap.docs[0].id;
      await updateDoc(doc(db, "kitchenSchedules", docId), {
        meals,
        totalDevotees,
        updatedAt: Timestamp.now(),
      });

      return NextResponse.json({
        id: docId,
        message: "Schedule updated successfully",
      });
    }

    // Create new
    const docRef = await addDoc(collection(db, "kitchenSchedules"), {
      date,
      meals,
      totalDevotees,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    });

    return NextResponse.json({
      id: docRef.id,
      message: "Schedule created successfully",
    });
  } catch (error: any) {
    console.error("Error saving schedule:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}

/* ==================== DELETE ==================== */

export async function DELETE(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams;
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing schedule id" },
        { status: 400 }
      );
    }

    await deleteDoc(doc(db, "kitchenSchedules", id));

    return NextResponse.json({ message: "Schedule deleted successfully" });
  } catch (error: any) {
    console.error("Error deleting schedule:", error);
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    );
  }
}
