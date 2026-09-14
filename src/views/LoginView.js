// src/views/LoginView.js
import { AuthService } from '../services/AuthService.js';

export class LoginView {
  constructor(containerId, onLoginSucesso) {
    this.container = document.getElementById(containerId);
    this.onLoginSucesso = onLoginSucesso;
  }

  render() {
    this.container.innerHTML = `
      <div class="min-h-[85vh] flex items-center justify-center p-4">
        <div class="bg-white border border-slate-200 shadow-xl rounded-3xl p-8 max-w-md w-full space-y-6">
          <div class="text-center space-y-2">
            <div class="w-14 h-14 bg-indigo-600 rounded-2xl mx-auto flex items-center justify-center text-white text-2xl shadow-lg shadow-indigo-100">
              📖
            </div>
            <h1 class="text-2xl font-black text-slate-800 tracking-tight">Diário Docente</h1>
            <p class="text-xs text-slate-400 font-medium">Acesso restrito ao painel de gestão escolar</p>
          </div>

          <form id="form-login" class="space-y-4 text-sm">
            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">E-mail Profissional</label>
              <input type="email" id="login-email" required placeholder="professor@escola.com" class="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 transition">
            </div>

            <div>
              <label class="block text-xs font-bold text-slate-600 uppercase mb-1">Senha de Acesso</label>
              <input type="password" id="login-senha" required placeholder="••••••••" class="w-full border border-slate-200 rounded-xl p-3 focus:ring-2 focus:ring-indigo-500 focus:outline-none text-slate-800 transition">
            </div>

            <div id="login-msg-erro" class="hidden text-xs font-semibold text-rose-600 bg-rose-50 border border-rose-200 p-3 rounded-xl"></div>

            <button type="submit" id="btn-submit-login" class="w-full py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold text-sm shadow-md shadow-indigo-100 transition duration-150">
              Acessar Diário
            </button>
          </form>

          <div class="pt-2 text-center">
            <button id="btn-toggle-cadastro" class="text-xs font-semibold text-indigo-600 hover:underline">
              Primeiro acesso? Crie sua conta
            </button>
          </div>
        </div>
      </div>
    `;

    this.bindEvents();
  }

  bindEvents() {
    let modoCriarConta = false;
    const form = this.container.querySelector('#form-login');
    const toggleBtn = this.container.querySelector('#btn-toggle-cadastro');
    const btnSubmit = this.container.querySelector('#btn-submit-login');
    const msgErro = this.container.querySelector('#login-msg-erro');

    toggleBtn.addEventListener('click', () => {
      modoCriarConta = !modoCriarConta;
      btnSubmit.innerText = modoCriarConta ? 'Criar Nova Conta' : 'Acessar Diário';
      toggleBtn.innerText = modoCriarConta ? 'Já possui conta? Faça login' : 'Primeiro acesso? Crie sua conta';
      msgErro.classList.add('hidden');
    });

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      msgErro.classList.add('hidden');
      btnSubmit.disabled = true;
      btnSubmit.innerText = 'Autenticando...';

      const email = this.container.querySelector('#login-email').value;
      const senha = this.container.querySelector('#login-senha').value;

      try {
        if (modoCriarConta) {
          await AuthService.cadastrar(email, senha);
          alert('Conta criada com sucesso! Você já pode entrar.');
          modoCriarConta = false;
          btnSubmit.innerText = 'Acessar Diário';
        } else {
          await AuthService.entrar(email, senha);
          if (this.onLoginSucesso) this.onLoginSucesso();
        }
      } catch (err) {
        msgErro.innerText = err.message || 'Falha na autenticação. Verifique os dados.';
        msgErro.classList.remove('hidden');
      } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = modoCriarConta ? 'Criar Nova Conta' : 'Acessar Diário';
      }
    });
  }
}