async function putSingleShot(
  uploadUrl: string,
  file: File,
  onProgress?: (p: number) => void
): Promise<void> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.open("PUT", uploadUrl);

    // ⚠️ এখানে Content-Type header পাঠানো হচ্ছে না।
    // Presigned URL-এর signature এর সাথে mismatch হলে upload fail হতে পারে।

    xhr.upload.onprogress = (e) => {
      if (e.lengthComputable && onProgress) {
        onProgress(Math.round((e.loaded / e.total) * 100));
      }
    };

    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        console.error("Upload failed");
        console.error("Status:", xhr.status);
        console.error("Response:", xhr.responseText);

        reject(new Error(`Upload failed (${xhr.status})`));
      }
    };

    xhr.onerror = () => {
      console.error("Network error");
      reject(new Error("Network error during upload."));
    };

    xhr.send(file);
  });
}
