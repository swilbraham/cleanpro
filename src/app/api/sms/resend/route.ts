import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms } from "@/lib/sms";

// POST: Resend a failed SMS
export async function POST(request: Request) {
  try {
    const { id } = await request.json();

    const reminder = await prisma.smsReminder.findUnique({ where: { id } });
    if (!reminder) {
      return NextResponse.json({ error: "SMS not found" }, { status: 404 });
    }

    const smsResult = await sendSms(reminder.phone, reminder.message);

    await prisma.smsReminder.update({
      where: { id },
      data: {
        status: "SENT",
        twilioSid: smsResult.sid,
        sentAt: new Date(),
        error: null,
      },
    });

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || "Failed to resend" },
      { status: 500 }
    );
  }
}
