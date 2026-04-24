import os
from io import BytesIO
from functools import lru_cache
from pathlib import Path

from fastapi import FastAPI, File, HTTPException, UploadFile
from PIL import Image
from ultralytics import YOLO


ROOT_DIR = Path(__file__).resolve().parents[2]
MODELS_DIR = ROOT_DIR / "models"
IS_RENDER = bool(os.getenv("RENDER") or os.getenv("RENDER_EXTERNAL_URL"))
USE_LIGHTWEIGHT_DETECTOR = os.getenv(
    "USE_LIGHTWEIGHT_DETECTOR",
    "true" if IS_RENDER else "false",
).strip().lower() in {"1", "true", "yes"}


def resolve_model_path(env_var: str, *fallbacks: Path) -> Path:
    env_value = os.getenv(env_var)
    if env_value:
        candidate = Path(env_value)
        if not candidate.is_absolute():
            candidate = ROOT_DIR / candidate
        return candidate

    for item in fallbacks:
        if item.exists():
            return item
    return fallbacks[0]


if USE_LIGHTWEIGHT_DETECTOR:
    detector_fallbacks = (
        MODELS_DIR / "yolo11n.pt",
        MODELS_DIR / "trained" / "cow_yolos_best.pt",
        MODELS_DIR / "cow_yolos_best.pt",
    )
else:
    detector_fallbacks = (
        MODELS_DIR / "trained" / "cow_yolos_best.pt",
        MODELS_DIR / "cow_yolos_best.pt",
        MODELS_DIR / "yolo11n.pt",
    )

MODEL_PATH = resolve_model_path("DETECTOR_MODEL_PATH", *detector_fallbacks)
FITNESS_MODEL_PATH = resolve_model_path(
    "FITNESS_MODEL_PATH",
    MODELS_DIR / "trained" / "cow_fitness_cls.pt",
    MODELS_DIR / "cow_fitness_cls.pt",
)
SPECIES_MODEL_PATH = resolve_model_path(
    "SPECIES_MODEL_PATH",
    MODELS_DIR / "trained" / "cattle_species_cls.pt",
    MODELS_DIR / "cattle_species_cls.pt",
)
DETECTOR_CONFIDENCE_THRESHOLD = float(os.getenv("DETECTOR_CONFIDENCE_THRESHOLD", "0.55"))
DETECTOR_IMAGE_SIZE = int(os.getenv("DETECTOR_IMAGE_SIZE", "256" if IS_RENDER else "640"))
ENABLE_FITNESS_MODEL = os.getenv("ENABLE_FITNESS_MODEL", "false").strip().lower() in {"1", "true", "yes"}
ENABLE_SPECIES_MODEL = os.getenv("ENABLE_SPECIES_MODEL", "false").strip().lower() in {"1", "true", "yes"}
app = FastAPI(title="Animal Type and Fitness API")

if not MODEL_PATH.exists():
    raise RuntimeError(f"Detector model not found at: {MODEL_PATH}")


@lru_cache(maxsize=1)
def get_detector_model() -> YOLO:
    return YOLO(str(MODEL_PATH))


fitness_model_path = FITNESS_MODEL_PATH


@lru_cache(maxsize=1)
def get_fitness_model() -> YOLO | None:
    if not ENABLE_FITNESS_MODEL or not fitness_model_path.exists():
        return None
    return YOLO(str(fitness_model_path))


species_model_path = SPECIES_MODEL_PATH


@lru_cache(maxsize=1)
def get_species_model() -> YOLO | None:
    if not ENABLE_SPECIES_MODEL or not species_model_path.exists():
        return None
    return YOLO(str(species_model_path))

def build_assessment(detections: list, image_width: int, image_height: int) -> dict:
    if not detections:
        return {
            "status": "bad",
            "score": 20,
            "summary": "No cattle or buffalo detected clearly in the image.",
            "note": "Image-based estimate only; this is not a veterinary diagnosis.",
        }

    image_area = max(1, image_width * image_height)
    max_confidence = max(float(item.get("confidence", 0.0)) for item in detections)
    largest_area = 0.0

    for item in detections:
        bbox = item.get("bbox") or {}
        width = max(0.0, float(bbox.get("x2", 0.0)) - float(bbox.get("x1", 0.0)))
        height = max(0.0, float(bbox.get("y2", 0.0)) - float(bbox.get("y1", 0.0)))
        largest_area = max(largest_area, width * height)

    area_ratio = largest_area / image_area
    confidence_points = int(max_confidence * 60)

    if 0.08 <= area_ratio <= 0.65:
        visibility_points = 30
    elif 0.04 <= area_ratio < 0.08 or 0.65 < area_ratio <= 0.8:
        visibility_points = 20
    elif 0.02 <= area_ratio < 0.04 or 0.8 < area_ratio <= 0.9:
        visibility_points = 10
    else:
        visibility_points = 5

    if len(detections) == 1:
        count_points = 10
    elif len(detections) <= 3:
        count_points = 5
    else:
        count_points = 0

    score = max(0, min(100, confidence_points + visibility_points + count_points))

    if score >= 75:
        status = "good"
        summary = "Animal visibility and detection confidence are strong."
    elif score >= 45:
        status = "average"
        summary = "Detection quality is moderate; use a clearer side-view image."
    else:
        status = "bad"
        summary = "Detection quality is weak; result is not reliable."

    return {
        "status": status,
        "score": score,
        "summary": summary,
        "note": "Image-based estimate only; this is not a veterinary diagnosis.",
    }


