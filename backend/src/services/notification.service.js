const config = require('../config/env');
const smsService = require('./sms/sms.service');
const emailService = require('./email/email.service');
const { getOtpTemplate } = require('./email/emailTemplates');
const { buildDltPayload } = require('./dltPayloadResolver.service');
const {
  isOtpDltEnabled,
  isLegacyFallbackAllowed,
  isDltOnly,
  getOtpDeliveryPolicy,
  buildOtpTemplateContext,
} = require('./otpDltResolver.service');
const { SUPPORTED_CHANNELS } = require('../config/channels');
const {
  logNotification,
  logOtp,
  logError: logErrorCategory,
} = require('./logging/businessLogger.service');
const { recipientFromList, buildLogContext } = require('./logging/logContext');
const {
  maskVariablesValues,
  redactResolvedVariables,
} = require('../utils/otpLogRedaction');

function normalizeChannel(channel) {
  if (typeof channel !== 'string' || !channel.trim()) {
    return 'SMS';
  }
  return channel.trim().toUpperCase();
}

function providerForChannel(channel) {
  if (channel === 'SMS') {
    return 'fast2sms';
  }
  if (channel === 'EMAIL') {
    return 'sendgrid';
  }
  return null;
}

async function sendLegacyOtpToRecipients(recipients, templateData, logContext, appId) {
  await Promise.all(
    recipients.map((recipient) => smsService.sendOTP(recipient, templateData.otp, appId, {
      ...logContext,
      recipient,
      provider: 'fast2sms',
      deliveryMode: 'legacy_q',
      appId,
    })),
  );
}

/**
 * @returns {Promise<{ deliveryMode: string, providerRoute: string, fallbackAllowed: boolean, usedFallback: boolean }>}
 */
async function sendOtpSmsToRecipients(recipients, templateData, logContext) {
  const appId = templateData.appId;
  const policy = getOtpDeliveryPolicy(appId);
  const useDlt = policy.dltActive;
  const fallbackAllowed = policy.fallbackAllowed;

  if (!useDlt) {
    if (config.otp.dltEnabled) {
      logOtp('otp_dlt_fallback', 'started', logContext, {
        appId,
        deliveryMode: 'legacy_q',
        fallbackAllowed: true,
        reason: 'dlt_inactive',
        business: policy.businessId ?? null,
        templateKey: policy.templateKey ?? null,
        templateId: policy.templateId ?? null,
      });
    }
    await sendLegacyOtpToRecipients(recipients, templateData, logContext, appId);
    return {
      deliveryMode: 'legacy_q',
      providerRoute: 'q',
      fallbackAllowed: true,
      usedFallback: false,
    };
  }

  const otpContext = buildOtpTemplateContext({
    appId,
    otp: templateData.otp,
    ...Object.fromEntries(
      Object.entries(templateData).filter(([key]) => key !== 'otp' && key !== 'appId'),
    ),
  });
  const dltPayload = buildDltPayload(otpContext, {
    ...logContext,
    templateId: otpContext.template?.dlt?.templateId ?? null,
  });
  const dltLogContext = buildLogContext({
    ...logContext,
    business: otpContext.businessId,
    templateKey: otpContext.templateKey,
    templateId: dltPayload.templateId,
  });
  const deliveryMode = isDltOnly(appId) ? 'dlt_only' : 'dlt';

  logOtp('otp_dlt_dispatch', 'started', dltLogContext, {
    appId,
    deliveryMode,
    fallbackAllowed,
    business: otpContext.businessId,
    templateKey: otpContext.templateKey,
    templateId: dltPayload.templateId,
  });

  logOtp('fast2sms_request_prepared', 'started', dltLogContext, {
    appId,
    templateKey: otpContext.templateKey,
    resolvedVariables: redactResolvedVariables(otpContext.variables),
    variablesValues: maskVariablesValues(dltPayload.variablesValues),
    senderId: dltPayload.senderId,
    entityId: dltPayload.entityId,
    templateId: dltPayload.templateId,
    messageId: dltPayload.messageId,
  });

  try {
    await Promise.all(
      recipients.map((recipient) => smsService.sendDltTemplated(recipient, dltPayload, {
        ...dltLogContext,
        recipient,
        provider: 'fast2sms',
      })),
    );
    return {
      deliveryMode,
      providerRoute: 'dlt',
      fallbackAllowed,
      usedFallback: false,
    };
  } catch (dltErr) {
    const errorMessage = dltErr instanceof Error ? dltErr.message : 'DLT send failed';
    const providerFailure =
      dltErr instanceof Error && dltErr.providerFailure
        ? dltErr.providerFailure
        : {
            httpStatus: null,
            providerBody: dltErr instanceof Error ? dltErr.cause ?? null : null,
            providerResponse: dltErr instanceof Error ? dltErr.providerResponse ?? dltErr.cause ?? null : null,
            providerErrorCode: dltErr instanceof Error ? dltErr.providerCode ?? null : null,
            providerErrorMessage: dltErr instanceof Error ? dltErr.providerMessage ?? errorMessage : errorMessage,
            providerCode: dltErr instanceof Error ? dltErr.providerCode ?? null : null,
            providerMessage: dltErr instanceof Error ? dltErr.providerMessage ?? errorMessage : errorMessage,
            route: 'dlt',
            senderId: dltPayload.senderId,
            templateId: dltPayload.templateId,
            entityId: dltPayload.entityId,
          };

    attachProviderFailureToError(dltErr, providerFailure);

    if (!fallbackAllowed) {
      logOtp('otp_dlt_hard_failure', 'failed', dltLogContext, {
        appId,
        deliveryMode: 'dlt_only',
        fallbackAllowed: false,
        business: otpContext.businessId,
        templateKey: otpContext.templateKey,
        error: errorMessage,
        ...providerFailure,
      });
      throw dltErr;
    }

    logOtp('otp_dlt_fallback', 'started', logContext, {
      appId,
      deliveryMode: 'legacy_q',
      fallbackAllowed: true,
      reason: 'dlt_provider_failure',
      business: otpContext.businessId,
      templateKey: otpContext.templateKey,
      templateId: dltPayload.templateId,
    });
    await sendLegacyOtpToRecipients(recipients, templateData, logContext, appId);
    return {
      deliveryMode: 'legacy_q',
      providerRoute: 'q',
      fallbackAllowed: true,
      usedFallback: true,
    };
  }
}

