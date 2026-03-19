# Mobile App Setup (Fastest Path)

## 1) Start backend API from this repo

```bash
F:/Cow/cow_fitness_yolo/.venv/Scripts/python.exe -m uvicorn src.api:app --host 0.0.0.0 --port 8000 --reload
```

Health check:

```bash
curl http://localhost:8000/health
```

Prediction test:

```bash
curl -X POST "http://localhost:8000/predict" -F "file=@path/to/image.jpg"
```

Batch prediction test:

```bash
curl -X POST "http://localhost:8000/predict-batch" -F "files=@path/to/image1.jpg" -F "files=@path/to/image2.jpg"
```

## 2) Create React Native app (Expo)

```bash
npx create-expo-app cowFitnessApp
cd cowFitnessApp
npm install axios expo-image-picker
npm start
```

## 3) Connect app to backend

- Pick image from gallery/camera.
- Send multipart form-data with key `file` to `http://<YOUR_PC_IP>:8000/predict`.
- Draw returned bounding boxes from `detections[].bbox`.

Response shape:

```json
{
  "detections": [
    {
      "class_id": 0,
      "class_name": "cow",
      "confidence": 0.93,
      "bbox": {"x1": 10.2, "y1": 30.5, "x2": 200.1, "y2": 300.7}
    }
  ]
}
```

Additional output fields now included:

- `species`: `cow` / `buffalo` / `other` / `unknown`
- `breed`: predicted breed label when species is `cow` and breed model exists
- `assessment.source`: `classifier` or `heuristic`

Optional classifier weight files (auto-loaded if present):

- `models/cow_fitness_cls.pt` for good/average/bad
- `models/cattle_species_cls.pt` for cow vs buffalo vs other
- `models/cow_breed_cls.pt` for cow breed classification

## 4) About TFLite export on your current machine

Your TFLite export fails in Python 3.13 due TensorFlow/`tf_keras` compatibility in the Ultralytics conversion chain.

If you still want on-device inference now, create a Python 3.11 virtual environment and run export there:

```bash
py -3.11 -m venv .venv311
.venv311\Scripts\activate
pip install ultralytics onnx tensorflow onnx2tf==1.28.8 onnxslim==0.1.85 sng4onnx==2.0.0 onnx_graphsurgeon==0.5.8 ai-edge-litert==2.1.2 tf_keras==2.15.0
yolo export model=models/cow_yolos_best.pt format=tflite
```
