# AWS MONITOR

API de monitoramento de servidores EC2 Amazon AWS.

## LogStatus bash script example

```#!/bin/bash

  DATA="$( (                                                              \
    df;                                                                   \
    echo "---break----------------------------------------------------";  \
    ls -l /var/opt/mssql/data/;                                           \
    echo "---break----------------------------------------------------";  \
    systemctl status mssql-server;                                        \
    echo "---break----------------------------------------------------";  \
    free;                                                                 \
    echo "---break----------------------------------------------------";  \
    uptime;                                                               \
    echo "---break----------------------------------------------------";  \
    cat /etc/hostname;                                                    \
  ) | tr '\r\n' ' ')"

  curl -k --location --request POST "https://{API-ADDRESS}/aws-monitor/status-set/$CUSTOMER" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"status\":\"$DATA\"}"
```

## .env details

| Field | Description |
|-------|-------------|
| PORT | Port that server will listen to. |
| MAIL_HOST | SMTP mail host server address. |
| MAIL_PORT | SMTP mail host server port. |
| MAIL_FROM | E-mail user. |
| MAIL_PASSWORD | Email password. |
| FIREBASE_CLIENT_EMAIL | Firebase service account client email. |
| FIREBASE_PRIVATE_KEY | Firebase service account private key. |
| ALERT_DESTINATIONS | Alerter email destinations. String with emails separeted by comma. |
| ALERTER_CRON | Alerter check cron. Defaults to: '0 5-59/20 * * * *' |

## Set-data update route

> **POST /aws-monitor/status-set/{SERVER-NAME}**

### Example

`curl -k --location --request POST "https://{API-ADDRESS}/aws-monitor/status-set/{SERVER-NAME}" \
  --header 'Content-Type: application/json' \
  --data-raw "{\"status\":\"$DATA\"}"`
