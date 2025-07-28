FROM golang:1.24-bookworm AS builder
WORKDIR /build
COPY mcp ./mcp
WORKDIR /build/mcp
RUN go mod download
RUN CGO_ENABLED=0 GOOS=linux go build -o /mcp ./cmd/mcp/main.go

FROM debian:bookworm-slim
COPY --from=builder /mcp /usr/local/bin/mcp
EXPOSE 4000
ENTRYPOINT ["/usr/local/bin/mcp", "server"]

