from ultralytics import YOLO
import sys

def main():
    MODEL_PATH = "models/cow_yolos_best.pt"

    if len(sys.argv) != 2:
        print("Usage: python src/infer.py <image_path>")
        return

    img_path = sys.argv[1]
    model = YOLO(MODEL_PATH)
    results = model(img_path, save=True, imgsz=640)

    print("Results saved to:", results[0].save_dir)

if __name__ == "__main__":
    main()
