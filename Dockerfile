FROM alpine:3.21
RUN apk add --no-cache bash
COPY app/dummy.sh /usr/local/bin/dummy.sh
CMD ["bash", "/usr/local/bin/dummy.sh"]