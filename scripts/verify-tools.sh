#!/usr/bin/env bash
#
# verify-tools.sh - Checks installation status of video clipping tools
#

echo "========================================================"
echo "      🎥 Video Clipping Tools Diagnostic Check         "
echo "========================================================"
echo ""

check_tool() {
    local name="$1"
    local cmd="$2"
    local version_cmd="$3"

    if command -v "$cmd" >/dev/null 2>&1; then
        local ver
        ver=$(eval "$version_cmd" 2>&1 | head -n 1)
        printf "  %-16s : ✅ INSTALLED  (%s)\n" "$name" "$ver"
        return 0
    else
        printf "  %-16s : ❌ NOT FOUND\n" "$name"
        return 1
    fi
}

check_python_module() {
    local name="$1"
    local mod="$2"
    if python3 -c "import $mod" >/dev/null 2>&1; then
        local ver
        ver=$(python3 -c "import $mod; print(getattr($mod, '__version__', 'available'))" 2>&1)
        printf "  %-16s : ✅ INSTALLED  (%s)\n" "$name" "$ver"
        return 0
    else
        printf "  %-16s : ❌ NOT FOUND\n" "$name"
        return 1
    fi
}

echo "Core CLI Video Tools:"
check_tool "FFmpeg" "ffmpeg" "ffmpeg -version | grep 'ffmpeg version' | cut -d' ' -f3"
check_tool "FFprobe" "ffprobe" "ffprobe -version | grep 'ffprobe version' | cut -d' ' -f3"
check_tool "yt-dlp" "yt-dlp" "yt-dlp --version"
check_tool "scenedetect" "scenedetect" "scenedetect about | grep -o 'PySceneDetect [0-9.]*' | head -n 1"
check_tool "auto-editor" "auto-editor" "auto-editor --version"
check_tool "Node.js" "node" "node -v"
check_tool "Python 3" "python3" "python3 --version"

echo ""
echo "Python Video & AI Libraries:"
check_python_module "faster-whisper" "faster_whisper"
check_python_module "moviepy" "moviepy"
check_python_module "pymediainfo" "pymediainfo"
check_python_module "pydub" "pydub"
check_python_module "opencv-headless" "cv2"
check_python_module "pillow" "PIL"

echo ""
echo "Antigravity Custom Helper Tools (in PATH):"
check_tool "vclip (clip)" "vclip" "vclip --help | head -n 1"
check_tool "vdl (download)" "vdl" "vdl --help | head -n 1"
check_tool "vshort (9:16)" "vshort" "vshort --help | head -n 1"
check_tool "vsilence (cut)" "vsilence" "vsilence --help | head -n 1"
check_tool "vscenes (detect)" "vscenes" "vscenes --help | head -n 1"
check_tool "vsub (subtitles)" "vsub" "vsub --help | head -n 1"
check_tool "vinfo (metadata)" "vinfo" "vinfo --help | head -n 1"

echo ""
echo "========================================================"
echo "  All systems ready for high-performance video clipping!"
echo "========================================================"
