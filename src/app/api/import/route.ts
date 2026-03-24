import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

interface SetmoreRow {
  // Setmore CSV columns (flexible mapping)
  [key: string]: string;
}

function parseCSV(text: string): SetmoreRow[] {
  const lines = text.split(/\r?\n/).filter((l) => l.trim());
  if (lines.length < 2) return [];

  // Parse header - handle quoted values
  const parseRow = (line: string): string[] => {
    const result: string[] = [];
    let current = "";
    let inQuotes = false;
    for (let i = 0; i < line.length; i++) {
      const ch = line[i];
      if (ch === '"') {
        inQuotes = !inQuotes;
      } else if (ch === "," && !inQuotes) {
        result.push(current.trim());
        current = "";
      } else {
        current += ch;
      }
    }
    result.push(current.trim());
    return result;
  };

  const headers = parseRow(lines[0]).map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, "_"));
  const rows: SetmoreRow[] = [];

  for (let i = 1; i < lines.length; i++) {
    const values = parseRow(lines[i]);
    if (values.length < 2) continue;
    const row: SetmoreRow = {};
    headers.forEach((h, idx) => {
      row[h] = values[idx] || "";
    });
    rows.push(row);
  }

  return rows;
}

// Map common Setmore column names to our fields
function findValue(row: SetmoreRow, ...keys: string[]): string {
  for (const key of keys) {
    for (const [k, v] of Object.entries(row)) {
      if (k.includes(key) && v) return v;
    }
  }
  return "";
}

