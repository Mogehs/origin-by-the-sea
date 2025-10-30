const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://t7ck79lu3m.execute-api.eu-north-1.amazonaws.com/prod";

/**
 * Fetches the receipt for a given order ID
 * @param {string} orderId - The order ID to fetch receipt for
 * @returns {Promise<Object>} - Receipt data with base64 image
 */
export const fetchReceipt = async (orderId) => {
  try {
    const apiUrl = `${API_BASE_URL}/api/receipt/${orderId}`;

    console.log("🔍 Fetching receipt from:", apiUrl);
    console.log("🔍 Order ID:", orderId);

    const response = await fetch(apiUrl, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    console.log("📡 Receipt API response status:", response.status);
    console.log("📡 Receipt API response ok:", response.ok);

    const data = await response.json();
    console.log("📦 Receipt API response data:", {
      success: data.success,
      hasReceipt: !!data.receipt,
      mimeType: data.mimeType,
      format: data.format,
      receiptLength: data.receipt?.length,
    });

    if (!response.ok) {
      console.error("❌ Receipt API error:", data.error);
      throw new Error(data.error || "Failed to fetch receipt");
    }

    console.log("✅ Receipt fetched successfully");

    return {
      success: true,
      receipt: data.receipt,
      mimeType: data.mimeType,
      orderDetails: data.orderDetails,
    };
  } catch (error) {
    console.error("❌ Error fetching receipt:", error);
    return {
      success: false,
      error: error.message,
    };
  }
};

/**
 * Convert SVG base64 to PNG base64
 * @param {string} svgBase64 - Base64 encoded SVG data
 * @returns {Promise<string>} - Base64 encoded PNG data
 */
const convertSvgToPng = (svgBase64) => {
  return new Promise((resolve, reject) => {
    try {
      // Decode base64 SVG
      const svgString = atob(svgBase64);

      // Create an image element
      const img = new Image();
      const canvas = document.createElement("canvas");
      const ctx = canvas.getContext("2d");

      img.onload = () => {
        // Cleanup blob URL
        URL.revokeObjectURL(img.src);

        // Set canvas size to match SVG (with higher resolution for quality)
        const scale = 2; // 2x resolution for better quality
        canvas.width = img.width * scale;
        canvas.height = img.height * scale;

        // Set white background
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        // Scale context for higher resolution
        ctx.scale(scale, scale);

        // Draw the SVG image
        ctx.drawImage(img, 0, 0);

        // Convert canvas to PNG base64
        const pngDataUrl = canvas.toDataURL("image/png", 1.0);
        const pngBase64 = pngDataUrl.split(",")[1];

        resolve(pngBase64);
      };

      img.onerror = () => {
        reject(new Error("Failed to load SVG image"));
      };

      // Create blob URL for the SVG
      const blob = new Blob([svgString], { type: "image/svg+xml" });
      const url = URL.createObjectURL(blob);
      img.src = url;
    } catch (error) {
      reject(error);
    }
  });
};

/**
 * Downloads the receipt as an image file
 * @param {string} base64Data - Base64 encoded receipt image
 * @param {string} orderId - Order ID for filename
 * @param {string} mimeType - MIME type of the image
 */
export const downloadReceipt = async (
  base64Data,
  orderId,
  mimeType = "image/svg+xml"
) => {
  try {
    let finalBase64 = base64Data;
    let finalMimeType = "image/png";

    // Convert SVG to PNG for better compatibility and quality
    if (mimeType === "image/svg+xml") {
      console.log("Converting SVG to PNG...");
      finalBase64 = await convertSvgToPng(base64Data);
    }

    // Decode base64 to binary
    const binaryString = atob(finalBase64);
    const bytes = new Uint8Array(binaryString.length);
    for (let i = 0; i < binaryString.length; i++) {
      bytes[i] = binaryString.charCodeAt(i);
    }

    // Create blob from binary data
    const blob = new Blob([bytes], { type: finalMimeType });

    // Always use PNG extension
    const filename = `receipt-${orderId}-${Date.now()}.png`;

    // Create download link
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = filename;
    link.style.display = "none";

    // Append to body, click, and remove
    document.body.appendChild(link);
    link.click();

    // Cleanup
    setTimeout(() => {
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    }, 100);

    console.log(`✅ Receipt downloaded: ${filename}`);
    return true;
  } catch (error) {
    console.error("❌ Error downloading receipt:", error);
    throw error;
  }
};

/**
 * Prints the receipt
 * @param {string} base64Data - Base64 encoded receipt image
 */
export const printReceipt = (base64Data, mimeType = "image/svg+xml") => {
  try {
    const dataUrl = `data:${mimeType};base64,${base64Data}`;
    const printWindow = window.open("", "_blank");

    if (!printWindow) {
      throw new Error(
        "Could not open print window. Please check your popup blocker."
      );
    }

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Receipt</title>
          <style>
            body {
              margin: 0;
              padding: 20px;
              display: flex;
              justify-content: center;
              align-items: center;
              min-height: 100vh;
            }
            img {
              max-width: 100%;
              height: auto;
            }
            @media print {
              body {
                padding: 0;
              }
            }
          </style>
        </head>
        <body>
          <img src="${dataUrl}" alt="Receipt" onload="window.print(); window.close();" />
        </body>
      </html>
    `);
    printWindow.document.close();

    return true;
  } catch (error) {
    console.error("Error printing receipt:", error);
    return false;
  }
};

export default {
  fetchReceipt,
  downloadReceipt,
  printReceipt,
};
