// src/app.js
import { SyncManager } from './core/localDb.js';
import { Router } from './core/router.js';
import { AuthService } from './services/AuthService.js';
import { LoginView } from './views/LoginView.js';
import { LandingPageView } from './views/LandingPageView.js'; // <-- Importação da Landing Page
import { DashboardViewModel } from './viewmodels/DashboardViewModel.js';
import { DashboardView } from './views/DashboardView.js';
import { TurmaViewModel } from './viewmodels/TurmaViewModel.js';
import { TurmaView } from './views/TurmaView.js';
import { DiarioViewModel } from './viewmodels/DiarioViewModel.js';
import { DiarioView } from './views/DiarioView.js';
import { RelatorioView } from './views/RelatorioView.js';
import { BackupService } from './services/BackupService.js';
import { Toast } from './utils/ui.js';
import { atualizarCorTema } from './utils/theme.js';
import { MeusTrabalhosView } from './views/MeusTrabalhosView.js';
import { EditorDocumentoA4View } from './views/EditorDocumentoA4View.js';
import { EditorPlanoAulaView } from './views/EditorPlanoAulaView.js';
import { EditorApostilaView } from './views/EditorApostilaView.js';
import { BottomNavBar } from './components/BottomNavBar.js';
import { Sidebar } from './components/Sidebar.js';
import { checarNovaVersao } from './utils/versionCheck.js';

// 1. Registo nativo do Service Worker PWA (Offline & Cache com detecção de ciclo de vida)
if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('/sw.js', { scope: '/' });

      registration.addEventListener('updatefound', () => {
        const novoWorker = registration.installing;
        if (novoWorker) {
          novoWorker.addEventListener('statechange', () => {
            if (novoWorker.state === 'installed' && navigator.serviceWorker.controller) {
              console.log('Nova versão do Diário Docente disponível em cache.');
            }
          });
        }
      });
    } catch (err) {
      console.log('SW em desenvolvimento/preview:', err);
    }
  });
}

// 2. Inicia monitorização de conectividade e fila de sincronização
SyncManager.init();

