from ultralytics import YOLO
import sys
from pathlib import Path

def main():
    root_dir = Path(__file__).resolve().parents[2]
    model_path = root_dir / "models" / "trained" / "cow_yolos_best.pt"
    if not model_path.exists():
        model_path = root_dir / "models" / "cow_yolos_best.pt"

    if len(sys.argv) != 2:
        print("Usage: python backend/src/infer.py <image_path>")
        return

    img_path = sys.argv[1]
    model = YOLO(str(model_path))
    results = model(img_path, save=True, imgsz=640)

    print("Results saved to:", results[0].save_dir)

if __name__ == "__main__":
    main()