def build_classifier_assessment(image: Image.Image) -> dict | None:
    fitness_model = get_fitness_model()
    if fitness_model is None:
        return None

    result = fitness_model(image, verbose=False)
    if not result:
        return None

    probs = result[0].probs
    if probs is None:
        return None

    top_index = int(probs.top1)
    top_confidence = float(probs.top1conf)
    names = result[0].names or {}
    raw_label = names.get(top_index, str(top_index)).strip().lower()

    label_aliases = {
        "good": "good",
        "fit": "good",
        "healthy": "good",
        "average": "average",
        "medium": "average",
        "normal": "average",
        "bad": "bad",
        "unfit": "bad",
        "weak": "bad",
    }
    status = label_aliases.get(raw_label, raw_label)

    score_by_status = {
        "good": 80,
        "average": 55,
        "bad": 30,
    }
    base_score = score_by_status.get(status, 50)
    confidence_bonus = int(top_confidence * 20)
    score = max(0, min(100, base_score + confidence_bonus))

    summary_by_status = {
        "good": "Classifier indicates good fitness condition.",
        "average": "Classifier indicates average fitness condition.",
        "bad": "Classifier indicates poor fitness condition.",
    }

    return {
        "status": status,
        "score": score,
        "summary": summary_by_status.get(status, f"Classifier predicted '{status}'."),
        "note": "Model-based estimate only; veterinary validation is recommended.",
        "source": "classifier",
        "confidence": top_confidence,
    }


def classify_top_label(model_obj: YOLO | None, image: Image.Image, label_aliases: dict | None = None) -> dict | None:
    if model_obj is None:
        return None

    result = model_obj(image, verbose=False)
    if not result or result[0].probs is None:
        return None

    probs = result[0].probs
    top_index = int(probs.top1)
    top_confidence = float(probs.top1conf)
    names = result[0].names or {}
    raw_label = names.get(top_index, str(top_index)).strip().lower()
    mapped_label = raw_label
    if label_aliases:
        mapped_label = label_aliases.get(raw_label, raw_label)

    return {
        "label": mapped_label,
        "raw_label": raw_label,
        "confidence": top_confidence,
    }


def build_species_result(image: Image.Image, detections: list[dict]) -> dict:
    aliases = {
        "cow": "cow",
        "cattle": "cow",
        "animal": "cow",
        "buffalo": "buffalo",
        "buff": "buffalo",
        "other": "other",
        "unknown": "other",
    }
    species_model = get_species_model()
    classified = classify_top_label(species_model, image, aliases)
    if classified is None:
        for detection in detections:
            raw_label = str(detection.get("class_name") or "").strip().lower()
            mapped_label = aliases.get(raw_label)
            if mapped_label in {"cow", "buffalo"}:
                return {
                    "label": mapped_label,
                    "confidence": float(detection.get("confidence", 0.0)),
                    "source": "detector_fallback",
                }

        return {
            "label": "unknown",
            "confidence": 0.0,
            "source": "unavailable",
        }

    return {
        "label": classified["label"],
        "confidence": classified["confidence"],
        "source": "classifier",
    }


def force_unknown_species(result: dict | None) -> dict:
    label = str((result or {}).get("label", "unknown")).lower()
    if label != "cow":
        return {
            "label": "unknown",
            "confidence": 0.0,
            "source": "species_filter",
        }
    return result or {
        "label": "unknown",
        "confidence": 0.0,
        "source": "species_filter",
    }


def build_non_cow_assessment() -> dict:
    return {
        "status": "unknown",
        "score": 0,
        "summary": "Fitness model skipped because detected species is not cow.",
        "note": "Cow-only fitness inference is enabled.",
        "source": "species_filter",
    }