async function iniciarApp() {
  const usuario = await AuthService.getUsuarioAtual();
  const header = document.getElementById('app-header');

  // FLUXO PÚBLICO: Alterna entre Landing Page e Login quando não há sessão ativa
  if (!usuario) {
    atualizarCorTema('login');
    if (header) header.classList.add('hidden');

    const gerirRotaPublica = () => {
      const hash = window.location.hash;
      const appContainer = document.getElementById('app');
      
      // Zera qualquer margem/padding da sidebar herdada do index.html
      if (appContainer) {
        appContainer.className = 'w-full min-h-screen m-0 p-0';
      }

      if (hash === '#login') {
        const loginView = new LoginView('app', () => {
          window.location.hash = '#dashboard';
          window.location.reload();
        });
        loginView.render();
      } else {
        // Exibe a Landing Page institucional por predefinição
        LandingPageView.render(appContainer, {
          onAbrirLogin: () => {
            window.location.hash = '#login';
          },
          onAbrirCadastro: () => {
            window.location.hash = '#login';
          }
        });
      }
    };

    window.addEventListener('hashchange', gerirRotaPublica);
    gerirRotaPublica();
    return;
  }

  // FLUXO AUTENTICADO: Se autenticado, exibe o cabeçalho e inicializa menus
  if (header) {
    header.classList.remove('hidden');

    // Menu Mobile (Hambúrguer)
    const btnMobile = document.getElementById('btn-mobile-menu');
    const menuMobile = document.getElementById('menu-mobile');
    btnMobile?.addEventListener('click', () => {
      menuMobile?.classList.toggle('hidden');
    });

    document.querySelectorAll('.mobile-nav-link').forEach(link => {
      link.addEventListener('click', () => menuMobile?.classList.add('hidden'));
    });

    // Ação unificada de cópia de segurança completa (JSON)
    const dispararBackup = async (btn) => {
      btn.disabled = true;
      btn.innerText = 'A exportar...';
      try {
        await BackupService.gerarSnapshotCompleto();
        Toast.show('Cópia de segurança JSON descarregada com sucesso!', 'success');
      } catch (err) {
        Toast.show('Erro ao exportar: ' + err.message, 'error');
      } finally {
        btn.disabled = false;
        btn.innerHTML = '💾 Fazer Backup';
      }
    };

    const btnBackupDesktop = document.getElementById('btn-gerar-backup');
    const btnBackupMobile = document.getElementById('btn-gerar-backup-mobile');
    btnBackupDesktop?.addEventListener('click', () => dispararBackup(btnBackupDesktop));
    btnBackupMobile?.addEventListener('click', () => dispararBackup(btnBackupMobile));

    // Input invisível para carregar arquivo de restauração de backup (JSON)
    let inputRestore = document.getElementById('input-file-restore-backup');
    if (!inputRestore) {
      inputRestore = document.createElement('input');
      inputRestore.id = 'input-file-restore-backup';
      inputRestore.type = 'file';
      inputRestore.accept = '.json,application/json';
      inputRestore.className = 'hidden';
      document.body.appendChild(inputRestore);

      inputRestore.addEventListener('change', async (e) => {
        const file = e.target.files[0];
        if (!file) return;

        const confirmado = confirm('Atenção: A restauração irá importar todas as turmas, alunos, notas e documentos contidos no arquivo JSON. Deseja prosseguir?');
        if (!confirmado) {
          inputRestore.value = '';
          return;
        }

        Toast.show('Restaurando dados do backup...', 'info');
        try {
          const texto = await file.text();
          const resultado = await BackupService.restaurarBackup(texto);
          Toast.show(`Backup restaurado com sucesso! (${resultado.totalTurmas} turmas, ${resultado.totalAlunos} alunos).`, 'success');
          setTimeout(() => window.location.reload(), 1500);
        } catch (err) {
          Toast.show('Erro ao restaurar backup: ' + err.message, 'error');
        } finally {
          inputRestore.value = '';
        }
      });
    }

    // Botão Restaurar Backup Desktop (insere ao lado do botão de backup se não existir)
    if (btnBackupDesktop && !document.getElementById('btn-restaurar-backup')) {
      const btnRestoreDesktop = document.createElement('button');
      btnRestoreDesktop.id = 'btn-restaurar-backup';
      btnRestoreDesktop.className = 'touch-action px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold rounded-xl text-xs transition ml-1.5 cursor-pointer flex items-center gap-1';
      btnRestoreDesktop.innerHTML = '📥 Restaurar';
      btnRestoreDesktop.addEventListener('click', () => inputRestore.click());
      btnBackupDesktop.parentNode?.insertBefore(btnRestoreDesktop, btnBackupDesktop.nextSibling);
    } else {
      document.getElementById('btn-restaurar-backup')?.addEventListener('click', () => inputRestore.click());
    }

    // Botão Restaurar Backup Mobile (insere no menu mobile se não existir)
    if (btnBackupMobile && !document.getElementById('btn-restaurar-backup-mobile')) {
      const btnRestoreMobile = document.createElement('button');
      btnRestoreMobile.id = 'btn-restaurar-backup-mobile';
      btnRestoreMobile.className = 'touch-action w-full text-left px-4 py-2.5 text-slate-700 hover:bg-slate-50 font-bold text-xs transition flex items-center gap-2 cursor-pointer';
      btnRestoreMobile.innerHTML = '📥 Restaurar Backup';
      btnRestoreMobile.addEventListener('click', () => inputRestore.click());
      btnBackupMobile.parentNode?.insertBefore(btnRestoreMobile, btnBackupMobile.nextSibling);
    } else {
      document.getElementById('btn-restaurar-backup-mobile')?.addEventListener('click', () => inputRestore.click());
    }

    // Botão Terminar Sessão Desktop
    if (!document.getElementById('btn-logout')) {
      const navDesktop = document.getElementById('nav-desktop');
      const logoutBtn = document.createElement('button');
      logoutBtn.id = 'btn-logout';
      logoutBtn.className = 'text-rose-600 hover:text-rose-800 text-xs font-bold transition ml-2 cursor-pointer';
      logoutBtn.innerText = 'Sair';
      logoutBtn.addEventListener('click', async () => {
        await AuthService.sair();
        window.location.hash = '';
        window.location.reload();
      });
      navDesktop?.appendChild(logoutBtn);
    }

    // Botão Terminar Sessão Mobile
    const mobileLogoutSlot = document.getElementById('mobile-logout-slot');
    if (mobileLogoutSlot && !document.getElementById('btn-logout-mobile')) {
      const logoutMobile = document.createElement('button');
      logoutMobile.id = 'btn-logout-mobile';
      logoutMobile.className = 'text-rose-600 hover:text-rose-800 text-xs font-bold transition p-2 cursor-pointer';
      logoutMobile.innerText = 'Sair da Conta';
      logoutMobile.addEventListener('click', async () => {
        await AuthService.sair();
        window.location.hash = '';
        window.location.reload();
      });
      mobileLogoutSlot.appendChild(logoutMobile);
    }
  }

  // Rotas internas do SPA para docentes autenticados
  const rotas = {
    dashboard: (container) => {
      const vm = new DashboardViewModel();
      const view = new DashboardView(container.id, vm, (rota, id) => {
        window.location.hash = id ? `#${rota}/${id}` : `#${rota}`;
      });
      vm.carregarDashboard();
    },

    turma: (container, turmaId) => {
      const vm = new TurmaViewModel(turmaId);
      new TurmaView(container.id, vm);
      vm.carregarDados();
    },

    diario: (container, turmaId) => {
      const vm = new DiarioViewModel(turmaId);
      new DiarioView(container.id, vm);
      vm.carregarDiario();
    },

    relatorios: (container, turmaId) => {
      const view = new RelatorioView(container.id, turmaId);
      view.carregarERenderizar();
    },

    'meus-trabalhos': (container) => {
      const view = new MeusTrabalhosView(container.id);
      view.render();
    },

    'estudio-a4': (container) => {
      const view = new EditorDocumentoA4View(container.id);
      view.render();
    },

    'planos-aula': (container) => {
      const view = new EditorPlanoAulaView(container.id);
      view.render();
    },
    'apostilas': (container) => {
      const view = new EditorApostilaView(container.id);
      view.render();
    },
    provas: (container) => {
      const view = new EditorDocumentoA4View(container.id, 'prova');
      view.render();
    },

    listas: (container) => {
      const view = new EditorDocumentoA4View(container.id, 'lista');
      view.render();
    },

    404: (container) => {
      container.innerHTML = `
        <div class="p-12 text-center">
          <h2 class="text-xl font-bold text-slate-800">Página não encontrada</h2>
          <a href="#dashboard" class="text-indigo-600 text-sm font-semibold mt-2 inline-block">Voltar ao início</a>
        </div>
      `;
    }
  };

  BottomNavBar.render();
  Sidebar.render();

  // checarNovaVersao() foi desativado aqui pois desregistrava os Service Workers a cada reload
  // checarNovaVersao();

  const appRouter = new Router(rotas, 'app');
  appRouter.iniciar();
}

iniciarApp();