/// <reference path="../pb_data/types.d.ts" />

onMailerRecordVerificationSend((e) => {
  const publicUrl = String($os.getenv("THISCORD_PUBLIC_URL") || "").replace(/\/$/, "");
  if (publicUrl && e.message) {
    const appName = String($os.getenv("THISCORD_APP_NAME") || "Thiscord");
    const actionUrl = `${publicUrl}/auth/verify?token=${encodeURIComponent(String(e.meta.token || ""))}`;
    e.message.subject = `Verify your ${appName} email`;
    e.message.html = `<p>Confirm your email address to finish setting up ${appName}.</p><p><a href="${actionUrl}">Verify email</a></p><p>If the button does not work, open this address:</p><p>${actionUrl}</p>`;
    e.message.text = `Confirm your email address to finish setting up ${appName}:\n\n${actionUrl}`;
  }
  e.next();
}, "users");

onMailerRecordPasswordResetSend((e) => {
  const publicUrl = String($os.getenv("THISCORD_PUBLIC_URL") || "").replace(/\/$/, "");
  if (publicUrl && e.message) {
    const appName = String($os.getenv("THISCORD_APP_NAME") || "Thiscord");
    const actionUrl = `${publicUrl}/auth/reset?token=${encodeURIComponent(String(e.meta.token || ""))}`;
    e.message.subject = `Reset your ${appName} password`;
    e.message.html = `<p>A password reset was requested for your ${appName} account.</p><p><a href="${actionUrl}">Reset password</a></p><p>If the button does not work, open this address:</p><p>${actionUrl}</p>`;
    e.message.text = `Reset your ${appName} password:\n\n${actionUrl}`;
  }
  e.next();
}, "users");
