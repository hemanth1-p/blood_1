const nodemailer = require('nodemailer');

// Create reusable transporter using SMTP
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

// Common email header/footer HTML
const emailWrapper = (bodyContent) => `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
</head>
<body style="margin:0; padding:0; background:#f4f5f7; font-family: 'Segoe UI', Arial, sans-serif;">
  <div style="max-width:600px; margin:30px auto; background:#ffffff; border-radius:12px; overflow:hidden; box-shadow:0 4px 20px rgba(0,0,0,0.08);">

    <!-- Header -->
    <div style="background:linear-gradient(135deg, #dc2626 0%, #991b1b 100%); padding:28px 32px; text-align:center;">
      <h1 style="margin:0; color:#ffffff; font-size:24px; font-weight:700; letter-spacing:0.5px;">
        🩸 BloodConnect
      </h1>
      <p style="margin:6px 0 0; color:rgba(255,255,255,0.85); font-size:13px;">
        Every Drop Counts. Every Life Matters.
      </p>
    </div>

    <!-- Body Content -->
    <div style="padding:32px;">
      ${bodyContent}
    </div>

    <!-- Footer -->
    <div style="background:#f9fafb; padding:20px 32px; text-align:center; border-top:1px solid #e5e7eb;">
      <p style="margin:0; font-size:12px; color:#9ca3af;">
        This is an automated email from BloodConnect. Please do not reply directly.
      </p>
      <p style="margin:6px 0 0; font-size:12px; color:#9ca3af;">
        24/7 Emergency Helpline: <strong style="color:#dc2626;">1800-XXX-XXXX</strong>
      </p>
      <p style="margin:8px 0 0; font-size:11px; color:#d1d5db;">
        © ${new Date().getFullYear()} BloodConnect. All rights reserved.
      </p>
    </div>

  </div>
</body>
</html>
`;

/**
 * Send Welcome Registration Email to new donor
 */
const sendRegistrationEmail = async (donor) => {
  const body = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="width:64px; height:64px; background:#fef2f2; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:32px;">
        🎉
      </div>
    </div>

    <h2 style="margin:0 0 8px; font-size:20px; color:#111827; text-align:center;">
      Welcome to BloodConnect, ${donor.fullName}!
    </h2>
    <p style="margin:0 0 24px; font-size:14px; color:#6b7280; text-align:center;">
      Your donor registration has been completed successfully.
    </p>

    <div style="background:#f9fafb; border-radius:10px; padding:20px; margin-bottom:24px; border:1px solid #e5e7eb;">
      <h3 style="margin:0 0 14px; font-size:15px; color:#374151; border-bottom:1px solid #e5e7eb; padding-bottom:10px;">
        📋 Your Registration Details
      </h3>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr>
          <td style="padding:6px 0; color:#6b7280; width:40%;">Full Name</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donor.fullName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Email</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donor.email}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Blood Group</td>
          <td style="padding:6px 0;">
            <span style="background:#dc2626; color:#fff; padding:3px 10px; border-radius:20px; font-weight:700; font-size:13px;">
              ${donor.bloodGroup}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Phone</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donor.phone || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Location</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donor.location || 'N/A'}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Status</td>
          <td style="padding:6px 0;">
            <span style="background:#16a34a; color:#fff; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600;">
              ✅ Active & Available
            </span>
          </td>
        </tr>
      </table>
    </div>

    <div style="background:#fef2f2; border-radius:10px; padding:16px 20px; margin-bottom:24px; border-left:4px solid #dc2626;">
      <p style="margin:0; font-size:14px; color:#991b1b; font-weight:600;">
        ❤️ Thank you for stepping up as a life saver!
      </p>
      <p style="margin:6px 0 0; font-size:13px; color:#7f1d1d;">
        Your willingness to donate blood can save up to 3 lives per donation. You are now part of our active donor network.
      </p>
    </div>

    <div style="text-align:center;">
      <p style="margin:0; font-size:13px; color:#6b7280;">
        Log in to your Donor Dashboard to manage your profile, toggle availability, and view donation history.
      </p>
    </div>
  `;

  const html = emailWrapper(body);

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"BloodConnect" <${process.env.EMAIL_USER}>`,
    to: donor.email,
    subject: '🎉 Welcome to BloodConnect — Registration Successful!',
    html,
  });
};

