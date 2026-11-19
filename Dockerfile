# Universal Docker image with all video clipping tools preinstalled
FROM python:3.11-slim-bookworm

ENV DEBIAN_FRONTEND=noninteractive
ENV PATH="/root/.local/bin:/usr/local/bin:$PATH"

# Install system dependencies & ffmpeg
RUN apt-get update && apt-get install -y --no-install-recommends \
    ffmpeg \
    curl \
    git \
    nodejs \
    npm \
    mediainfo \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Install yt-dlp
RUN curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o /usr/local/bin/yt-dlp \
    && chmod a+rx /usr/local/bin/yt-dlp

WORKDIR /app

# Install Python requirements
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Install Node dependencies
COPY package.json .
RUN npm install

# Copy application code and CLI tools
COPY . .
RUN cp bin/* /usr/local/bin/ && chmod +x /usr/local/bin/v* && \
    ln -sf /usr/local/bin/vclip /usr/local/bin/clip && \
    ln -sf /usr/local/bin/vdl /usr/local/bin/download-clip && \
    ln -sf /usr/local/bin/vshort /usr/local/bin/make-short && \
    ln -sf /usr/local/bin/vsilence /usr/local/bin/cut-silence && \
    ln -sf /usr/local/bin/vscenes /usr/local/bin/split-scenes && \
    ln -sf /usr/local/bin/vsub /usr/local/bin/sub-clip && \
    ln -sf /usr/local/bin/vinfo /usr/local/bin/video-info

EXPOSE 3000

CMD ["node", "server/index.js"]
