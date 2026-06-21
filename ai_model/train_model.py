"""
AGOS - train_model.py
=====================
Two-phase MobileNetV2 transfer learning for waste classification.

Phase 1: Freeze base, train classification head (fast convergence)
Phase 2: Unfreeze top 30 layers of MobileNetV2, fine-tune at low LR

Run from ai_model/ directory:
  pip install tensorflow pillow numpy scikit-learn matplotlib seaborn
  python train_model.py

Output:
  saved_model/waste_classifier.keras
  saved_model/training_history.png
  saved_model/confusion_matrix.png

CATEGORIES order must match classifier.py exactly:
  ["biodegradable", "none", "recyclable", "residual", "special_waste"]
"""

import os
import numpy as np
import matplotlib
matplotlib.use("Agg")  # non-interactive backend — safe on headless servers
import matplotlib.pyplot as plt

# --- Paths -------------------------------------------------------------------
BASE_DIR    = os.path.dirname(os.path.abspath(__file__))
DATASET_DIR = os.path.join(BASE_DIR, "dataset")
TRAIN_DIR   = os.path.join(DATASET_DIR, "train")
VAL_DIR     = os.path.join(DATASET_DIR, "validation")
TEST_DIR    = os.path.join(DATASET_DIR, "test")
SAVE_DIR    = os.path.join(BASE_DIR, "saved_model")
os.makedirs(SAVE_DIR, exist_ok=True)

# --- Hyperparameters ---------------------------------------------------------
IMG_SIZE    = (224, 224)
BATCH_SIZE  = 32
EPOCHS_P1   = 10   # Phase 1: head only
EPOCHS_P2   = 20   # Phase 2: fine-tune top layers
LR_P1       = 1e-3
LR_P2       = 1e-5
UNFREEZE_N  = 30   # how many layers from the top of MobileNetV2 to unfreeze

# This list must match the alphabetical order TF uses when loading from folders
# AND must match CATEGORIES in classifier.py
CATEGORIES  = ["biodegradable", "none", "recyclable", "residual", "special_waste"]

# =============================================================================
# 1. Data loading
# =============================================================================
import tensorflow as tf

print("TensorFlow version:", tf.__version__)
print("Loading datasets...\n")

# Training augmentation (additional, on top of augment_dataset.py)
train_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
    rescale=1.0 / 255.0,
    rotation_range=20,
    width_shift_range=0.1,
    height_shift_range=0.1,
    horizontal_flip=True,
    zoom_range=0.1,
    brightness_range=[0.8, 1.2],
)

val_test_datagen = tf.keras.preprocessing.image.ImageDataGenerator(
    rescale=1.0 / 255.0,
)

train_gen = train_datagen.flow_from_directory(
    TRAIN_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    classes=CATEGORIES,  # explicit order — must match classifier.py
    shuffle=True,
    seed=42,
)

val_gen = val_test_datagen.flow_from_directory(
    VAL_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    classes=CATEGORIES,
    shuffle=False,
)

test_gen = val_test_datagen.flow_from_directory(
    TEST_DIR,
    target_size=IMG_SIZE,
    batch_size=BATCH_SIZE,
    class_mode="categorical",
    classes=CATEGORIES,
    shuffle=False,
)

print("Class indices (must match classifier.py CATEGORIES order):")
print(train_gen.class_indices)
print()

# =============================================================================
# 2. Class weights (handle imbalance)
# =============================================================================
from sklearn.utils.class_weight import compute_class_weight

labels = train_gen.classes
class_weights_array = compute_class_weight(
    class_weight="balanced",
    classes=np.unique(labels),
    y=labels,
)
class_weights = dict(enumerate(class_weights_array))
print("Class weights (for imbalanced categories):")
for idx, cat in enumerate(CATEGORIES):
    print(f"  {cat:15s}: {class_weights[idx]:.3f}")
print()

# =============================================================================
# 3. Build model
# =============================================================================

base_model = tf.keras.applications.MobileNetV2(
    input_shape=(*IMG_SIZE, 3),
    include_top=False,
    weights="imagenet",
)
base_model.trainable = False  # Phase 1: freeze everything

inputs  = tf.keras.Input(shape=(*IMG_SIZE, 3))
x       = base_model(inputs, training=False)
x       = tf.keras.layers.GlobalAveragePooling2D()(x)
x       = tf.keras.layers.Dense(256, activation="relu")(x)
x       = tf.keras.layers.Dropout(0.4)(x)
outputs = tf.keras.layers.Dense(len(CATEGORIES), activation="softmax")(x)

model = tf.keras.Model(inputs, outputs)
model.summary()

# =============================================================================
# 4. Phase 1 — Train head only
# =============================================================================
print("\n" + "="*60)
print("PHASE 1 — Training classification head (base frozen)")
print("="*60)

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LR_P1),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

callbacks_p1 = [
    tf.keras.callbacks.EarlyStopping(
        monitor="val_accuracy", patience=5, restore_best_weights=True, verbose=1
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.5, patience=3, verbose=1
    ),
]

history_p1 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_P1,
    class_weight=class_weights,
    callbacks=callbacks_p1,
)

