# Pin a versioned Daytona sandbox base so snapshot rebuilds stay reproducible.
FROM daytonaio/sandbox:0.161.0

ARG GETDESIGN_RUNTIME_VERSION=dev

LABEL org.opencontainers.image.source="https://github.com/MohtashamMurshid/getdesign"
LABEL org.opencontainers.image.description="getdesign capture runtime: Chromium + fonts on Daytona"
LABEL org.opencontainers.image.licenses="MIT"
LABEL com.getdesign.runtime.version="${GETDESIGN_RUNTIME_VERSION}"

USER root

# System packages: Chromium + Daytona Computer Use desktop helpers.
RUN apt-get update && apt-get install -y --no-install-recommends \
  chromium \
  dbus-x11 \
  wmctrl \
  x11-utils \
  xdotool \
  xvfb \
  && rm -rf /var/lib/apt/lists/*

# Fonts: Latin/Cyrillic/Greek + emoji + CJK + common product fonts.
RUN apt-get update && apt-get install -y --no-install-recommends \
  fonts-dejavu-core \
  fonts-inter \
  fonts-liberation \
  fonts-noto-cjk \
  fonts-noto-color-emoji \
  fonts-noto-core \
  fonts-noto-mono \
  fonts-noto-ui-core \
  fonts-roboto \
  && rm -rf /var/lib/apt/lists/* \
  && fc-cache -f

# Locale so CJK and other UTF-8 content renders predictably.
ENV LANG=C.UTF-8
ENV LC_ALL=C.UTF-8

# Deterministic Chromium wrapper with capture-friendly defaults + CDP on
# 127.0.0.1:9222 (host reaches it via SSH tunnel via Daytona SDK).
RUN printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  'exec chromium \' \
  '  --no-sandbox \' \
  '  --disable-dev-shm-usage \' \
  '  --disable-gpu \' \
  '  --disable-background-networking \' \
  '  --disable-component-update \' \
  '  --disable-default-apps \' \
  '  --disable-features=Translate,InterestCohort \' \
  '  --disable-popup-blocking \' \
  '  --hide-scrollbars \' \
  '  --force-color-profile=srgb \' \
  '  --user-data-dir=/tmp/getdesign-chromium-profile \' \
  '  --remote-debugging-address=127.0.0.1 \' \
  '  --remote-debugging-port=9222 \' \
  '  "$@"' \
  > /usr/local/bin/getdesign-chromium && chmod +x /usr/local/bin/getdesign-chromium

# Snapshot self-identification: ensure helper reads this to confirm provenance.
RUN mkdir -p /etc/getdesign && \
  echo "{\"runtime\":\"${GETDESIGN_RUNTIME_VERSION}\",\"chromium\":\"$(chromium --version)\"}" \
  > /etc/getdesign/runtime.json

# Doctor probe: prints diagnostic info for ensure-snapshot and support requests.
RUN printf '%s\n' \
  '#!/usr/bin/env bash' \
  'set -euo pipefail' \
  'cat /etc/getdesign/runtime.json' \
  'echo' \
  'echo "display=${DISPLAY:-unset}"' \
  'echo "xvfb_running=$(pgrep -c Xvfb || true)"' \
  'echo "fonts_count=$(fc-list | wc -l)"' \
  > /usr/local/bin/getdesign-doctor && chmod +x /usr/local/bin/getdesign-doctor

USER daytona

ENV DISPLAY=:1
ENV GETDESIGN_VIEWPORT_WIDTH=1440
ENV GETDESIGN_VIEWPORT_HEIGHT=900
