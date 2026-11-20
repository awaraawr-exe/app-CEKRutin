import React, {useEffect, useRef} from 'react';
import {Download, Printer} from 'lucide-react';
import {CertificateRecord} from '../types/health';

interface CertificateGeneratorProps {
  certificate: CertificateRecord;
}

export const CertificateGenerator: React.FC<CertificateGeneratorProps> = ({certificate}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const w = 1600;
    const h = 1130;
    canvas.width = w;
    canvas.height = h;

    // Background
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, w, h);

    // Subtle soft header accent bar
    const grad = ctx.createLinearGradient(0, 0, w, 0);
    grad.addColorStop(0, '#0F766E');
    grad.addColorStop(0.5, '#0D9488');
    grad.addColorStop(1, '#0284C7');
    ctx.fillStyle = grad;
    ctx.fillRect(0, 0, w, 26);
    ctx.fillRect(0, h - 26, w, 26);

    // Outer & inner decorative borders
    ctx.strokeStyle = '#0D9488';
    ctx.lineWidth = 5;
    ctx.strokeRect(48, 56, w - 96, h - 112);

    ctx.strokeStyle = '#BAE6FD';
    ctx.lineWidth = 2;
    ctx.strokeRect(64, 72, w - 128, h - 144);

    // Top Emblem Shield
    ctx.fillStyle = '#CCFBF1';
    ctx.beginPath();
    ctx.arc(w / 2, 165, 48, 0, Math.PI * 2);
    ctx.fill();

    ctx.strokeStyle = '#0D9488';
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 24, 168);
    ctx.lineTo(w / 2 - 10, 168);
    ctx.lineTo(w / 2 - 3, 146);
    ctx.lineTo(w / 2 + 6, 186);
    ctx.lineTo(w / 2 + 13, 162);
    ctx.lineTo(w / 2 + 24, 168);
    ctx.stroke();

    // Brand Title
    ctx.fillStyle = '#0F766E';
    ctx.font = '700 28px "Plus Jakarta Sans", sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText('CEKRutin · SISTEM KENDALI RUTINITAS SEHAT KELUARGA', w / 2, 255);

    // Certificate Heading
    ctx.fillStyle = '#0F172A';
    ctx.font = '800 58px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('E-SERTIFIKAT KELUARGA SADAR SEHAT', w / 2, 345);

    // Divider line
    ctx.strokeStyle = '#CBD5E1';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(w / 2 - 220, 382);
    ctx.lineTo(w / 2 + 220, 382);
    ctx.stroke();

    // Subtitle
    ctx.fillStyle = '#475569';
    ctx.font = '500 28px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Penghargaan ini diberikan dengan bangga kepada:', w / 2, 448);

    // Recipient Name
    ctx.fillStyle = '#0284C7';
    ctx.font = '800 66px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(certificate.recipientName, w / 2, 540);

    // Role & Accomplishment
    ctx.fillStyle = '#334155';
    ctx.font = '600 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      `Peran Keluarga: ${certificate.memberRole}  ·  Skor Evaluasi Edukasi PTM: ${certificate.score}/100`,
      w / 2,
      606,
    );

    // Description paragraph
    ctx.fillStyle = '#475569';
    ctx.font = '400 24px "Plus Jakarta Sans", sans-serif';
    ctx.fillText(
      'Telah menyelesaikan modul edukasi pencegahan Penyakit Tidak Menular (PTM)',
      w / 2,
      690,
    );
    ctx.fillText(
      'serta berkomitmen menerapkan gerakan keluarga sehat: "Ingat, Periksa, Jaga Sehat".',
      w / 2,
      732,
    );

    // Badge box for slogan
    ctx.fillStyle = '#F0FDFA';
    ctx.strokeStyle = '#99F6E4';
    ctx.lineWidth = 2;
    const boxW = 540;
    const boxH = 66;
    ctx.beginPath();
    ctx.roundRect(w / 2 - boxW / 2, 784, boxW, boxH, 16);
    ctx.fill();
    ctx.stroke();

    ctx.fillStyle = '#0F766E';
    ctx.font = '700 26px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('INGAT, PERIKSA, JAGA SEHAT', w / 2, 826);

    // Footer metadata
    const dateStr = new Date(certificate.issuedAt).toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });

    ctx.textAlign = 'left';
    ctx.fillStyle = '#64748B';
    ctx.font = '500 20px "JetBrains Mono", monospace';
    ctx.fillText(`NO. SERTIFIKAT: ${certificate.certificateNumber}`, 120, 965);
    ctx.fillText(`TANGGAL TERBIT: ${dateStr}`, 120, 1002);

    ctx.textAlign = 'right';
    ctx.fillStyle = '#0F172A';
    ctx.font = '700 22px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Tim Promotif-Preventif CEKRutin', w - 120, 965);
    ctx.fillStyle = '#64748B';
    ctx.font = '400 18px "Plus Jakarta Sans", sans-serif';
    ctx.fillText('Tervalidasi Otomatis melalui Modul Edukasi Keluarga', w - 120, 1002);
  }, [certificate]);

  const handleDownloadPng = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL('image/png');
    const a = document.createElement('a');
    a.href = url;
    a.download = `E-Sertifikat-CEKRutin-${certificate.recipientName.replace(/\s+/g, '-')}.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  const handlePrintPdf = () => {
    window.print();
  };

  return (
    <div className="space-y-4">
      <div className="certificate-print-area rounded-xl overflow-hidden border border-slate-200 bg-white shadow-xs">
        <canvas
          ref={canvasRef}
          className="w-full h-auto block"
          aria-label={`E-Sertifikat CEKRutin untuk ${certificate.recipientName}`}
        />
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={handleDownloadPng}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-600 hover:bg-teal-700 text-white text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Download className="w-4 h-4" />
          Unduh E-Sertifikat (PNG)
        </button>
        <button
          type="button"
          onClick={handlePrintPdf}
          className="min-h-[44px] px-5 py-2.5 rounded-xl bg-white hover:bg-slate-50 text-slate-800 border border-slate-300 text-sm font-semibold inline-flex items-center gap-2 transition-colors cursor-pointer"
        >
          <Printer className="w-4 h-4" />
          Cetak / Simpan PDF
        </button>
      </div>
    </div>
  );
};
