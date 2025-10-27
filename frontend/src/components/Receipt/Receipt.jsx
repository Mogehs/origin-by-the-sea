import React, { useState, useEffect } from "react";
import { FaDownload, FaPrint, FaSpinner, FaCheckCircle } from "react-icons/fa";
import {
  fetchReceipt,
  downloadReceipt,
  printReceipt,
} from "../../services/receiptService";
import styles from "./Receipt.module.css";

const Receipt = ({ orderId, autoFetch = true }) => {
  const [loading, setLoading] = useState(false);
  const [receiptData, setReceiptData] = useState(null);
  const [error, setError] = useState(null);
  const [downloadSuccess, setDownloadSuccess] = useState(false);
  const [printSuccess, setPrintSuccess] = useState(false);

  const loadReceipt = async () => {
    setLoading(true);
    setError(null);

    console.log("📝 Receipt Component - Loading receipt for orderId:", orderId);

    try {
      const result = await fetchReceipt(orderId);

      console.log("📝 Receipt Component - Fetch result:", result);

      if (result.success) {
        console.log("✅ Receipt Component - Receipt data received:", {
          hasReceipt: !!result.receipt,
          mimeType: result.mimeType,
          receiptLength: result.receipt?.length,
        });
        setReceiptData(result);
      } else {
        console.error("❌ Receipt Component - Failed to load:", result.error);
        setError(result.error || "Failed to load receipt");
      }
    } catch (err) {
      console.error("❌ Receipt Component - Error loading receipt:", err);
      setError(err.message || "An error occurred while loading the receipt");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    console.log("📝 Receipt Component - Mounted/Updated with:", {
      orderId,
      autoFetch,
    });

    if (autoFetch && orderId) {
      if (orderId === "Unknown" || !orderId) {
        console.warn("⚠️ Receipt Component - Invalid orderId:", orderId);
        setError("Invalid order ID. Please check your order confirmation.");
        return;
      }
      loadReceipt();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [orderId, autoFetch]);

  const handleDownload = async () => {
    if (!receiptData) return;

    try {
      setDownloadSuccess(false);
      console.log("📥 Starting download...");

      if (receiptData.mimeType === "image/svg+xml") {
        // Get the SVG element from the DOM
        const svgElement = document.querySelector(
          `.${styles.receiptImage} svg`
        );
        if (!svgElement) {
          throw new Error("SVG element not found");
        }

        // Serialize SVG to string
        const svgString = new XMLSerializer().serializeToString(svgElement);
        const svgBlob = new Blob([svgString], {
          type: "image/svg+xml;charset=utf-8",
        });

        // Create a canvas and convert to PNG
        const img = new Image();
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");

        img.onload = () => {
          // Set canvas size (2x for quality)
          canvas.width = svgElement.width.baseVal.value * 2;
          canvas.height = svgElement.height.baseVal.value * 2;

          // White background
          ctx.fillStyle = "#ffffff";
          ctx.fillRect(0, 0, canvas.width, canvas.height);

          // Scale and draw
          ctx.scale(2, 2);
          ctx.drawImage(img, 0, 0);

          // Convert to PNG and download
          canvas.toBlob((blob) => {
            const url = URL.createObjectURL(blob);
            const link = document.createElement("a");
            link.href = url;
            link.download = `receipt-${orderId}-${Date.now()}.png`;
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
            URL.revokeObjectURL(url);

            console.log("✅ Download complete");
            setDownloadSuccess(true);
            setTimeout(() => setDownloadSuccess(false), 3000);
          }, "image/png");
        };

        img.onerror = () => {
          throw new Error("Failed to load SVG for conversion");
        };

        const svgUrl = URL.createObjectURL(svgBlob);
        img.src = svgUrl;
      } else {
        // For non-SVG, use the existing method
        await downloadReceipt(
          receiptData.receipt,
          orderId,
          receiptData.mimeType
        );
        setDownloadSuccess(true);
        setTimeout(() => setDownloadSuccess(false), 3000);
      }
    } catch (error) {
      console.error("❌ Download failed:", error);
      alert("Failed to download receipt. Please try again.");
    }
  };

  const handlePrint = () => {
    if (!receiptData) return;

    try {
      console.log("🖨️ Starting print...");

      if (receiptData.mimeType === "image/svg+xml") {
        // Get the SVG element from the DOM
        const svgElement = document.querySelector(
          `.${styles.receiptImage} svg`
        );
        if (!svgElement) {
          throw new Error("SVG element not found");
        }

        // Serialize SVG to string
        const svgString = new XMLSerializer().serializeToString(svgElement);
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
              <title>Receipt - Order ${orderId}</title>
              <style>
                body {
                  margin: 0;
                  padding: 20px;
                  display: flex;
                  justify-content: center;
                  align-items: center;
                  min-height: 100vh;
                }
                svg {
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
              ${svgString}
              <script>
                window.onload = function() {
                  window.print();
                  window.onafterprint = function() {
                    window.close();
                  };
                };
              </script>
            </body>
          </html>
        `);
        printWindow.document.close();

        console.log("✅ Print dialog opened");
        setPrintSuccess(true);
        setTimeout(() => setPrintSuccess(false), 3000);
      } else {
        // For non-SVG, use the existing method
        const success = printReceipt(receiptData.receipt, receiptData.mimeType);
        if (success) {
          setPrintSuccess(true);
          setTimeout(() => setPrintSuccess(false), 3000);
        } else {
          throw new Error("Print failed");
        }
      }
    } catch (error) {
      console.error("❌ Print failed:", error);
      alert("Failed to print receipt. Please try again.");
    }
  };

  if (loading) {
    return (
      <div className={styles.receiptContainer}>
        <div className={styles.loadingState}>
          <FaSpinner className={styles.spinner} />
          <p>Loading receipt...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={styles.receiptContainer}>
        <div className={styles.errorState}>
          <p className={styles.errorMessage}>
            ❌ <strong>Error:</strong> {error}
          </p>
          <div style={{ marginTop: "10px", fontSize: "13px", color: "#666" }}>
            <p>Order ID: {orderId || "Not provided"}</p>
            <p>API URL: {import.meta.env.VITE_API_URL || "Not set"}</p>
          </div>
          <button onClick={loadReceipt} className={styles.retryButton}>
            Try Again
          </button>
        </div>
      </div>
    );
  }

  if (!receiptData) {
    return (
      <div className={styles.receiptContainer}>
        <div className={styles.emptyState}>
          <p>No receipt available</p>
          {orderId && (
            <button onClick={loadReceipt} className={styles.loadButton}>
              Load Receipt
            </button>
          )}
        </div>
      </div>
    );
  }

  // Log the image data URL for debugging
  const imageDataUrl = `data:${receiptData.mimeType};base64,${receiptData.receipt}`;
  console.log("🖼️ Image Data URL created:", {
    mimeType: receiptData.mimeType,
    base64Length: receiptData.receipt?.length,
    dataUrlLength: imageDataUrl.length,
    dataUrlPreview: imageDataUrl.substring(0, 100) + "...",
  });

  // Try to decode and check SVG validity
  try {
    const decodedSVG = atob(receiptData.receipt);
    console.log(
      "📄 Decoded SVG (first 500 chars):",
      decodedSVG.substring(0, 500)
    );
    console.log(
      "📄 Decoded SVG (last 200 chars):",
      decodedSVG.substring(decodedSVG.length - 200)
    );
  } catch (e) {
    console.error("❌ Failed to decode base64:", e);
  }

  return (
    <div className={styles.receiptContainer}>
      <div className={styles.receiptHeader}>
        <div className={styles.successBadge}>
          <FaCheckCircle className={styles.successIcon} />
          <span>Receipt Generated</span>
        </div>
        <div className={styles.actionButtons}>
          <button
            onClick={handleDownload}
            className={styles.downloadButton}
            aria-label="Download receipt"
          >
            <FaDownload />
            <span>{downloadSuccess ? "Downloaded!" : "Download"}</span>
          </button>
          <button
            onClick={handlePrint}
            className={styles.printButton}
            aria-label="Print receipt"
          >
            <FaPrint />
            <span>{printSuccess ? "Printing..." : "Print"}</span>
          </button>
        </div>
      </div>

      {downloadSuccess && (
        <div className={styles.successMessage}>
          ✓ Receipt downloaded successfully!
        </div>
      )}

      <div className={styles.receiptPreview}>
        {receiptData.mimeType === "image/svg+xml" ? (
          // For SVG, decode and render directly
          <div
            className={styles.receiptImage}
            dangerouslySetInnerHTML={{
              __html: atob(receiptData.receipt),
            }}
          />
        ) : (
          // For other formats, use img tag
          <img
            src={`data:${receiptData.mimeType};base64,${receiptData.receipt}`}
            alt="Receipt"
            className={styles.receiptImage}
            onLoad={() => console.log("✅ Image loaded successfully")}
            onError={(e) => {
              console.error("❌ Image failed to load:", e);
              console.error("Image src length:", e.target.src?.length);
              console.error(
                "First 100 chars:",
                e.target.src?.substring(0, 100)
              );
            }}
          />
        )}
      </div>

      <div className={styles.receiptFooter}>
        <p className={styles.footerText}>
          Your receipt has been generated successfully. You can download or
          print it for your records.
        </p>
      </div>
    </div>
  );
};

export default Receipt;
