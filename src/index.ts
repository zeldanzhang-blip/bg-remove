export interface Env {
  REMOVE_BG_API_KEY: string;
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);

    // 前端页面
    if (url.pathname === "/" || url.pathname === "/index.html") {
      return new Response(INDEX_HTML, {
        headers: { "Content-Type": "text/html;charset=UTF-8" },
      });
    }

    // API 接口 - 去除背景
    if (url.pathname === "/api/remove" && request.method === "POST") {
      return handleRemoveBg(request, env, ctx);
    }

    return new Response("Not Found", { status: 404 });
  },
};

async function handleRemoveBg(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
  if (!env.REMOVE_BG_API_KEY) {
    return new Response(JSON.stringify({ error: "API Key 未配置" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const formData = await request.formData();
    const imageFile = formData.get("image") as File | null;

    if (!imageFile) {
      return new Response(JSON.stringify({ error: "请上传图片" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 直接流式转发到 Remove.bg，内存中处理
    const imageBuffer = await imageFile.arrayBuffer();
    
    const removeBgForm = new FormData();
    removeBgForm.append("image_file", new Blob([imageBuffer], { type: imageFile.type }), imageFile.name);
    removeBgForm.append("size", "auto");

    const response = await fetch("https://api.remove.bg/v1.0/removebg", {
      method: "POST",
      headers: {
        "X-Api-Key": env.REMOVE_BG_API_KEY,
      },
      body: removeBgForm,
    });

    if (!response.ok) {
      const errorText = await response.text();
      return new Response(JSON.stringify({ error: "Remove.bg API 错误", details: errorText }), {
        status: response.status,
        headers: { "Content-Type": "application/json" },
      });
    }

    // 直接返回处理后的图片（内存中，不存盘）
    const resultBlob = await response.blob();
    
    return new Response(resultBlob, {
      headers: {
        "Content-Type": "image/png",
        "Content-Disposition": `attachment; filename="removed-bg-${Date.now()}.png"`,
        "Cache-Control": "no-store",
      },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: String(error) }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

const INDEX_HTML = `<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>图片去背工具</title>
  <style>
    * { box-sizing: border-box; margin: 0; padding: 0; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      min-height: 100vh;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 20px;
    }
    .container {
      background: white;
      border-radius: 16px;
      padding: 40px;
      max-width: 600px;
      width: 100%;
      box-shadow: 0 20px 60px rgba(0,0,0,0.3);
    }
    h1 { text-align: center; margin-bottom: 30px; color: #333; }
    .upload-area {
      border: 3px dashed #ddd;
      border-radius: 12px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s;
    }
    .upload-area:hover { border-color: #667eea; background: #f8f9ff; }
    .upload-area.dragover { border-color: #667eea; background: #f0f3ff; }
    .upload-icon { font-size: 48px; margin-bottom: 16px; }
    .upload-text { color: #666; font-size: 16px; }
    #fileInput { display: none; }
    .preview-section {
      margin-top: 24px;
      display: none;
    }
    .preview-section.active { display: block; }
    .preview-row { display: flex; gap: 16px; flex-wrap: wrap; }
    .preview-box {
      flex: 1;
      min-width: 200px;
    }
    .preview-box img {
      width: 100%;
      border-radius: 8px;
      border: 1px solid #eee;
    }
    .preview-label {
      text-align: center;
      margin-bottom: 8px;
      color: #666;
      font-size: 14px;
    }
    .btn {
      display: block;
      width: 100%;
      padding: 16px;
      margin-top: 24px;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
      border: none;
      border-radius: 8px;
      font-size: 16px;
      font-weight: 600;
      cursor: pointer;
      transition: transform 0.2s;
    }
    .btn:hover { transform: translateY(-2px); }
    .btn:disabled { opacity: 0.6; cursor: not-allowed; }
    .loading {
      text-align: center;
      margin-top: 20px;
      color: #666;
      display: none;
    }
    .loading.active { display: block; }
    .spinner {
      width: 40px;
      height: 40px;
      border: 4px solid #f3f3f3;
      border-top: 4px solid #667eea;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      margin: 0 auto 16px;
    }
    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
    .download-link {
      display: none;
      text-align: center;
      margin-top: 20px;
    }
    .download-link.active { display: block; }
    .download-link a {
      color: #667eea;
      font-size: 16px;
      text-decoration: none;
    }
  </style>
</head>
<body>
  <div class="container">
    <h1>🖼️ 图片去背工具</h1>
    <div class="upload-area" id="uploadArea">
      <div class="upload-icon">📁</div>
      <div class="upload-text">点击或拖拽图片到这里</div>
    </div>
    <input type="file" id="fileInput" accept="image/*">
    
    <div class="preview-section" id="previewSection">
      <div class="preview-row">
        <div class="preview-box">
          <div class="preview-label">原图</div>
          <img id="originalPreview" alt="原图">
        </div>
        <div class="preview-box">
          <div class="preview-label">去背结果</div>
          <img id="resultPreview" alt="去背结果">
        </div>
      </div>
    </div>
    
    <div class="loading" id="loading">
      <div class="spinner"></div>
      <div>正在处理...</div>
    </div>
    
    <button class="btn" id="processBtn" disabled>开始处理</button>
    
    <div class="download-link" id="downloadLink">
      <a id="downloadBtn" href="#" download="removed-bg.png">⬇️ 下载去背图片</a>
    </div>
  </div>

  <script>
    const uploadArea = document.getElementById('uploadArea');
    const fileInput = document.getElementById('fileInput');
    const processBtn = document.getElementById('processBtn');
    const previewSection = document.getElementById('previewSection');
    const originalPreview = document.getElementById('originalPreview');
    const resultPreview = document.getElementById('resultPreview');
    const loading = document.getElementById('loading');
    const downloadLink = document.getElementById('downloadLink');
    const downloadBtn = document.getElementById('downloadBtn');

    let selectedFile = null;

    // 点击上传
    uploadArea.addEventListener('click', () => fileInput.click());
    
    // 文件选择
    fileInput.addEventListener('change', (e) => {
      if (e.target.files[0]) handleFile(e.target.files[0]);
    });
    
    // 拖拽上传
    uploadArea.addEventListener('dragover', (e) => {
      e.preventDefault();
      uploadArea.classList.add('dragover');
    });
    uploadArea.addEventListener('dragleave', () => uploadArea.classList.remove('dragover'));
    uploadArea.addEventListener('drop', (e) => {
      e.preventDefault();
      uploadArea.classList.remove('dragover');
      if (e.dataTransfer.files[0]) handleFile(e.dataTransfer.files[0]);
    });

    function handleFile(file) {
      if (!file.type.startsWith('image/')) {
        alert('请上传图片文件');
        return;
      }
      selectedFile = file;
      originalPreview.src = URL.createObjectURL(file);
      previewSection.classList.add('active');
      processBtn.disabled = false;
      resultPreview.src = '';
      downloadLink.classList.remove('active');
    }

    // 处理图片
    processBtn.addEventListener('click', async () => {
      if (!selectedFile) return;
      
      loading.classList.add('active');
      processBtn.disabled = true;
      
      try {
        const formData = new FormData();
        formData.append('image', selectedFile);
        
        const response = await fetch('/api/remove', {
          method: 'POST',
          body: formData
        });
        
        if (!response.ok) {
          const data = await response.json();
          throw new Error(data.error || '处理失败');
        }
        
        const blob = await response.blob();
        const url = URL.createObjectURL(blob);
        
        resultPreview.src = url;
        downloadBtn.href = url;
        downloadLink.classList.add('active');
      } catch (error) {
        alert('处理失败: ' + error.message);
      } finally {
        loading.classList.remove('active');
        processBtn.disabled = false;
      }
    });
  </script>
</body>
</html>`;
