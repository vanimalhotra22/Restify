def generate_alert(heart_rate, spo2):
    alerts = []
    if heart_rate > 100:
        alerts.append("High heart rate detected")
    if spo2 < 90:
        alerts.append("Low SpO₂ detected")
    return alerts
