#!/usr/bin/env bash
#
# install.sh - Universal Linux installer for all video clipping tools
# Supported: Debian/Ubuntu, Arch Linux, Fedora/RHEL, Alpine
#
set -e

echo "=========================================================="
echo "      🚀 Installing Video Clipping Tools Suite (Linux)    "
echo "=========================================================="

# Check root or sudo
SUDO=""
if [ "$(id -u)" -ne 0 ]; then
    if command -v sudo >/dev/null 2>&1; then
        SUDO="sudo"
    fi
fi

# Detect Package Manager
if command -v apt-get >/dev/null 2>&1; then
    echo "📦 Detected Debian/Ubuntu package manager..."
    $SUDO apt-get update -y
    $SUDO apt-get install -y ffmpeg python3 python3-pip python3-venv git curl mediainfo
elif command -v pacman >/dev/null 2>&1; then
    echo "📦 Detected Arch Linux package manager..."
    $SUDO pacman -Sy --noconfirm ffmpeg python python-pip git curl mediainfo
elif command -v dnf >/dev/null 2>&1; then
    echo "📦 Detected Fedora package manager..."
    $SUDO dnf install -y ffmpeg ffmpeg-free-devel python3 python3-pip git curl mediainfo
fi

# Ensure user local bin exists and in PATH
mkdir -p "$HOME/.local/bin"
export PATH="$HOME/.local/bin:$PATH"

# Install yt-dlp binary
echo "📥 Installing latest yt-dlp binary..."
curl -sL https://github.com/yt-dlp/yt-dlp/releases/latest/download/yt-dlp -o "$HOME/.local/bin/yt-dlp"
chmod a+rx "$HOME/.local/bin/yt-dlp"

# Install Python packages
echo "🐍 Installing Python video clipping libraries..."
python3 -m pip install --break-system-packages --user -r "$(dirname "$0")/../requirements.txt" || \
python3 -m pip install --user -r "$(dirname "$0")/../requirements.txt"

# Install custom helper CLI tools
echo "⚙️  Installing helper CLI tools (vclip, vdl, vshort, vsilence, vscenes, vsub, vinfo)..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_BIN="$SCRIPT_DIR/../bin"

cp "$REPO_BIN"/* "$HOME/.local/bin/"
chmod +x "$HOME/.local/bin"/v*
ln -sf "$HOME/.local/bin/vclip" "$HOME/.local/bin/clip"
ln -sf "$HOME/.local/bin/vdl" "$HOME/.local/bin/download-clip"
ln -sf "$HOME/.local/bin/vshort" "$HOME/.local/bin/make-short"
ln -sf "$HOME/.local/bin/vsilence" "$HOME/.local/bin/cut-silence"
ln -sf "$HOME/.local/bin/vscenes" "$HOME/.local/bin/split-scenes"
ln -sf "$HOME/.local/bin/vsub" "$HOME/.local/bin/sub-clip"
ln -sf "$HOME/.local/bin/vinfo" "$HOME/.local/bin/video-info"

echo ""
echo "🎉 Installation complete!"
echo "Run: bash $(dirname "$0")/verify-tools.sh"