function parseDate(dateStr: string): Date | null {
  if (!dateStr) return null;

  // Try DD/MM/YYYY (UK format)
  const ukMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (ukMatch) {
    const d = new Date(`${ukMatch[3]}-${ukMatch[2].padStart(2, "0")}-${ukMatch[1].padStart(2, "0")}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Try MM/DD/YYYY (US format)
  const usMatch = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
  if (usMatch) {
    const d = new Date(`${usMatch[3]}-${usMatch[1].padStart(2, "0")}-${usMatch[2].padStart(2, "0")}`);
    if (!isNaN(d.getTime())) return d;
  }

  // Try YYYY-MM-DD
  const isoMatch = dateStr.match(/^(\d{4})-(\d{2})-(\d{2})/);
  if (isoMatch) {
    const d = new Date(dateStr);
    if (!isNaN(d.getTime())) return d;
  }

  // Generic fallback
  const d = new Date(dateStr);
  return isNaN(d.getTime()) ? null : d;
}

function parseTime(timeStr: string): string | null {
  if (!timeStr) return null;

  // Handle "10:00 AM" format
  const ampm = timeStr.match(/(\d{1,2}):(\d{2})\s*(am|pm)/i);
  if (ampm) {
    let h = parseInt(ampm[1]);
    const m = ampm[2];
    if (ampm[3].toLowerCase() === "pm" && h < 12) h += 12;
    if (ampm[3].toLowerCase() === "am" && h === 12) h = 0;
    return `${h.toString().padStart(2, "0")}:${m}`;
  }

  // Handle "10:00" 24h format
  const h24 = timeStr.match(/^(\d{1,2}):(\d{2})/);
  if (h24) {
    return `${h24[1].padStart(2, "0")}:${h24[2]}`;
  }

  return null;
}

async function getNextJobNumber() {
  const seq = await prisma.sequence.upsert({
    where: { id: "job" },
    update: { current: { increment: 1 } },
    create: { id: "job", current: 1 },
  });
  return `JOB-${seq.current.toString().padStart(4, "0")}`;
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;
    const dateFormat = (formData.get("dateFormat") as string) || "dd/mm/yyyy";
    const importMode = (formData.get("mode") as string) || "preview";

    if (!file) {
      return NextResponse.json({ error: "No file uploaded" }, { status: 400 });
    }

    const text = await file.text();
    const rows = parseCSV(text);

    if (rows.length === 0) {
      return NextResponse.json({ error: "No data rows found in CSV" }, { status: 400 });
    }

    // Detect columns
    const headers = Object.keys(rows[0]);

    // Map each row to import data
    const parsed = rows.map((row, idx) => {
      const firstName = findValue(row, "first_name", "firstname", "customer_first", "client_first") ||
        findValue(row, "name", "customer_name", "client_name").split(" ")[0] || "";
      const lastName = findValue(row, "last_name", "lastname", "customer_last", "client_last") ||
        findValue(row, "name", "customer_name", "client_name").split(" ").slice(1).join(" ") || "";
      const phone = findValue(row, "phone", "mobile", "tel", "cell", "contact_number");
      const email = findValue(row, "email", "e_mail");
      const address = findValue(row, "address", "street", "location");
      const city = findValue(row, "city", "town");
      const postcode = findValue(row, "postcode", "zip", "postal", "post_code", "zip_code");

      const dateStr = findValue(row, "date", "appointment_date", "start_date", "booking_date", "scheduled");
      const timeStr = findValue(row, "time", "start_time", "appointment_time", "booking_time");
      const endTimeStr = findValue(row, "end_time", "finish_time");
      const durationStr = findValue(row, "duration", "length");
      const service = findValue(row, "service", "type", "service_name", "appointment_type");
      const staff = findValue(row, "staff", "provider", "assigned", "team_member", "employee");
      const notes = findValue(row, "notes", "comment", "description", "details", "remarks");
      const status = findValue(row, "status", "state");
      const price = findValue(row, "price", "cost", "amount", "total", "fee");

      // Parse date based on user's format preference
      let parsedDate: Date | null = null;
      if (dateStr) {
        if (dateFormat === "mm/dd/yyyy") {
          // Swap day/month for US format
          const parts = dateStr.match(/^(\d{1,2})[\/\-](\d{1,2})[\/\-](\d{4})$/);
          if (parts) {
            parsedDate = new Date(`${parts[3]}-${parts[1].padStart(2, "0")}-${parts[2].padStart(2, "0")}`);
          }
        } else {
          parsedDate = parseDate(dateStr);
        }
        if (parsedDate && isNaN(parsedDate.getTime())) parsedDate = null;
      }

      // Calculate duration
      let duration = 60;
      if (durationStr) {
        const mins = parseInt(durationStr);
        if (!isNaN(mins) && mins > 0) duration = mins;
      } else if (timeStr && endTimeStr) {
        const start = parseTime(timeStr);
        const end = parseTime(endTimeStr);
        if (start && end) {
          const [sh, sm] = start.split(":").map(Number);
          const [eh, em] = end.split(":").map(Number);
          const diff = (eh * 60 + em) - (sh * 60 + sm);
          if (diff > 0) duration = diff;
        }
      }

      return {
        row: idx + 2,
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        phone: phone.trim(),
        email: email.trim(),
        address: address.trim(),
        city: city.trim(),
        postcode: postcode.trim(),
        date: parsedDate,
        dateRaw: dateStr,
        time: parseTime(timeStr),
        timeRaw: timeStr,
        duration,
        service: service.trim(),
        staff: staff.trim(),
        notes: notes.trim(),
        status: status.trim(),
        price: price ? parseFloat(price.replace(/[£$,]/g, "")) : null,
        valid: !!(firstName && phone && parsedDate),
        errors: [
          ...(!firstName ? ["Missing customer name"] : []),
          ...(!phone ? ["Missing phone number"] : []),
          ...(!parsedDate ? [`Invalid/missing date: "${dateStr}"`] : []),
        ],
      };
    });

    // Preview mode - just return parsed data
    if (importMode === "preview") {
      return NextResponse.json({
        headers,
        total: parsed.length,
        valid: parsed.filter((r) => r.valid).length,
        invalid: parsed.filter((r) => !r.valid).length,
        rows: parsed,
      });
    }

    // Import mode - create customers and jobs
    const results = { created: 0, skipped: 0, errors: [] as string[] };

    for (const row of parsed) {
      if (!row.valid) {
        results.skipped++;
        continue;
      }

      try {
        // Find or create customer by phone
        let customer = await prisma.customer.findFirst({
          where: { phone: row.phone },
        });

        if (!customer) {
          customer = await prisma.customer.create({
            data: {
              firstName: row.firstName,
              lastName: row.lastName || "Unknown",
              phone: row.phone,
              email: row.email || null,
              address: row.address || "Not provided",
              city: row.city || "Not provided",
              postcode: row.postcode || "Not provided",
              tags: ["imported"],
            },
          });
        }

        // Find staff member if provided
        let assignedToId: string | null = null;
        if (row.staff) {
          const user = await prisma.user.findFirst({
            where: {
              name: { contains: row.staff, mode: "insensitive" },
            },
          });
          if (user) assignedToId = user.id;
        }

        // Create job
        const jobNumber = await getNextJobNumber();
        await prisma.job.create({
          data: {
            jobNumber,
            customerId: customer.id,
            assignedToId,
            scheduledDate: row.date!,
            scheduledTime: row.time,
            duration: row.duration,
            notes: [
              row.service ? `Service: ${row.service}` : "",
              row.notes || "",
              row.price ? `Price: £${row.price.toFixed(2)}` : "",
              `Imported from Setmore`,
            ]
              .filter(Boolean)
              .join("\n"),
            status: "SCHEDULED",
          },
        });

        results.created++;
      } catch (error: any) {
        results.errors.push(`Row ${row.row}: ${error.message}`);
        results.skipped++;
      }
    }

    return NextResponse.json({
      success: true,
      ...results,
    });
  } catch (error: any) {
    console.error("Import failed:", error);
    return NextResponse.json(
      { error: error.message || "Import failed" },
      { status: 500 }
    );
  }
}
