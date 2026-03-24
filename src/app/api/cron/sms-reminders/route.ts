import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { sendSms, buildReminderMessage, buildReviewMessage } from "@/lib/sms";

// Vercel Cron calls this endpoint
// Secured with CRON_SECRET header
export async function GET(request: Request) {
  // Verify cron secret
  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const results = { reminders: 0, reviews: 0, errors: [] as string[] };

  try {
    // ============ 24-HOUR BEFORE REMINDERS ============
    // Find jobs scheduled for tomorrow that haven't had a reminder sent
    const now = new Date();
    const tomorrow = new Date(now);
    tomorrow.setDate(tomorrow.getDate() + 1);

    // Start and end of tomorrow
    const tomorrowStart = new Date(tomorrow);
    tomorrowStart.setHours(0, 0, 0, 0);
    const tomorrowEnd = new Date(tomorrow);
    tomorrowEnd.setHours(23, 59, 59, 999);

    const jobsNeedingReminder = await prisma.job.findMany({
      where: {
        scheduledDate: {
          gte: tomorrowStart,
          lte: tomorrowEnd,
        },
        status: {
          in: ["SCHEDULED"],
        },
        smsReminders: {
          none: {
            type: "REMINDER_24H_BEFORE",
          },
        },
      },
      include: {
        customer: {
          select: { firstName: true, phone: true },
        },
      },
    });

    for (const job of jobsNeedingReminder) {
      try {
        const message = buildReminderMessage(job.customer.firstName);
        const smsResult = await sendSms(job.customer.phone, message);

        await prisma.smsReminder.create({
          data: {
            jobId: job.id,
            type: "REMINDER_24H_BEFORE",
            phone: job.customer.phone,
            message,
            status: "SENT",
            twilioSid: smsResult.sid,
            sentAt: new Date(),
          },
        });

        results.reminders++;
      } catch (error: any) {
        // Log the failure but continue processing other jobs
        await prisma.smsReminder.create({
          data: {
            jobId: job.id,
            type: "REMINDER_24H_BEFORE",
            phone: job.customer.phone,
            message: buildReminderMessage(job.customer.firstName),
            status: "FAILED",
            error: error.message || "Unknown error",
          },
        });
        results.errors.push(
          `Reminder failed for job ${job.jobNumber}: ${error.message}`
        );
      }
    }

    // ============ 24-HOUR AFTER REVIEW REQUESTS ============
    // Find jobs completed yesterday that haven't had a review request sent
    const yesterday = new Date(now);
    yesterday.setDate(yesterday.getDate() - 1);

    const yesterdayStart = new Date(yesterday);
    yesterdayStart.setHours(0, 0, 0, 0);
    const yesterdayEnd = new Date(yesterday);
    yesterdayEnd.setHours(23, 59, 59, 999);

    const jobsNeedingReview = await prisma.job.findMany({
      where: {
        scheduledDate: {
          gte: yesterdayStart,
          lte: yesterdayEnd,
        },
        status: {
          in: ["COMPLETED", "INVOICED"],
        },
        smsReminders: {
          none: {
            type: "REVIEW_24H_AFTER",
          },
        },
      },
      include: {
        customer: {
          select: { firstName: true, phone: true },
        },
      },
    });

    for (const job of jobsNeedingReview) {
      try {
        const message = buildReviewMessage(job.customer.firstName);
        const smsResult = await sendSms(job.customer.phone, message);

        await prisma.smsReminder.create({
          data: {
            jobId: job.id,
            type: "REVIEW_24H_AFTER",
            phone: job.customer.phone,
            message,
            status: "SENT",
            twilioSid: smsResult.sid,
            sentAt: new Date(),
          },
        });

        results.reviews++;
      } catch (error: any) {
        await prisma.smsReminder.create({
          data: {
            jobId: job.id,
            type: "REVIEW_24H_AFTER",
            phone: job.customer.phone,
            message: buildReviewMessage(job.customer.firstName),
            status: "FAILED",
            error: error.message || "Unknown error",
          },
        });
        results.errors.push(
          `Review request failed for job ${job.jobNumber}: ${error.message}`
        );
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: any) {
    console.error("SMS cron failed:", error);
    return NextResponse.json(
      { error: error.message || "Cron job failed" },
      { status: 500 }
    );
  }
}
