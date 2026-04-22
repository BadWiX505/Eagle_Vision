import cv2
import threading
import time


class StreamAdapter:
    def __init__(self, frame_source, fps=30, width=None, height=None):
        """
        frame_source: callable that returns a numpy frame on each call.
        fps: target frames per second for the output stream.
        width, height: optional resize dimensions.
        """
        self.frame_source = frame_source
        self.fps = fps
        self.width = width
        self.height = height
        self.running = False
        self.frame = None
        self.lock = threading.Lock()

    def start(self):
        if not self.running:
            self.running = True
            self.thread = threading.Thread(target=self._update, daemon=True)
            self.thread.start()

    def stop(self):
        self.running = False
        if hasattr(self, "thread"):
            self.thread.join()

    def _update(self):
        interval = 1.0 / self.fps
        while self.running:
            frame = self.frame_source()
            if frame is not None:
                if self.width and self.height:
                    frame = cv2.resize(frame, (self.width, self.height))
                with self.lock:
                    self.frame = frame
            time.sleep(interval)

    def get_frame(self):
        """Returns the latest frame as JPEG bytes, or None if unavailable."""
        with self.lock:
            if self.frame is None:
                return None
            ret, jpeg = cv2.imencode(".jpg", self.frame)
            if not ret:
                return None
            return jpeg.tobytes()

    def stream_generator(self):
        """Yields multipart/x-mixed-replace chunks for HTTP MJPEG streaming."""
        while self.running:
            frame = self.get_frame()
            if frame is not None:
                yield (
                    b"--frame\r\n"
                    b"Content-Type: image/jpeg\r\n\r\n" + frame + b"\r\n"
                )
            time.sleep(1.0 / self.fps)
