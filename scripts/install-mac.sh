#!/usr/bin/env bash
#
# install-mac.sh - macOS installer for all video clipping tools
# Uses Homebrew and Python pip
#
set -e

echo "=========================================================="
echo "      🍎 Installing Video Clipping Tools Suite (macOS)    "
echo "=========================================================="

if ! command -v brew >/dev/null 2>&1; then
    echo "❌ Homebrew is required. Please install Homebrew from https://brew.sh first:"
    echo '  /bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"'
    exit 1
fi

echo "📦 Installing ffmpeg, yt-dlp, and mediainfo via Homebrew..."
brew install ffmpeg yt-dlp mediainfo python3

mkdir -p "$HOME/.local/bin"
export PATH="$HOME/.local/bin:$PATH"

echo "🐍 Installing Python video clipping tools & libraries..."
python3 -m pip install --break-system-packages -r "$(dirname "$0")/../requirements.txt" || \
python3 -m pip install -r "$(dirname "$0")/../requirements.txt"

echo "⚙️ Installing helper CLI tools..."
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cp "$SCRIPT_DIR/../bin"/* "$HOME/.local/bin/"
chmod +x "$HOME/.local/bin"/v*
ln -sf "$HOME/.local/bin/vclip" "$HOME/.local/bin/clip"
ln -sf "$HOME/.local/bin/vdl" "$HOME/.local/bin/download-clip"
ln -sf "$HOME/.local/bin/vshort" "$HOME/.local/bin/make-short"
ln -sf "$HOME/.local/bin/vsilence" "$HOME/.local/bin/cut-silence"
ln -sf "$HOME/.local/bin/vscenes" "$HOME/.local/bin/split-scenes"
ln -sf "$HOME/.local/bin/vsub" "$HOME/.local/bin/sub-clip"
ln -sf "$HOME/.local/bin/vinfo" "$HOME/.local/bin/video-info"

echo ""
echo "🎉 Installation complete on macOS!"
echo "Run: bash $(dirname "$0")/verify-tools.sh"
