const fs = require('fs');
const path = require('path');

// Simulate the HTML template from server.js
function getPreviewHtml(name, promoCode, promoAmount) {
  const hasPromo = promoCode && promoCode.trim() !== '';
  
  return `
      <div style="font-family: 'Helvetica Neue', Helvetica, Arial, sans-serif; max-width: 500px; margin: 0 auto; padding: 20px 10px; background-color: #dce3e1; border-radius: 8px;">
        <!-- Email Header -->
        <div style="text-align: center; margin-bottom: 20px;">
          <h1 style="color: #1e3a5f; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase;">LIT</h1>
          <p style="color: #64748b; margin: 4px 0 0 0; font-size: 11px; font-weight: 600; letter-spacing: 1px; text-transform: uppercase;">Little India Twist</p>
        </div>

        <!-- Greeting -->
        <div style="background-color: #ffffff; padding: 15px 20px; border-radius: 8px 8px 0 0; border-bottom: 1px solid #f1f5f9;">
          <p style="font-size: 15px; line-height: 1.5; color: #1e293b; margin: 0;">
            Hello <strong>${name}</strong>,
          </p>
          <p style="font-size: 13px; line-height: 1.5; color: #475569; margin: 6px 0 0 0;">
            Thank you for registering with <strong>LIT</strong>! We are excited to welcome you to our rewards program.
          </p>
        </div>

        <!-- Ticket Voucher Section -->
        <div style="background-color: #1e355e; border-radius: 12px; box-shadow: 0 10px 25px rgba(30, 53, 94, 0.15); overflow: hidden; display: block; margin: 0;">
          <table cellpadding="0" cellspacing="0" border="0" width="100%">
            <!-- Row 1: Top Notches / Padding -->
            <tr style="height: 10px; line-height: 0; font-size: 0;">
              <td width="30%" style="background-color: #1e355e; padding: 0;">&nbsp;</td>
              <td style="background-color: #1e355e; padding: 0;">&nbsp;</td>
              <td width="20" style="background-color: #dce3e1; border-radius: 0 0 10px 10px; padding: 0;">&nbsp;</td>
              <td width="80" style="background-color: #182c4f; padding: 0;">&nbsp;</td>
            </tr>

            <!-- Row 2: Main Content -->
            <tr>
              <!-- Left Column: Food Graphic -->
              <td width="30%" style="vertical-align: middle; padding: 0; background-color: #1e355e; line-height: 0; height: 100%;">
                <img src="assets/food.png" alt="LIT Specialty" style="width: 100%; height: 100%; min-height: 150px; object-fit: cover; display: block;" height="100%" />
              </td>

              <!-- Middle Column: Voucher Details -->
              <td style="padding: 10px 15px; vertical-align: middle; text-align: left; background-color: #1e355e;">
                <div style="font-family: Georgia, serif; font-size: 15px; font-style: italic; color: #93c5fd; margin-bottom: 2px;">Promo Code</div>
                <h2 style="font-size: 20px; font-weight: 800; color: #ffffff; margin: 0 0 6px 0; letter-spacing: 1px; text-transform: uppercase;">VOUCHER</h2>
                
                ${hasPromo ? `
                <p style="font-size: 11px; line-height: 1.4; color: #cbd5e1; margin: 0 0 10px 0;">
                  Show code to redeem reward.
                </p>
                <div style="margin-bottom: 8px;">
                  <span style="display: inline-block; background-color: rgba(255,255,255,0.1); border: 1.5px dashed #93c5fd; padding: 5px 12px; border-radius: 4px; font-size: 15px; font-weight: 700; color: #ffffff; letter-spacing: 1.5px;">
                    ${promoCode}
                  </span>
                </div>
                <div style="font-size: 18px; font-weight: 800; color: #38bdf8;">
                  $${parseFloat(promoAmount).toFixed(2)} OFF
                </div>
                ` : `
                <p style="font-size: 11px; line-height: 1.4; color: #cbd5e1; margin: 0 0 8px 0;">
                  We look forward to serving you the best authentic dishes.
                </p>
                <div style="font-size: 15px; font-weight: 800; color: #38bdf8;">
                  See you soon at LIT!
                </div>
                `}
              </td>

              <!-- Divider Column -->
              <td width="20" style="background-color: #1e355e; padding: 0; text-align: center; vertical-align: middle;">
                <div style="border-left: 2px dashed rgba(255, 255, 255, 0.3); height: 120px; margin: 0 auto; width: 1px;"></div>
              </td>

              <!-- Right Column: Ticket Stub -->
              <td width="80" style="vertical-align: middle; text-align: center; padding: 10px 5px; background-color: #182c4f;">
                <div style="writing-mode: vertical-rl; transform: rotate(180deg); font-size: 10px; text-transform: uppercase; color: #93c5fd; font-weight: bold; letter-spacing: 1.5px; white-space: nowrap; display: inline-block;">
                  WELCOME REWARD
                </div>
              </td>
            </tr>

            <!-- Row 3: Bottom Notches / Padding -->
            <tr style="height: 10px; line-height: 0; font-size: 0;">
              <td width="30%" style="background-color: #1e355e; padding: 0;">&nbsp;</td>
              <td style="background-color: #1e355e; padding: 0;">&nbsp;</td>
              <td width="20" style="background-color: #dce3e1; border-radius: 10px 10px 0 0; padding: 0;">&nbsp;</td>
              <td width="80" style="background-color: #182c4f; padding: 0;">&nbsp;</td>
            </tr>
          </table>
        </div>

        <!-- Instructions bottom block -->
        <div style="background-color: #ffffff; padding: 15px 20px; border-radius: 0 0 8px 8px; border-top: 1px solid #f1f5f9; text-align: center;">
          <p style="font-size: 12px; line-height: 1.5; color: #64748b; margin: 0;">
            Simply present your registered mobile number or show this email to our staff during your next visit to redeem your reward discount!
          </p>
        </div>

        <!-- Footer -->
        <div style="text-align: center; margin-top: 20px; font-size: 11px; color: #94a3b8; line-height: 1.4;">
          <p style="margin: 0 0 4px 0; font-weight: bold;">© 2026 UNIPRO . All rights reserved.</p>
          <p style="margin: 0;">This is an automated message. Please do not reply directly to this email.</p>
        </div>
      </div>
  `;
}

const htmlContent = getPreviewHtml("Lokesh K", "LIT5", 5);
const outputPath = path.join(__dirname, 'preview.html');

fs.writeFileSync(outputPath, htmlContent);
console.log('✅ Email preview file generated successfully at:');
console.log(outputPath);
