const convertForm = document.querySelector("#video-upload-form ");
const jobIdForm = document.querySelector(".get-status");
const downloadBtn = document.querySelector(".download-btn");
console.log(jobIdForm);

if (convertForm) {
  convertForm.addEventListener("submit", async (e) => {
    try {
      e.preventDefault();
      const form = new FormData();
      form.append("video", document.getElementById("video-url").files[0]);

      const res = await fetch("http://localhost:5000/process-video", {
        method: "POST",
        body: form,
      });
      console.log(res);
      const data = await res.json();
      const uri = `/status?filename=${encodeURIComponent(
        data.fileName
      )}&jobId=${encodeURIComponent(data.jobId)}`;
      location.assign(uri);
    } catch (error) {}
  });
}

if (jobIdForm) {
  jobIdForm.addEventListener("submit", async (e) => {
    try {
      e.preventDefault();
      const urlParams = new URLSearchParams(window.location.href);
      let filename = "";
      let jobId = "";
      urlParams.forEach((e, i) => {
        if (i == "http://localhost:5000/status?filename") filename = e;
        else jobId = e;
      });
      const res = await fetch(`http://localhost:5000/job/${jobId}`, {
        method: "GET",
      });
      const data = await res.json();
      console.log(data);
      if (data.isJobCompleted) {
        const uri = `/download?filename=${encodeURIComponent(
          filename
        )}&jobId=${encodeURIComponent(jobId)}`;
        window.location.assign(uri);
      }
    } catch (error) {}
  });
}
if (downloadBtn) {
  downloadBtn.addEventListener("click", async () => {
    const urlParams = new URLSearchParams(window.location.href);
    let filename = "";
    let jobId = "";
    urlParams.forEach((e, i) => {
      if (i === "http://localhost:5000/download?filename") filename = e;
      else jobId = e;
    });

    console.log(filename);

    const res = await fetch(
      `http://localhost:5000/Download/video/${filename}`,
      {
        method: "GET",
      }
    );
    console.log(res);
    window.location.assign(res.url);
  });
}
