/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
*/
import JSZip from 'jszip';
import saveAs from 'file-saver';

/**
 * Creates a downloadable zip file from an array of file objects.
 * @param {Array<{path: string, content: string}>} files Array of file objects.
 */
export async function createAndDownloadZip(files) {
  if (!files || files.length === 0) return;

  const zip = new JSZip();
  
  files.forEach(file => {
    if (file.path && file.content) {
      zip.file(file.path, file.content);
    }
  });

  try {
    const content = await zip.generateAsync({ type: "blob" });
    if (content.size > 0) {
      saveAs(content, "generated-project.zip");
    }
  } catch (error) {
    console.error("Failed to create or download zip file:", error);
  }
}