FROM alpine:3.22
ARG POCKETBASE_VERSION=0.39.9
ARG TARGETARCH
RUN apk add --no-cache ca-certificates su-exec \
    && addgroup -g 10001 thiscord \
    && adduser -D -H -u 10001 -G thiscord thiscord
COPY vendor/pocketbase/${POCKETBASE_VERSION}/linux_${TARGETARCH}/ /tmp/pocketbase/
RUN cd /tmp/pocketbase \
    && sha256sum -c SHA256SUMS \
    && install -m 0755 pocketbase /usr/local/bin/pocketbase \
    && rm -rf /tmp/pocketbase
WORKDIR /app
COPY pb_hooks /app/pb_hooks
COPY pb_migrations /app/pb_migrations
COPY docker-entrypoint.sh /usr/local/bin/thiscord-pocketbase
RUN chmod 0755 /usr/local/bin/pocketbase /usr/local/bin/thiscord-pocketbase \
    && mkdir -p /app/pb_data \
    && chown -R thiscord:thiscord /app
VOLUME ["/app/pb_data"]
EXPOSE 8090
ENTRYPOINT ["thiscord-pocketbase"]
