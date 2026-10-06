// src/views/LoginView.js
import { AuthService } from '../services/AuthService.js';
import { PoliticasModal } from '../utils/PoliticasModal.js';

export class LoginView {
  constructor(containerId, onLoginSucesso) {
    this.container = document.getElementById(containerId);
    this.onLoginSucesso = onLoginSucesso;
    this.modoCriarConta = false;
  }

  render() {
    this.container.className = 'w-full min-h-screen m-0 p-0 flex items-center justify-center bg-slate-100 select-none';

    this.container.innerHTML = `
      <div class="w-full max-w-md p-6 sm:p-8 m-4 bg-white border border-slate-200 rounded-3xl shadow-xl space-y-6">
        
        <!-- Cabeçalho -->
        <div class="text-center space-y-1">
          <img src="./assets/apple-touch-icon.png" alt="Logótipo Diário Docente" class="w-12 h-12 rounded-xl mx-auto mb-3 shadow-md object-cover" />
          <h2 class="text-2xl font-black text-slate-800 tracking-tight">Diário Docente</h2>
          <p class="text-xs text-slate-500 font-medium">Aceda à sua conta ou crie um novo registo</p>
        </div>

        <!-- Abas Entrar / Criar Conta -->
        <div class="flex border-b border-slate-100 text-xs font-bold">
          <button id="tab-login" class="flex-1 py-2.5 border-b-2 border-indigo-600 text-indigo-600 transition">
            Entrar
          </button>
          <button id="tab-cadastro" class="flex-1 py-2.5 text-slate-400 hover:text-slate-600 border-b-2 border-transparent transition">
            Criar Conta
          </button>
        </div>

        <!-- Mensagem de Erro -->
        <div id="auth-erro" class="hidden p-3 bg-rose-50 border border-rose-200 text-rose-700 text-xs rounded-xl font-medium text-center"></div>

        <!-- Formulário de Autenticação -->
        <form id="form-auth" class="space-y-4 text-xs">
          <div id="campo-nome-wrapper" class="hidden">
            <label class="block font-bold text-slate-600 mb-1">Nome Completo</label>
            <input type="text" id="auth-nome" placeholder="Prof. O seu nome" class="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 bg-slate-50">
          </div>

          <div>
            <label class="block font-bold text-slate-600 mb-1">E-mail</label>
            <input type="email" id="auth-email" required placeholder="seu@email.com" class="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 bg-slate-50">
          </div>

          <div>
            <label class="block font-bold text-slate-600 mb-1">Palavra-passe</label>
            <input type="password" id="auth-senha" required placeholder="••••••••" class="w-full border border-slate-200 rounded-xl p-3 outline-none focus:border-indigo-500 bg-slate-50">
          </div>

          <button type="submit" id="btn-submit-auth" class="touch-action min-h-[44px] w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md transition active:scale-95">
            Entrar na Conta
          </button>
        </form>

        <!-- Consentimento LGPD & Termos de Uso -->
        <div class="text-[11px] text-slate-500 text-center leading-relaxed pt-2 border-t border-slate-100">
          Ao continuar, concorda com os nossos 
          <button id="btn-login-termos" class="text-indigo-600 font-bold hover:underline">Termos de Uso</button> 
          e a 
          <button id="btn-login-privacidade" class="text-indigo-600 font-bold hover:underline">Política de Privacidade (LGPD)</button>.
        </div>

        <!-- Voltar para a Landing Page -->
        <div class="text-center pt-1">
          <a href="#" class="text-xs text-slate-400 hover:text-slate-600 transition font-medium">
            ← Voltar à página inicial
          </a>
        </div>

      </div>
    `;

    this.container.querySelector('#btn-login-termos')?.addEventListener('click', (e) => {
      e.preventDefault();
      PoliticasModal.abrir('termos');
    });

    this.container.querySelector('#btn-login-privacidade')?.addEventListener('click', (e) => {
      e.preventDefault();
      PoliticasModal.abrir('privacidade');
    });

    this.bindAuthEvents();
  }

  bindAuthEvents() {
    const tabLogin = this.container.querySelector('#tab-login');
    const tabCadastro = this.container.querySelector('#tab-cadastro');
    const campoNome = this.container.querySelector('#campo-nome-wrapper');
    const btnSubmit = this.container.querySelector('#btn-submit-auth');
    const msgErro = this.container.querySelector('#auth-erro');
    const form = this.container.querySelector('#form-auth');

    const alternarModo = (criarConta) => {
      this.modoCriarConta = criarConta;
      msgErro.classList.add('hidden');

      if (criarConta) {
        tabCadastro.className = 'flex-1 py-2.5 border-b-2 border-indigo-600 text-indigo-600 transition';
        tabLogin.className = 'flex-1 py-2.5 text-slate-400 hover:text-slate-600 border-b-2 border-transparent transition';
        campoNome.classList.remove('hidden');
        btnSubmit.innerText = 'Criar Nova Conta';
      } else {
        tabLogin.className = 'flex-1 py-2.5 border-b-2 border-indigo-600 text-indigo-600 transition';
        tabCadastro.className = 'flex-1 py-2.5 text-slate-400 hover:text-slate-600 border-b-2 border-transparent transition';
        campoNome.classList.add('hidden');
        btnSubmit.innerText = 'Entrar na Conta';
      }
    };

    tabLogin.addEventListener('click', () => alternarModo(false));
    tabCadastro.addEventListener('click', () => alternarModo(true));

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgErro.classList.add('hidden');
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'A processar...';

      const email = this.container.querySelector('#auth-email').value.trim();
      const senha = this.container.querySelector('#auth-senha').value;

      try {
        if (this.modoCriarConta) {
          await AuthService.cadastrar(email, senha);
          alert('Conta criada com sucesso! Já pode iniciar sessão.');
          alternarModo(false);
        } else {
          await AuthService.entrar(email, senha);
          if (this.onLoginSucesso) this.onLoginSucesso();
        }
      } catch (err) {
        msgErro.innerText = err.message || 'Falha na autenticação. Verifique os dados inseridos.';
        msgErro.classList.remove('hidden');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = this.modoCriarConta ? 'Criar Nova Conta' : 'Entrar na Conta';
      }
    });
  }
}