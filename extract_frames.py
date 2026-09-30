import cv2
import os
import sys

def extract_frames(video_path, output_dir, max_frames=None, scale_width=2560):
    if not os.path.exists(output_dir):
        os.makedirs(output_dir)

    print(f"Opening video: {video_path}")
    cap = cv2.VideoCapture(video_path)
    
    if not cap.isOpened():
        print(f"Error: Could not open video {video_path}")
        sys.exit(1)

    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS)
    orig_width  = int(cap.get(cv2.CAP_PROP_FRAME_WIDTH))
    orig_height = int(cap.get(cv2.CAP_PROP_FRAME_HEIGHT))
    print(f"Total frames: {frame_count} | FPS: {fps} | Resolution: {orig_width}x{orig_height}")

    count = 0
    while True:
        ret, frame = cap.read()
        if not ret:
            break
            
        # Resize maintaining aspect ratio — Lanczos4 = sharpest possible downscale
        height, width = frame.shape[:2]
        new_width = min(scale_width, width)  # Never upscale beyond source
        new_height = int((new_width / width) * height)
        
        resized_frame = cv2.resize(frame, (new_width, new_height), interpolation=cv2.INTER_LANCZOS4)

        # WebP quality 100 = near lossless
        frame_filename = os.path.join(output_dir, f"frame_{str(count).zfill(4)}.webp")
        cv2.imwrite(frame_filename, resized_frame, [cv2.IMWRITE_WEBP_QUALITY, 100])
        
        count += 1
        if count % 20 == 0:
            print(f"Extracted {count}/{frame_count} frames...")
            
        if max_frames and count >= max_frames:
            break

    cap.release()
    print(f"\nExtraction complete! Total frames saved: {count}")
    print(f"Output directory: {output_dir}")
    return count

if __name__ == "__main__":
    video_file = r"C:\Users\HP\Downloads\realestate_create_a_video_of.mp4"
    out_folder = os.path.join(os.path.dirname(os.path.abspath(__file__)), "assets", "frames")
    
    if not os.path.exists(video_file):
        print(f"CRITICAL ERROR: File not found at {video_file}")
    else:
        total = extract_frames(video_file, out_folder)
        print(f"\nFrameCount for app.js: {total}")
