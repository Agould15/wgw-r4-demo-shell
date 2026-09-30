#!/usr/bin/env python3
"""Serve the offline demo locally with byte-range support for large video files."""

from functools import partial
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
import os
import re

ROOT = Path(__file__).resolve().parents[1]
RANGE_CHUNK_SIZE = 1024 * 1024


class RangeRequestHandler(SimpleHTTPRequestHandler):
    def send_head(self):
        self._range = None
        if "Range" not in self.headers:
            return super().send_head()

        path = self.translate_path(self.path)
        if not os.path.isfile(path):
            return super().send_head()

        file = open(path, "rb")
        size = os.fstat(file.fileno()).st_size
        value = self.headers.get("Range", "")
        match = re.fullmatch(r"bytes=(\d*)-(\d*)", value.strip())
        if not match or size == 0:
            file.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        first, last = match.groups()
        if first:
            start = int(first)
            end = min(int(last), size - 1) if last else min(start + RANGE_CHUNK_SIZE - 1, size - 1)
        else:
            suffix = int(last or "0")
            if suffix <= 0:
                file.close()
                self.send_response(416)
                self.send_header("Content-Range", f"bytes */{size}")
                self.send_header("Content-Length", "0")
                self.end_headers()
                return None
            start = max(0, size - suffix)
            end = size - 1

        if start >= size or end < start:
            file.close()
            self.send_response(416)
            self.send_header("Content-Range", f"bytes */{size}")
            self.send_header("Content-Length", "0")
            self.end_headers()
            return None

        length = end - start + 1
        self.send_response(206)
        self.send_header("Content-Type", self.guess_type(path))
        self.send_header("Accept-Ranges", "bytes")
        self.send_header("Content-Range", f"bytes {start}-{end}/{size}")
        self.send_header("Content-Length", str(length))
        self.send_header("Last-Modified", self.date_time_string(os.path.getmtime(path)))
        self.end_headers()
        self._range = (start, length)
        return file

    def copyfile(self, source, outputfile):
        if self._range is None:
            return super().copyfile(source, outputfile)
        start, remaining = self._range
        source.seek(start)
        while remaining:
            chunk = source.read(min(64 * 1024, remaining))
            if not chunk:
                break
            outputfile.write(chunk)
            remaining -= len(chunk)


if __name__ == "__main__":
    server = ThreadingHTTPServer(("127.0.0.1", 8000), partial(RangeRequestHandler, directory=str(ROOT)))
    print(f"Serving {ROOT} at http://127.0.0.1:8000")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        print("\nStopping local demo server.")
    finally:
        server.server_close()