def process_image(image: Image.Image) -> dict:
    image_width, image_height = image.size

    detector_model = get_detector_model()
    species_model = get_species_model()
    results = detector_model(image, imgsz=DETECTOR_IMAGE_SIZE, conf=DETECTOR_CONFIDENCE_THRESHOLD)
    if not results:
        detections = []
        animal_type = force_unknown_species(build_species_result(image, detections))
        if animal_type.get("label") != "cow":
            return {
                "detections": detections,
                "assessment": build_non_cow_assessment(),
                "animal_type": animal_type,
                "species": animal_type,
            }
        classifier_assessment = build_classifier_assessment(image)
        if classifier_assessment is None:
            classifier_assessment = build_assessment([], image_width, image_height)
            classifier_assessment["source"] = "heuristic"
        return {
            "detections": detections,
            "assessment": classifier_assessment,
            "animal_type": animal_type,
            "species": animal_type,
        }

    boxes = results[0].boxes
    names = results[0].names
    detections = []

    if boxes is not None and boxes.xyxy is not None:
        xyxy = boxes.xyxy.cpu().tolist()
        conf = boxes.conf.cpu().tolist() if boxes.conf is not None else []
        cls_ids = boxes.cls.cpu().tolist() if boxes.cls is not None else []

        for index, coords in enumerate(xyxy):
            class_id = int(cls_ids[index]) if index < len(cls_ids) else -1
            confidence = float(conf[index]) if index < len(conf) else 0.0
            class_name = names.get(class_id, str(class_id))
            detections.append(
                {
                    "class_id": class_id,
                    "class_name": class_name,
                    "confidence": confidence,
                    "bbox": {
                        "x1": float(coords[0]),
                        "y1": float(coords[1]),
                        "x2": float(coords[2]),
                        "y2": float(coords[3]),
                    },
                }
            )

    animal_type = force_unknown_species(build_species_result(image, detections))
    if animal_type.get("label") != "cow":
        return {
            "detections": detections,
            "assessment": build_non_cow_assessment(),
            "animal_type": animal_type,
            "species": animal_type,
        }

    classifier_assessment = build_classifier_assessment(image)
    if classifier_assessment is None:
        classifier_assessment = build_assessment(detections, image_width, image_height)
        classifier_assessment["source"] = "heuristic"

    return {
        "detections": detections,
        "assessment": classifier_assessment,
        "animal_type": animal_type,
        "species": animal_type,
    }


async def read_upload_image(file: UploadFile) -> Image.Image:
    if not file.content_type or not file.content_type.startswith("image/"):
        raise HTTPException(status_code=400, detail="Upload an image file")

    content = await file.read()
    if not content:
        raise HTTPException(status_code=400, detail="Empty file")

    try:
        return Image.open(BytesIO(content)).convert("RGB")
    except Exception as exc:
        raise HTTPException(status_code=400, detail="Invalid image") from exc


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


@app.get("/")
def home() -> dict:
    return {
        "status": "ok",
        "message": "Animal Type and Fitness API is running",
        "docs": "/docs",
    }


@app.post("/warmup")
def warmup() -> dict:
    detector_model = get_detector_model()
    return {
        "status": "ok",
        "detector_model": str(MODEL_PATH),
        "detector_ready": detector_model is not None,
    }


@app.get("/model-status")
def model_status() -> dict:
    fitness_model_instance = get_fitness_model()
    species_model_instance = get_species_model()
    return {
        "detector_model": str(MODEL_PATH),
        "detector_model_loaded": get_detector_model.cache_info().currsize > 0,
        "fitness_model_path": str(fitness_model_path),
        "fitness_model_exists": fitness_model_path.exists(),
        "fitness_model_enabled": ENABLE_FITNESS_MODEL,
        "fitness_model_loaded": fitness_model_instance is not None,
        "animal_type_model_path": str(species_model_path),
        "animal_type_model_exists": species_model_path.exists(),
        "animal_type_model_enabled": ENABLE_SPECIES_MODEL,
        "animal_type_model_loaded": species_model_instance is not None,
        "detector_image_size": DETECTOR_IMAGE_SIZE,
        "lightweight_detector_mode": USE_LIGHTWEIGHT_DETECTOR,
    }


@app.post("/predict")
async def predict(file: UploadFile = File(...)) -> dict:
    image = await read_upload_image(file)
    return process_image(image)


@app.post("/predict-batch")
async def predict_batch(files: list[UploadFile] = File(...)) -> dict:
    if not files:
        raise HTTPException(status_code=400, detail="Upload at least one image file")

    outputs = []
    for file in files:
        image = await read_upload_image(file)
        result = process_image(image)
        outputs.append({
            "file_name": file.filename,
            **result,
        })

    return {
        "count": len(outputs),
        "results": outputs,
    }