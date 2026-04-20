# Pin a versioned Daytona sandbox base image so snapshot rebuilds stay reproducible.
FROM daytonaio/sandbox:0.161.0

USER root

RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  dbus-x11 \
  fonts-dejavu-core \
  fonts-liberation \
  fonts-noto-color-emoji \
  fonts-noto-core \
  fonts-noto-mono \
  fonts-noto-ui-core \
  wmctrl \
  x11-utils \
  xdotool \
  xvfb \
  && rm -rf /var/lib/apt/lists/*

# Provide a deterministic Chromium entrypoint for the screenshot helpers.
# /usr/local/bin/getdesign-chromium keeps --no-sandbox because typical
# containerized Daytona runtimes rely on container isolation rather than the
# Chromium sandbox, and often do not expose the user namespaces or seccomp /
# AppArmor allowances Chromium needs. If your runtime enables those kernel
# features, remove --no-sandbox from this wrapper.
RUN printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  'exec chromium --no-sandbox --disable-dev-shm-usage "$@"' \
  > /usr/local/bin/getdesign-chromium && chmod +x /usr/local/bin/getdesign-chromium

USER daytona

ENV DISPLAY=:1
ENV GETDESIGN_VIEWPORT_WIDTH=1440
ENV GETDESIGN_VIEWPORT_HEIGHT=900
