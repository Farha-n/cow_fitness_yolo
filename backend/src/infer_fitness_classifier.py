import argparse
import json
from pathlib import Path

from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    root_dir = Path(__file__).resolve().parents[2]
    default_model = root_dir / "models" / "trained" / "cow_fitness_cls.pt"
    legacy_model = root_dir / "models" / "cow_fitness_cls.pt"
    if not default_model.exists() and legacy_model.exists():
        default_model = legacy_model

    parser = argparse.ArgumentParser(description="Infer cow fitness class from image.")
    parser.add_argument("image", help="Path to input image")
    parser.add_argument("--model", default=str(default_model), help="Trained classifier model path")
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
