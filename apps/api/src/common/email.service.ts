import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);

  async sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
    const apiKey = process.env.RESEND_API_KEY;
    const from = process.env.EMAIL_FROM || 'noreply@lardosanjos.online';

    if (!apiKey) {
      this.logger.warn(
        `RESEND_API_KEY não configurada. Link de reset para ${email}: ${resetUrl}`,
      );
      return;
    }

    try {
      const response = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from,
          to: email,
          subject: 'Recuperação de senha — Lar dos Anjos Pet',
          html: `<p>Você solicitou a recuperação de senha.</p><p><a href="${resetUrl}">Redefinir senha</a></p><p>Este link expira em 1 hora.</p>`,
        }),
      });

      if (!response.ok) {
        this.logger.error(`Falha ao enviar e-mail: ${response.status}`);
      }
    } catch (error) {
      this.logger.error('Erro ao enviar e-mail de recuperação', error);
    }
  }
}
