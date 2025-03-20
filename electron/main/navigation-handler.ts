import { BrowserWindow, ipcMain } from 'electron';

// Registra manipuladores para navegação entre páginas no Electron
export function setupNavigationHandlers(mainWindow: BrowserWindow) {
  // Manipulador para navegação interna
  ipcMain.handle('navigate', async (event, route) => {
    try {
      console.log(`[Electron] Solicitação de navegação para: ${route}`);
      
      // Verificar se a janela principal existe
      if (!mainWindow || mainWindow.isDestroyed()) {
        console.error('[Electron] Janela principal não disponível');
        return { success: false, error: 'Janela principal não disponível' };
      }
      
      // Normalizar a rota
      const normalizedRoute = route.startsWith('/') ? route : `/${route}`;
      
      // Obter o URL base atual
      const currentUrl = mainWindow.webContents.getURL();
      const baseUrl = currentUrl.split('#')[0].split('?')[0];
      const urlObj = new URL(baseUrl);
      
      // Construir a nova URL
      const newUrl = `${urlObj.origin}${normalizedRoute}`;
      console.log(`[Electron] Navegando para: ${newUrl}`);
      
      // Carregar a nova URL
      await mainWindow.loadURL(newUrl);
      return { success: true };
    } catch (error) {
      console.error(`[Electron] Erro ao navegar: ${error}`);
      return { success: false, error: String(error) };
    }
  });
} 