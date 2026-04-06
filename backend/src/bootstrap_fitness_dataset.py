import argparse
import random
import shutil
from collections import defaultdict
from pathlib import Path

from PIL import Image
from ultralytics import YOLO


def parse_args() -> argparse.Namespace:
    root_dir = Path(__file__).resolve().parents[2]
    default_detector = root_dir / "models" / "trained" / "cow_yolos_best.pt"
    legacy_detector = root_dir / "models" / "cow_yolos_best.pt"
    if not default_detector.exists() and legacy_detector.exists():
        default_detector = legacy_detector

    parser = argparse.ArgumentParser(description="Bootstrap good/average/bad fitness dataset from existing cow images.")
    parser.add_argument("--source", default="runs", help="Source directory with candidate images")
    parser.add_argument("--output", default="data_fitness", help="Output classification dataset root")
    parser.add_argument("--detector", default=str(default_detector), help="YOLO detector model path")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    return parser.parse_args()


def list_candidate_images(source_root: Path) -> list[Path]:
    include_tokens = ("val_batch", "train_batch", "predict")
    images = []
    for path in source_root.rglob("*.jpg"):
        name = path.name.lower()
        if any(token in name for token in include_tokens):
            images.append(path)
    return sorted(set(images))


def pick_label(area_ratio: float, confidence: float) -> str:
    if confidence >= 0.6 and area_ratio >= 0.12:
        return "good"
    if confidence >= 0.35 and area_ratio >= 0.05:
        return "average"
    return "bad"


def ensure_layout(output_root: Path) -> None:
    for split in ("train", "val", "test"):
        for label in ("good", "average", "bad"):
            class_dir = output_root / split / label
            class_dir.mkdir(parents=True, exist_ok=True)
            for file_path in class_dir.glob("*"):
                if file_path.is_file():
                    file_path.unlink()


def assign_splits_for_label(paths: list[Path]) -> list[tuple[Path, str]]:
    if not paths:
        return []

    total = len(paths)
    if total == 1:
        only = paths[0]
        return [(only, "train"), (only, "val"), (only, "test")]
    if total == 2:
        return [(paths[0], "train"), (paths[1], "val"), (paths[1], "test")]

    train_count = max(1, int(total * 0.8))
    val_count = max(1, int(total * 0.1))
    test_count = total - train_count - val_count
    if test_count <= 0:
        test_count = 1
        train_count = max(1, train_count - 1)

    assigned = []
    for index, item in enumerate(paths):
        if index < train_count:
            assigned.append((item, "train"))
        elif index < train_count + val_count:
            assigned.append((item, "val"))
        else:
            assigned.append((item, "test"))
    return assigned


def main() -> None:
    args = parse_args()
    random.seed(args.seed)

    source_root = Path(args.source)
    output_root = Path(args.output)
    ensure_layout(output_root)

    detector = YOLO(args.detector)
    candidates = list_candidate_images(source_root)
    random.shuffle(candidates)

    kept = []
    for image_path in candidates:
        try:
            image = Image.open(image_path).convert("RGB")
        except Exception:
            continue

        width, height = image.size
        image_area = max(1, width * height)
        results = detector(image, imgsz=640, verbose=False)
        if not results:
            continue

        boxes = results[0].boxes
        if boxes is None or boxes.xyxy is None or len(boxes.xyxy) == 0:
            continue

        xyxy = boxes.xyxy.cpu().tolist()
        conf = boxes.conf.cpu().tolist() if boxes.conf is not None else [0.0] * len(xyxy)

        largest_area = 0.0
        max_conf = 0.0
        for i, coords in enumerate(xyxy):
            box_area = max(0.0, (coords[2] - coords[0]) * (coords[3] - coords[1]))
            largest_area = max(largest_area, box_area)
            max_conf = max(max_conf, float(conf[i]) if i < len(conf) else 0.0)

        area_ratio = largest_area / image_area
        label = pick_label(area_ratio, max_conf)
        kept.append((image_path, label))

    total = len(kept)
    if total == 0:
        print("No usable images found to bootstrap dataset.")
        return

    by_label: dict[str, list[Path]] = defaultdict(list)
    for image_path, label in kept:
        by_label[label].append(image_path)

    counts = {"good": 0, "average": 0, "bad": 0}
    file_index = 0
    for label in ("good", "average", "bad"):
        label_paths = by_label.get(label, [])
        random.shuffle(label_paths)
        for src_path, split in assign_splits_for_label(label_paths):
            destination = output_root / split / label / f"{src_path.stem}_{file_index}.jpg"
            shutil.copy2(src_path, destination)
            counts[label] += 1
            file_index += 1

    print(f"Bootstrapped {total} images into {output_root}")
    print(f"Label counts: {counts}")


if __name__ == "__main__":
    main()
