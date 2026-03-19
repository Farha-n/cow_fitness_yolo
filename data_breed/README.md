# Breed Classifier Dataset

Create this folder structure before training. Replace <breed_name> with actual breeds:

```text
data_breed/
  train/
    <breed_name>/
  val/
    <breed_name>/
  test/
    <breed_name>/
```

Example breeds:

- holstein
- jersey
- sahiwal
- gir
- red_sindhi

## Train breed classifier

```bash
F:/Cow/cow_fitness_yolo/.venv/Scripts/python.exe src/train_breed_classifier.py --data data_breed --epochs 50 --imgsz 224 --batch 16
```

Copy trained best weights to:

```text
models/cow_breed_cls.pt
```

Restart backend.