# =============================================================================
# 5. Phase 2 — Fine-tune top layers
# =============================================================================
print("\n" + "="*60)
print(f"PHASE 2 — Fine-tuning top {UNFREEZE_N} layers of MobileNetV2")
print("="*60)

base_model.trainable = True
# Freeze everything except the last UNFREEZE_N layers
for layer in base_model.layers[:-UNFREEZE_N]:
    layer.trainable = False

print(f"Trainable layers: {sum(1 for l in model.layers if l.trainable)}")

model.compile(
    optimizer=tf.keras.optimizers.Adam(learning_rate=LR_P2),
    loss="categorical_crossentropy",
    metrics=["accuracy"],
)

callbacks_p2 = [
    tf.keras.callbacks.EarlyStopping(
        monitor="val_accuracy", patience=8, restore_best_weights=True, verbose=1
    ),
    tf.keras.callbacks.ReduceLROnPlateau(
        monitor="val_loss", factor=0.3, patience=4, verbose=1
    ),
    tf.keras.callbacks.ModelCheckpoint(
        filepath=os.path.join(SAVE_DIR, "best_checkpoint.keras"),
        monitor="val_accuracy",
        save_best_only=True,
        verbose=1,
    ),
]

history_p2 = model.fit(
    train_gen,
    validation_data=val_gen,
    epochs=EPOCHS_P2,
    class_weight=class_weights,
    callbacks=callbacks_p2,
)

# =============================================================================
# 6. Save model
# =============================================================================
save_path = os.path.join(SAVE_DIR, "waste_classifier.keras")
model.save(save_path)
print(f"\n✅ Model saved to: {save_path}")

# =============================================================================
# 7. Evaluation
# =============================================================================
from sklearn.metrics import classification_report, confusion_matrix
import seaborn as sns

print("\n" + "="*60)
print("EVALUATION — Test set")
print("="*60)

test_gen.reset()
y_pred_probs = model.predict(test_gen, verbose=1)
y_pred = np.argmax(y_pred_probs, axis=1)
y_true = test_gen.classes[:len(y_pred)]  # trim to match

print("\nClassification Report:")
print(classification_report(y_true, y_pred, target_names=CATEGORIES))

# Confusion matrix
cm = confusion_matrix(y_true, y_pred)
fig, ax = plt.subplots(figsize=(8, 6))
sns.heatmap(
    cm,
    annot=True,
    fmt="d",
    cmap="Blues",
    xticklabels=CATEGORIES,
    yticklabels=CATEGORIES,
    ax=ax,
)
ax.set_xlabel("Predicted")
ax.set_ylabel("Actual")
ax.set_title("AGOS Waste Classifier — Confusion Matrix")
plt.tight_layout()
cm_path = os.path.join(SAVE_DIR, "confusion_matrix.png")
plt.savefig(cm_path, dpi=150)
print(f"Confusion matrix saved: {cm_path}")

# Training history plot
all_acc     = history_p1.history["accuracy"]     + history_p2.history["accuracy"]
all_val_acc = history_p1.history["val_accuracy"] + history_p2.history["val_accuracy"]
all_loss    = history_p1.history["loss"]         + history_p2.history["loss"]
all_val_loss= history_p1.history["val_loss"]     + history_p2.history["val_loss"]

fig, (ax1, ax2) = plt.subplots(1, 2, figsize=(12, 4))
epochs_range = range(1, len(all_acc) + 1)
p1_end = len(history_p1.history["accuracy"])

ax1.plot(epochs_range, all_acc, label="Train")
ax1.plot(epochs_range, all_val_acc, label="Val")
ax1.axvline(p1_end, color="gray", linestyle="--", label="Phase 2 start")
ax1.set_title("Accuracy")
ax1.set_xlabel("Epoch")
ax1.legend()

ax2.plot(epochs_range, all_loss, label="Train")
ax2.plot(epochs_range, all_val_loss, label="Val")
ax2.axvline(p1_end, color="gray", linestyle="--", label="Phase 2 start")
ax2.set_title("Loss")
ax2.set_xlabel("Epoch")
ax2.legend()

plt.tight_layout()
hist_path = os.path.join(SAVE_DIR, "training_history.png")
plt.savefig(hist_path, dpi=150)
print(f"Training history saved: {hist_path}")

# =============================================================================
# 8. Quick smoke test of classifier.py output format
# =============================================================================
print("\n" + "="*60)
print("SMOKE TEST — verifying classifier.py output format")
print("="*60)

# Simulate what classifier.py does
dummy_probs = np.array([[0.12, 0.00, 0.78, 0.07, 0.03]])
result = {}
for i, cat in enumerate(CATEGORIES):
    result[cat] = round(float(dummy_probs[0][i]) * 100, 2)

dom_idx = int(np.argmax(dummy_probs[0]))
print({
    "percentages": result,
    "dominant_waste_type": CATEGORIES[dom_idx],
    "confidence": round(float(dummy_probs[0][dom_idx]) * 100, 2),
    "success": True,
})

print("\n✅ Training complete. Copy waste_classifier.keras to your Django project.")
print("   Path: ai_model/saved_model/waste_classifier.keras")
