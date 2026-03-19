import argparse
import json

from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(description="Infer cow fitness class from image.")
    parser.add_argument("image", help="Path to input image")
    parser.add_argument("--model", default="models/cow_fitness_cls.pt", help="Trained classifier model path")
    return parser.parse_args()


def main() -> None:
    args = parse_args()
    model = YOLO(args.model)
    results = model(args.image, verbose=False)

    if not results or results[0].probs is None:
        print(json.dumps({"status": "unknown", "confidence": 0.0}))
        return

    probs = results[0].probs
    top_index = int(probs.top1)
    top_confidence = float(probs.top1conf)
    label = results[0].names.get(top_index, str(top_index)).lower()

    print(
        json.dumps(
            {
                "status": label,
                "confidence": round(top_confidence, 4),
            },
            indent=2,
        )
    )


if __name__ == "__main__":
    main()