async function handleSMS({ to, message, templateData, validatedTemplate, logContext }) {
  const recipients = Array.isArray(to) ? to : [to];

  if (validatedTemplate) {
    const dltPayload = buildDltPayload(validatedTemplate, {
      ...logContext,
      templateId: validatedTemplate.template?.dlt?.templateId ?? null,
    });
    await Promise.all(
      recipients.map((recipient) => smsService.sendDltTemplated(recipient, dltPayload, {
        ...logContext,
        recipient,
        templateId: dltPayload.templateId,
        provider: 'fast2sms',
      })),
    );
    return undefined;
  }

  if (typeof message === 'string' && message.trim()) {
    await Promise.all(
      recipients.map((recipient) => smsService.sendMessage(recipient, message, {
        ...logContext,
        recipient,
        provider: 'fast2sms',
      })),
    );
    return undefined;
  }

  if (templateData?.otp) {
    return sendOtpSmsToRecipients(recipients, templateData, logContext);
  }

  throw new Error('SMS message is required');
}

function buildTemplateHtml(subject, data) {
  return `<h2>${subject}</h2><p>${JSON.stringify(data ?? {})}</p>`;
}

async function handleEmail({
  to,
  subject,
  template,
  data,
  html,
  message,
  templateData,
}) {
  const resolvedSubject = subject?.trim() || 'Your ELVA OTP Code';

  let resolvedHtml;
  if (typeof html === 'string' && html.trim()) {
    resolvedHtml = html.trim();
  } else if (template !== undefined && template !== null) {
    resolvedHtml = buildTemplateHtml(resolvedSubject, data);
  } else if (templateData?.otp) {
    resolvedHtml = getOtpTemplate({
      otp: templateData.otp,
      appId: templateData.appId,
      fallbackMessage: message,
    });
  } else {
    throw new Error('Email body is required');
  }

  return emailService.sendEmail({ to, subject: resolvedSubject, html: resolvedHtml });
}

function resolveInitialOtpLogDetails(templateData, normalizedChannel) {
  if (!templateData?.otp) {
    return {};
  }
  if (normalizedChannel === 'EMAIL') {
    return { appId: templateData.appId ?? null, deliveryMode: 'email' };
  }
  const policy = getOtpDeliveryPolicy(templateData.appId);
  return {
    appId: templateData.appId ?? null,
    deliveryMode: policy.deliveryPolicy === 'legacy_q' ? 'legacy_q' : policy.deliveryPolicy,
    fallbackAllowed: policy.fallbackAllowed,
  };
}

