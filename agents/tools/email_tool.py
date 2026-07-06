import os
import smtplib
from email.message import EmailMessage
from crewai.tools import BaseTool
from pydantic import BaseModel

class SendEmailInput(BaseModel):
    subject: str
    body: str
    to_email: str = ""

class EmailTool(BaseTool):
    name: str = "send_email_alert"
    description: str = "Send an email alert to the finance manager with detailed reconciliation summaries or discrepancy reports."
    args_schema: type[BaseModel] = SendEmailInput

    def _run(self, subject: str, body: str, to_email: str = "") -> dict:
        smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
        smtp_port = int(os.getenv("SMTP_PORT", "465"))
        smtp_user = os.getenv("SMTP_USERNAME")
        smtp_pass = os.getenv("SMTP_PASSWORD")
        to = to_email or os.getenv("ALERT_EMAIL_ADDRESS")
        
        if not all([smtp_user, smtp_pass, to]):
            return {"error": "Missing SMTP credentials or target email. Cannot send email."}

        msg = EmailMessage()
        msg.set_content(body)
        msg['Subject'] = subject
        msg['From'] = smtp_user
        msg['To'] = to

        try:
            if smtp_port == 465:
                # SSL
                with smtplib.SMTP_SSL(smtp_server, smtp_port) as server:
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
            else:
                # TLS
                with smtplib.SMTP(smtp_server, smtp_port) as server:
                    server.starttls()
                    server.login(smtp_user, smtp_pass)
                    server.send_message(msg)
            return {"status": "success", "message": "Email sent successfully."}
        except Exception as e:
            return {"status": "error", "message": str(e)}
