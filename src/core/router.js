// src/core/router.js
import { atualizarCorTema } from '../utils/theme.js';
export class Router {
  constructor(rotas, containerId) {
    this.rotas = rotas;
    this.container = document.getElementById(containerId);
    window.addEventListener('hashchange', () => this.resolverRota());
  }

  iniciar() {
    if (!window.location.hash) {
      window.location.hash = '#dashboard';
    } else {
      this.resolverRota();
    }
  }

  navegarPara(caminho) {
    window.location.hash = caminho;
  }

  resolverRota() {
    const hashCompleto = window.location.hash.slice(1) || 'dashboard';
    const [caminhoBase, parametro] = hashCompleto.split('/');

    const handler = this.rotas[caminhoBase] || this.rotas['404'];
    if (handler) {
      handler(this.container, parametro);
    }
  }
}