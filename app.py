# analyze.py
import sys
import json
import cv2
import mediapipe as mp
import numpy as np
import base64
from io import BytesIO
from PIL import Image

def decode_image(base64_string):
    try:
        image_data = base64.b64decode(base64_string.split(",")[1])
        image = Image.open(BytesIO(image_data))
        return cv2.cvtColor(np.array(image), cv2.COLOR_RGB2BGR), None
    except Exception as e:
        return None, str(e)

def angle(a, b, c):
    a, b, c = np.array([a.x, a.y]), np.array([b.x, b.y]), np.array([c.x, c.y])
    ba = a - b
    bc = c - b
    cosine = np.dot(ba, bc) / (np.linalg.norm(ba) * np.linalg.norm(bc))
    return np.degrees(np.arccos(np.clip(cosine, -1.0, 1.0)))

def analyze_pose(image, posture_type):
    mp_pose = mp.solutions.pose  # type: ignore
    with mp_pose.Pose(static_image_mode=True) as pose:
        results = pose.process(cv2.cvtColor(image, cv2.COLOR_BGR2RGB))

        if not results.pose_landmarks:
            return {"status": "No pose detected"}

        lm = results.pose_landmarks.landmark

        if posture_type == "squat":
            shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER]
            hip = lm[mp_pose.PoseLandmark.LEFT_HIP]
            knee = lm[mp_pose.PoseLandmark.LEFT_KNEE]
            toe = lm[mp_pose.PoseLandmark.LEFT_FOOT_INDEX]

            back_angle = angle(shoulder, hip, knee)
            is_back_straight = 60 <= back_angle <= 110
            knee_over_toe = knee.x > toe.x
            is_bad = knee_over_toe or not is_back_straight

            return {
                "posture": "squat",
                "back_angle": round(back_angle, 2),
                "is_back_straight": bool(is_back_straight),
                "knee_ahead_of_toe": bool(knee_over_toe),
                "is_bad_posture": bool(is_bad)
            }

        elif posture_type == "desk":
            nose = lm[mp_pose.PoseLandmark.NOSE]
            shoulder = lm[mp_pose.PoseLandmark.LEFT_SHOULDER]
            hip = lm[mp_pose.PoseLandmark.LEFT_HIP]
            knee = lm[mp_pose.PoseLandmark.LEFT_KNEE]

            neck_angle = angle(nose, shoulder, hip)
            back_angle = angle(shoulder, hip, knee)

            is_neck_bent = neck_angle < 160
            is_back_straight = back_angle >= 150
            is_bad = is_neck_bent or not is_back_straight

            return {
                "posture": "desk",
                "neck_bend_angle": round(neck_angle, 2),
                "back_angle": round(back_angle, 2),
                "is_neck_bent": bool(is_neck_bent),
                "is_back_straight": bool(is_back_straight),
                "is_bad_posture": bool(is_bad)
            }

        return {"status": "Invalid posture type"}

# Main entry
if __name__ == "__main__":
    try:
        input_data = sys.stdin.read()
        data = json.loads(input_data)

        base64_img = data.get("image")
        posture_type = data.get("postureType")

        image, err = decode_image(base64_img)
        if image is None:
            raise ValueError(f"Image decode failed: {err}")

        result = analyze_pose(image, posture_type)
        print(json.dumps(result))

    except Exception as e:
        print(json.dumps({"error": str(e)}))
