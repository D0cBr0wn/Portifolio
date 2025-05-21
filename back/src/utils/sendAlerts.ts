import nodemailer from 'nodemailer'

const transporter = nodemailer.createTransport({
  host: 'smtp-relay.gmail.com',
  port: 587,
  auth: {
    user: process.env.MAIL_USER,
    pass: process.env.MAIL_PASS
  }
})

export async function sendAdminBanAlert(
  ip: string,
  email: string | null,
  reason: string
) {
  // TODO uncomment while mail will be ready
  // const text = `Bannissement IP: ${ip}\nRaison: ${reason}\nEmail tenté: ${email ?? 'non précisé'}`
  // await transporter.sendMail({
  //   from: '"Sécurité API FOK" <admin@example.com>',
  //   to: 'toiaussi@example.com',
  //   subject: `[ALERTE] Bannissement IP ${ip}`,
  //   text
  // })
}
