# Species Classifier Dataset (cow / buffalo / other)

Create this folder structure before training:

```text
data_species/
  train/
    cow/
    buffalo/
    other/
  val/
    cow/
    buffalo/
    other/
  test/
    cow/
    buffalo/
    other/
```

## Train species classifier

```bash
F:/Cow/cow_fitness_yolo/.venv/Scripts/python.exe src/train_species_classifier.py --data data_species --epochs 50 --imgsz 224 --batch 16
```

Copy trained best weights to:

```text
models/cattle_species_cls.pt
```

Restart backend.
