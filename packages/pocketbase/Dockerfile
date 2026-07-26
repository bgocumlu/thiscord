FROM alpine:3.22 AS download
ARG POCKETBASE_VERSION=0.39.9
ARG TARGETARCH
RUN apk add --no-cache ca-certificates unzip wget \
    && wget -q "https://github.com/pocketbase/pocketbase/releases/download/v${POCKETBASE_VERSION}/pocketbase_${POCKETBASE_VERSION}_linux_${TARGETARCH}.zip" -O /tmp/pocketbase.zip \
    && unzip /tmp/pocketbase.zip -d /out

FROM alpine:3.22
RUN apk add --no-cache ca-certificates su-exec \
    && addgroup -g 10001 thiscord \
    && adduser -D -H -u 10001 -G thiscord thiscord
WORKDIR /app
COPY --from=download /out/pocketbase /usr/local/bin/pocketbase
COPY pb_hooks /app/pb_hooks
COPY pb_migrations /app/pb_migrations
COPY docker-entrypoint.sh /usr/local/bin/thiscord-pocketbase
RUN chmod 0755 /usr/local/bin/pocketbase /usr/local/bin/thiscord-pocketbase \
    && mkdir -p /app/pb_data \
    && chown -R thiscord:thiscord /app
VOLUME ["/app/pb_data"]
EXPOSE 8090
ENTRYPOINT ["thiscord-pocketbase"]
