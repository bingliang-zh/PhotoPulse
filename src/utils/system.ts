import { appDataDir, join } from '@tauri-apps/api/path';
import { openPath } from '@tauri-apps/plugin-opener';

// Reuse OnLogCallback type if possible, or redefine it here to avoid circular dep, 
// but usually types should be in a types file. For now, simplest is to accept the function.
type OnLog = (message: string, type: 'info' | 'warn' | 'error') => void;

export const openFolderWithLogs = async (relativePath: string | undefined, onLog?: OnLog) => {
    onLog?.("Attempting to open path...", 'info');
    let targetPath = "";

    try {
        const rootPath = await appDataDir();

        if (relativePath && relativePath.trim() !== "") {
            // Check if it's already an absolute path (optional safety, but user asked for relative behavior)
            // But simplify: assume relative to appDataDir as requested.
            // Remove leading slash if present to be safe with join, or let join handle it.
            // transform "/backgrounds" -> "backgrounds" if platform specific needed, but join usually handles it.
            targetPath = await join(rootPath, relativePath);
        } else {
            targetPath = rootPath;
        }

        onLog?.(`Opening path: ${targetPath}`, 'info');
        console.log(`System: invoking openPath('${targetPath}')`);
        await openPath(targetPath);
        onLog?.("Folder opened successfully", 'info');

    } catch (e) {
        console.error("Open error:", e);
        onLog?.(`Error opening folder: ${e}`, 'error');
    }
};
