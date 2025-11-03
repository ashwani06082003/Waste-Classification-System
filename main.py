import tensorflow as tf
from tensorflow.keras.models import load_model
import numpy as np
import cv2
import os

# Paths (Updated for your project structure)
MODEL_PATH = "models/keras_model.h5"
LABELS_PATH = "models/labels.txt"
IMAGE_FOLDER = "images/"

def load_labels(labels_path):
    """Load class labels from labels.txt."""
    try:
        with open(labels_path, "r") as f:
            return [line.strip() for line in f.readlines()]
    except FileNotFoundError:
        print("Error: Labels file not found.")
        return []

def get_latest_image(folder_path):
    """Retrieve the latest image from the folder."""
    try:
        files = [os.path.join(folder_path, f) for f in os.listdir(folder_path) if f.lower().endswith(('png', 'jpg', 'jpeg'))]
        return max(files, key=os.path.getctime) if files else None
    except FileNotFoundError:
        print("Error: Image folder not found.")
        return None

def classify_image(model, image_path, class_labels):
    """Classify an image using the trained model."""
    img = cv2.imread(image_path)
    if img is None:
        print("Error: Could not read image.")
        return None, None
    
    img = cv2.cvtColor(cv2.resize(img, (224, 224)), cv2.COLOR_BGR2RGB)  # Resize & convert BGR to RGB
    img = np.expand_dims(img.astype(np.float32) / 255.0, axis=0)  # Normalize and reshape
    
    predictions = model.predict(img)
    class_index = np.argmax(predictions)  # Get highest probability class
    confidence = predictions[0][class_index]  # Confidence score

    if class_index < len(class_labels):
        predicted_class = class_labels[class_index]
        print(f"Predicted Class: {predicted_class}, Confidence: {confidence:.2f}")
        return predicted_class, confidence
    else:
        print("Error: Predicted class index out of bounds.")
        return None, None

# Load Model & Labels
try:
    model = load_model(MODEL_PATH)
    class_labels = load_labels(LABELS_PATH)
    if not class_labels:
        raise ValueError("No class labels found.")
except Exception as e:
    print(f"Error loading model or labels: {e}")
    exit()

# Get and classify the latest image
# Final Classification Output
latest_image = get_latest_image(IMAGE_FOLDER)
if latest_image:
    predicted_class, confidence = classify_image(model, latest_image, class_labels)
    if predicted_class:
        print(f"{predicted_class} ({confidence:.2f})")  # Clean output for the server
    else:
        print("Error: Classification Failed")
else:
    print("No image found.")
