<?php
// Enable error reporting for debugging
error_reporting(E_ALL);
ini_set('display_errors', 0);

// Set content type to JSON
header('Content-Type: application/json');

// Allow CORS
header('Access-Control-Allow-Origin: *');
header('Access-Control-Allow-Methods: POST, OPTIONS');
header('Access-Control-Allow-Headers: Content-Type, Authorization');

// Handle preflight OPTIONS request
if ($_SERVER['REQUEST_METHOD'] === 'OPTIONS') {
    http_response_code(200);
    exit();
}

// Only accept POST requests
if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(array('status' => 'error', 'message' => 'Method not allowed'));
    exit();
}

// Get JSON input
$input = file_get_contents('php://input');
$data = json_decode($input, true);

// Validate required fields
if (!isset($data['email']) || !isset($data['orderId']) || !isset($data['receiptSVG'])) {
    http_response_code(400);
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Missing required fields: email, orderId, receiptSVG'
    ));
    exit();
}

// Extract data
$customerEmail = $data['email'];
$customerName = isset($data['name']) ? $data['name'] : 'Valued Customer';
$orderId = $data['orderId'];
$receiptSVG = $data['receiptSVG'];
$subtotal = isset($data['subtotal']) ? $data['subtotal'] : '0.00';
$vat = isset($data['vat']) ? $data['vat'] : '0.00';
$total = isset($data['total']) ? $data['total'] : '0.00';
$currency = isset($data['currency']) ? strtoupper($data['currency']) : 'AED';
$trn = isset($data['trn']) ? $data['trn'] : '100123456789003';
$orderDate = isset($data['orderDate']) ? $data['orderDate'] : date('F j, Y');

// From email configuration
$from_email = "info@originsbythesea.com";
$from_name = "Origin By The Sea";

// Email subject
$subject = "Order Confirmation - $orderId | Origin By The Sea";

// Create HTML email content
$htmlContent = <<<HTML
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
      line-height: 1.6;
      color: #333;
      max-width: 600px;
      margin: 0 auto;
      padding: 20px;
    }
    .header {
      text-align: center;
      padding: 20px 0;
      border-bottom: 3px solid #e6994b;
      margin-bottom: 30px;
    }
    .header h1 {
      color: #e6994b;
      margin: 0;
      font-size: 28px;
    }
    .message {
      background-color: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .message h2 {
      color: #333;
      margin-top: 0;
    }
    .order-info {
      background-color: #fff3e6;
      padding: 15px;
      border-radius: 6px;
      margin: 20px 0;
      border-left: 4px solid #e6994b;
    }
    .order-info p {
      margin: 5px 0;
    }
    .receipt-container {
      text-align: center;
      margin: 30px 0;
      max-width: 100%;
      overflow-x: auto;
    }
    .receipt-container svg {
      max-width: 100%;
      height: auto;
    }
    .footer {
      text-align: center;
      padding: 20px 0;
      border-top: 1px solid #ddd;
      margin-top: 30px;
      color: #666;
      font-size: 14px;
    }
    .button {
      display: inline-block;
      background-color: #e6994b;
      color: white;
      padding: 12px 30px;
      text-decoration: none;
      border-radius: 6px;
      font-weight: 500;
      margin: 20px 0;
    }
  </style>
</head>
<body>
  <div class="header">
    <h1>🌊 Origin By The Sea</h1>
  </div>
  
  <div class="message">
    <h2>Thank You for Your Order!</h2>
    <p>Dear $customerName,</p>
    <p>Thank you for shopping with Origin By The Sea. Your order has been confirmed and is being processed.</p>
  </div>
  
  <div class="order-info">
    <p><strong>Order ID:</strong> $orderId</p>
    <p><strong>Subtotal (Before VAT):</strong> $subtotal $currency</p>
    <p><strong>VAT (5%):</strong> $vat $currency</p>
    <p><strong>Order Total (Including VAT):</strong> $total $currency</p>
    <p><strong>Order Date:</strong> $orderDate</p>
    <p style="font-size: 12px; color: #666; margin-top: 10px;"><strong>TRN:</strong> $trn</p>
  </div>
  
  <div class="receipt-container">
    <h3>Your Tax Invoice</h3>
    $receiptSVG
  </div>
  
  <div style="text-align: center;">
    <a href="https://originsbythesea.com/track-order" class="button">Track Your Order</a>
  </div>
  
  <div class="footer">
    <p>If you have any questions about your order, please don't hesitate to contact us.</p>
    <p>Email: support@originsbythesea.com | Phone: +971 XXX XXXX</p>
    <p>&copy; 2025 Origin By The Sea. All rights reserved.</p>
  </div>
</body>
</html>
HTML;

// Plain text version for email clients that don't support HTML
$textContent = "Thank You for Your Order!\n\n";
$textContent .= "Dear $customerName,\n\n";
$textContent .= "Thank you for shopping with Origin By The Sea. Your order has been confirmed.\n\n";
$textContent .= "Order Details:\n";
$textContent .= "Order ID: $orderId\n";
$textContent .= "Subtotal (Before VAT): $subtotal $currency\n";
$textContent .= "VAT (5%): $vat $currency\n";
$textContent .= "Total (Including VAT): $total $currency\n";
$textContent .= "Order Date: $orderDate\n";
$textContent .= "TRN: $trn\n\n";
$textContent .= "Track your order: https://originsbythesea.com/track-order\n\n";
$textContent .= "For support, contact us at support@originsbythesea.com\n";
$textContent .= "© 2025 Origin By The Sea. All rights reserved.";

// Create email boundary for multipart message
$boundary = md5(time());

// Email headers
$headers = "From: $from_name <$from_email>\r\n";
$headers .= "Reply-To: $from_email\r\n";
$headers .= "MIME-Version: 1.0\r\n";
$headers .= "Content-Type: multipart/alternative; boundary=\"$boundary\"\r\n";

// Email body with both text and HTML versions
$body = "--$boundary\r\n";
$body .= "Content-Type: text/plain; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$body .= $textContent . "\r\n";

$body .= "--$boundary\r\n";
$body .= "Content-Type: text/html; charset=UTF-8\r\n";
$body .= "Content-Transfer-Encoding: 7bit\r\n\r\n";
$body .= $htmlContent . "\r\n";

$body .= "--$boundary--";

// Send email
$mailSent = mail($customerEmail, $subject, $body, $headers);

if ($mailSent) {
    echo json_encode(array(
        'status' => 'success',
        'message' => 'Receipt email sent successfully',
        'recipient' => $customerEmail,
        'orderId' => $orderId
    ));
} else {
    http_response_code(500);
    echo json_encode(array(
        'status' => 'error',
        'message' => 'Failed to send email',
        'error' => error_get_last()
    ));
}
