import { Resend } from 'resend'
import { env } from '../config/env'

const resend = env.RESEND_API_KEY ? new Resend(env.RESEND_API_KEY) : null

interface SendEmailOptions {
  to: string | string[]
  subject: string
  html: string
}

export async function sendEmail({ to, subject, html }: SendEmailOptions) {
  if (!resend) {
    console.log('[email] Skipping (no API key):', { to, subject })
    return { success: true, mock: true }
  }

  try {
    const data = await resend.emails.send({
      from: env.EMAIL_FROM,
      to: Array.isArray(to) ? to : [to],
      subject,
      html,
    })
    return { success: true, data }
  } catch (error) {
    console.error('[email] Send failed:', error)
    return { success: false, error }
  }
}

export async function sendOrderConfirmation(
  email: string,
  details: { customerName: string; orderId: string; total: string; type: string }
) {
  return sendEmail({
    to: email,
    subject: `Order Confirmed - ${env.APP_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Order Confirmed</h2>
        <p>Hi ${details.customerName},</p>
        <p>Your ${details.type} order has been confirmed:</p>
        <ul>
          <li><strong>Order ID:</strong> ${details.orderId}</li>
          <li><strong>Total:</strong> ${details.total}</li>
        </ul>
        <p>— ${env.APP_NAME}</p>
      </div>
    `,
  })
}

export async function sendReservationConfirmation(
  email: string,
  details: { guestName: string; date: string; time: string; partySize: number; tableNumber?: number }
) {
  return sendEmail({
    to: email,
    subject: `Reservation Confirmed - ${env.APP_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Reservation Confirmed</h2>
        <p>Hi ${details.guestName},</p>
        <p>Your reservation has been confirmed:</p>
        <ul>
          <li><strong>Date:</strong> ${details.date}</li>
          <li><strong>Time:</strong> ${details.time}</li>
          <li><strong>Party Size:</strong> ${details.partySize}</li>
          ${details.tableNumber ? `<li><strong>Table:</strong> ${details.tableNumber}</li>` : ''}
        </ul>
        <p>— ${env.APP_NAME}</p>
      </div>
    `,
  })
}

export async function sendPaymentReceipt(
  email: string,
  details: { customerName: string; billId: string; amount: string }
) {
  return sendEmail({
    to: email,
    subject: `Payment Receipt - ${env.APP_NAME}`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;">
        <h2>Payment Received</h2>
        <p>Hi ${details.customerName},</p>
        <p>We received your payment of <strong>${details.amount}</strong>.</p>
        <p>Bill ID: ${details.billId}</p>
        <p>— ${env.APP_NAME}</p>
      </div>
    `,
  })
}
