import os
from crewai.tools import BaseTool
from pydantic import BaseModel
from twilio.rest import Client

class SendSMSInput(BaseModel):
    message: str
    to_number: str = ""

class TwilioSMSTool(BaseTool):
    name: str = "send_sms_alert"
    description: str = "Send an SMS alert to the finance manager about a critical discrepancy."
    args_schema: type[BaseModel] = SendSMSInput

    def _run(self, message: str, to_number: str = "") -> dict:
        client = Client(os.getenv("TWILIO_ACCOUNT_SID"), os.getenv("TWILIO_AUTH_TOKEN"))
        to = to_number or os.getenv("ALERT_PHONE_NUMBER")
        msg = client.messages.create(
            body=message,
            from_=os.getenv("TWILIO_FROM_NUMBER"),
            to=to,
        )
        return {"sid": msg.sid, "status": msg.status}
