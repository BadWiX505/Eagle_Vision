import threading
import queue
import time

from pipelines.mainpipe import DetectionPipeline

# Run ML inference every N frames to keep CPU load manageable (~10 fps at 30 fps capture)
_DETECT_EVERY_N = 3


class AsyncDetectionPipeline:
    def __init__(self, camera_source):
        self.camera_source = camera_source

        # Bounded queue: drop old frames when the model falls behind rather than
        # building up a memory-hungry delay.
        self.frame_queue = queue.Queue(maxsize=2)

        self.latest_processed_frame = None
        self.latest_metadata = None  # DetectionOutput | None
        self.lock = threading.Lock()
        self.running = False

        self._frame_counter = 0
        self.detection_pipeline = DetectionPipeline()

    def start(self):
        if not self.running:
            self.running = True

            self.producer_thread = threading.Thread(target=self._capture_loop, daemon=True)
            self.producer_thread.start()

            self.consumer_thread = threading.Thread(target=self._processing_loop, daemon=True)
            self.consumer_thread.start()

    def stop(self):
        self.running = False
        if hasattr(self, "producer_thread"):
            self.producer_thread.join()
            self.consumer_thread.join()

    def _capture_loop(self):
        """Producer: read from camera as fast as possible."""
        while self.running:
            frame = self.camera_source()
            if frame is not None:
                if self.frame_queue.full():
                    try:
                        self.frame_queue.get_nowait()
                    except queue.Empty:
                        pass
                self.frame_queue.put(frame)
            time.sleep(0.005)

    def _processing_loop(self):
        """Consumer: run ML models every _DETECT_EVERY_N frames at their own pace."""
        while self.running:
            try:
                frame = self.frame_queue.get(timeout=1.0)
            except queue.Empty:
                continue

            self._frame_counter += 1

            if self._frame_counter % _DETECT_EVERY_N == 0:
                metadata = self.detection_pipeline.run(frame)
            else:
                metadata = None  # reuse last known metadata

            with self.lock:
                self.latest_processed_frame = frame
                if metadata is not None:
                    self.latest_metadata = metadata

    def get_processed_frame(self):
        """Returns the most recently processed frame without blocking."""
        with self.lock:
            return self.latest_processed_frame

    def get_latest_metadata(self):
        """Returns the most recent DetectionOutput without blocking."""
        with self.lock:
            return self.latest_metadata
