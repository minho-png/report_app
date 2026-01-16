const { app, BrowserWindow } = require('electron');
const path = require('path');

// [중요] package.json에서 보낸 'IS_DEV' 신호를 확인합니다.
const isDev = process.env.IS_DEV === 'true';

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 900,
    webPreferences: {
      nodeIntegration: true,
      contextIsolation: false
    }
  });

  if (isDev) {
    // 개발 모드: 로컬 서버 연결
    console.log('Running in Development Mode');
    win.loadURL('http://localhost:5173');
    win.webContents.openDevTools();
  } else {
    // 배포 모드: 빌드된 파일 로드
    win.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});