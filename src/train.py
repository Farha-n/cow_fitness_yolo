import os
from ultralytics import YOLO

def main():
    DATA_CONFIG = "data/data.yaml"
    MODEL_NAME = "yolov8s.pt"

    print("=== Starting Training ===")
    print("Using data:", DATA_CONFIG)

    model = YOLO(MODEL_NAME)

    model.train(
        data=DATA_CONFIG,
        epochs=40,
        imgsz=640,
        batch=16,
        workers=2,
        device=0,
        optimizer="AdamW",
        project="runs/train",
        name="cow_yolos",
        exist_ok=True,
        verbose=True
    )

    print("\n=== Training Complete ===")
    print("Best weights saved to runs/train/cow_yolos/weights/best.pt")

if __name__ == "__main__":
    main()
