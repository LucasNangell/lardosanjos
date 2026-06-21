FROM alpine:3.20

RUN apk add --no-cache \
  bash \
  mysql-client \
  aws-cli \
  tzdata \
  coreutils \
  gzip

ENV TZ=America/Sao_Paulo

COPY scripts/backup-mysql.sh /usr/local/bin/backup-mysql.sh
COPY scripts/backup-cron.sh /usr/local/bin/backup-cron.sh
RUN chmod +x /usr/local/bin/backup-mysql.sh /usr/local/bin/backup-cron.sh

CMD ["/usr/local/bin/backup-cron.sh"]
