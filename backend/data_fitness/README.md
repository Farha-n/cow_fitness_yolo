# Cow Fitness Classification Dataset (good / average / bad)

Create this folder structure before training:

```text
data_fitness/
  train/
    good/
    average/
    bad/
  val/
    good/
    average/
    bad/
  test/
    good/
    average/
    bad/
```

## Labeling guidance

- `good`: healthy body condition, clear posture, no obvious weakness.
- `average`: moderate condition, uncertain signs.
- `bad`: weak/thin/clearly poor condition.

Keep labels consistent and reviewed by domain experts where possible.

## Train classifier

From repo root:

```bash
F:/Cow/cow_fitness_yolo/.venv/Scripts/python.exe backend/src/train_fitness_classifier.py --data backend/data_fitness --epochs 50 --imgsz 224 --batch 16
```

Best weights are saved under `runs/fitness_cls/.../weights/best.pt`.

Copy trained model to:

```text
models/trained/cow_fitness_cls.pt
```

Then restart API server. The `/predict` endpoint will automatically switch from heuristic to classifier mode.

## Quick inference test

```bash
F:/Cow/cow_fitness_yolo/.venv/Scripts/python.exe backend/src/infer_fitness_classifier.py "path/to/image.jpg" --model models/trained/cow_fitness_cls.pt
```
