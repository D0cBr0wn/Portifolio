import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 587),
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
})

export async function sendAdminBanAlert(ip: string, email: string | null, reason: string) {
  if (!process.env.ADMIN_EMAIL || !process.env.SMTP_HOST) return

  const text = `Bannissement IP: ${ip}\nRaison: ${reason}\nEmail tenté: ${email ?? 'non précisé'}`
  await transporter.sendMail({
    from: `"Sécurité Portfolio" <${process.env.SMTP_USER}>`,
    to: process.env.ADMIN_EMAIL,
    subject: `[ALERTE] Bannissement IP ${ip}`,
    text,
  })
}
