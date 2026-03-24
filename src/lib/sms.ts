import twilio from "twilio";

const accountSid = process.env.TWILIO_ACCOUNT_SID;
const authToken = process.env.TWILIO_AUTH_TOKEN;
const fromNumber = process.env.TWILIO_PHONE_NUMBER;

function getClient() {
  if (!accountSid || !authToken) {
    throw new Error("Twilio credentials not configured");
  }
  return twilio(accountSid, authToken);
}

export async function sendSms(to: string, body: string) {
  const client = getClient();

  if (!fromNumber) {
    throw new Error("TWILIO_PHONE_NUMBER not configured");
  }

  // Normalise UK numbers: 07xxx -> +447xxx
  let normalised = to.replace(/\s+/g, "");
  if (normalised.startsWith("07")) {
    normalised = "+44" + normalised.slice(1);
  } else if (normalised.startsWith("7") && normalised.length === 10) {
    normalised = "+44" + normalised;
  } else if (!normalised.startsWith("+")) {
    normalised = "+44" + normalised;
  }

  const message = await client.messages.create({
    body,
    from: fromNumber,
    to: normalised,
  });

  return message;
}

export function buildReminderMessage(customerFirstName: string): string {
  return `Hi ${customerFirstName}, just a reminder that you have a carpet/upholstery cleaning appointment tomorrow. Call us on 07724564683 if there are any problems. Thanks, Simon`;
}

export function buildReviewMessage(customerFirstName: string): string {
  return `Hi ${customerFirstName}, thank you for choosing us for your cleaning. If you are happy with the clean please leave us a review on https://share.google/rOepzL0A42jiYKmXQ and if there are any problems please call us on 07724564683 and we will ensure you are happy with the end result. Thanks, Simon`;
}
