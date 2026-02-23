FROM alpine:3.21
ARG VERSION
ARG COMMIT_HASH
RUN apk add --no-cache bash
COPY app/dummy.sh /usr/local/bin/dummy.sh
RUN echo "# Version:  ${VERSION}" >> /usr/local/bin/dummy.sh
RUN echo "# Commit:  ${COMMIT_HASH}" >> /usr/local/bin/dummy.sh

CMD ["bash", "/usr/local/bin/dummy.sh"]