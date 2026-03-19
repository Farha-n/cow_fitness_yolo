import argparse

from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Train cow breed classifier.")
    parser.add_argument("--data", default="data_breed", help="Breed dataset root path")
    parser.add_argument("--model", default="yolo11n-cls.pt", help="Base classification model")
    parser.add_argument("--imgsz", type=int, default=224, help="Image size")
    parser.add_argument("--epochs", type=int, default=50, help="Training epochs")
    parser.add_argument("--batch", type=int, default=16, help="Batch size")
    parser.add_argument("--project", default="runs/breed_cls", help="Project output directory")
    parser.add_argument("--name", default="exp", help="Run name")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    model = YOLO(args.model)
    model.train(
        data=args.data,
        imgsz=args.imgsz,
        epochs=args.epochs,
        batch=args.batch,
        project=args.project,
        name=args.name,
    )


if __name__ == "__main__":
    main()
