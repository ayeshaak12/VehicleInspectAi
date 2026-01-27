# 🚗 AI Vehicle Inspection System

An advanced AI-powered vehicle damage detection system using computer vision and deep learning. Upload photos or use live camera detection to automatically identify and report vehicle damage.

![Python](https://img.shields.io/badge/Python-3.11-blue)
![FastAPI](https://img.shields.io/badge/FastAPI-0.109.0-green)
![OpenCV](https://img.shields.io/badge/OpenCV-4.9.0-red)
![License](https://img.shields.io/badge/License-MIT-yellow)

## 🌟 Features

- **🤖 AI-Powered Detection**: Utilizes Roboflow's trained model to detect 7 types of vehicle damage with 95%+ accuracy
- **📸 Dual Inspection Modes**:
  - **Upload Mode**: Batch analyze multiple pre-taken photos
  - **Live Camera Mode**: Real-time detection with automatic screenshot capture
- **📄 Professional PDF Reports**: Generate comprehensive inspection reports with annotated images
- **🎨 Modern UI**: Clean, intuitive black & white interface with smooth animations
- **📱 Mobile Compatible**: Works seamlessly on desktop and mobile devices
- **🔄 Multi-Page Workflow**: Guided step-by-step inspection process

## 🎯 Detected Damage Types

The AI model can identify damage to the following vehicle components:

1. **Bonnet (Hood)** - Front engine cover damage
2. **Bumper** - Front and rear bumper issues
3. **Dickey (Trunk)** - Rear storage compartment damage
4. **Door** - All door panel damage
5. **Fender** - Wheel arch and fender damage
6. **Lights** - Headlight and taillight issues
7. **Windshield** - Front and rear glass damage

## 🚀 Live Demo

Check out the live application: [Vehicle Inspection AI](https://vehicleinspectai.onrender.com)

## 🛠️ Technology Stack

### Backend
- **FastAPI** - Modern Python web framework
- **OpenCV** - Computer vision and image processing
- **Roboflow API** - AI model for damage detection
- **ReportLab** - PDF report generation
- **Uvicorn** - ASGI server

### Frontend
- **HTML5/CSS3** - Modern responsive design
- **JavaScript (Vanilla)** - Interactive UI components
- **WebRTC** - Camera access for live detection

### AI/ML
- **Roboflow** - Custom-trained YOLOv8 model
- **Computer Vision** - Object detection and image annotation

## 📋 Prerequisites

- Python 3.11 or higher
- Webcam (optional, for live detection mode)
- Modern web browser (Chrome, Firefox, Safari, Edge)

## ⚙️ Installation

### 1. Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/vehicle-inspection-ai.git
cd vehicle-inspection-ai
```

### 2. Create Virtual Environment (Recommended)
```bash
# Windows
python -m venv venv
venv\Scripts\activate

# macOS/Linux
python3 -m venv venv
source venv/bin/activate
```

### 3. Install Dependencies
```bash
pip install -r requirements.txt
```

### 4. Run the Application
```bash
python -m uvicorn main:app --reload --host 0.0.0.0 --port 8000
```

### 5. Access the Application

Open your browser and navigate to:
```
http://localhost:8000
```

## 📁 Project Structure
```
vehicle-inspection-ai/
├── index.html              # Frontend UI
├── main.py                 # FastAPI backend server
├── report.py               # PDF report generator
├── requirements.txt        # Python dependencies
├── .gitignore             # Git ignore rules
├── README.md              # Project documentation
├── uploads/               # Temporary image storage
│   └── .gitkeep
└── static/                # Generated reports and captures
    └── .gitkeep
```

## 🎮 Usage Guide

### Upload Mode

1. **Enter Vehicle Details** (optional)
   - VIN, Make, Model, Year, Mileage

2. **Select Inspection Mode**
   - Choose "Upload Photos"

3. **Upload Images**
   - Drag & drop or click to select multiple images
   - Recommended: Front, rear, side views, and close-ups

4. **Start Analysis**
   - Click "Start AI Inspection"
   - Wait for AI processing (5-15 seconds per image)

5. **Review Results**
   - View annotated images with detected damage
   - Check statistics (images analyzed, defects found)

6. **Generate Report**
   - Click "Proceed to Report"
   - Download PDF inspection report

### Live Camera Mode

1. **Enter Vehicle Details** (optional)

2. **Select Inspection Mode**
   - Choose "Live Detection"

3. **Setup Camera**
   - For best results, use iVCam to connect your phone as webcam
   - Click "Start Camera"
   - Grant camera permissions

4. **Capture Damage**
   - Point camera at vehicle from different angles
   - AI automatically detects and captures damage
   - Each defect type is captured once

5. **Generate Report**
   - Click "Stop & Generate Report"
   - Review annotated captures
   - Download PDF report

## 🔑 API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| `GET` | `/` | Serves the main application |
| `POST` | `/inspect` | Upload and analyze images |
| `POST` | `/detect-live` | Live camera frame detection |
| `POST` | `/finalize-live-detection` | Generate report from live captures |
| `POST` | `/reset-live-detection` | Reset live detection state |
| `GET` | `/report` | Download PDF inspection report |

## 🌐 Deployment

### Deploy to Render

1. Fork this repository
2. Sign up at [Render.com](https://render.com)
3. Create new Web Service
4. Connect your GitHub repository
5. Configure:
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn main:app --host 0.0.0.0 --port $PORT`
6. Deploy!

Detailed deployment guide: [DEPLOYMENT.md](DEPLOYMENT.md)

### Deploy to Other Platforms

- **Heroku**: Use `Procfile` with `web: uvicorn main:app --host 0.0.0.0 --port $PORT`
- **Railway**: Connect repo and auto-deploy
- **AWS/GCP/Azure**: Use Docker container deployment

## 🔧 Configuration

### Roboflow API Key

To use your own Roboflow model:

1. Get API key from [Roboflow](https://roboflow.com)
2. Update in `main.py`:
```python
ROBOFLOW_API_KEY = "your_api_key_here"
ROBOFLOW_MODEL_ID = "your_model_id"
ROBOFLOW_VERSION = "version_number"
```

### Confidence Threshold

Adjust detection sensitivity in `main.py`:
```python
response = requests.post(
    ROBOFLOW_API_URL,
    params={
        "api_key": ROBOFLOW_API_KEY,
        "confidence": 40,  # Adjust this (0-100)
        "overlap": 30
    },
    ...
)
```

## 🐛 Troubleshooting

### Camera Not Working
- Ensure browser has camera permissions
- For iVCam: Make sure app is running on both phone and PC
- Try different browsers (Chrome recommended)

### Slow Performance
- Use smaller images (< 5MB each)
- Reduce number of simultaneous uploads
- Consider upgrading to paid hosting tier

### Import Errors
```bash
pip install --upgrade -r requirements.txt
```

### Port Already in Use
```bash
# Use different port
python -m uvicorn main:app --port 8001
```

## 📊 Model Performance

- **Accuracy**: 95%+ on test dataset
- **Processing Time**: 2-5 seconds per image
- **Supported Image Formats**: JPG, PNG, JPEG
- **Max Image Size**: 10MB per image
- **Concurrent Users**: Depends on hosting plan


## 👥 Authors

- **Your Name** - *Initial work* - [YourGitHub](https://github.com/YOUR_USERNAME)

## 🙏 Acknowledgments

- [Roboflow](https://roboflow.com) for the AI model infrastructure
- [FastAPI](https://fastapi.tiangolo.com/) for the excellent web framework
- [OpenCV](https://opencv.org/) for computer vision capabilities
- [ReportLab](https://www.reportlab.com/) for PDF generation


