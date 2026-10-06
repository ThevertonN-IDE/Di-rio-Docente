// src/utils/AssinaturaModal.js
import { Toast } from './ui.js';

export class AssinaturaModal {
  // Ajuste com a sua chave Pix e o número do WhatsApp da TG Tech (com DDD)
  static CHAVE_PIX = "thevertongutemberg15@gmail.com";
  static WHATSAPP_NUMERO = "5584986743960"; 

  static abrir(usuarioEmail = '') {
    let modal = document.getElementById('modal-assinatura-pro');
    if (!modal) {
      modal = document.createElement('div');
      modal.id = 'modal-assinatura-pro';
      document.body.appendChild(modal);
    }

    const mensagemWhatsapp = encodeURIComponent(
      `Olá! Fiz o pagamento do Plano Pro do Diário Docente.\n\n` +
      `📧 E-mail da conta: ${usuarioEmail || 'informe seu e-mail aqui'}\n` +
      `Seguem os dados do comprovante em anexo:`
    );

    const linkWhatsapp = `https://wa.me/${this.WHATSAPP_NUMERO}?text=${mensagemWhatsapp}`;

    modal.className = 'fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-[80] flex items-end sm:items-center justify-center p-0 sm:p-4 select-none';
    modal.innerHTML = `
      <div class="bg-white border-t sm:border border-slate-200 rounded-t-3xl sm:rounded-2xl max-w-md w-full p-5 sm:p-6 shadow-2xl space-y-4 max-h-[90vh] overflow-y-auto">
        <!-- Puxador Mobile -->
        <div class="w-12 h-1.5 bg-slate-300 rounded-full mx-auto sm:hidden -mt-1 mb-1"></div>

        <div class="flex items-center justify-between border-b pb-3">
          <div>
            <h3 class="text-base font-black text-slate-800 flex items-center gap-1.5">
              <span>✨</span> Diário Docente Pro
            </h3>
            <p class="text-xs text-slate-500">Turmas ilimitadas, IA e exportações completas</p>
          </div>
          <button id="btn-fechar-modal-pix" class="touch-target-44 text-slate-400 hover:text-slate-600 text-2xl font-bold">&times;</button>
        </div>

        <div class="bg-indigo-50 border border-indigo-100 p-4 rounded-2xl text-center space-y-1">
          <span class="text-xs font-bold text-indigo-700 uppercase tracking-wider">Assinatura Mensal</span>
          <div class="text-3xl font-black text-indigo-950">R$ 19,90 <span class="text-xs font-medium text-slate-500">/ 30 dias</span></div>
        </div>

        <!-- Copiar Chave Pix -->
        <div class="space-y-1.5">
          <label class="block text-xs font-bold text-slate-700">Chave Pix para pagamento:</label>
          <div class="flex items-center gap-2">
            <input 
              type="text" 
              readonly 
              value="${this.CHAVE_PIX}" 
              id="inp-chave-pix-copiar"
              class="w-full bg-slate-50 border border-slate-200 text-slate-800 font-mono text-xs px-3 py-2.5 rounded-xl outline-none select-all"
            >
            <button id="btn-copiar-pix" class="touch-action min-h-[44px] px-4 bg-slate-900 hover:bg-slate-800 text-white font-bold text-xs rounded-xl transition flex items-center gap-1 shrink-0">
              <span>📋</span> Copiar
            </button>
          </div>
        </div>

        <!-- Instruções e WhatsApp -->
        <div class="space-y-3 pt-2 border-t border-slate-100">
          <ol class="text-xs text-slate-600 space-y-1 list-decimal list-inside">
            <li>Faça o Pix de <strong>R$ 19,90</strong> no seu banco.</li>
            <li>Envie o comprovante para nosso WhatsApp.</li>
            <li>Seu acesso Pro é ativado em até 30 minutos.</li>
          </ol>

          <a 
            href="${linkWhatsapp}" 
            target="_blank" 
            class="touch-action w-full min-h-[44px] py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-xl shadow-sm transition active:scale-95 flex items-center justify-center gap-2 text-center"
          >
            <span>💬</span> Enviar Comprovante no WhatsApp
          </a>
        </div>

      </div>
    `;

    modal.classList.remove('hidden');

    const fechar = () => modal.classList.add('hidden');
    modal.querySelector('#btn-fechar-modal-pix').onclick = fechar;
    modal.addEventListener('click', (e) => {
      if (e.target === modal) fechar();
    });

    modal.querySelector('#btn-copiar-pix').onclick = () => {
      navigator.clipboard.writeText(this.CHAVE_PIX);
      Toast.show('Chave Pix copiada com sucesso!', 'success');
    };
  }
}