async function sendNotification({
  requestId,
  channel,
  to,
  subject,
  template,
  data,
  html,
  message,
  templateData,
  validatedTemplate,
}) {
  const normalizedChannel = normalizeChannel(channel);
  const recipientCount = Array.isArray(to) ? to.length : 1;
  const provider = providerForChannel(normalizedChannel);
  const isOtpDispatch = Boolean(templateData?.otp);
  const isLegacySms = normalizedChannel === 'SMS' && typeof message === 'string' && message.trim();
  const isTemplateSms = Boolean(validatedTemplate);
  const otpLogDetails = isOtpDispatch
    ? resolveInitialOtpLogDetails(templateData, normalizedChannel)
    : {};
  const otpDeliveryStartMs = isOtpDispatch ? Date.now() : null;
  const baseContext = buildLogContext({
    requestId,
    channel: normalizedChannel,
    recipient: recipientFromList(to),
    business: validatedTemplate?.businessId ?? null,
    templateKey: validatedTemplate?.templateKey ?? null,
    templateId: validatedTemplate?.template?.dlt?.templateId ?? null,
    provider,
  });
  const handlers = {
    EMAIL: handleEmail,
    SMS: handleSMS,
  };

  try {
    if (!SUPPORTED_CHANNELS.includes(normalizedChannel)) {
      throw new Error(`Unsupported notification channel: ${normalizedChannel}`);
    }

    if (isTemplateSms) {
      logNotification('notification_dispatch', 'started', baseContext);
    } else if (isLegacySms) {
      logNotification('legacy_sms_dispatch', 'started', baseContext);
    } else if (normalizedChannel === 'EMAIL') {
      logNotification('email_dispatch', 'started', baseContext);
    } else if (isOtpDispatch) {
      logOtp('otp_notification_dispatch', 'started', baseContext, otpLogDetails);
    }

    const handlerResult = await handlers[normalizedChannel]({
      to,
      subject,
      template,
      data,
      html,
      message,
      templateData,
      validatedTemplate,
      logContext: baseContext,
    });

    const otpSmsResult = normalizedChannel === 'SMS' ? handlerResult : undefined;
    if (isOtpDispatch && otpSmsResult) {
      otpLogDetails.deliveryMode = otpSmsResult.deliveryMode;
      otpLogDetails.fallbackAllowed = otpSmsResult.fallbackAllowed;
      if (otpSmsResult.usedFallback) {
        otpLogDetails.usedFallback = true;
      }
    }

    if (isOtpDispatch) {
      const providerRoute = otpSmsResult?.providerRoute
        ?? (otpLogDetails.deliveryMode === 'email' ? 'email' : 'q');
      logOtp('otp_notification_sent', 'sent', baseContext, { recipientCount, ...otpLogDetails });
      logOtp('otp_delivery_completed', 'completed', baseContext, {
        ...otpLogDetails,
        recipientCount,
        durationMs: otpDeliveryStartMs != null ? Date.now() - otpDeliveryStartMs : null,
        providerRoute,
        channel: normalizedChannel,
      });
    } else {
      logNotification('notification_sent', 'sent', baseContext, { recipientCount });
    }
  } catch (err) {
    const errorMessage = err instanceof Error ? err.message : 'Unknown error';
    const providerFailure =
      err instanceof Error && err.providerFailure
        ? err.providerFailure
        : extractProviderFailureFromError(err);

    if (isOtpDispatch) {
      logErrorCategory('otp_notification_failed', 'provider_failed', baseContext, {
        recipientCount,
        error: errorMessage,
        providerMessage: providerFailure.providerMessage,
        providerCode: providerFailure.providerCode,
        providerResponse: providerFailure.providerResponse,
        httpStatus: providerFailure.httpStatus,
        ...otpLogDetails,
      });
      const providerRoute = otpLogDetails.deliveryMode === 'dlt' || otpLogDetails.deliveryMode === 'dlt_only'
        ? 'dlt'
        : (otpLogDetails.deliveryMode === 'email' ? 'email' : 'q');
      logOtp('otp_delivery_completed', 'failed', baseContext, {
        ...otpLogDetails,
        recipientCount,
        durationMs: otpDeliveryStartMs != null ? Date.now() - otpDeliveryStartMs : null,
        providerRoute,
        channel: normalizedChannel,
        error: errorMessage,
        providerMessage: providerFailure.providerMessage,
        providerCode: providerFailure.providerCode,
      });
    } else {
      logErrorCategory('notification_failed', 'provider_failed', baseContext, {
        recipientCount,
        error: errorMessage,
        providerMessage: providerFailure.providerMessage,
        providerCode: providerFailure.providerCode,
        providerResponse: providerFailure.providerResponse,
        httpStatus: providerFailure.httpStatus,
      });
    }
    attachProviderFailureToError(err, providerFailure);
    throw err;
  }
}

function extractProviderFailureFromError(err) {
  if (!(err instanceof Error)) {
    return {
      httpStatus: null,
      providerBody: null,
      providerResponse: null,
      providerErrorCode: null,
      providerErrorMessage: null,
      providerCode: null,
      providerMessage: null,
      route: null,
      senderId: null,
      templateId: null,
      entityId: null,
    };
  }

  if (err.providerFailure && typeof err.providerFailure === 'object') {
    return err.providerFailure;
  }

  return {
    httpStatus: null,
    providerBody: err.cause ?? null,
    providerResponse: err.cause ?? null,
    providerErrorCode: err.providerCode ?? null,
    providerErrorMessage: err.providerMessage ?? err.message,
    providerCode: err.providerCode ?? null,
    providerMessage: err.providerMessage ?? err.message,
    route: null,
    senderId: null,
    templateId: null,
    entityId: null,
  };
}

function attachProviderFailureToError(err, providerFailure) {
  if (!(err instanceof Error)) {
    return;
  }
  if (!err.providerFailure) {
    err.providerFailure = providerFailure;
  }
  if (!err.providerMessage && providerFailure.providerMessage) {
    err.providerMessage = providerFailure.providerMessage;
  }
  if (!err.providerCode && providerFailure.providerCode) {
    err.providerCode = providerFailure.providerCode;
  }
  if (!err.providerResponse && providerFailure.providerResponse) {
    err.providerResponse = providerFailure.providerResponse;
  }
}

module.exports = {
  sendNotification,
  normalizeChannel,
};