/**
 * Send Donation Recorded Email to donor when admin logs a donation
 */
const sendDonationRecordedEmail = async (donor, donation) => {
  const donationDate = new Date(donation.donationDate).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });

  const livesImpacted = (donation.unitsDonated || 1) * 3;

  const body = `
    <div style="text-align:center; margin-bottom:24px;">
      <div style="width:64px; height:64px; background:#fef2f2; border-radius:50%; display:inline-flex; align-items:center; justify-content:center; font-size:32px;">
        🩸
      </div>
    </div>

    <h2 style="margin:0 0 8px; font-size:20px; color:#111827; text-align:center;">
      Donation Recorded Successfully!
    </h2>
    <p style="margin:0 0 24px; font-size:14px; color:#6b7280; text-align:center;">
      Dear ${donor.fullName}, your blood donation has been recorded in our system.
    </p>

    <div style="background:#f9fafb; border-radius:10px; padding:20px; margin-bottom:24px; border:1px solid #e5e7eb;">
      <h3 style="margin:0 0 14px; font-size:15px; color:#374151; border-bottom:1px solid #e5e7eb; padding-bottom:10px;">
        💉 Donation Details
      </h3>
      <table style="width:100%; border-collapse:collapse; font-size:14px;">
        <tr>
          <td style="padding:6px 0; color:#6b7280; width:40%;">Donor Name</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donor.fullName}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Blood Group</td>
          <td style="padding:6px 0;">
            <span style="background:#dc2626; color:#fff; padding:3px 10px; border-radius:20px; font-weight:700; font-size:13px;">
              ${donation.bloodGroup}
            </span>
          </td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Units Donated</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donation.unitsDonated} unit(s)</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Donation Date</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donationDate}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Hospital / Center</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donation.hospital}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Location</td>
          <td style="padding:6px 0; color:#111827; font-weight:600;">${donation.location}</td>
        </tr>
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Status</td>
          <td style="padding:6px 0;">
            <span style="background:#16a34a; color:#fff; padding:3px 10px; border-radius:20px; font-size:12px; font-weight:600;">
              ✅ ${donation.status || 'Completed'}
            </span>
          </td>
        </tr>
        ${donation.notes ? `
        <tr>
          <td style="padding:6px 0; color:#6b7280;">Notes</td>
          <td style="padding:6px 0; color:#111827;">${donation.notes}</td>
        </tr>` : ''}
      </table>
    </div>

    <div style="background:#ecfdf5; border-radius:10px; padding:16px 20px; margin-bottom:24px; border-left:4px solid #16a34a;">
      <p style="margin:0; font-size:14px; color:#065f46; font-weight:600;">
        🌟 You just impacted ~${livesImpacted} lives!
      </p>
      <p style="margin:6px 0 0; font-size:13px; color:#047857;">
        Total Lifetime Donations: <strong>${donor.totalDonations || 1}</strong> &nbsp;|&nbsp;
        Total Lives Impacted: <strong>${donor.livesImpacted || livesImpacted}</strong>
      </p>
    </div>

    <div style="background:#fffbeb; border-radius:10px; padding:14px 18px; margin-bottom:20px; border-left:4px solid #f59e0b;">
      <p style="margin:0; font-size:13px; color:#92400e;">
        ⏳ <strong>Next Eligible Donation:</strong> You can donate blood again after <strong>90 days</strong> from this donation date (on or after ${new Date(new Date(donation.donationDate).getTime() + 90 * 24 * 60 * 60 * 1000).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' })}).
      </p>
    </div>

    <div style="text-align:center;">
      <p style="margin:0; font-size:13px; color:#6b7280;">
        Thank you for being a hero. Your generosity saves lives! ❤️
      </p>
    </div>
  `;

  const html = emailWrapper(body);

  const transporter = createTransporter();
  await transporter.sendMail({
    from: `"BloodConnect" <${process.env.EMAIL_USER}>`,
    to: donor.email,
    subject: `🩸 Donation Recorded — ${donation.unitsDonated} Unit(s) of ${donation.bloodGroup} at ${donation.hospital}`,
    html,
  });
};

module.exports = {
  sendRegistrationEmail,
  sendDonationRecordedEmail,
};
