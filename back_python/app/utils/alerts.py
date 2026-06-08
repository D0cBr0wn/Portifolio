import logging

import aiosmtplib
from email.mime.text import MIMEText

from app.config import settings

logger = logging.getLogger(__name__)


async def send_admin_ban_alert(ip: str, email: str, reason: str) -> None:
    if not settings.smtp_host or settings.smtp_port == 0:
        logger.warning("SMTP not configured, skipping alert for IP %s", ip)
        return

    msg = MIMEText(f"IP {ip} a été bannie.\nEmail essayé: {email}\nRaison: {reason}")
    msg["Subject"] = f"[OOO] IP bannie : {ip}"
    msg["From"] = settings.smtp_user or "noreply@ooo.local"
    msg["To"] = settings.admin_email

    try:
        await aiosmtplib.send(
            msg,
            hostname=settings.smtp_host,
            port=settings.smtp_port,
            username=settings.smtp_user or None,
            password=settings.smtp_password or None,
        )
    except Exception as exc:
        logger.error("Failed to send ban alert: %s", exc)
